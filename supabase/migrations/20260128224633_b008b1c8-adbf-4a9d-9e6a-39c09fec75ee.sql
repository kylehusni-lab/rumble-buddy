-- Block direct SELECT access to parties table (force use of parties_public view)
DROP POLICY IF EXISTS "Anyone can read parties_public view" ON parties;
CREATE POLICY "No direct read access to parties table"
ON parties FOR SELECT
USING (false);