(function(){
  const cfg = window.DONATION_APP_CONFIG || {};
  const GOAL = Number(cfg.goalAmount || 10000);

  // ---------- DOM refs ----------
  const adminToggle = () => document.getElementById('adminToggle');
  const form = () => document.getElementById('donationForm');
  const nameEl = () => document.getElementById('name');
  const amountEl = () => document.getElementById('amount');
  const messageEl = () => document.getElementById('message');
  const tbody = () => document.getElementById('donorTbody');
  const totalAmountEl = () => document.getElementById('totalAmount');
  const donorCountEl = () => document.getElementById('donorCount');
  const goalAmountEl = () => document.getElementById('goalAmount');
  const goalInlineEl = () => document.getElementById('goalInline');
  const progressFillEl = () => document.getElementById('progressFill');
  const percentTextEl = () => document.getElementById('percentText');
  const exportBtn = () => document.getElementById('exportCsv');
  const shareBtn = () => document.getElementById('shareBtn');
  const yearEl = () => document.getElementById('year');
  const directLinksEl = () => document.getElementById('directLinks');
  const paymentGrid = () => document.getElementById('paymentGrid');
  const fallback = () => document.getElementById('fallbackPayments');

  // ---------- Utilities ----------
  function currency(n){ return (Number(n)||0).toLocaleString(undefined,{style:'currency',currency:'USD'}) }
  function escapeHtml(s){ return String(s??'').replace(/[&<>\"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;','\'':'&#039;'}[m])) }
  function formatDate(ts){ try{ return new Date(ts).toLocaleString(); }catch(e){ return '' } }
  function setText(el, val){ if (el) el.textContent = val; }
  function byId(id){ return document.getElementById(id); }

  // ---------- Basic layout init ----------
  document.addEventListener('DOMContentLoaded', ()=>{
    const y = yearEl(); if (y) y.textContent = new Date().getFullYear().toString();
    const g = goalAmountEl(); if (g) g.textContent = currency(GOAL);
    const gi = goalInlineEl(); if (gi) gi.textContent = currency(GOAL);

    // Mobile nav
    document.addEventListener('click', (e)=>{
      const btn = document.getElementById('menuToggle');
      const nav = document.getElementById('mobileNav');
      if (!btn || !nav) return;
      if (e.target === btn){ e.preventDefault(); nav.classList.toggle('open'); btn.setAttribute('aria-expanded', nav.classList.contains('open') ? 'true' : 'false'); }
      if (!nav.contains(e.target) && e.target !== btn){ nav.classList.remove('open'); btn.setAttribute('aria-expanded','false'); }
    });

    // Payment quick links (keep fallback visible always)
    buildDirectLinks();
    bindShare();
    bindAdmin();
    bindExport();
    bindForm(); // will enable once Firebase + auth are ready
  });

  // ---------- Payment links + Share ----------
  function buildDirectLinks(){
    const el = directLinksEl();
    const pg = paymentGrid();
    const fb = fallback();
    const p = (cfg.paymentLinks||{});
    const zelleEmail = p.zelleEmail || '';
    const zellePhone = p.zellePhone || '';

    const links = [];
    if (p.cashapp) links.push(`<a href="${p.cashapp}" target="_blank" rel="noopener">Cash App</a>`);
    if (p.venmo) links.push(`<a href="${p.venmo}" target="_blank" rel="noopener">Venmo</a>`);
    if (p.paypal) links.push(`<a href="${p.paypal}" target="_blank" rel="noopener">PayPal</a>`);
    if (zelleEmail) links.push(`<span title="Use your bank app">Zelle: ${zelleEmail}</span>`);
    if (el) el.innerHTML = links.join(' · ');

    // Native-ish buttons with web fallback (but always show fallback block too)
    if (pg){
      let btns = '';
      if (p.cashapp) btns += `<a class="btn btn-ghost" href="${p.cashapp}" target="_blank" rel="noopener">Cash App $1</a>`;
      if (p.venmo)   btns += `<a class="btn btn-ghost" href="${p.venmo}" target="_blank" rel="noopener">Venmo $1</a>`;
      if (p.paypal)  btns += `<a class="btn btn-ghost" href="${p.paypal}" target="_blank" rel="noopener">PayPal $1</a>`;
      if (zelleEmail || zellePhone) btns += `<button class="btn btn-ghost" type="button" id="zelleBtn">Zelle $1</button>`;
      pg.innerHTML = btns;
      const zb = byId('zelleBtn');
      if (zb){ zb.addEventListener('click',()=>{
        const info = [zelleEmail, zellePhone].filter(Boolean).join(' / ');
        if (!info) return alert('Zelle info not configured.');
        navigator.clipboard.writeText(info).then(()=> alert('Zelle info copied to clipboard: '+info+'\\nOpen your bank app to send.'));
      });}
    }

    // Fallback Zelle copy
    const zbf = byId('zelleBtnFallback');
    if (zbf){
      zbf.addEventListener('click', ()=>{
        const info = [zelleEmail, zellePhone].filter(Boolean).join(' / ');
        if (!info) return alert('Zelle info not configured.');
        navigator.clipboard.writeText(info).then(()=> alert('Zelle info copied: '+info+'\\nOpen your bank app to send.'));
      });
    }
  }

  function bindShare(){
    const btn = shareBtn();
    if (!btn) return;
    btn.addEventListener('click', ()=>{
      const data={ title:'One Dollar Plan', text:'Be 1 in 10,000 — donate $1 to help fund flight school.', url: location.href };
      if (navigator.share) navigator.share(data).catch(shareFallback);
      else shareFallback();
    });
  }
  function shareFallback(){
    const p = cfg.paymentLinks || {};
    const lines = [
      'Be 1 in 10,000 — donate $1 to help fund flight school.',
      window.location.href
    ];
    if (p.cashapp) lines.push('Cash App: ' + p.cashapp);
    if (p.venmo) lines.push('Venmo: ' + p.venmo);
    if (p.paypal) lines.push('PayPal: ' + p.paypal);
    const text = lines.join('\\n');
    if (navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(()=> alert('Share text copied. Paste anywhere!'));
    } else {
      prompt('Copy this and share:', text);
    }
  }

  // ---------- Admin + Export ----------
  function bindAdmin(){
    const btn = adminToggle();
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (document.body.classList.contains('admin-mode')){
        document.body.classList.remove('admin-mode'); return;
      }
      const pin = prompt('Enter admin PIN');
      if (pin === (cfg.adminPin || '1234')) document.body.classList.add('admin-mode');
      else alert('Incorrect PIN');
    });
  }
  function bindExport(){
    const btn = exportBtn();
    if (!btn) return;
    btn.addEventListener('click', ()=>{
      const f = window.__firebase;
      if (!f) return alert('Not ready yet.');
      const ev = f.API.ref(f.db, 'donations');
      f.API.get(ev).then(snap=>{
        const val = snap.val() || {};
        const list = Object.values(val);
        const rows = [['Name','Amount','Message','Date ISO']].concat(
          list.map(x=>[x.name||'Anonymous', String(x.amount||0), (x.message||'').replace(/\\n/g,' '), new Date(x.ts||Date.now()).toISOString()]));
        const csv = rows.map(r => r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\\n');
        const blob = new Blob([csv], {type:'text/csv;charset=utf-8'});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'supporters.csv';
        a.click();
        URL.revokeObjectURL(a.href);
      });
    });
  }

  // ---------- Firebase hook ----------
  let listenerAttached = false;
  function attachListener(){
    if (listenerAttached) return;
    const dL = byId('diagListen'); if (dL) dL.textContent = 'attaching';
    try{
      const f = window.__firebase;
      const ev = f.API.ref(f.db, 'donations');
      f.API.onValue(ev, (snap)=>{
        const val = snap.val() || {};
        const list = Object.values(val);
        render(list);
        const dL2 = byId('diagListen'); if (dL2) dL2.textContent = 'attached';
      }, (err)=>{
        const msg = (err && err.message) ? err.message : String(err);
        const de = byId('diagErr'); if (de) de.textContent = 'listen error: ' + msg;
      });
      listenerAttached = true;
    }catch(err){
      const de = byId('diagErr'); if (de) de.textContent = 'list init error: ' + (err && err.message ? err.message : String(err));
    }
  }

  function bindForm(){
    const fEl = form();
    if (!fEl) return;
    // Disable submit until auth is ready
    const btn = fEl.querySelector('button[type="submit"]');
    function setEnabled(ok){ if (btn) btn.disabled = !ok; }
    setEnabled(!!window.__authReady);
    document.addEventListener('firebase-auth-ready', ()=> setEnabled(true), { once:true });

    fEl.addEventListener('submit', async (e)=>{
      e.preventDefault();
      if (!window.__authReady) return alert('Please wait a moment for authentication to finish.');
      const f = window.__firebase;
      if (!f) return alert('Database not ready yet.');
      const entry={
        name: (nameEl().value||'Anonymous').trim(),
        amount: Math.round(Number(amountEl().value||0)*100)/100,
        message: (messageEl().value||'').trim(),
        ts: Date.now()
      };
      if (!(entry.amount >= 0.5)) return alert('Amount must be at least $0.50');
      try{
        const parent = f.API.ref(f.db, 'donations');
        const newRef = f.API.push(parent);
        await f.API.set(newRef, entry);
        alert('Saved! Your donation entry was written to the database.');
        form().reset();
      }catch(err){
        alert('Save failed: ' + (err && err.message ? err.message : String(err)));
      }
    });
  }

  // ---------- Render ----------
  function render(list){
    list = Array.isArray(list) ? list.slice().sort((a,b)=> (b.ts||0)-(a.ts||0)) : [];
    const total = list.reduce((sum,x)=>sum + Number(x.amount||0), 0);
    const count = list.length;
    setText(totalAmountEl(), currency(total));
    setText(donorCountEl(), String(count));
    const pct = Math.max(0, Math.min(100, Math.round((total/GOAL)*100)));
    const pf = progressFillEl(); if (pf) pf.style.width = pct + '%';
    setText(percentTextEl(), pct + '% funded');

    const body = tbody(); if (!body) return;
    body.innerHTML='';
    list.forEach((x,i)=>{
      const tr=document.createElement('tr');
      tr.innerHTML = `
        <td>${i+1}</td>
        <td>${escapeHtml(x.name||'Anonymous')}</td>
        <td><span class="badge good">${currency(x.amount||0)}</span></td>
        <td>${escapeHtml(x.message||'')}</td>
        <td>${formatDate(x.ts)}</td>
        <td class="admin-only"><button class="btn small btn-ghost" data-del="${x.ts}">Delete</button></td>`;
      body.appendChild(tr);
    });
    body.querySelectorAll('[data-del]').forEach(btn=>{
      btn.addEventListener('click', async (e)=>{
        if (!document.body.classList.contains('admin-mode')) return alert('Enable Admin mode');
        const ts=Number(e.currentTarget.getAttribute('data-del'));
        try{
          const f = window.__firebase;
          const snap = await f.API.get(f.API.ref(f.db, 'donations'));
          const val = snap.val() || {};
          for (const [k,v] of Object.entries(val)){ if (v.ts===ts){ await f.API.remove(f.API.ref(f.db,'donations/'+k)); } }
        }catch(err){
          alert('Delete failed: ' + (err && err.message ? err.message : String(err)));
        }
      });
    });
  }

  // ---------- Glue events ----------
  document.addEventListener('firebase-ready', ()=>{
    const fb = byId('diagFb'); if (fb) fb.textContent = 'ready';
    attachListener();
  });
  document.addEventListener('firebase-auth-ready', ()=>{
    const au = byId('diagAuth'); if (au && au.textContent.indexOf('signed') === -1) au.textContent = 'signed in';
    const btn = byId('diagTestWrite');
    if (btn){ btn.disabled = false; btn.textContent = 'Run'; }
  });

  // Also try to attach listener shortly after DOM load, in case events fired early
  document.addEventListener('DOMContentLoaded', ()=> setTimeout(attachListener, 300));

})();