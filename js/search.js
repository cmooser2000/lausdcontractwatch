/* LAUSD Contract Watch — Search Page */

initLayout();

const PER_PAGE = 25;
let allContracts = [];
let filtered = [];
let currentPage = 1;

const $ = id => document.getElementById(id);

loadData().then(data => {
  allContracts = data.contracts;
  readUrlParams();
  applyFilters();
  bindEvents();
});

// ── URL Params ────────────────────────────────────────────────

function readUrlParams() {
  const p = new URLSearchParams(location.search);
  if (p.get('q'))        $('searchInput').value      = p.get('q');
  if (p.get('category')) $('filterCategory').value   = p.get('category');
  if (p.get('status'))   $('filterStatus').value     = p.get('status');
  if (p.get('sort'))     $('filterSort').value        = p.get('sort');
  if (p.get('finding'))  $('filterFinding').value     = p.get('finding');
  if (p.get('min'))      $('filterAmountMin').value   = p.get('min');
  if (p.get('max'))      $('filterAmountMax').value   = p.get('max');
  if (p.get('page'))     currentPage = parseInt(p.get('page')) || 1;
}

function pushUrlParams() {
  const p = new URLSearchParams();
  const q   = $('searchInput').value.trim();
  const cat = $('filterCategory').value;
  const st  = $('filterStatus').value;
  const srt = $('filterSort').value;
  const fnd = $('filterFinding').value;
  const mn  = $('filterAmountMin').value;
  const mx  = $('filterAmountMax').value;
  if (q)   p.set('q', q);
  if (cat) p.set('category', cat);
  if (st)  p.set('status', st);
  if (srt && srt !== 'amount_desc') p.set('sort', srt);
  if (fnd) p.set('finding', fnd);
  if (mn)  p.set('min', mn);
  if (mx)  p.set('max', mx);
  if (currentPage > 1) p.set('page', currentPage);
  const qs = p.toString();
  history.replaceState(null, '', qs ? '?' + qs : location.pathname);
}

// ── Filter & Sort ─────────────────────────────────────────────

function applyFilters() {
  const q   = $('searchInput').value.trim().toLowerCase();
  const cat = $('filterCategory').value;
  const st  = $('filterStatus').value;
  const srt = $('filterSort').value;
  const fnd = $('filterFinding').value;
  const mn  = parseFloat($('filterAmountMin').value) || 0;
  const mx  = parseFloat($('filterAmountMax').value) || Infinity;

  filtered = allContracts.filter(c => {
    if (cat && c.category !== cat) return false;
    if (st  && c.status   !== st)  return false;
    if (fnd && c.finding_level !== fnd) return false;
    const amt = parseFloat(c.amount) || 0;
    if (amt < mn || amt > mx) return false;
    if (q) {
      const haystack = [c.title, c.vendor_name, c.vendor_list, c.description,
                        c.plain_english, c.keywords, c.department, c.notes,
                        c.contract_number]
        .filter(Boolean).join(' ').toLowerCase();
      // support multi-word: all words must appear
      if (!q.split(/\s+/).every(word => haystack.includes(word))) return false;
    }
    return true;
  });

  // Sort
  filtered.sort((a, b) => {
    switch (srt) {
      case 'amount_asc':  return (parseFloat(a.amount)||0) - (parseFloat(b.amount)||0);
      case 'date_desc':   return (b.approval_date||'').localeCompare(a.approval_date||'');
      case 'date_asc':    return (a.approval_date||'').localeCompare(b.approval_date||'');
      case 'vendor':      return (a.vendor_name||'').localeCompare(b.vendor_name||'');
      case 'title':       return (a.title||'').localeCompare(b.title||'');
      default:            return (parseFloat(b.amount)||0) - (parseFloat(a.amount)||0);
    }
  });

  currentPage = Math.min(currentPage, Math.ceil(filtered.length / PER_PAGE) || 1);
  pushUrlParams();
  renderTable();
  renderPagination();
}

// ── Render ────────────────────────────────────────────────────

function renderTable() {
  const tbody = $('contractsTbody');
  const summary = $('resultsSummary');
  const start = (currentPage - 1) * PER_PAGE;
  const page  = filtered.slice(start, start + PER_PAGE);

  const total = allContracts.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);
  const filtTotal = filtered.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);
  summary.innerHTML = `Showing <strong>${page.length}</strong> of <strong>${filtered.length}</strong> contracts
    &mdash; filtered total: <strong>${formatMoney(filtTotal)}</strong>
    ${filtered.length < allContracts.length ? `&nbsp;<span style="color:var(--text-muted)">(of ${allContracts.length} total, ${formatMoney(total)})</span>` : ''}`;

  if (!page.length) {
    tbody.innerHTML = `<tr><td colspan="6">
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>No contracts found</h3>
        <p>Try broadening your search or clearing some filters.</p>
      </div></td></tr>`;
    return;
  }

  tbody.innerHTML = page.map(c => `
    <tr class="clickable-row" onclick="location.href='/contract.html?id=${c.id}'">
      <td>
        <a class="contract-link" href="/contract.html?id=${c.id}">${escapeHtml(c.title)}</a>
        <div class="contract-num">${escapeHtml(c.contract_number || '')}</div>
      </td>
      <td>${escapeHtml(c.vendor_name || '—')}</td>
      <td>${categoryTag(c.category)}</td>
      <td class="col-right amount-cell">${formatMoney(c.amount)}</td>
      <td>${statusBadge(c.status)}</td>
      <td class="date-cell">${formatDate(c.approval_date)}</td>
    </tr>`).join('');
}

function renderPagination() {
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pag = $('pagination');
  if (totalPages <= 1) { pag.innerHTML = ''; return; }

  let html = '';
  // Prev
  if (currentPage > 1)
    html += `<a class="page-link" href="#" data-page="${currentPage - 1}">&laquo;</a>`;

  // Page numbers (window of 7)
  let start = Math.max(1, currentPage - 3);
  let end   = Math.min(totalPages, currentPage + 3);
  if (start > 1)          html += `<a class="page-link" href="#" data-page="1">1</a>${start > 2 ? '<span class="page-link" style="cursor:default">…</span>' : ''}`;
  for (let i = start; i <= end; i++)
    html += `<a class="page-link${i === currentPage ? ' active' : ''}" href="#" data-page="${i}">${i}</a>`;
  if (end < totalPages)   html += `${end < totalPages - 1 ? '<span class="page-link" style="cursor:default">…</span>' : ''}<a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a>`;

  // Next
  if (currentPage < totalPages)
    html += `<a class="page-link" href="#" data-page="${currentPage + 1}">&raquo;</a>`;

  pag.innerHTML = html;
  pag.querySelectorAll('[data-page]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      currentPage = parseInt(a.dataset.page);
      applyFilters();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

// ── Events ────────────────────────────────────────────────────

function bindEvents() {
  let debounce;
  $('searchInput').addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => { currentPage = 1; applyFilters(); }, 200);
  });
  ['filterCategory','filterStatus','filterSort','filterFinding',
   'filterAmountMin','filterAmountMax'].forEach(id => {
    $(id).addEventListener('change', () => { currentPage = 1; applyFilters(); });
  });
  $('btnClearFilters').addEventListener('click', () => {
    $('searchInput').value = '';
    $('filterCategory').value = '';
    $('filterStatus').value = '';
    $('filterSort').value = 'amount_desc';
    $('filterFinding').value = '';
    $('filterAmountMin').value = '';
    $('filterAmountMax').value = '';
    currentPage = 1;
    applyFilters();
  });
}
