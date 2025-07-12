-- Clean up duplicate n8n configuration entries
DELETE FROM analytics_events 
WHERE event_type = 'n8n_configuration' 
AND id NOT IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn 
    FROM analytics_events 
    WHERE event_type = 'n8n_configuration'
  ) t 
  WHERE t.rn = 1
);