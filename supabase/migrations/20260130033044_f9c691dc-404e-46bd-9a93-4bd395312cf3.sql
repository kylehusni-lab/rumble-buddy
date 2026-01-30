-- Add policy for hosts to update player points in their party
CREATE POLICY "Hosts can update players in their party"
ON public.players FOR UPDATE
TO authenticated
USING (is_party_host(party_code));