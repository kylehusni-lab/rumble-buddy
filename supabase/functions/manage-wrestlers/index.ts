import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Origin validation for CORS
function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  
  const allowedPatterns = [
    /^https:\/\/therumbleapp\.com$/,
    /^https:\/\/.*\.lovable\.app$/,
    /^https:\/\/.*\.lovableproject\.com$/,
    /^http:\/\/localhost(:\d+)?$/,
  ];
  
  // If there's no Origin header (e.g., server-to-server calls), allow it.
  const isAllowed = !origin || allowedPatterns.some((pattern) => pattern.test(origin));
  
  return {
    "Access-Control-Allow-Origin": origin ? (isAllowed ? origin : "") : "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

interface WrestlerData {
  id?: string;
  name?: string;
  short_name?: string;
  division?: "mens" | "womens";
  image_url?: string;
  is_rumble_participant?: boolean;
  is_confirmed?: boolean;
  names?: string[];
  default_division?: "mens" | "womens";
  search?: string;
  division_filter?: "mens" | "womens" | "all";
  rumble_only?: boolean;
}

interface RequestBody {
  action: "list" | "create" | "update" | "delete" | "bulk_import" | "update_rumble_status";
  data?: WrestlerData;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Reject browser requests from non-allowed origins
  if (req.headers.get("origin") && !corsHeaders["Access-Control-Allow-Origin"]) {
    return new Response(
      JSON.stringify({ error: "Origin not allowed" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Require a logged-in user and verify they have the admin role.
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await authClient.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: hasRole, error: roleError } = await supabase.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });

    if (roleError || !hasRole) {
      return new Response(
        JSON.stringify({ error: "Access denied" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body: RequestBody = await req.json();
    const { action, data } = body;

    switch (action) {
      case "list": {
        let query = supabase
          .from("wrestlers")
          .select("*")
          .eq("is_active", true)
          .order("name", { ascending: true });

        if (data?.division_filter && data.division_filter !== "all") {
          query = query.eq("division", data.division_filter);
        }

        if (data?.rumble_only) {
          query = query.eq("is_rumble_participant", true);
        }

        if (data?.search) {
          query = query.ilike("name", `%${data.search}%`);
        }

        const { data: wrestlers, error } = await query;

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Calculate participant counts
        const mensParticipants = (wrestlers || []).filter(
          (w: { division: string; is_rumble_participant: boolean }) => 
            w.division === "mens" && w.is_rumble_participant
        ).length;
        const womensParticipants = (wrestlers || []).filter(
          (w: { division: string; is_rumble_participant: boolean }) => 
            w.division === "womens" && w.is_rumble_participant
        ).length;

        return new Response(
          JSON.stringify({ wrestlers, mensParticipants, womensParticipants }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "create": {
        if (!data?.name || !data?.division) {
          return new Response(
            JSON.stringify({ error: "Name and division are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Validate name length
        if (data.name.length > 50) {
          return new Response(
            JSON.stringify({ error: "Name must be 50 characters or less" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Validate short_name length
        if (data.short_name && data.short_name.length > 15) {
          return new Response(
            JSON.stringify({ error: "Short name must be 15 characters or less" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: wrestler, error } = await supabase
          .from("wrestlers")
          .insert({
            name: data.name.trim(),
            short_name: data.short_name?.trim() || null,
            division: data.division,
            image_url: data.image_url || null,
            is_rumble_participant: data.is_rumble_participant ?? false,
            is_confirmed: data.is_confirmed ?? true,
          })
          .select()
          .single();

        if (error) {
          if (error.code === "23505") {
            return new Response(
              JSON.stringify({ error: "A wrestler with this name already exists" }),
              { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ wrestler }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "update": {
        if (!data?.id) {
          return new Response(
            JSON.stringify({ error: "Wrestler ID is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const updates: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };

        if (data.name !== undefined) {
          if (data.name.length > 50) {
            return new Response(
              JSON.stringify({ error: "Name must be 50 characters or less" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          updates.name = data.name.trim();
        }

        if (data.short_name !== undefined) {
          if (data.short_name && data.short_name.length > 15) {
            return new Response(
              JSON.stringify({ error: "Short name must be 15 characters or less" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          updates.short_name = data.short_name?.trim() || null;
        }

        if (data.division !== undefined) {
          updates.division = data.division;
        }

        if (data.image_url !== undefined) {
          updates.image_url = data.image_url;
        }

        if (data.is_rumble_participant !== undefined) {
          updates.is_rumble_participant = data.is_rumble_participant;
        }

        if (data.is_confirmed !== undefined) {
          updates.is_confirmed = data.is_confirmed;
        }

        const { data: wrestler, error } = await supabase
          .from("wrestlers")
          .update(updates)
          .eq("id", data.id)
          .select()
          .single();

        if (error) {
          if (error.code === "23505") {
            return new Response(
              JSON.stringify({ error: "A wrestler with this name already exists" }),
              { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ wrestler }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "delete": {
        if (!data?.id) {
          return new Response(
            JSON.stringify({ error: "Wrestler ID is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Soft delete by setting is_active to false
        const { error } = await supabase
          .from("wrestlers")
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq("id", data.id);

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "bulk_import": {
        if (!data?.names || !Array.isArray(data.names) || data.names.length === 0) {
          return new Response(
            JSON.stringify({ error: "Names array is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Rate limit - max 100 wrestlers at once
        if (data.names.length > 100) {
          return new Response(
            JSON.stringify({ error: "Maximum 100 wrestlers can be imported at once" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const division = data.default_division || "mens";
        const wrestlers = data.names
          .map((name) => name.trim())
          .filter((name) => name.length > 0 && name.length <= 50)
          .map((name) => ({
            name,
            division,
            is_active: true,
          }));

        if (wrestlers.length === 0) {
          return new Response(
            JSON.stringify({ error: "No valid wrestler names provided" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Insert with on conflict do nothing to skip duplicates
        const { data: imported, error } = await supabase
          .from("wrestlers")
          .upsert(wrestlers, { onConflict: "name", ignoreDuplicates: true })
          .select();

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({
            imported: imported?.length || 0,
            skipped: wrestlers.length - (imported?.length || 0),
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "update_rumble_status": {
        if (!data?.id) {
          return new Response(
            JSON.stringify({ error: "Wrestler ID is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const updates: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };

        if (data.is_rumble_participant !== undefined) {
          updates.is_rumble_participant = data.is_rumble_participant;
        }

        if (data.is_confirmed !== undefined) {
          updates.is_confirmed = data.is_confirmed;
        }

        const { data: wrestler, error } = await supabase
          .from("wrestlers")
          .update(updates)
          .eq("id", data.id)
          .select()
          .single();

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ wrestler }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Error in manage-wrestlers:", error);
    const corsHeaders = getCorsHeaders(req);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
