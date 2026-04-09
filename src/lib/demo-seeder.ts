import { supabase } from "@/integrations/supabase/client";
import { MANIA_42_MATCHES, MANIA_42_PROPS } from "./events/mania-42";

export const DEMO_GUESTS = [
  { name: "Melanie", email: "melanie@demo.local" },
  { name: "Mike", email: "mike@demo.local" },
  { name: "Jon", email: "jon@demo.local" },
  { name: "Chris", email: "chris@demo.local" },
  { name: "Steve", email: "steve@demo.local" },
] as const;

export async function generateDemoPicksForPlayers(playerIds: string[]) {
  const picks: Array<{
    player_id: string;
    match_id: string;
    prediction: string;
  }> = [];

  for (const playerId of playerIds) {
    // Match picks - randomly pick a winner from each match's options
    for (const match of MANIA_42_MATCHES) {
      const opts = match.options;
      picks.push({
        player_id: playerId,
        match_id: match.id,
        prediction: opts[Math.floor(Math.random() * opts.length)],
      });
    }

    // Prop picks - YES/NO for each prop
    for (const prop of MANIA_42_PROPS) {
      picks.push({
        player_id: playerId,
        match_id: prop.id,
        prediction: Math.random() > 0.5 ? "YES" : "NO",
      });
    }
  }

  const { error } = await supabase.rpc('seed_demo_picks', { p_picks: picks });
  if (error) throw error;
}

export async function seedDemoParty(
  partyCode: string,
  hostSessionId: string,
  hostUserId?: string
): Promise<{ hostPlayerId: string; guestIds: string[] }> {
  const hostEmail = "kyle.husni@gmail.com";

  // 1. Create demo host as player
  const { data: hostPlayerId, error: hostError } = await supabase
    .rpc('seed_demo_player', {
      p_party_code: partyCode,
      p_email: hostEmail,
      p_display_name: "Kyle",
      p_session_id: hostSessionId,
    });

  if (hostError) throw hostError;
  if (!hostPlayerId) throw new Error("Failed to create host player");

  if (hostUserId) {
    await supabase
      .from("players")
      .update({ user_id: hostUserId })
      .eq("id", hostPlayerId);
  }

  // 2. Create 5 demo guests
  const guestIds: string[] = [];
  for (const guest of DEMO_GUESTS) {
    const { data: guestId, error: guestError } = await supabase
      .rpc('seed_demo_player', {
        p_party_code: partyCode,
        p_email: guest.email,
        p_display_name: guest.name,
        p_session_id: crypto.randomUUID(),
      });

    if (guestError) throw guestError;
    if (guestId) guestIds.push(guestId);
  }

  // 3. Generate picks for all players using WM42 config
  const allPlayerIds = [hostPlayerId, ...guestIds];
  await generateDemoPicksForPlayers(allPlayerIds);

  return { hostPlayerId, guestIds };
}
