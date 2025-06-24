const { createClient } = supabase;
const supabaseUrl = 'https://cnxoktpvkpqpbrsxwmbp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNueG9rdHB2a3BxcGJyc3h3bWJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NDk1MzksImV4cCI6MjA2NjMyNTUzOX0.TCgBy1_EBD3JoOYYCat8MEgnlLwtrOSpunlDzRZVVTQ';
const supabaseClient  = createClient(
  supabaseUrl,
  supabaseKey
);

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    document.getElementById('error-msg').textContent = error.message;
  } else {
    // Store session and redirect
    localStorage.setItem('supabaseSession', JSON.stringify(data));
    window.location.href = 'dashboard.html';
  }
});
