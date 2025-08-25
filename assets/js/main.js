(function(){
  const cfg = window.DONATION_APP_CONFIG || {};
  const GOAL = Number(cfg.goalAmount || 10000);
  const LS_KEY = 'one_dollar_plan_donors_v1';
  const adminToggle = document.getElementById('adminToggle');
  const form = document.getElementById('donationForm');
  const nameEl = document.getElementById('name');
  const amountEl = document.getElementById('amount');
  const messageEl = document.getElementById('message');
  const tbody = document.getElementById('donorTbody');
  const totalAmountEl = document.getElementById('totalAmount');
  const donorCountEl = document.getElementById('donorCount');
  const goalAmountEl = document.getElementById('goalAmount');
  const goalInlineEl = document.getElementById('goalInline');
  const progressFillEl = document.getElementById('progressFill');
  const percentTextEl = document.getElementById('percentText');
  const exportBtn = document.getElementById('exportCsv');
  const clearDemoBtn = document.getElementById('clearDemo');
  const shareBtn = document.getElementById('shareBtn');
  const yearEl = document.getElementById('year');
  const directLinksEl = document.getElementById('directLinks');
  const paymentGrid = document.getElementById('paymentGrid');
  const fallback = document.getElementById('fallbackPayments');

  // Mobile menu toggle
  document.addEventListener('click', (e)=>{
    const btn = document.getElementById('menuToggle');
    const nav = document.getElementById('mobileNav');
    if (!btn || !nav) return;
    if (e.target === btn){ e.preventDefault(); nav.classList.toggle('open'); btn.setAttribute('aria-expanded', nav.classList.contains('open') ? 'true' : 'false'); }
    if (!nav.contains(e.target) && e.target !== btn){ nav.classList.remove('open'); btn.setAttribute('aria-expanded','false'); }
  });

  yearEl.textContent = new Date().getFullYear().toString();
  goalAmountEl.textContent = currency(GOAL);
  goalInlineEl.textContent = currency(GOAL);

  function buildDirectLinks(){
    const links = [];
    if (cfg.paymentLinks?.cashapp) links.push(`<a href="${cfg.paymentLinks.cashapp}" target="_blank" rel="noopener">Cash App</a>`);
    if (cfg.paymentLinks?.venmo) links.push(`<a href="${cfg.paymentLinks.venmo}" target="_blank" rel="noopener">Venmo</a>`);
    if (cfg.paymentLinks?.paypal) links.push(`<a href="${cfg.paymentLinks.paypal}" target="_blank" rel="noopener">PayPal</a>`);
    const zelleEmail = cfg.paymentLinks?.zelleEmail || '';
    const zellePhone = cfg.paymentLinks?.zellePhone || '';
    if (zelleEmail) links.push(`<span title="Use your bank app">Zelle: ${zelleEmail}</span>`);
    directLinksEl.innerHTML = links.join(' · ');

    let btns='';
    if (cfg.paymentLinks?.cashapp) btns += `<a class="btn btn-ghost" href="${cfg.paymentLinks.cashapp}" target="_blank" rel="noopener">Cash App $1</a>`;
    if (cfg.paymentLinks?.venmo) btns += `<a class="btn btn-ghost" href="${cfg.paymentLinks.venmo}" target="_blank" rel="noopener">Venmo $1</a>`;
    if (cfg.paymentLinks?.paypal) btns += `<a class="btn btn-ghost" href="${cfg.paymentLinks.paypal}" target="_blank" rel="noopener">PayPal $1</a>`;
    if (zelleEmail || zellePhone){ btns += `<button class="btn btn-ghost" type="button" id="zelleBtn">Zelle $1</button>`; }
    paymentGrid.innerHTML = btns || '<div class="badge warn">Add your payment links in assets/js/firebase-config.js</div>';
    if (fallback) { fallback.classList.add('hidden'); }
    const zb = document.getElementById('zelleBtn');
    if (zb){ zb.addEventListener('click', ()=>{
      const info = [zelleEmail, zellePhone].filter(Boolean).join(' / ');
      if (!info){ alert('Zelle info not configured.'); return; }
      navigator.clipboard.writeText(info).then(()=>{
        alert('Zelle info copied to clipboard: '+info+'\\nOpen your bank app to send.');
      });
    });}
  }
  buildDirectLinks();

  // Fallback Zelle copy button
  (function(){
    const btn = document.getElementById("zelleBtnFallback");
    if (!btn) return;
    const zelleEmail = (cfg.paymentLinks && cfg.paymentLinks.zelleEmail) || "YOUR-ZELLE-EMAIL@example.com";
    const zellePhone = (cfg.paymentLinks && cfg.paymentLinks.zellePhone) || "";
    btn.addEventListener("click", ()=>{
      const info = [zelleEmail, zellePhone].filter(Boolean).join(" / ");
      navigator.clipboard.writeText(info).then(()=> alert("Zelle info copied: "+info+"\\nOpen your bank app to send."));
    });
  })();

  let admin = false;
  adminToggle.addEventListener('click', () => {
    if (admin) { admin=false; document.body.classList.remove('admin-mode'); return; }
    const pin = prompt('Enter admin PIN');
    if (pin === (cfg.adminPin || '1234')) { admin=true; document.body.classList.add('admin-mode'); }
    else alert('Incorrect PIN');
  });

  const storage = (function(){
    const fb = window.__firebase;
    const usingFirebase = !!(cfg.useFirebase && fb);

    function readLocal(){ try{return JSON.parse(localStorage.getItem(LS_KEY)||'[]')}catch(e){return[]} }
    function writeLocal(list){ localStorage.setItem(LS_KEY, JSON.stringify(list)) }

    if (usingFirebase){
      const ev = fb.API.ref(fb.db, 'donations');
      async function list(cb){
        fb.API.onValue(ev,(snap)=>{ const val = snap.val() || {}; cb(Object.values(val)); });
      }
      async function add(entry){
        const key=Math.random().toString(36).slice(2);
        try { await fb.API.set(fb.API.ref(fb.db, 'donations/'+key), entry); }
        catch(err){ console.error('Add failed', err); alert('Could not save to database: ' + (err && err.message ? err.message : err)); throw err; }
      }
      async function remove(ts){
        try {
          const snap = await fb.API.get(fb.API.ref(fb.db, 'donations'));
          const val = snap.val() || {};
          for (const [k,v] of Object.entries(val)){ if (v.ts===ts){ await fb.API.remove(fb.API.ref(fb.db,'donations/'+k)); } }
        } catch(err){ console.error('Delete failed', err); alert('Delete failed: ' + (err && err.message ? err.message : err)); throw err; }
      }
      return { list, add, remove, usingFirebase:true };
    }

    function list(cb){ cb(readLocal()) }
    async function add(entry){ const list=readLocal(); list.unshift(entry); writeLocal(list); }
    async function remove(ts){ const list=readLocal().filter(x=>x.ts!==ts); writeLocal(list) }
    return { list, add, remove, usingFirebase:false };
  })();

  if (cfg.useFirebase) document.addEventListener('firebase-ready', init);
  else init();

  function init(){
    refresh();
    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const name=(nameEl.value||'Anonymous').trim();
      const amount=Number(amountEl.value||0);
      const message=(messageEl.value||'').trim();
      if (!isFinite(amount) || amount<=0) return alert('Enter a valid amount');
      const entry={name, amount: Math.round(amount*100)/100, message, ts: Date.now()};
      await storage.add(entry);
      form.reset();
      refresh(true);
      const sup = document.querySelector('#supporters'); if (sup) window.scrollTo({ top: sup.offsetTop-40, behavior:'smooth' });
    });
    exportBtn.addEventListener('click', exportCSV);
    clearDemoBtn.addEventListener('click', ()=>{ localStorage.removeItem(LS_KEY); refresh(true); });
    shareBtn.addEventListener('click', shareSite);
  }

  function shareSite(){
    const data={ title:'One Dollar Plan', text:'Be 1 in 10,000 — donate $1 to help fund flight school.', url: location.href };
    if (navigator.share) navigator.share(data).catch(copyLink);
    else copyLink();
  }
  function copyLink(){ navigator.clipboard.writeText(location.href).then(()=>alert('Link copied!')) }

  function refresh(){
    storage.list((list)=>{
      list = Array.isArray(list) ? list.slice().sort((a,b)=>b.ts-a.ts) : [];
      render(list);
    });
  }

  function render(list){
    const total = list.reduce((sum,x)=>sum + Number(x.amount||0), 0);
    const count = list.length;
    totalAmountEl.textContent = currency(total);
    donorCountEl.textContent = String(count);
    const pct = Math.max(0, Math.min(100, Math.round((total/GOAL)*100)));
    progressFillEl.style.width = pct + '%';
    percentTextEl.textContent = pct + '% funded';

    tbody.innerHTML='';
    list.forEach((x,i)=>{
      const tr=document.createElement('tr');
      tr.innerHTML = `
        <td>${i+1}</td>
        <td>${escapeHtml(x.name||'Anonymous')}</td>
        <td><span class="badge good">${currency(x.amount||0)}</span></td>
        <td>${escapeHtml(x.message||'')}</td>
        <td>${formatDate(x.ts)}</td>
        <td class="admin-only"><button class="btn small btn-ghost" data-del="${x.ts}">Delete</button></td>`;
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll('[data-del]').forEach(btn=>{
      btn.addEventListener('click', async (e)=>{
        if (!document.body.classList.contains('admin-mode')) return alert('Enable Admin mode');
        if (!confirm('Remove this entry?')) return;
        const ts=Number(e.currentTarget.getAttribute('data-del'));
        await storage.remove(ts);
        refresh();
      });
    });
  }

  function exportCSV(){
    storage.list((list)=>{
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
  }

  function currency(n){ return (n||0).toLocaleString(undefined,{style:'currency',currency:'USD'}) }
  function escapeHtml(s){ return String(s).replace(/[&<>\"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;','\'':'&#039;'}[m])) }
  function formatDate(ts){ try{ return new Date(ts).toLocaleString(); }catch(e){ return '' } }

})();