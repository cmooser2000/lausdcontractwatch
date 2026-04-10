/* LAUSD Contract Watch — Contract Detail Page */

initLayout();

const contractId = parseInt(new URLSearchParams(location.search).get('id'));

if (!contractId) {
  document.getElementById('contractBody').innerHTML =
    `<div class="empty-state"><div class="empty-icon">❌</div><h3>No contract specified</h3>
     <p><a href="/search.html">Browse all contracts</a></p></div>`;
} else {
  loadData().then(data => {
    const c = data.contracts.find(x => x.id === contractId);
    if (!c) {
      document.getElementById('contractBody').innerHTML =
        `<div class="empty-state"><div class="empty-icon">🔍</div><h3>Contract not found</h3>
         <p><a href="/search.html">Browse all contracts</a></p></div>`;
      return;
    }
    document.title = `${c.title} — LAUSD Contract Watch`;
    renderHeader(c);
    renderBody(c, data);
  });
}

// ── Header ────────────────────────────────────────────────────

function renderHeader(c) {
  document.getElementById('pageHeaderContent').innerHTML = `
    <div class="contract-header-row">
      ${categoryTag(c.category)}
      ${statusBadge(c.status)}
      ${verificationBadge(c.verification_status)}
      ${c.finding_level && c.finding_level !== 'none'
        ? `<span class="badge" style="background:#f8d7da;color:#721c24">⚠ ${escapeHtml(c.finding_level)} finding</span>` : ''}
    </div>
    <h1 style="font-size:1.5rem;font-weight:800;margin:0.25rem 0">${escapeHtml(c.title)}</h1>
    <div class="vendor-name-large">${escapeHtml(c.vendor_name || '')}</div>`;
}

// ── Main Body ─────────────────────────────────────────────────

function renderBody(c, data) {
  const conflicts = (data.conflicts_of_interest || []).filter(cf => cf.contract_id === contractId);
  const vendorConns = (data.vendor_connections || []).filter(vc =>
    (c.vendor_name || '').toLowerCase().includes((vc.vendor_name || '').toLowerCase()) ||
    (vc.vendor_name || '').toLowerCase().includes((c.vendor_name || '').split(/[\s,]/)[0].toLowerCase())
  );
  const profile = (data.vendor_profiles || []).find(vp =>
    (c.vendor_name || '').toLowerCase().includes((vp.vendor_name || '').toLowerCase())
  );
  const equivs = data.cost_equivalents || [];

  document.getElementById('contractBody').innerHTML = `
    ${verificationBanner(c.verification_status)}
    <div class="contract-detail-grid">
      <div class="contract-main">
        ${plainEnglishCard(c)}
        ${descriptionCard(c)}
        ${aiAnalysisCard(c)}
        ${conflictsCard(conflicts, data.board_members || [])}
        ${boardConnectionsCard(vendorConns, data.board_members || [])}
      </div>
      <aside class="contract-sidebar">
        ${quickFactsCard(c)}
        ${equivalentsCard(c, equivs)}
        ${vendorProfileCard(profile)}
        ${relatedContractsCard(c, data.contracts)}
        ${sourceCard(c)}
      </aside>
    </div>`;
}

// ── Cards ─────────────────────────────────────────────────────

function verificationBanner(v) {
  const map = {
    verified:   ['vb-verified',   '✓ Verified against primary LAUSD board documents.'],
    reported:   ['vb-reported',   'ℹ Reported: sourced from news coverage, not independently verified.'],
    estimated:  ['vb-estimated',  '~ Estimated: based on comparable contracts. Verify against source.'],
    unverified: ['vb-unverified', '⚠ Unverified: requires verification against source documents.'],
  };
  const [cls, msg] = map[v] || map.unverified;
  return `<div class="verification-banner ${cls}">${msg}</div>`;
}

function plainEnglishCard(c) {
  if (!c.plain_english) return '';
  return `<div class="detail-card card-plain-english">
    <h3>In Plain English</h3>
    <p class="plain-english-text">${escapeHtml(c.plain_english)}</p>
  </div>`;
}

function descriptionCard(c) {
  if (!c.description) return '';
  return `<div class="detail-card">
    <h3>Official Description</h3>
    <div class="detail-grid">
      <div class="detail-item"><span class="detail-label">Contract #</span><span class="detail-value">${escapeHtml(c.contract_number || '—')}</span></div>
      <div class="detail-item"><span class="detail-label">Department</span><span class="detail-value">${escapeHtml(c.department || '—')}</span></div>
      <div class="detail-item"><span class="detail-label">Contract Type</span><span class="detail-value">${escapeHtml(c.contract_type || '—')}</span></div>
      <div class="detail-item"><span class="detail-label">Funding Source</span><span class="detail-value">${escapeHtml(c.funding_source || '—')}</span></div>
      <div class="detail-item"><span class="detail-label">Board Vote</span><span class="detail-value">${escapeHtml(c.board_vote || '—')}</span></div>
      <div class="detail-item"><span class="detail-label">Board Meeting</span><span class="detail-value">${formatDate(c.board_meeting_date)}</span></div>
    </div>
    <div style="margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border)">
      <p style="font-size:0.9rem;line-height:1.7;color:var(--text-light)">${escapeHtml(c.description)}</p>
    </div>
    ${c.notes ? `<div style="margin-top:0.75rem;font-size:0.82rem;color:var(--text-muted);font-style:italic">${escapeHtml(c.notes)}</div>` : ''}
  </div>`;
}

