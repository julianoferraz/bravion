import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // This function is called by cron job - use service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date().toISOString();

    // Find posts scheduled for publication
    const { data: scheduledPosts, error: fetchError } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_at", now)
      .is("deleted_at", null);

    if (fetchError) {
      console.error("Failed to fetch scheduled posts:", fetchError);
      throw new Error("Failed to fetch scheduled posts");
    }

    console.log(`Found ${scheduledPosts?.length || 0} posts to publish`);

    const results = {
      published: [] as string[],
      failed: [] as { id: string; error: string }[],
    };

    for (const post of scheduledPosts || []) {
      // Create job record
      const { data: job } = await supabase
        .from("blog_jobs")
        .insert({
          type: "publish_scheduled",
          post_id: post.id,
          status: "running",
          payload: { scheduledAt: post.scheduled_at },
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      try {
        // Validate post has required content
        if (!post.content_html || !post.slug) {
          throw new Error("Post missing required content or slug");
        }

        // Check slug uniqueness among published posts
        const { data: existingPost } = await supabase
          .from("blog_posts")
          .select("id")
          .eq("slug", post.slug)
          .eq("status", "published")
          .neq("id", post.id)
          .maybeSingle();

        if (existingPost) {
          throw new Error(`Slug "${post.slug}" already exists`);
        }

        // Publish the post
        const { error: updateError } = await supabase
          .from("blog_posts")
          .update({
            status: "published",
            published_at: now,
          })
          .eq("id", post.id);

        if (updateError) {
          throw new Error(`Update failed: ${updateError.message}`);
        }

        // Update job as success
        if (job) {
          await supabase
            .from("blog_jobs")
            .update({
              status: "success",
              result: { publishedAt: now },
              finished_at: new Date().toISOString(),
            })
            .eq("id", job.id);
        }

        // Create audit log
        await supabase.from("audit_logs").insert({
          actor_user_id: post.author_id,
          action: "post_published_scheduled",
          entity_type: "blog_post",
          entity_id: post.id,
          details: { scheduledAt: post.scheduled_at, publishedAt: now },
        });

        results.published.push(post.id);
        console.log(`Published post: ${post.id} (${post.title})`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error(`Failed to publish post ${post.id}:`, errorMessage);

        // Mark post as failed
        await supabase
          .from("blog_posts")
          .update({ status: "failed" })
          .eq("id", post.id);

        // Update job as failed
        if (job) {
          await supabase
            .from("blog_jobs")
            .update({
              status: "failed",
              error_message: errorMessage,
              finished_at: new Date().toISOString(),
            })
            .eq("id", job.id);
        }

        // Create audit log for failure
        await supabase.from("audit_logs").insert({
          actor_user_id: post.author_id,
          action: "post_publish_failed",
          entity_type: "blog_post",
          entity_id: post.id,
          details: { error: errorMessage, scheduledAt: post.scheduled_at },
        });

        results.failed.push({ id: post.id, error: errorMessage });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        timestamp: now,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("publish-scheduled error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
