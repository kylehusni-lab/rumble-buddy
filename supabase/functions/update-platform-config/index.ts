import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jwtVerify } from "https://deno.land/x/jose@v5.2.0/index.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Get the signing secret (must match verify-admin-pin)
async function getSigningSecret(): Promise<Uint8Array> {
  const secretStr = Deno.env.get("PLATFORM_ADMIN_PIN") || "fallback-secret-key";
  const encoder = new TextEncoder();
  const data = encoder.encode(secretStr + "-jwt-signing-key-v1");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(hashBuffer);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, mensEntrants, womensEntrants } = await req.json();

    // Validate token exists
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token is required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify JWT signature and expiration
    const secret = await getSigningSecret();
    
    try {
      const { payload } = await jwtVerify(token, secret);
      
      // Verify role claim
      if (payload.role !== "platform_admin") {
        return new Response(
          JSON.stringify({ error: "Invalid token role" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (jwtError) {
      console.error("JWT verification failed:", jwtError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
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
