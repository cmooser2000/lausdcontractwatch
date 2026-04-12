/* LAUSD Contract Watch — Tech Vendors Page */

initLayout();

loadData().then(data => {
  const tech = data.contracts.filter(c => c.category === 'Technology');
  const total = tech.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);
  const active = tech.filter(c => c.status === 'Active');

  document.getElementById('techSummary').innerHTML =
    `<strong>${tech.length}</strong> technology contracts &mdash; total value: <strong>${formatMoney(total)}</strong>
    &mdash; <strong>${active.length}</strong> currently active`;

  const sorted = [...tech].sort((a, b) => (parseFloat(b.amount) || 0) - (parseFloat(a.amount) || 0));
  const tbody = document.getElementById('techTbody');

  tbody.innerHTML = sorted.map(c => {
    const findingBadge = findingBadgeHtml(c.finding_level)
      || '<span style="color:var(--text-muted);font-size:0.8rem">\u2014</span>';
    return `
      <tr class="clickable-row" onclick="location.href='/contract.html?id=${c.id}'">
        <td><a class="contract-link" href="/contract.html?id=${c.id}">${escapeHtml(c.title)}</a>
            <div class="contract-num">${escapeHtml(c.contract_number || '')}</div></td>
        <td>${escapeHtml(c.vendor_name || '—')}</td>
        <td class="col-right amount-cell">${formatMoney(c.amount)}</td>
        <td>${statusBadge(c.status)}</td>
        <td>${findingBadge}</td>
        <td class="date-cell">${formatDate(c.approval_date)}</td>
      </tr>`;
  }).join('');
});

