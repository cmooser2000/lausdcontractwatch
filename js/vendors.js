/* LAUSD Contract Watch — Vendor Analysis Page */

initLayout();

let activeTab = 'active';

loadData().then(data => {
  const contracts = data.contracts;
  delegated = data.delegated_purchases || [];
  renderVendors(contracts);
  bindTabs(contracts);
}).catch(() => {
  document.getElementById('vendorSummary').innerHTML =
    'Couldn\u2019t load vendor data. <a href="" onclick="location.reload(true);return false">Reload the page</a>.';
  document.getElementById('vendorsTbody').innerHTML = '';
});

let delegated = [];

function buildVendorMap(contracts, includeDelegatedOnly) {
  const map = {};
  contracts.forEach(c => {
    const name = (c.vendor_name || 'Unknown').trim();
    const key = vendorKey(name);
    if (!map[key]) map[key] = { name, contracts: [], total: 0, categories: new Set(), statuses: new Set() };
    map[key].contracts.push(c);
    map[key].total += parseFloat(c.amount) || 0;
    map[key].categories.add(c.category);
    map[key].statuses.add(c.status);
  });
  if (includeDelegatedOnly) {
    delegated.forEach(p => {
      const key = vendorKey(p.vendor_name);
      if (!map[key]) map[key] = { name: p.vendor_name, contracts: [], total: 0, categories: new Set(), statuses: new Set(), delegatedOnly: true };
    });
  }
  return Object.values(map).sort((a, b) => b.total - a.total);
}

function renderVendors(contracts) {
  const all = buildVendorMap(contracts, true);
  const active = buildVendorMap(contracts.filter(c => c.status === 'Active'));

  document.getElementById('activeCount').textContent = active.length;
  document.getElementById('allCount').textContent = all.length;

  renderTable(activeTab === 'active' ? active : all);

  const total = (activeTab === 'active' ? active : all).reduce((s, v) => s + v.total, 0);
  document.getElementById('vendorSummary').innerHTML =
    `<strong>${(activeTab === 'active' ? active : all).length}</strong> vendors &mdash; total value: <strong>${formatMoney(total)}</strong>`;
}

function renderTable(vendors) {
  const tbody = document.getElementById('vendorsTbody');
  if (!vendors.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-icon"><i data-lucide="list"></i></div><h3>No vendors found</h3></div></td></tr>`;
    lucide.createIcons();
    return;
  }

  tbody.innerHTML = vendors.map((v, i) => {
    const cats = [...v.categories].filter(Boolean).map(c => categoryTag(c)).join(' ');
    const statuses = [...v.statuses].filter(Boolean).map(s => statusBadge(s)).join(' ');
    return `
      <tr>
        <td style="color:var(--text-muted);font-weight:600;font-family:var(--mono)">${i + 1}</td>
        <td>
          <a class="contract-link" href="${vendorUrl(v.name)}">${escapeHtml(v.name)}</a>
          <div class="contract-num">${v.delegatedOnly ? 'Delegated purchases only' : `${v.contracts.length} contract${v.contracts.length !== 1 ? 's' : ''}`}</div>
        </td>
        <td style="font-size:0.85rem;color:var(--text-muted)">${v.contracts.length}</td>
        <td class="col-right amount-cell">${formatMoney(v.total)}</td>
        <td class="categories-cell">${cats}</td>
        <td>${statuses}</td>
      </tr>`;
  }).join('');
}

function bindTabs(contracts) {
  document.querySelectorAll('.tab[data-tab]').forEach(tab => {
    tab.addEventListener('click', e => {
      e.preventDefault();
      activeTab = tab.dataset.tab;
      document.querySelectorAll('.tab[data-tab]').forEach(t => t.classList.remove('tab-active'));
      tab.classList.add('tab-active');
      renderVendors(contracts);
    });
  });
}
