// Redirect if not logged in
supabaseClient.auth.getSession().then(({ data: { session } }) => {
  if (!session) window.location.href = 'index.html';
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  localStorage.removeItem('supabaseSession');
  window.location.href = 'index.html';
});

function dateDiffInDays(a, b) {
  return Math.floor((b - a) / (1000 * 60 * 60 * 24)) + 1;
}

async function fetchTenants() {
  const { data: tenants, error } = await supabaseClient.from('tenants').select('*');
  if (error) return console.error(error);

  const tbody = document.getElementById('tenant-body');
  tbody.innerHTML = '';

  tenants.forEach(t => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td contenteditable="true" data-field="name" data-id="${t.id}">${t.name}</td>
      <td contenteditable="true" data-field="rent" data-id="${t.id}">${t.rent}</td>
      <td contenteditable="true" data-field="move_in" data-id="${t.id}">${t.move_in}</td>
      <td contenteditable="true" data-field="move_out" data-id="${t.id}">${t.move_out ?? ''}</td>
      <td><button onclick="saveRow(this, '${t.id}')">Save</button></td>
    `;
    tbody.appendChild(row);
  });
}

async function saveRow(button, id) {
  const row = button.closest('tr');
  const updated = {};
  ['name', 'rent', 'move_in', 'move_out'].forEach(field => {
    const cell = row.querySelector(`[data-field='${field}']`);
    updated[field] = cell.textContent.trim();
  });
  if (!updated.move_out) updated.move_out = null;

  const { error } = await supabaseClient.from('tenants').update(updated).eq('id', id);
  if (error) return console.error('Error saving:', error);
  alert('Saved!');
}

async function calculatePUB() {
  const pubAmount = parseFloat(document.getElementById("pub-amount").value);
  const pubStart = new Date(document.getElementById("pub-start").value);
  const pubEnd = new Date(document.getElementById("pub-end").value);

  await supabaseClient.from('pub_bills').insert({
    amount: pubAmount,
    start_date: pubStart.toISOString().split('T')[0],
    end_date: pubEnd.toISOString().split('T')[0]
  });

  const { data: tenants, error } = await supabaseClient.from('tenants').select('*');
  if (error) return console.error(error);

  const pubDays = dateDiffInDays(pubStart, pubEnd);
  const rentStart = new Date(pubStart.getFullYear(), pubStart.getMonth(), 1);
  const rentEnd = new Date(pubStart.getFullYear(), pubStart.getMonth() + 1, 0);
  const rentDays = dateDiffInDays(rentStart, rentEnd);

  let summary = `🏠 Monthly Contribution Summary:\n\n`;

  const shares = tenants.map(t => {
    const moveIn = new Date(t.move_in);
    const moveOut = t.move_out ? new Date(t.move_out) : null;

    let pubDaysActive = pubDays;
    if (moveIn > pubStart) pubDaysActive = dateDiffInDays(moveIn, pubEnd);
    if (moveOut && moveOut < pubEnd) pubDaysActive = dateDiffInDays(pubStart, moveOut);
    if (moveIn > pubEnd || (moveOut && moveOut < pubStart)) pubDaysActive = 0;

    let rentDaysActive = rentDays;
    if (moveIn > rentStart) rentDaysActive = dateDiffInDays(moveIn, rentEnd);
    if (moveOut && moveOut < rentEnd) rentDaysActive = dateDiffInDays(rentStart, moveOut);
    if (moveIn > rentEnd || (moveOut && moveOut < rentStart)) rentDaysActive = 0;

    const pubShare = pubAmount * (pubDaysActive / pubDays);
    const rentShare = parseFloat(t.rent) * (rentDaysActive / rentDays);

    return {
      name: t.name,
      rent: rentShare,
      pub: pubShare,
      total: rentShare + pubShare
    };
  });

  shares.forEach(s => {
    summary += `- ${s.name}: Rent SGD ${s.rent.toFixed(2)} + PUB SGD ${s.pub.toFixed(2)} = SGD ${s.total.toFixed(2)}\n`;
  });

  document.getElementById("summary-output").textContent = summary;
}

window.onload = fetchTenants;
