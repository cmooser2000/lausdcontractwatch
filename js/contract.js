/* LAUSD Contract Watch — Contract Detail Page */

function formatCompact(n) {
  if (n >= 1000000000) {
    var b = n / 1000000000;
    return (b % 1 === 0 ? b.toFixed(0) : b.toFixed(1).replace(/\.0$/, '')) + 'B';
  }
  if (n >= 1000000) {
    var m = n / 1000000;
    return (m % 1 === 0 ? m.toFixed(0) : m.toFixed(1).replace(/\.0$/, '')) + 'M';
  }
  if (n >= 1000) {
    return Math.round(n / 1000).toLocaleString() + 'K';
  }
  return n.toLocaleString();
}

initLayout();

const contractId = parseInt(new URLSearchParams(location.search).get('id'));

if (!contractId) {
  document.getElementById('contractBody').innerHTML =
    `<div class="empty-state"><div class="empty-icon"><i data-lucide="x-circle"></i></div><h3>No contract specified</h3>
     <p><a href="/search.html">Browse all contracts</a></p></div>`;
  lucide.createIcons();
} else {
  loadData().then(data => {
    const c = data.contracts.find(x => x.id === contractId);
    if (!c) {
      document.getElementById('contractBody').innerHTML =
        `<div class="empty-state"><div class="empty-icon"><i data-lucide="search"></i></div><h3>Contract not found</h3>
         <p><a href="/search.html">Browse all contracts</a></p></div>`;
      lucide.createIcons();
      return;
    }
    document.title = `${c.title} — LAUSD Contract Watch`;
    renderHeader(c);
    renderBody(c, data);
    lucide.createIcons();
  });
}

// ── Header ────────────────────────────────────────────────────

function renderHeader(c) {
  document.getElementById('pageHeaderContent').innerHTML = `
    <div class="contract-header-row">
      ${categoryTag(c.category)}
      ${statusBadge(c.status)}
      ${verificationBadge(c.verification_status)}
      ${findingBadgeHtml(c.finding_level)}
    </div>
    <h1 style="font-size:1.5rem;font-weight:800;margin:0.25rem 0">${escapeHtml(c.title)}</h1>
    <div class="vendor-name-large">${escapeHtml(c.vendor_name || '')}</div>`;
}

// ── Main Body ─────────────────────────────────────────────────

function renderBody(c, data) {
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
    verified:   ['vb-verified',   '<i data-lucide="check-circle"></i> Verified against primary LAUSD board documents.'],
    reported:   ['vb-reported',   '<i data-lucide="info"></i> Reported: sourced from news coverage, not independently verified.'],
    estimated:  ['vb-estimated',  '<i data-lucide="help-circle"></i> Estimated: based on comparable contracts. Verify against source.'],
    unverified: ['vb-unverified', '<i data-lucide="alert-triangle"></i> Unverified: requires verification against source documents.'],
  };
  const [cls, msg] = map[v] || map.unverified;
  return `<div class="verification-banner ${cls}">${msg}</div>
    <div class="verification-banner vb-factcheck" style="background:#eef2f7;border-left:3px solid var(--blue);color:var(--text-light);font-size:0.82rem;padding:0.6rem 1rem;margin-bottom:1rem;border-radius:var(--radius-sm);line-height:1.5">
      AI-assisted data extraction &mdash; actively fact-checking. Errors are possible. <a href="#sourceCard" style="color:var(--blue);font-weight:600">View source document to verify.</a> Found an error? <a href="mailto:lausdcontractwatch@gmail.com" style="color:var(--blue);font-weight:600">Tell us &rarr;</a>
    </div>`;
}

function plainEnglishCard(c) {
  if (!c.plain_english) return '';
  return `<div class="detail-card card-plain-english">
    <h3>In Plain English</h3>
    <div class="md-prose plain-english-text">${parseField(c.plain_english)}</div>
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
    <div class="md-prose" style="margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border)">
      ${parseField(c.description)}
    </div>
    ${c.notes ? `<div class="md-prose" style="margin-top:0.75rem;font-size:0.82rem;color:var(--text-muted);font-style:italic">${parseField(c.notes)}</div>` : ''}
  </div>`;
}

