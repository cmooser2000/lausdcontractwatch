/* LAUSD Contract Watch — Take Action Page */

initLayout();

let boardMembers = [];
let campaigns = [];
let templates = [];

loadData().then(data => {
  boardMembers = data.board_members.filter(m => m.active && m.district);
  campaigns    = data.campaigns.filter(c => c.active);
  templates    = data.campaign_templates;

  populateCampaigns();
  renderAllContacts();
  bindEvents();

  // Read URL params
  const p = new URLSearchParams(location.search);
  if (p.get('district')) { document.getElementById('selectDistrict').value = p.get('district'); }
  if (p.get('campaign')) { document.getElementById('selectCampaign').value = p.get('campaign'); }
  if (p.get('district') || p.get('campaign')) update();
});

function populateCampaigns() {
  const sel = document.getElementById('selectCampaign');
  campaigns.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id; opt.textContent = c.title;
    sel.appendChild(opt);
  });
}

function update() {
  const district  = document.getElementById('selectDistrict').value;
  const campaignId = document.getElementById('selectCampaign').value;

  const member = boardMembers.find(m => String(m.district) === district);
  const campaign = campaigns.find(c => String(c.id) === campaignId);

  // Board member card
  const bmCard = document.getElementById('boardMemberCard');
  const bmInfo = document.getElementById('boardMemberInfo');
  if (member) {
    bmCard.style.display = '';
    bmInfo.innerHTML = `
      <div style="display:flex;align-items:center;gap:1.5rem;flex-wrap:wrap">
        <div style="width:52px;height:52px;border-radius:50%;background:var(--navy);color:var(--white);display:flex;align-items:center;justify-content:center;font-size:1.3rem;font-weight:700;flex-shrink:0">
          ${escapeHtml(member.name.split(' ').map(w=>w[0]).filter((_,i,a)=>i===0||i===a.length-1).join(''))}
        </div>
        <div>
          <div style="font-weight:700;font-size:1.05rem">${escapeHtml(member.name)}</div>
          <div style="font-size:0.9rem;color:var(--text-light)">${escapeHtml(member.position || 'Board Member')} — District ${escapeHtml(member.district)}</div>
          ${member.email ? `<div style="font-size:0.85rem;margin-top:0.25rem"><a href="mailto:${escapeHtml(member.email)}">${escapeHtml(member.email)}</a></div>` : ''}
          ${member.phone ? `<div style="font-size:0.85rem;color:var(--text-muted)">${escapeHtml(member.phone)}</div>` : ''}
        </div>
      </div>`;
  } else {
    bmCard.style.display = 'none';
  }

  // Email card
  const emailCard = document.getElementById('emailCard');
  if (!member || !campaign) { emailCard.style.display = 'none'; return; }

  // Find best template: district-specific first, then fallback to any for this campaign
  const t = templates.find(t => String(t.campaign_id) === String(campaign.id) && String(t.district) === district)
         || templates.find(t => String(t.campaign_id) === String(campaign.id));

  const subject = t?.email_subject || `LAUSD Contract Accountability — District ${district}`;
  const body    = t?.email_body    || campaign.body || '';
  const email   = member.email || '';

  document.getElementById('emailSubjectPreview').textContent = subject;
  document.getElementById('emailBodyPreview').textContent = body;

  const subjectEnc = encodeURIComponent(subject);
  const bodyEnc    = encodeURIComponent(body);

  document.getElementById('btnMailto').href = `mailto:${encodeURIComponent(email)}?subject=${subjectEnc}&body=${bodyEnc}`;
  document.getElementById('btnGmail').href  = `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(email)}&su=${subjectEnc}&body=${bodyEnc}`;

  const copyBtn = document.getElementById('btnCopyEmail');
  copyBtn.onclick = () => {
    const text = `To: ${email}\nSubject: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(text).then(() => {
      copyBtn.textContent = '✓ Copied!';
      setTimeout(() => { copyBtn.textContent = '📋 Copy Email Text'; }, 2000);
    });
  };

  emailCard.style.display = '';
}

function renderAllContacts() {
  const container = document.getElementById('allBoardContacts');
  container.innerHTML = boardMembers
    .sort((a, b) => parseInt(a.district) - parseInt(b.district))
    .map(m => {
      const initials = m.name.split(' ').map(w=>w[0]).filter((_,i,a)=>i===0||i===a.length-1).join('');
      return `
        <div class="board-card">
          <div class="board-avatar">${escapeHtml(initials)}</div>
          <h3>${escapeHtml(m.name)}</h3>
          <div class="board-info board-district">District ${escapeHtml(m.district)}</div>
          <div class="board-info">${escapeHtml(m.position || 'Board Member')}</div>
          ${m.email ? `<div style="font-size:0.8rem;margin-top:0.5rem"><a href="mailto:${escapeHtml(m.email)}">${escapeHtml(m.email)}</a></div>` : ''}
          ${m.phone ? `<div style="font-size:0.78rem;color:var(--text-muted);margin-top:0.2rem">${escapeHtml(m.phone)}</div>` : ''}
          <div style="margin-top:0.75rem">
            <button class="btn btn-primary btn-sm" onclick="document.getElementById('selectDistrict').value='${m.district}';document.getElementById('selectDistrict').scrollIntoView({behavior:'smooth'});update()">
              Write to District ${escapeHtml(m.district)}
            </button>
          </div>
        </div>`;
    }).join('');
}

function bindEvents() {
  document.getElementById('selectDistrict').addEventListener('change', update);
  document.getElementById('selectCampaign').addEventListener('change', update);
}
