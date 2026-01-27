import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { token, mensEntrants, womensEntrants } = await req.json();

    // Validate token exists and is not expired
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token is required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse token to check expiry (token format: timestamp-uuid)
    const tokenParts = token.split("-");
    if (tokenParts.length < 2) {
      return new Response(
        JSON.stringify({ error: "Invalid token format" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tokenTimestamp = parseInt(tokenParts[0], 10);
    const tokenAge = Date.now() - tokenTimestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    if (tokenAge > maxAge) {
      return new Response(
        JSON.stringify({ error: "Token expired" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update mens entrants
    if (mensEntrants && Array.isArray(mensEntrants)) {
      const { error: mensError } = await supabase
        .from("platform_config")
        .upsert({
          key: "mens_rumble_entrants",
          value: mensEntrants,
          updated_at: new Date().toISOString(),
          updated_by: "platform_admin",
        }, { onConflict: "key" });

      if (mensError) {
        console.error("Error updating mens entrants:", mensError);
        throw mensError;
      }
    }

    // Update womens entrants
    if (womensEntrants && Array.isArray(womensEntrants)) {
      const { error: womensError } = await supabase
        .from("platform_config")
        .upsert({
          key: "womens_rumble_entrants",
          value: womensEntrants,
          updated_at: new Date().toISOString(),
          updated_by: "platform_admin",
        }, { onConflict: "key" });

      if (womensError) {
        console.error("Error updating womens entrants:", womensError);
        throw womensError;
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in update-platform-config:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
