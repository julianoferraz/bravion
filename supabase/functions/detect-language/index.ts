import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-forwarded-for, cf-connecting-ip, x-real-ip, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Brazilian IP ranges detection using country code from geolocation services
async function detectCountry(ip: string): Promise<string> {
  // Skip for localhost/private IPs
  if (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.")
  ) {
    return "US"; // Default to English for local development
  }

  try {
    // Use ip-api.com (free, no key required)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`);
    if (response.ok) {
      const data = await response.json();
      return data.countryCode || "US";
    }
  } catch (error) {
    console.error("IP geolocation error:", error);
  }

  return "US"; // Default fallback
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP from various headers
    const forwardedFor = req.headers.get("x-forwarded-for");
    const cfConnectingIp = req.headers.get("cf-connecting-ip");
    const realIp = req.headers.get("x-real-ip");

    let clientIp = cfConnectingIp || realIp || forwardedFor?.split(",")[0]?.trim() || "127.0.0.1";

    const countryCode = await detectCountry(clientIp);

    // Portuguese for Brazil, English for everyone else
    const language = countryCode === "BR" ? "pt" : "en";

    return new Response(
      JSON.stringify({
        language,
        countryCode,
        ip: clientIp,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("detect-language error:", error);
    
    // Default to English on error
    return new Response(
      JSON.stringify({
        language: "en",
        countryCode: "US",
        error: "Detection failed, using default",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
