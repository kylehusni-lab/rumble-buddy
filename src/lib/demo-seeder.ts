import { supabase } from "@/integrations/supabase/client";
import { UNDERCARD_MATCHES, CHAOS_PROPS, DEFAULT_MENS_ENTRANTS, DEFAULT_WOMENS_ENTRANTS } from "./constants";

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

export async function generateDemoPicksForPlayers(playerIds: string[]) {
  const picks: Array<{
    player_id: string;
    match_id: string;
    prediction: string;
  }> = [];

  const mensEntrants = DEFAULT_MENS_ENTRANTS;
  const womensEntrants = DEFAULT_WOMENS_ENTRANTS;

  for (const playerId of playerIds) {
    // Undercard matches (2 picks)
    UNDERCARD_MATCHES.forEach((match) => {
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

    // Men's Chaos Props (6 picks)
    CHAOS_PROPS.forEach((_, i) => {
      picks.push({
        player_id: playerId,
        match_id: `mens_chaos_prop_${i + 1}`,
        prediction: Math.random() > 0.5 ? "YES" : "NO",
      });
    });

    // Women's Chaos Props (6 picks)
    CHAOS_PROPS.forEach((_, i) => {
      picks.push({
        player_id: playerId,
        match_id: `womens_chaos_prop_${i + 1}`,
        prediction: Math.random() > 0.5 ? "YES" : "NO",
      });
    });
  }

  const { error } = await supabase.from("picks").insert(picks);
  if (error) throw error;
}

export async function seedDemoParty(
  partyCode: string,
  hostSessionId: string
): Promise<{ hostPlayerId: string; guestIds: string[] }> {
  const hostEmail = "kyle.husni@gmail.com";
  
  // 1. Create demo host as player (Kyle) - no .select() due to RLS
  const { error: hostError } = await supabase
    .from("players")
    .insert({
      party_code: partyCode,
      email: hostEmail,
      display_name: "Kyle",
      session_id: hostSessionId,
    });

  if (hostError) throw hostError;

  // Lookup host ID using SECURITY DEFINER function
  const { data: hostLookup, error: hostLookupError } = await supabase
    .rpc('lookup_player_by_email', {
      p_party_code: partyCode,
      p_email: hostEmail
    });

  if (hostLookupError || !hostLookup?.[0]) {
    throw hostLookupError || new Error("Failed to lookup host player");
  }
  const hostPlayerId = hostLookup[0].id;

  // 2. Create 5 demo guests - no .select() due to RLS
  const guestInserts = DEMO_GUESTS.map((g) => ({
    party_code: partyCode,
    email: g.email,
    display_name: g.name,
    session_id: crypto.randomUUID(),
  }));

  const { error: guestsError } = await supabase
    .from("players")
    .insert(guestInserts);

  if (guestsError) throw guestsError;

  // Lookup each guest ID using SECURITY DEFINER function
  const guestIds: string[] = [];
  for (const guest of DEMO_GUESTS) {
    const { data: guestLookup } = await supabase
      .rpc('lookup_player_by_email', {
        p_party_code: partyCode,
        p_email: guest.email
      });
    if (guestLookup?.[0]?.id) {
      guestIds.push(guestLookup[0].id);
    }
  }

  // 3. Generate picks for all players
  const allPlayerIds = [hostPlayerId, ...guestIds];
  await generateDemoPicksForPlayers(allPlayerIds);

  return {
    hostPlayerId,
    guestIds,
  };
}