function parseField(text) {
  if (!text) return '';
  // Clean literal escape sequences from JSON-stored text
  var cleaned = text
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t');
  if (typeof marked !== 'undefined' && marked.parse) {
    var renderer = new marked.Renderer();
    renderer.link = function(href, title, text) {
      var t = title ? ' title="' + title + '"' : '';
      return '<a href="' + href + '" target="_blank" rel="noopener"' + t + '>' + text + '</a>';
    };
    return marked.parse(cleaned, { renderer: renderer, breaks: true });
  }
  return escapeHtml(cleaned).replace(/\n/g, '<br>');
}

// Alias for backward compat
var renderMd = parseField;

function questionsToChecklist(text) {
  if (!text) return '';
  var md = parseField(text);
  // Parse the rendered markdown and convert list items or lines into checklist items
  var tmp = document.createElement('div');
  tmp.innerHTML = md;
  var items = [];
  // If markdown produced a list, use its items
  var lis = tmp.querySelectorAll('li');
  if (lis.length) {
    lis.forEach(function(li) { items.push(li.innerHTML); });
  } else {
    // Split on line breaks / paragraphs
    var ps = tmp.querySelectorAll('p');
    if (ps.length > 1) {
      ps.forEach(function(p) { items.push(p.innerHTML); });
    } else {
      // Split plain text on numbered patterns or newlines
      var raw = tmp.innerHTML;
      var parts = raw.split(/(?:<br\s*\/?>|\n)+/).map(function(s) { return s.replace(/^\d+[\.\)]\s*/, '').trim(); }).filter(Boolean);
      items = parts;
    }
  }
  if (!items.length) return '<div class="md-prose">' + md + '</div>';
  return '<ul class="questions-checklist">' +
    items.map(function(item) {
      return '<li><span class="q-icon"><i data-lucide="circle"></i></span><span>' + item + '</span></li>';
    }).join('') + '</ul>';
}

function aiAnalysisCard(c) {
  if (!c.ai_analysis && !c.red_flags && !c.questions_to_ask) return '';
  return `<div class="detail-card">
    <h3>Analysis &amp; Concerns</h3>
    ${c.red_flags ? `
      <div style="background:#fff5f5;border:1px solid #f5c6cb;border-radius:6px;padding:1rem;margin-bottom:1rem">
        <strong style="color:var(--red);font-size:0.85rem;text-transform:uppercase;letter-spacing:0.05em"><i data-lucide="alert-triangle"></i> Red Flags</strong>
        <div class="md-prose md-prose-flags" style="margin-top:0.5rem">${renderMd(c.red_flags)}</div>
      </div>` : ''}
    ${c.ai_analysis ? `<div class="md-prose" style="margin-bottom:1rem">${renderMd(c.ai_analysis)}</div>` : ''}
    ${c.questions_to_ask ? `
      <div style="background:#f0f4ff;border:1px solid #c5d3f5;border-radius:6px;padding:1rem">
        <strong style="color:var(--blue);font-size:0.85rem;text-transform:uppercase;letter-spacing:0.05em"><i data-lucide="circle"></i> Questions to Ask</strong>
        ${questionsToChecklist(c.questions_to_ask)}
      </div>` : ''}
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
            <div class="conn-desc md-prose">${parseField(vc.description || '')}</div>
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
          <div class="eq-count">${formatCompact(n)}</div>
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
    ${profile.controversies ? `<div class="md-prose" style="margin-top:0.75rem;padding-top:0.75rem;border-top:1px solid var(--border);font-size:0.82rem;color:var(--text-light);line-height:1.5">${parseField(profile.controversies)}</div>` : ''}
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
  return `<div class="sidebar-card sidebar-card-alert" id="sourceCard">
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
    book:       'book-open',
    tree:       'tree-pine',
    art:        'palette',
    music:      'music',
    textbook:   'book',
    playground: 'sun',
    counselor:  'user',
    medical:    'stethoscope',
    afterschool:'school',
    person:     'user',
  };
  const icon = map[key] || 'package';
  return `<i data-lucide="${icon}"></i>`;
}
