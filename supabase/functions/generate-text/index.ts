import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface GenerateTextRequest {
  postId: string;
  title: string;
  brief: string;
  tone?: string;
  length?: string;
  targetAudience?: string;
  keywords?: string[];
  language?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    const body: GenerateTextRequest = await req.json();
    const {
      postId,
      title,
      brief,
      tone = "professional",
      length = "medium",
      targetAudience = "general audience",
      keywords = [],
      language = "pt-BR",
    } = body;

    if (!postId || !title || !brief) {
      return new Response(
        JSON.stringify({ error: "postId, title, and brief are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create job record
    const { data: job, error: jobError } = await supabase
      .from("blog_jobs")
      .insert({
        type: "generate_text",
        post_id: postId,
        status: "running",
        payload: { title, brief, tone, length, targetAudience, keywords, language },
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (jobError) {
      console.error("Failed to create job:", jobError);
      throw new Error("Failed to create job record");
    }

    // Update post status to generating
    await supabase
      .from("blog_posts")
      .update({ status: "generating" })
      .eq("id", postId);

    const lengthGuide = {
      short: "around 500-800 words",
      medium: "around 1000-1500 words",
      long: "around 2000-3000 words",
    };

    const systemPrompt = `You are an expert content writer and SEO specialist. Generate high-quality blog content based on the provided brief.

IMPORTANT RULES:
- Write original, engaging, and informative content
- Do NOT invent factual data or statistics unless you can verify them
- Use proper HTML structure with H2, H3 headings
- Include an introduction, main sections, and conclusion
- Maintain a ${tone} tone throughout
- Target audience: ${targetAudience}
- Length: ${lengthGuide[length as keyof typeof lengthGuide] || lengthGuide.medium}
- Language: ${language === "pt-BR" ? "Brazilian Portuguese" : "English"}
${keywords.length > 0 ? `- Incorporate these SEO keywords naturally: ${keywords.join(", ")}` : ""}

Respond in JSON format:
{
  "refinedTitle": "Optimized title for SEO",
  "metaTitle": "SEO meta title (max 60 chars)",
  "metaDescription": "SEO meta description (max 160 chars)",
  "suggestedSlug": "url-friendly-slug",
  "excerpt": "Brief summary (2-3 sentences)",
  "contentHtml": "<h2>...</h2><p>...</p>... Full article in HTML",
  "faq": [{"question": "...", "answer": "..."}, ...] // Optional 3-5 FAQs
}`;

    const userPrompt = `Title: ${title}

Brief/Description:
${brief}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);

      if (aiResponse.status === 429) {
        await supabase
          .from("blog_jobs")
          .update({
            status: "failed",
            error_message: "Rate limit exceeded. Please try again later.",
            finished_at: new Date().toISOString(),
          })
          .eq("id", job.id);

        await supabase
          .from("blog_posts")
          .update({ status: "failed" })
          .eq("id", postId);

        return new Response(
          JSON.stringify({ error: "Rate limit exceeded" }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content returned from AI");
    }

    let generatedContent;
    try {
      generatedContent = JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response");
    }

    // Update post with generated content
    const { error: updateError } = await supabase
      .from("blog_posts")
      .update({
        title: generatedContent.refinedTitle || title,
        meta_title: generatedContent.metaTitle,
        meta_description: generatedContent.metaDescription,
        slug: generatedContent.suggestedSlug || postId,
        excerpt: generatedContent.excerpt,
        content_html: generatedContent.contentHtml,
        content_json: generatedContent.faq ? { faq: generatedContent.faq } : null,
        status: "ready",
      })
      .eq("id", postId);

    if (updateError) {
      console.error("Failed to update post:", updateError);
      throw new Error("Failed to update post with generated content");
    }

    // Update job as success
    await supabase
      .from("blog_jobs")
      .update({
        status: "success",
        result: {
          refinedTitle: generatedContent.refinedTitle,
          metaTitle: generatedContent.metaTitle,
          wordsGenerated: generatedContent.contentHtml?.split(/\s+/).length || 0,
        },
        finished_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    // Create audit log
    await supabase.from("audit_logs").insert({
      actor_user_id: userId,
      action: "generate_text",
      entity_type: "blog_post",
      entity_id: postId,
      details: { jobId: job.id, tone, length, language },
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: generatedContent,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("generate-text error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
