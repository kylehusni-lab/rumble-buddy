-- Add unique constraint on wrestler name
ALTER TABLE public.wrestlers ADD CONSTRAINT wrestlers_name_unique UNIQUE (name);

-- Seed wrestlers from platform_config
INSERT INTO public.wrestlers (name, division, is_rumble_participant, is_confirmed)
SELECT 
  CASE 
    WHEN entrant_name LIKE '*%' THEN substring(entrant_name from 2)
    ELSE entrant_name
  END as name,
  'mens' as division,
  true as is_rumble_participant,
  NOT (entrant_name LIKE '*%') as is_confirmed
FROM platform_config pc, jsonb_array_elements_text(pc.value) as entrant_name
WHERE pc.key = 'mens_rumble_entrants'
  AND entrant_name != 'Surprise/Other Entrant'
UNION ALL
SELECT 
  CASE 
    WHEN entrant_name LIKE '*%' THEN substring(entrant_name from 2)
    ELSE entrant_name
  END as name,
  'womens' as division,
  true as is_rumble_participant,
  NOT (entrant_name LIKE '*%') as is_confirmed
FROM platform_config pc, jsonb_array_elements_text(pc.value) as entrant_name
WHERE pc.key = 'womens_rumble_entrants'
  AND entrant_name != 'Surprise/Other Entrant'
ON CONFLICT (name) DO UPDATE SET
  is_rumble_participant = true,
  is_confirmed = EXCLUDED.is_confirmed,
  division = EXCLUDED.division;