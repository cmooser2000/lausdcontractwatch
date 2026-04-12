/* LAUSD Contract Watch — Conflicts of Interest Page */

initLayout();

let allConflicts = [];
let contracts = [];

loadData().then(data => {
  allConflicts = data.conflicts_of_interest;
  contracts = data.contracts;
  populateFilters();
  renderConflicts();
  bindEvents();
});

function populateFilters() {
  const filers = [...new Set(allConflicts.map(c => c.filer_name).filter(Boolean))].sort();
  const years  = [...new Set(allConflicts.map(c => c.filing_year).filter(Boolean))].sort().reverse();

  const filerSel = document.getElementById('filterFiler');
  filers.forEach(f => {
    const opt = document.createElement('option');
    opt.value = f; opt.textContent = f;
    filerSel.appendChild(opt);
  });

  const yearSel = document.getElementById('filterYear');
  years.forEach(y => {
    const opt = document.createElement('option');
    opt.value = y; opt.textContent = y;
    yearSel.appendChild(opt);
  });
}

function getFiltered() {
  const filer  = document.getElementById('filterFiler').value;
  const year   = document.getElementById('filterYear').value;
  const conf   = document.getElementById('filterConfidence').value;
  const overlap = document.getElementById('filterOverlapOnly').checked;

  return allConflicts.filter(c => {
    if (filer  && c.filer_name     !== filer)  return false;
    if (year   && c.filing_year    !== year)   return false;
    if (conf   && c.match_confidence !== conf) return false;
    if (overlap && !c.year_overlap)            return false;
    return true;
  });
}

function renderConflicts() {
  const filtered = getFiltered();
  const list = document.getElementById('conflictsList');

  document.getElementById('conflictsSummary').innerHTML =
    `<strong>${filtered.length}</strong> of ${allConflicts.length} disclosures shown
    &mdash; <span style="color:var(--text-muted);font-size:0.85rem">Many involve publicly-traded stock and are not confirmed conflicts.</span>`;

  if (!filtered.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon"><i data-lucide="search"></i></div><h3>No matches found</h3><p>Try adjusting your filters.</p></div>`;
    lucide.createIcons();
    return;
  }

  // Group by filer
  const byFiler = {};
  filtered.forEach(cf => {
    const key = cf.filer_name || 'Unknown';
    if (!byFiler[key]) byFiler[key] = [];
    byFiler[key].push(cf);
  });

  list.innerHTML = Object.entries(byFiler).map(([filer, items]) => {
    const highConf = items.filter(i => i.match_confidence === 'High');
    const withOverlap = items.filter(i => i.year_overlap);
    return `
      <div class="detail-card" style="margin-bottom:1.5rem">
        <h3 style="margin-bottom:1rem">
          ${escapeHtml(filer)}
          <span style="font-size:0.8rem;font-weight:400;color:var(--text-muted);margin-left:0.5rem">${items[0]?.filer_position || ''}</span>
        </h3>
        <div style="display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:1rem;font-size:0.85rem">
          <span style="color:var(--text-muted)">${items.length} disclosure${items.length !== 1 ? 's' : ''}</span>
          ${highConf.length ? `<span style="color:var(--red);font-weight:600">${highConf.length} high-confidence match${highConf.length !== 1 ? 'es' : ''}</span>` : ''}
          ${withOverlap.length ? `<span style="color:var(--orange);font-weight:600">${withOverlap.length} with year overlap</span>` : ''}
        </div>
        <div style="display:flex;flex-direction:column;gap:0.75rem">
          ${items.map(cf => conflictRow(cf)).join('')}
        </div>
      </div>`;
  }).join('');
  lucide.createIcons();
}

function conflictRow(cf) {
  const contract = contracts.find(c => c.id === cf.contract_id);
  const confColor = { High: '#721c24', Medium: '#856404', Low: '#6c757d' }[cf.match_confidence] || '#6c757d';
  const confBg    = { High: '#f8d7da', Medium: '#fff3cd', Low: '#e2e3e5' }[cf.match_confidence] || '#e2e3e5';

  return `
    <div style="background:var(--bg);border-radius:var(--radius-sm);padding:0.85rem 1rem;border:1px solid var(--border)">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;flex-wrap:wrap">
        <div>
          <span style="display:inline-block;background:${confBg};color:${confColor};font-size:0.72rem;font-weight:700;padding:0.15rem 0.5rem;border-radius:3px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.35rem">
            ${escapeHtml(cf.match_confidence || 'Low')} confidence
          </span>
          ${cf.year_overlap ? `<span style="display:inline-block;background:#fff3cd;color:#856404;font-size:0.72rem;font-weight:700;padding:0.15rem 0.5rem;border-radius:3px;margin-left:0.25rem;margin-bottom:0.35rem"><i data-lucide="alert-triangle"></i> Year Overlap</span>` : ''}
          ${cf.is_public_stock ? `<span style="display:inline-block;background:#e2e3e5;color:#383d41;font-size:0.72rem;padding:0.15rem 0.5rem;border-radius:3px;margin-left:0.25rem;margin-bottom:0.35rem">Public Stock</span>` : ''}
          <div style="font-weight:600;font-size:0.9rem">${escapeHtml(cf.company_disclosed || '—')}</div>
          <div style="font-size:0.8rem;color:var(--text-muted)">${escapeHtml(cf.schedule_type || '')} &mdash; ${escapeHtml(cf.amount_range || '')} &mdash; Filed: ${escapeHtml(cf.filing_year || '')}</div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          ${contract ? `<a href="/contract.html?id=${contract.id}" style="font-size:0.82rem;color:var(--blue);font-weight:600">${escapeHtml(contract.title)}</a>
            <div style="font-size:0.8rem;color:var(--text-muted)">${formatMoney(cf.contract_amount)}</div>` : ''}
        </div>
      </div>
      <p style="font-size:0.82rem;color:var(--text-light);margin-top:0.5rem;line-height:1.5">${escapeHtml(cf.flag_reason || '')}</p>
    </div>`;
}

function bindEvents() {
  ['filterFiler','filterYear','filterConfidence'].forEach(id => {
    document.getElementById(id).addEventListener('change', renderConflicts);
  });
  document.getElementById('filterOverlapOnly').addEventListener('change', renderConflicts);
}
