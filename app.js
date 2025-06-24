document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  if (!loginForm) return;

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      document.getElementById('error-msg').textContent = error.message;
    } else {
      localStorage.setItem('supabaseSession', JSON.stringify(data));
      window.location.href = 'dashboard.html';
    }
  });
});
