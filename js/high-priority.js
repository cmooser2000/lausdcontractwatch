/* LAUSD Contract Watch — High Priority Contracts Page */

initLayout();

let contracts = [];
let costEquivs = [];
let activeLevel = 'significant';

loadData().then(data => {
  contracts = data.contracts;
  costEquivs = data.cost_equivalents || [];

  const sig = contracts.filter(c => c.finding_level === 'significant');
  const med = contracts.filter(c => c.finding_level === 'medium');
  const min = contracts.filter(c => c.finding_level === 'minor');

  document.getElementById('countSig').textContent = sig.length;
  document.getElementById('countMed').textContent = med.length;
  document.getElementById('countMin').textContent = min.length;

  renderList('significant');
  bindTabs();
});

function renderList(level) {
  const list = document.getElementById('priorityList');
  const items = contracts
    .filter(c => c.finding_level === level)
    .sort((a, b) => (parseFloat(b.amount) || 0) - (parseFloat(a.amount) || 0));

  if (!items.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">✅</div><h3>No contracts at this level</h3></div>`;
    return;
  }

  list.innerHTML = items.map((c, i) => priorityCard(c, i + 1, level)).join('');
}

function priorityCard(c, rank, level) {
  const amt = parseFloat(c.amount) || 0;
  const headerClass = { significant: 'problem-header-critical', medium: 'problem-header-medium', minor: 'problem-header-high' }[level] || 'problem-header-high';

  const comparisons = costEquivs.slice(0, 2).map(e => {
    const n = Math.floor(amt / parseFloat(e.unit_cost));
    return n ? `<span style="font-size:0.82rem;color:var(--text-muted)">= ${n.toLocaleString()} ${e.unit_label}</span>` : '';
  }).filter(Boolean).join('&nbsp;&nbsp;');

  return `
    <div class="priority-card">
      <div class="priority-rank">#${rank}</div>
      <div class="priority-content">
        <div class="priority-header">
          <div>
            <h2><a href="/contract.html?id=${c.id}">${escapeHtml(c.title)}</a></h2>
            <div class="priority-meta">
              ${categoryTag(c.category)}
              ${statusBadge(c.status)}
              <span>${escapeHtml(c.vendor_name || '')}</span>
            </div>
          </div>
          <div class="priority-amount">
            <span class="priority-dollar">${formatMoney(c.amount)}</span>
            ${comparisons ? `<div style="margin-top:0.25rem">${comparisons}</div>` : ''}
          </div>
        </div>

        ${c.red_flags ? `
          <div class="priority-explanation">
            <h4>Red Flags</h4>
            <p>${escapeHtml(c.red_flags)}</p>
          </div>` : ''}

        ${c.plain_english ? `
          <div style="font-size:0.9rem;line-height:1.7;color:var(--text-light);margin-bottom:1rem">
            ${escapeHtml(c.plain_english)}
          </div>` : c.description ? `
          <div style="font-size:0.9rem;line-height:1.7;color:var(--text-light);margin-bottom:1rem">
            ${escapeHtml(c.description.slice(0, 400))}${c.description.length > 400 ? '…' : ''}
          </div>` : ''}

        ${c.questions_to_ask ? `
          <div class="priority-explanation" style="background:#f0f4ff;border-left:3px solid var(--blue)">
            <h4 style="color:var(--blue)">Questions to Ask</h4>
            <p>${escapeHtml(c.questions_to_ask)}</p>
          </div>` : ''}

        <div class="priority-actions">
          <a href="/contract.html?id=${c.id}" class="btn btn-primary btn-sm">Full Details</a>
          <a href="/take-action.html" class="btn btn-outline btn-sm">Take Action</a>
          ${c.source_url ? `<a href="${escapeHtml(c.source_url)}" class="btn btn-outline btn-sm" target="_blank" rel="noopener">Source Doc</a>` : ''}
        </div>
      </div>
    </div>`;
}

function bindTabs() {
  document.querySelectorAll('.tab[data-level]').forEach(tab => {
    tab.addEventListener('click', e => {
      e.preventDefault();
      activeLevel = tab.dataset.level;
      document.querySelectorAll('.tab[data-level]').forEach(t => t.classList.remove('tab-active'));
      tab.classList.add('tab-active');
      renderList(activeLevel);
    });
  });
}
