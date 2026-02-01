import { supabase } from "@/integrations/supabase/client";
// Import Rumble config directly for Demo Mode - always uses Rumble
import { 
  RUMBLE_2026_MATCHES, 
  RUMBLE_2026_CHAOS_PROPS,
  RUMBLE_2026_CONFIG,
} from "./events/rumble-2026";

export const DEMO_GUESTS = [
  { name: "Melanie", email: "melanie@demo.local" },
  { name: "Mike", email: "mike@demo.local" },
  { name: "Jon", email: "jon@demo.local" },
  { name: "Chris", email: "chris@demo.local" },
  { name: "Steve", email: "steve@demo.local" },
] as const;

// Helper to get N unique random wrestlers
function getRandomUniqueWrestlers(entrants: string[], count: number): string[] {
  const shuffled = [...entrants].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export async function generateDemoPicksForPlayers(
  playerIds: string[],
  mensEntrants: string[],
  womensEntrants: string[]
) {
  const picks: Array<{
    player_id: string;
    match_id: string;
    prediction: string;
  }> = [];

  for (const playerId of playerIds) {
    // Undercard matches (2 picks) - use Rumble matches
    RUMBLE_2026_MATCHES.forEach((match) => {
      picks.push({
        player_id: playerId,
        match_id: match.id,
        prediction: match.options[Math.random() > 0.5 ? 0 : 1],
      });
    });

    // Men's Rumble Winner (1 pick)
    picks.push({
      player_id: playerId,
      match_id: "mens_rumble_winner",
      prediction: mensEntrants[Math.floor(Math.random() * mensEntrants.length)],
    });

    // Women's Rumble Winner (1 pick)
    picks.push({
      player_id: playerId,
      match_id: "womens_rumble_winner",
      prediction: womensEntrants[Math.floor(Math.random() * womensEntrants.length)],
    });

    // Men's Rumble Props - wrestler selections (5 picks)
    const mensWrestlerProps = ['first_elimination', 'most_eliminations', 'longest_time', 'entrant_1', 'entrant_30'];
    mensWrestlerProps.forEach(propId => {
      picks.push({
        player_id: playerId,
        match_id: `mens_${propId}`,
        prediction: mensEntrants[Math.floor(Math.random() * mensEntrants.length)],
      });
    });

    // Men's Final Four (4 unique picks)
    const mensFinalFour = getRandomUniqueWrestlers(mensEntrants, 4);
    mensFinalFour.forEach((wrestler, i) => {
      picks.push({
        player_id: playerId,
        match_id: `mens_final_four_${i + 1}`,
        prediction: wrestler,
      });
    });

    // Men's No-Show prop (YES/NO)
    picks.push({
      player_id: playerId,
      match_id: "mens_no_show",
      prediction: Math.random() > 0.5 ? "YES" : "NO",
    });

    // Women's Rumble Props - wrestler selections (5 picks)
    const womensWrestlerProps = ['first_elimination', 'most_eliminations', 'longest_time', 'entrant_1', 'entrant_30'];
    womensWrestlerProps.forEach(propId => {
      picks.push({
        player_id: playerId,
        match_id: `womens_${propId}`,
        prediction: womensEntrants[Math.floor(Math.random() * womensEntrants.length)],
      });
    });

    // Women's Final Four (4 unique picks)
    const womensFinalFour = getRandomUniqueWrestlers(womensEntrants, 4);
    womensFinalFour.forEach((wrestler, i) => {
      picks.push({
        player_id: playerId,
        match_id: `womens_final_four_${i + 1}`,
        prediction: wrestler,
      });
    });

    // Women's No-Show prop (YES/NO)
    picks.push({
      player_id: playerId,
      match_id: "womens_no_show",
      prediction: Math.random() > 0.5 ? "YES" : "NO",
    });

    // Men's Chaos Props (7 picks) - use Rumble chaos props
    RUMBLE_2026_CHAOS_PROPS.forEach((_, i) => {
      picks.push({
        player_id: playerId,
        match_id: `mens_chaos_prop_${i + 1}`,
        prediction: Math.random() > 0.5 ? "YES" : "NO",
      });
    });

    // Women's Chaos Props (7 picks) - use Rumble chaos props
    RUMBLE_2026_CHAOS_PROPS.forEach((_, i) => {
      picks.push({
        player_id: playerId,
        match_id: `womens_chaos_prop_${i + 1}`,
        prediction: Math.random() > 0.5 ? "YES" : "NO",
      });
    });
  }

  // Use secure RPC function that bypasses RLS for demo picks
  // Pass the array directly - Supabase will convert to JSONB
  const { error } = await supabase.rpc('seed_demo_picks', {
    p_picks: picks
  });
  if (error) throw error;
}

export async function seedDemoParty(
  partyCode: string,
  hostSessionId: string,
  hostUserId?: string
): Promise<{ hostPlayerId: string; guestIds: string[] }> {
  const hostEmail = "kyle.husni@gmail.com";
  
  // Fetch entrants from database for Rumble demo
  const { data: wrestlers } = await supabase
    .from("wrestlers")
    .select("name, division")
    .eq("is_active", true)
    .eq("is_rumble_participant", true);
  
  const mensEntrants = wrestlers
    ?.filter(w => w.division === "mens")
    .map(w => w.name) || [];
  const womensEntrants = wrestlers
    ?.filter(w => w.division === "womens")
    .map(w => w.name) || [];
  
  // 1. Create demo host as player (Kyle) using RPC (bypasses RLS for user_id linking)
  const { data: hostPlayerId, error: hostError } = await supabase
    .rpc('seed_demo_player', {
      p_party_code: partyCode,
      p_email: hostEmail,
      p_display_name: "Kyle",
      p_session_id: hostSessionId,
    });

  if (hostError) throw hostError;
  if (!hostPlayerId) throw new Error("Failed to create host player");

  // If we have a host user ID, update the player record
  if (hostUserId) {
    await supabase
      .from("players")
      .update({ user_id: hostUserId })
      .eq("id", hostPlayerId);
  }

  // 2. Create 5 demo guests using RPC (bypasses RLS)
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
    if (guestId) {
      guestIds.push(guestId);
    }
  }


  // 3. Generate picks for all players using Rumble config
  const allPlayerIds = [hostPlayerId, ...guestIds];
  await generateDemoPicksForPlayers(allPlayerIds, mensEntrants, womensEntrants);

  return {
    hostPlayerId,
    guestIds,
  };
}
