// Firebase v12 CDN imports with Anonymous Auth and Diagnostics
const cfg = window.DONATION_APP_CONFIG || {};
if (!cfg.useFirebase) {
} else {
  const version = '12.1.0';
  const imports = [
    `https://www.gstatic.com/firebasejs/${version}/firebase-app.js`,
    `https://www.gstatic.com/firebasejs/${version}/firebase-auth.js`,
    `https://www.gstatic.com/firebasejs/${version}/firebase-database.js`
  ];
  Promise.all(imports.map(u => import(u))).then(([appMod, authMod, dbMod]) => {
    const { initializeApp } = appMod;
    const { getAuth, signInAnonymously, onAuthStateChanged } = authMod;
    const app = initializeApp(cfg.firebaseConfig);

    window.__firebase = { driver: 'realtime', app, db: dbMod.getDatabase(app), API: dbMod };
    window.__fbReady = true;
    const fbSpan = document.getElementById('diagFb'); if (fbSpan) fbSpan.textContent = 'ready';
    const dbSpan = document.getElementById('diagDb'); if (dbSpan) dbSpan.textContent = 'Realtime DB ready';
    document.dispatchEvent(new Event('firebase-ready'));

    const auth = getAuth(app);
    signInAnonymously(auth).catch((e)=>{
      const err = document.getElementById('diagErr'); if (err) err.textContent = 'auth error: ' + (e && e.message ? e.message : e);
    });
    onAuthStateChanged(auth, (user)=>{
      const a = document.getElementById('diagAuth'); if (a) a.textContent = user ? ('signed in (anon) uid ' + user.uid) : 'not signed in';
      if (user){ window.__authReady = true; document.dispatchEvent(new Event('firebase-auth-ready')); }
    });

    function bindDiag(){
      const btn=document.getElementById('diagTestWrite');
      if (!btn || btn.__bound) return;
      btn.__bound = true;
      function setEnabled(ok){ btn.disabled = !ok; btn.textContent = ok ? 'Run' : 'Run (auth not ready)'; }
      setEnabled(!!window.__authReady);
      document.addEventListener('firebase-auth-ready', ()=> setEnabled(true), { once:true });
      btn.addEventListener('click', async ()=>{
        const out=document.getElementById('diagWrite');
        try{
          const f=window.__firebase;
          const parent = f.API.ref(f.db, 'donations');
          const newRef = f.API.push(parent);
          await f.API.set(newRef, { name:'__diag__', amount: 1, message:'test', ts: Date.now() });
          out.textContent = 'write ok (realtime)';
        }catch(err){
          const msg = (err && err.message) ? err.message : String(err);
          const errSpan = document.getElementById('diagErr'); if (errSpan) errSpan.textContent = 'error: ' + msg;
          if (out) out.textContent = 'error: ' + msg;
        }
      });
    }
    document.addEventListener('DOMContentLoaded', bindDiag);
    document.addEventListener('firebase-ready', bindDiag);
    document.addEventListener('firebase-auth-ready', bindDiag);
  });
}
