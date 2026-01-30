-- Clean up party 9328 (orphaned test data)
DELETE FROM parties WHERE code = '9328';

-- Fix party X629M5 host ownership - set Kyle as the actual host
UPDATE parties 
SET host_user_id = 'ba1a255c-e878-44da-83b1-082ac5413193'
WHERE code = 'X629M5';

-- Add policy for admins to create parties with null host_user_id
CREATE POLICY "Admins can create parties" 
ON parties
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin')
);

-- Add policy for users to claim unclaimed parties
CREATE POLICY "Users can claim unclaimed parties" 
ON parties
FOR UPDATE
TO authenticated
USING (host_user_id IS NULL)
WITH CHECK (auth.uid() = host_user_id);