function aiAnalysisCard(c) {
  if (!c.ai_analysis && !c.red_flags && !c.questions_to_ask) return '';
  return `<div class="detail-card">
    <h3>Analysis &amp; Concerns</h3>
    ${c.red_flags ? `
      <div style="background:#fff5f5;border:1px solid #f5c6cb;border-radius:6px;padding:1rem;margin-bottom:1rem">
        <strong style="color:var(--red);font-size:0.85rem;text-transform:uppercase;letter-spacing:0.05em">⚠ Red Flags</strong>
        <p style="font-size:0.9rem;margin-top:0.5rem;line-height:1.7">${escapeHtml(c.red_flags)}</p>
      </div>` : ''}
    ${c.ai_analysis ? `<p style="font-size:0.9rem;line-height:1.7;margin-bottom:1rem">${escapeHtml(c.ai_analysis)}</p>` : ''}
    ${c.questions_to_ask ? `
      <div style="background:#f0f4ff;border:1px solid #c5d3f5;border-radius:6px;padding:1rem">
        <strong style="color:var(--blue);font-size:0.85rem;text-transform:uppercase;letter-spacing:0.05em">Questions to Ask</strong>
        <p style="font-size:0.9rem;margin-top:0.5rem;line-height:1.7">${escapeHtml(c.questions_to_ask)}</p>
      </div>` : ''}
  </div>`;
}

function conflictsCard(conflicts, boardMembers) {
  if (!conflicts.length) return '';
  const high = conflicts.filter(cf => !cf.is_public_stock);
  const stock = conflicts.filter(cf => cf.is_public_stock);
  return `<div class="detail-card card-conflicts">
    <h3>⚠ Potential Conflicts of Interest <span style="font-size:0.8rem;font-weight:400;color:#9b59b6">(${conflicts.length} flag${conflicts.length !== 1 ? 's' : ''})</span></h3>
    <div class="conflicts-disclaimer">
      These are potential matches between board member Form 700 financial disclosures and this contract.
      They are not confirmed conflicts — many involve publicly-traded stock holdings.
      <a href="/conflicts.html">Learn more about our methodology &rarr;</a>
    </div>
    <div class="conflicts-list">
      ${conflicts.slice(0, 5).map(cf => `
        <div class="conflict-item">
          <span class="conflict-type-badge">${escapeHtml(cf.match_confidence || 'Low')} confidence match</span>
          <div class="conflict-parties">
            <div class="conflict-party">
              <span class="conflict-role">Board Member</span>
              <strong>${escapeHtml(cf.filer_name || '—')}</strong>
              <span style="font-size:0.82rem;color:var(--text-light)">${escapeHtml(cf.filer_position || '')}</span>
            </div>
            <span class="conflict-arrow">⟷</span>
            <div class="conflict-party">
              <span class="conflict-role">Disclosed Holding</span>
              <strong>${escapeHtml(cf.company_disclosed || '—')}</strong>
              <span style="font-size:0.82rem;color:var(--text-light)">${escapeHtml(cf.schedule_type || '')} — ${escapeHtml(cf.amount_range || '')} — ${escapeHtml(cf.filing_year || '')}</span>
            </div>
          </div>
          <p class="conflict-desc">${escapeHtml(cf.flag_reason || '')}</p>
        </div>`).join('')}
    </div>
    ${conflicts.length > 5 ? `<p style="margin-top:1rem;font-size:0.85rem;color:var(--text-muted)">+${conflicts.length - 5} more — <a href="/conflicts.html">view all on conflicts page</a></p>` : ''}
  </div>`;
}

