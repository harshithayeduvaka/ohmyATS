
-- Ensure vault available (already enabled on Supabase)
-- Create a random secret for the cron purge endpoint, idempotent
do $$
declare
  v_id uuid;
begin
  select id into v_id from vault.secrets where name = 'purge_cron_secret';
  if v_id is null then
    perform vault.create_secret(encode(gen_random_bytes(32), 'hex'), 'purge_cron_secret', 'Shared secret for purge-old-scans cron');
  end if;
end$$;

-- Unschedule existing job (id=1) if present
do $$
begin
  perform cron.unschedule(jobid) from cron.job where jobid = 1;
exception when others then null;
end$$;

-- Reschedule with x-cron-secret header pulled from vault
select cron.schedule(
  'purge-old-scans-daily',
  '0 3 * * *',
  $cron$
  select net.http_post(
    url := 'https://znznuxpvoehdgdrnzahw.supabase.co/functions/v1/purge-old-scans',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpuem51eHB2b2VoZGdkcm56YWh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3ODA0MjEsImV4cCI6MjA4OTM1NjQyMX0.VN5igQNduoPuQqL5hVlxfWweT4wYf9523o_GSt_MUqQ',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'purge_cron_secret' limit 1)
    ),
    body := '{}'::jsonb
  );
  $cron$
);
