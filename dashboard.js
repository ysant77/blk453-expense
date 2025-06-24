const supabase = supabase.createClient(
  'https://cnxoktpvkpqpbrsxwmbp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNueG9rdHB2a3BxcGJyc3h3bWJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NDk1MzksImV4cCI6MjA2NjMyNTUzOX0.TCgBy1_EBD3JoOYYCat8MEgnlLwtrOSpunlDzRZVVTQ'
);

// Redirect if not logged in
supabase.auth.getSession().then(({ data: { session } }) => {
  if (!session) window.location.href = 'index.html';
});

// Logout button
document.getElementById('logout-btn').addEventListener('click', async () => {
  await supabase.auth.signOut();
  localStorage.removeItem('supabaseSession');
  window.location.href = 'index.html';
});

// Dummy placeholders for now
async function addTenant() {
  alert("Stub: Add Tenant");
}

async function calculatePUB() {
  const pubAmount = parseFloat(document.getElementById("pub-amount").value);
  const start = new Date(document.getElementById("pub-start").value);
  const end = new Date(document.getElementById("pub-end").value);

  // Placeholder output
  const summary = `🏠 PUB Summary:
Start: ${start.toDateString()}
End: ${end.toDateString()}
Amount: SGD ${pubAmount.toFixed(2)}

More logic to be implemented later...`;
  document.getElementById("summary-output").textContent = summary;
}