function boardConnectionsCard(conns, boardMembers) {
  if (!conns.length) return '';
  return `<div class="detail-card" style="border-color:#f5c6cb;background:#fff5f5">
    <h3 style="color:var(--red)">Board Member Connections</h3>
    <div class="connections-list">
      ${conns.map(vc => {
        const bm = boardMembers.find(b => b.id === vc.board_member_id);
        return `<div class="connection-card">
          <div class="conn-header">
            <span class="conn-type-badge">${escapeHtml(vc.connection_type || 'Connection')}</span>
          </div>
          <div class="conn-body">
            <div class="conn-parties">
              <div class="conn-party">
                <span class="conn-role">Board Member</span>
                <strong>${escapeHtml(bm ? bm.name : 'Unknown')}</strong>
                <span>${escapeHtml(bm ? `District ${bm.district}` : '')}</span>
              </div>
              <span class="conn-arrow">⟷</span>
              <div class="conn-party">
                <span class="conn-role">Vendor</span>
                <strong>${escapeHtml(vc.vendor_name)}</strong>
              </div>
            </div>
            <p class="conn-desc">${escapeHtml(vc.description || '')}</p>
          </div>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

function quickFactsCard(c) {
  return `<div class="sidebar-card sidebar-card-highlight">
    <h4>Quick Facts</h4>
    <div class="quick-fact"><span class="qf-label">Amount</span><span class="qf-value">${formatMoneyFull(c.amount)}</span></div>
    <div class="quick-fact"><span class="qf-label">Category</span><span class="qf-value">${escapeHtml(c.category || '—')}</span></div>
    <div class="quick-fact"><span class="qf-label">Status</span><span class="qf-value">${escapeHtml(c.status || '—')}</span></div>
    <div class="quick-fact"><span class="qf-label">Approved</span><span class="qf-value">${formatDate(c.approval_date)}</span></div>
    <div class="quick-fact"><span class="qf-label">Start</span><span class="qf-value">${formatDate(c.start_date)}</span></div>
    <div class="quick-fact"><span class="qf-label">End</span><span class="qf-value">${formatDate(c.end_date)}</span></div>
    <div class="quick-fact"><span class="qf-label">Verification</span><span class="qf-value" style="font-size:0.75rem">${escapeHtml(c.verification_status || 'unverified')}</span></div>
  </div>`;
}

function equivalentsCard(c, equivs) {
  if (!equivs.length || !c.amount) return '';
  const amt = parseFloat(c.amount) || 0;
  const picks = equivs.slice(0, 6);
  return `<div class="sidebar-card">
    <h4>What This Could Buy</h4>
    <div class="equivalents-grid">
      ${picks.map(e => {
        const n = Math.floor(amt / parseFloat(e.unit_cost));
        return `<div class="equivalent-card">
          <div class="eq-icon">${equivIcon(e.icon)}</div>
          <div class="eq-count">${n >= 1000 ? (n/1000).toFixed(0)+'K' : n.toLocaleString()}</div>
          <div class="eq-label">${escapeHtml(e.unit_label)}</div>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

function vendorProfileCard(profile) {
  if (!profile) return '';
  return `<div class="sidebar-card">
    <h4>Vendor Profile</h4>
    ${profile.parent_company ? `<div style="margin-bottom:0.5rem"><span style="font-size:0.75rem;color:var(--text-muted)">Parent Company</span><div style="font-size:0.9rem;font-weight:600">${escapeHtml(profile.parent_company)}</div></div>` : ''}
    ${profile.company_type ? `<div style="margin-bottom:0.5rem"><span style="font-size:0.75rem;color:var(--text-muted)">Type</span><div style="font-size:0.9rem">${escapeHtml(profile.company_type)}</div></div>` : ''}
    ${profile.controversies ? `<div style="margin-top:0.75rem;padding-top:0.75rem;border-top:1px solid var(--border);font-size:0.82rem;color:var(--text-light);line-height:1.5">${escapeHtml(profile.controversies)}</div>` : ''}
  </div>`;
}

function relatedContractsCard(c, contracts) {
  const related = contracts.filter(x =>
    x.id !== c.id && (
      (c.vendor_name && x.vendor_name && x.vendor_name.split(/[\s,]/)[0] === c.vendor_name.split(/[\s,]/)[0]) ||
      x.category === c.category
    )
  ).sort((a, b) => (parseFloat(b.amount)||0) - (parseFloat(a.amount)||0)).slice(0, 5);

  if (!related.length) return '';
  return `<div class="sidebar-card">
    <h4>Related Contracts</h4>
    <ul class="sidebar-list">
      ${related.map(r => `
        <li>
          <a href="/contract.html?id=${r.id}" style="font-size:0.82rem">${escapeHtml(r.title)}</a>
          <span class="sidebar-amount">${formatMoney(r.amount)}</span>
        </li>`).join('')}
    </ul>
  </div>`;
}

function sourceCard(c) {
  if (!c.source_url) return '';
  const isLocal = c.source_url.startsWith('/');
  return `<div class="sidebar-card sidebar-card-alert">
    <h4>Source Document</h4>
    <p style="font-size:0.82rem;color:var(--text-light);margin-bottom:0.75rem">
      This contract was extracted from official LAUSD board records.
    </p>
    ${isLocal
      ? `<a href="${escapeHtml(c.source_url)}" class="btn btn-primary btn-block" style="font-size:0.85rem">View Board Report (PDF)</a>`
      : `<a href="${escapeHtml(c.source_url)}" target="_blank" rel="noopener" class="btn btn-primary btn-block" style="font-size:0.85rem">View Source &rarr;</a>`}
  </div>`;
}

// ── Icon mapping ──────────────────────────────────────────────

function equivIcon(key) {
  const map = {
    book: '📚', tree: '🌳', art: '🎨', music: '🎵',
    textbook: '📖', playground: '🛝', counselor: '🧑‍💼',
    medical: '🏥', afterschool: '🏫', person: '👤',
  };
  return map[key] || '📦';
}
