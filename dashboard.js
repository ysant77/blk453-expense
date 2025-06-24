const supabase = supabase.createClient(
  'https://YOUR_PROJECT.supabase.co',
  'YOUR_ANON_PUBLIC_KEY'
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
