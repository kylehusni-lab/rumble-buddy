import { supabase } from "@/integrations/supabase/client";
import { UNDERCARD_MATCHES, CHAOS_PROPS, DEFAULT_MENS_ENTRANTS, DEFAULT_WOMENS_ENTRANTS } from "./constants";

export const DEMO_GUESTS = [
  { name: "Randy Savage", email: "randy@demo.local" },
  { name: "Macho Man", email: "macho@demo.local" },
  { name: "Hulk Hogan", email: "hulk@demo.local" },
  { name: "Stone Cold", email: "stone@demo.local" },
  { name: "The Rock", email: "rock@demo.local" },
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
    // Undercard matches (3 picks)
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
  // 1. Create demo host as player (Kyle)
  const { data: hostPlayer, error: hostError } = await supabase
    .from("players")
    .insert({
      party_code: partyCode,
      email: "kyle.husni@gmail.com",
      display_name: "Kyle",
      session_id: hostSessionId,
    })
    .select("id")
    .single();

  if (hostError || !hostPlayer) throw hostError || new Error("Failed to create host player");

  // 2. Create 5 demo guests
  const guestInserts = DEMO_GUESTS.map((g) => ({
    party_code: partyCode,
    email: g.email,
    display_name: g.name,
    session_id: crypto.randomUUID(),
  }));

  const { data: guests, error: guestsError } = await supabase
    .from("players")
    .insert(guestInserts)
    .select("id");

  if (guestsError || !guests) throw guestsError || new Error("Failed to create guests");

  // 3. Generate picks for all players
  const allPlayerIds = [hostPlayer.id, ...guests.map((g) => g.id)];
  await generateDemoPicksForPlayers(allPlayerIds);

  return {
    hostPlayerId: hostPlayer.id,
    guestIds: guests.map((g) => g.id),
  };
}
