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

let contributionSummaries = {}; // key = YYYY-MM -> array of tenant summaries

function formatMonthYear(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
}

async function fetchTenants() {
  const { data: tenants, error } = await supabaseClient.from('tenants').select('*');
  if (error) return console.error(error);

  const tbody = document.getElementById('tenant-body');
  tbody.innerHTML = '';

  tenants.forEach(t => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><span data-field="name" data-id="${t.id}">${t.name}</span></td>
      <td><span data-field="rent" data-id="${t.id}">${t.rent}</span></td>
      <td><span data-field="move_in" data-id="${t.id}">${t.move_in}</span></td>
      <td><span data-field="move_out" data-id="${t.id}">${t.move_out ?? ''}</span></td>
      <td>
        <button onclick="editRow(this, '${t.id}')">Edit</button>
        <button class="danger" onclick="deleteTenant('${t.id}')">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function editRow(button, id) {
  const row = button.closest('tr');
  row.querySelectorAll('span').forEach(span => {
    const input = document.createElement('input');
    input.value = span.textContent;
    input.setAttribute('data-field', span.getAttribute('data-field'));
    input.setAttribute('data-id', id);
    span.replaceWith(input);
  });
  button.textContent = 'Save';
  button.onclick = () => saveRow(button, id);
}

async function addTenant() {
  const name = document.getElementById('new-name').value.trim();
  const rent = parseFloat(document.getElementById('new-rent').value);
  const move_in = document.getElementById('new-movein').value;
  const move_out = document.getElementById('new-moveout').value || null;

  if (!name || isNaN(rent) || !move_in) {
    alert('Name, Rent, and Move-In are required!');
    return;
  }

  const { data: existing, error: checkError } = await supabaseClient
    .from("tenants")
    .select("*")
    .eq("name", name);

  if (checkError) return console.error(checkError);
  if (existing.length > 0) {
    alert("Tenant with this name already exists.");
    return;
  }

  await supabaseClient.from('tenants').insert({ name, rent, move_in, move_out });

  alert("Tenant added!");
  document.getElementById('new-name').value = '';
  document.getElementById('new-rent').value = '';
  document.getElementById('new-movein').value = '';
  document.getElementById('new-moveout').value = '';

  await fetchTenants();

  const today = new Date().toISOString().split("T")[0];
  const { data: bills } = await supabaseClient.from('pub_bills').select('*');
  const activeBill = bills.find(b => today >= b.start_date && today <= b.end_date);
  if (activeBill) {
    document.getElementById("pub-amount").value = activeBill.amount;
    document.getElementById("pub-start").value = activeBill.start_date;
    document.getElementById("pub-end").value = activeBill.end_date;
    await calculatePUB(true);
  }
}

async function saveRow(button, id) {
  const row = button.closest('tr');
  const updated = {};
  row.querySelectorAll('input').forEach(input => {
    updated[input.getAttribute('data-field')] = input.value.trim();
  });

  if (!updated.move_in) {
    alert("Move-in date is required.");
    return;
  }

  if (updated.move_out) {
    const moveInDate = new Date(updated.move_in);
    const moveOutDate = new Date(updated.move_out);
    if (moveOutDate <= moveInDate) {
      alert("Move-out date must be after move-in date.");
      return;
    }
  } else {
    updated.move_out = null;
  }

  const { error } = await supabaseClient.from('tenants').update(updated).eq('id', id);
  if (error) return console.error('Error saving:', error);
  alert('Saved!');
  fetchTenants();
}


async function deleteTenant(id) {
  if (!confirm('Delete this tenant?')) return;
  const { error } = await supabaseClient.from('tenants').delete().eq('id', id);
  if (error) return console.error(error);
  fetchTenants();
}

async function calculatePUB(forceUpdate = false) {
  const amount = parseFloat(document.getElementById("pub-amount").value);
  const start = document.getElementById("pub-start").value;
  const end = document.getElementById("pub-end").value;

  if (!amount || !start || !end) {
    alert("All PUB fields are required!");
    return;
  }

  const pubStart = new Date(start);
  const pubEnd = new Date(end);

  if (pubEnd <= pubStart) {
    alert("End date must be after start date.");
    return;
  }

  if (
    pubStart.getMonth() === pubEnd.getMonth() &&
    pubStart.getFullYear() === pubEnd.getFullYear()
  ) {
    alert("Start and end date must be in different months.");
    return;
  }

  const { data: existingPub, error: dupCheckError } = await supabaseClient
    .from("pub_bills")
    .select("*")
    .eq("start_date", start)
    .eq("end_date", end);

  if (dupCheckError) return console.error(dupCheckError);
  if (existingPub.length > 0 && !forceUpdate) {
    alert("PUB bill for this date range already exists.");
    return;
  }

  if (existingPub.length === 0) {
    await supabaseClient.from("pub_bills").insert({
      amount,
      start_date: start,
      end_date: end,
    });
  }

  const { data: tenants } = await supabaseClient.from("tenants").select("*");

  const activeTenants = tenants.filter((t) => {
    const moveIn = new Date(t.move_in);
    const moveOut = t.move_out ? new Date(t.move_out) : null;
    return moveIn <= pubEnd && (!moveOut || moveOut >= pubStart);
  });

  const rentStart = new Date(pubStart.getFullYear(), pubStart.getMonth(), 1);
  const rentEnd = new Date(pubStart.getFullYear(), pubStart.getMonth() + 1, 0);
  const rentDays = dateDiffInDays(rentStart, rentEnd);

  const monthKey = `${pubStart.getFullYear()}-${String(pubStart.getMonth() + 1).padStart(2, '0')}`;
  const monthLabel = formatMonthYear(pubStart);
  const summaryList = [];
  let summary = `📊 Monthly Contribution Summary (${monthLabel})\n\n`;

  let totalActiveDays = 0;
  const tenantDays = [];

  activeTenants.forEach(t => {
    const moveIn = new Date(t.move_in);
    const moveOut = t.move_out ? new Date(t.move_out) : null;
    const overlapStart = moveIn > pubStart ? moveIn : pubStart;
    const overlapEnd = moveOut && moveOut < pubEnd ? moveOut : pubEnd;
    const days = overlapEnd >= overlapStart ? dateDiffInDays(overlapStart, overlapEnd) : 0;
    totalActiveDays += days;
    tenantDays.push({ tenant: t, days });
  });

  tenantDays.forEach(({ tenant: t, days }) => {
    const rent = parseFloat(t.rent) || 0;
    const pubShare = days > 0 && totalActiveDays > 0 ? (amount * days) / totalActiveDays : 0;

    const actualStart = new Date(Math.max(new Date(t.move_in), rentStart));
    const actualEnd = new Date(Math.min(new Date(t.move_out || rentEnd), rentEnd));
    const rentDaysActive = actualEnd >= actualStart ? dateDiffInDays(actualStart, actualEnd) : 0;
    const rentShare = rentDaysActive > 0 ? (rent * rentDaysActive) / rentDays : 0;

    const total = rentShare + pubShare;

    summary += `👤 ${t.name}\n  - Rent: SGD ${rentShare.toFixed(2)}\n  - PUB:  SGD ${pubShare.toFixed(2)}\n  - Total: SGD ${total.toFixed(2)}\n\n`;

    summaryList.push({
      name: t.name,
      rentShare: rentShare.toFixed(2),
      pubShare: pubShare.toFixed(2),
      total: total.toFixed(2),
      month: monthLabel,
    });
  });

  document.getElementById("summary-output").textContent = summary;
  contributionSummaries[monthKey] = summaryList;

  const monthFilter = document.getElementById("month-filter");
  if (![...monthFilter.options].some((opt) => opt.value === monthKey)) {
    monthFilter.innerHTML += `<option value="${monthKey}">${monthLabel}</option>`;
  }

  monthFilter.value = monthKey;
  renderFilteredSummary();
  fetchPUBHistory();
}

window.onload = async () => {
  await fetchTenants();
  await fetchPUBHistory();

  const { data: bills } = await supabaseClient.from("pub_bills").select("*").order("start_date", { ascending: false });
  if (bills && bills.length > 0) {
    const latest = bills[0];
    document.getElementById("pub-amount").value = latest.amount;
    document.getElementById("pub-start").value = latest.start_date;
    document.getElementById("pub-end").value = latest.end_date;
    await calculatePUB(true);
  }
};
