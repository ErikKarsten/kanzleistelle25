
-- Schedule daily applicant reminder at 8:00 AM UTC
SELECT cron.schedule(
  'daily-applicant-reminder',
  '0 8 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://myvjwpbhdnnrkwazudnh.supabase.co/functions/v1/applicant-reminder',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15dmp3cGJoZG5ucmt3YXp1ZG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNzAwMjksImV4cCI6MjA4NDc0NjAyOX0.LviukkQjtfxmiiExFlaiHeL70SNqPkt2eaXJne3PhaQ"}'::jsonb,
        body:='{"time": "scheduled"}'::jsonb
    ) as request_id;
  $$
);
