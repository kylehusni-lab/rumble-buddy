import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pin } = await req.json();

    if (!pin) {
      return new Response(
        JSON.stringify({ valid: false, error: "PIN is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminPin = Deno.env.get("PLATFORM_ADMIN_PIN");

    if (!adminPin) {
      console.error("PLATFORM_ADMIN_PIN not configured");
      return new Response(
        JSON.stringify({ valid: false, error: "Admin PIN not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (pin !== adminPin) {
      return new Response(
        JSON.stringify({ valid: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a simple session token (timestamp + random)
    const token = `${Date.now()}-${crypto.randomUUID()}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    return new Response(
      JSON.stringify({
        valid: true,
        token,
        expiresAt,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in verify-admin-pin:", error);
    return new Response(
      JSON.stringify({ valid: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
