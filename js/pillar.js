/* LAUSD Contract Watch — Pillar Page: Related Contracts */

function renderRelatedContracts(category) {
  const grid = document.getElementById('relatedContracts');
  if (!grid) return;

  loadData().then(data => {
    const contracts = data.contracts;
    const matches = contracts
      .filter(c => c.category === category)
      .sort((a, b) => (parseFloat(b.amount) || 0) - (parseFloat(a.amount) || 0))
      .slice(0, 3);

    if (!matches.length) {
      grid.innerHTML = '<p style="color:var(--text-light)">No matching contracts found.</p>';
      return;
    }

    matches.forEach(c => {
      const card = document.createElement('a');
      card.className = 'pillar-contract-card';
      card.href = '/contract.html?id=' + c.id;
      card.innerHTML =
        '<h4>' + escapeHtml(c.title) + '</h4>' +
        '<div class="pcc-amount">' + formatMoney(c.amount) + '</div>' +
        '<div class="pcc-vendor">' + escapeHtml(c.vendor_name || '') + '</div>' +
        '<div class="pcc-desc">' + escapeHtml(truncate(c.plain_english || c.description || '', 120)) + '</div>' +
        '<div class="pcc-cta">View details &rarr;</div>';
      grid.appendChild(card);
    });
  });
}

function truncate(str, len) {
  if (!str || str.length <= len) return str || '';
  return str.slice(0, len).replace(/\s+\S*$/, '') + '\u2026';
}
