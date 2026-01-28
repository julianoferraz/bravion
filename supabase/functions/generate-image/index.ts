import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface GenerateImageRequest {
  postId: string;
  theme: string;
  style?: string;
  aspectRatio?: string;
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

    const body: GenerateImageRequest = await req.json();
    const {
      postId,
      theme,
      style = "modern illustration",
      aspectRatio = "16:9",
    } = body;

    if (!postId || !theme) {
      return new Response(
        JSON.stringify({ error: "postId and theme are required" }),
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
        type: "generate_image",
        post_id: postId,
        status: "running",
        payload: { theme, style, aspectRatio },
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (jobError) {
      console.error("Failed to create job:", jobError);
      throw new Error("Failed to create job record");
    }

    // Generate image prompt
    const imagePrompt = `Create a blog cover image: ${theme}. Style: ${style}. Aspect ratio: ${aspectRatio}. Professional, clean, modern design. DO NOT include any text or words in the image. Ultra high resolution.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: imagePrompt,
          },
        ],
        modalities: ["image", "text"],
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
    const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      throw new Error("No image returned from AI");
    }

    // Convert base64 to blob and upload to storage
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    const fileName = `${postId}-${Date.now()}.png`;
    const filePath = `covers/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("blog-images")
      .upload(filePath, imageBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error("Failed to upload image to storage");
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("blog-images")
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // Update post with cover image
    const { error: updateError } = await supabase
      .from("blog_posts")
      .update({
        cover_image_url: publicUrl,
        og_image_url: publicUrl,
      })
      .eq("id", postId);

    if (updateError) {
      console.error("Failed to update post:", updateError);
      throw new Error("Failed to update post with image URL");
    }

    // Update job as success
    await supabase
      .from("blog_jobs")
      .update({
        status: "success",
        result: { imageUrl: publicUrl, fileName },
        finished_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    // Create audit log
    await supabase.from("audit_logs").insert({
      actor_user_id: userId,
      action: "generate_image",
      entity_type: "blog_post",
      entity_id: postId,
      details: { jobId: job.id, style, aspectRatio, imageUrl: publicUrl },
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: { imageUrl: publicUrl },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("generate-image error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
