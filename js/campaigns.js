/* LAUSD Contract Watch — Campaigns Page */

initLayout();

loadData().then(data => {
  renderCampaigns(data.campaigns, data.campaign_templates, data.board_members);
});

function renderCampaigns(campaigns, templates, boardMembers) {
  const list = document.getElementById('campaignsList');
  const active = campaigns.filter(c => c.active);

  if (!active.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon"><i data-lucide="megaphone"></i></div><h3>No active campaigns</h3><p>Check back soon.</p></div>`;
    lucide.createIcons();
    return;
  }

  list.innerHTML = active.map(campaign => {

    const campTemplates = templates.filter(t => String(t.campaign_id) === String(campaign.id));
    return `
      <div class="detail-card" style="margin-bottom:2rem">
        <div style="background:var(--navy);color:var(--white);border-radius:var(--radius) var(--radius) 0 0;margin:-1.25rem -1.5rem 1.5rem;padding:2rem 2rem 1.5rem">
          ${campaign.header_text ? `<div style="font-size:0.8rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--gold-light);margin-bottom:0.5rem">${escapeHtml(campaign.header_text)}</div>` : ''}
          <h2 style="font-size:1.4rem;font-weight:800;margin:0">${escapeHtml(campaign.title)}</h2>
        </div>

        ${campaign.body ? `<p style="font-size:0.95rem;line-height:1.8;color:var(--text-light);margin-bottom:1.5rem">${escapeHtml(campaign.body)}</p>` : ''}

        ${campaign.pdf_file ? `
          <div style="margin-bottom:1.5rem">
            <a href="${escapeHtml(campaign.pdf_file)}" target="_blank" rel="noopener" class="btn btn-outline">
              <i data-lucide="file-text"></i> ${escapeHtml(campaign.pdf_button_text || 'View Document')}
            </a>
          </div>` : ''}

        ${campTemplates.length ? `
          <div>
            <h3 style="font-size:1rem;margin-bottom:1rem">Email Your Board Member</h3>
            <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:1rem">
              Select your district to get a pre-written email you can send with one click.
            </p>
            <div style="display:grid;gap:0.5rem">
              ${buildDistrictButtons(campTemplates, boardMembers)}
            </div>
          </div>` : `
          <a href="/take-action.html" class="btn btn-primary">Write to Your Board Member &rarr;</a>`}
      </div>`;
  }).join('');
  lucide.createIcons();
}

function buildDistrictButtons(templates, boardMembers) {
  // Group by district, deduplicate
  const byDistrict = {};
  templates.forEach(t => {
    const d = t.district || 'General';
    if (!byDistrict[d]) byDistrict[d] = t;
  });

  return Object.entries(byDistrict).map(([district, t]) => {
    const bm = boardMembers.find(m => String(m.district) === String(district));
    const subject = encodeURIComponent(t.email_subject || 'LAUSD Contract Accountability');
    const body = encodeURIComponent(t.email_body || '');
    const email = bm ? bm.email : '';
    const label = bm ? `District ${district} — ${bm.name}` : `District ${district}`;

    return `
      <div style="display:flex;gap:0.5rem;align-items:center;padding:0.75rem 1rem;background:var(--bg);border-radius:var(--radius-sm);border:1px solid var(--border)">
        <span style="flex:1;font-size:0.9rem;font-weight:500">${escapeHtml(label)}</span>
        <div style="display:flex;gap:0.5rem;flex-shrink:0">
          ${email ? `<a href="mailto:${escapeHtml(email)}?subject=${subject}&body=${body}" class="btn btn-primary btn-sm">Email</a>` : ''}
          ${email ? `<a href="https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(email)}&su=${subject}&body=${body}" target="_blank" rel="noopener" class="btn btn-outline btn-sm">Gmail</a>` : ''}
        </div>
      </div>`;
  }).join('');
}
