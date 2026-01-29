-- Add RLS policy for hosts to read players in their party
CREATE POLICY "Hosts can read players in their party"
ON public.players FOR SELECT
TO authenticated
USING (is_party_host(party_code));

-- Add RLS policy for party members to read fellow players
CREATE POLICY "Party members can read fellow players"
ON public.players FOR SELECT
TO authenticated
USING (is_party_member(party_code));