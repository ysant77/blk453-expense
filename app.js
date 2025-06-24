const supabase = supabase.createClient(
  'https://YOUR_PROJECT.supabase.co',
  'YOUR_ANON_PUBLIC_KEY'
);

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    document.getElementById('error-msg').textContent = error.message;
  } else {
    // Store session and redirect
    localStorage.setItem('supabaseSession', JSON.stringify(data));
    window.location.href = 'dashboard.html';
  }
});
