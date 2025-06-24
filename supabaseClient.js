const { createClient } = supabase;
const supabaseUrl = 'https://cnxoktpvkpqpbrsxwmbp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNueG9rdHB2a3BxcGJyc3h3bWJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NDk1MzksImV4cCI6MjA2NjMyNTUzOX0.TCgBy1_EBD3JoOYYCat8MEgnlLwtrOSpunlDzRZVVTQ';
const supabaseClient  = createClient(
  supabaseUrl,
  supabaseKey
);