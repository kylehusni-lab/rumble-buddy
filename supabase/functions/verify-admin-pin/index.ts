import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SignJWT, jwtVerify } from "https://deno.land/x/jose@v5.2.0/index.ts";

// Origin validation for CORS
function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  
  const allowedPatterns = [
    /^https:\/\/rumble-buddy\.lovable\.app$/,
    /^https:\/\/.*\.lovable\.app$/,
    /^http:\/\/localhost(:\d+)?$/,
  ];
  
  const isAllowed = allowedPatterns.some(pattern => pattern.test(origin));
  
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : "",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

// In-memory rate limiting (resets on cold start, but provides basic protection)
const attemptsByIP = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = attemptsByIP.get(ip);
  
  if (!record || record.resetAt < now) {
    attemptsByIP.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  
  if (record.count >= MAX_ATTEMPTS) {
    return false;
  }
  
  record.count++;
  return true;
}

function resetRateLimitOnSuccess(ip: string): void {
  attemptsByIP.delete(ip);
}

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
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Reject requests from non-allowed origins
  if (!corsHeaders["Access-Control-Allow-Origin"]) {
    return new Response(
      JSON.stringify({ valid: false, error: "Origin not allowed" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // Rate limiting check
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
               req.headers.get("cf-connecting-ip") || 
               "unknown";
    
    if (!checkRateLimit(ip)) {
      return new Response(
        JSON.stringify({ valid: false, error: "Too many attempts. Try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    // PIN is correct - reset rate limit for this IP
    resetRateLimitOnSuccess(ip);

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
