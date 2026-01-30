import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PinRecoveryRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration is missing");
    }

    const { email }: PinRecoveryRequest = await req.json();

    // Validate required fields
    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Use service role to look up the player's PIN
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: player, error: lookupError } = await supabase
      .from("solo_players")
      .select("pin, display_name")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (lookupError || !player) {
      // Don't reveal if email exists or not for security
      console.log("Player not found for email:", email);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "If an account exists with this email, you will receive your PIN shortly." 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send the PIN via email
    const resend = new Resend(RESEND_API_KEY);
    const displayName = player.display_name || "User";

    const emailResponse = await resend.emails.send({
      from: "Over The Top <noreply@therumbleapp.com>",
      to: [email.toLowerCase().trim()],
      subject: "Your Over The Top PIN",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0b; color: #ffffff; padding: 40px 20px; margin: 0;">
          <div style="max-width: 400px; margin: 0 auto; text-align: center;">
            <a href="https://therumbleapp.com" style="text-decoration: none;">
              <h1 style="color: #d4af37; font-size: 28px; margin-bottom: 8px;">The Rumble App</h1>
            </a>
            <p style="color: #888; font-size: 14px; margin-bottom: 32px;">Royal Rumble 2026</p>
            
            <p style="font-size: 16px; margin-bottom: 24px;">Hey ${displayName}!</p>
            
            <p style="font-size: 14px; color: #aaa; margin-bottom: 16px;">Here's your 4-digit PIN:</p>
            
            <div style="background: linear-gradient(135deg, #1a1a1f, #2a2a35); border: 2px solid #d4af37; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
              <span style="font-size: 48px; font-weight: bold; letter-spacing: 16px; color: #d4af37; font-family: monospace;">${player.pin}</span>
            </div>
            
            <p style="font-size: 12px; color: #666; margin-top: 32px;">
              Keep this PIN safe! You'll need it to sign in at <a href="https://therumbleapp.com" style="color: #d4af37;">therumbleapp.com</a>
            </p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("PIN recovery email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "If an account exists with this email, you will receive your PIN shortly." 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("Error in send-pin-recovery function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
