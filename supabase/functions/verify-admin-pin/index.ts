import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SignJWT, jwtVerify } from "https://deno.land/x/jose@v5.2.0/index.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Get or create a signing secret
async function getSigningSecret(): Promise<Uint8Array> {
  const secretStr = Deno.env.get("PLATFORM_ADMIN_PIN") || "fallback-secret-key";
  // Use a derived key from the admin PIN as the signing secret
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

    // Generate a signed JWT token
    const secret = await getSigningSecret();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const token = await new SignJWT({ 
      role: "platform_admin",
      iat: Math.floor(Date.now() / 1000),
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(secret);

    return new Response(
      JSON.stringify({
        valid: true,
        token,
        expiresAt: expiresAt.toISOString(),
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
