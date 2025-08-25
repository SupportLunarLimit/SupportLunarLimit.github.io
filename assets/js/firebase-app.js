// Firebase v12 CDN imports with Anonymous Auth and Diagnostics (amount: $1)
const cfg = window.DONATION_APP_CONFIG || {};
if (!cfg.useFirebase) {
  // No Firebase
} else {
  const version = '12.1.0';
  const imports = [
    `https://www.gstatic.com/firebasejs/${version}/firebase-app.js`,
    `https://www.gstatic.com/firebasejs/${version}/firebase-auth.js`,
    `https://www.gstatic.com/firebasejs/${version}/firebase-database.js`,
    `https://www.gstatic.com/firebasejs/${version}/firebase-firestore.js`
  ];
  Promise.all(imports.map(u => import(u))).then(([appMod, authMod, dbMod, fsMod]) => {
    const { initializeApp } = appMod;
    const { getAuth, signInAnonymously, onAuthStateChanged } = authMod;
    let __authResolve; let __authReady = new Promise(r=>{ __authResolve = r; });
    const app = initializeApp(cfg.firebaseConfig);

    // Diagnostics hooks
    window.__diag = { fb: 'not-ready', auth: 'not-ready', db: 'not-ready', uid: null, error: null };

    // Anonymous auth (for secure write rules)
    const auth = getAuth(app);
    signInAnonymously(auth).catch((e)=>console.warn('Anonymous auth failed:', e));
    onAuthStateChanged(auth, (user)=>{
      if (user) document.dispatchEvent(new Event('firebase-auth-ready'));
      if (user && __authResolve){ __authResolve(true); __authResolve = null; document.dispatchEvent(new Event('firebase-ready')); }
      try{ const el=document.getElementById('diagAuth'); if (el) el.textContent = user ? ('signed in (anon) uid ' + user.uid) : 'not signed in'; window.__diag.auth = user ? 'signed-in' : 'signed-out'; window.__diag.uid = user?user.uid:null; }catch(e){}
    });

    if (cfg.firebaseDriver === 'realtime') {
      window.__firebase = { driver: 'realtime', app, db: dbMod.getDatabase(app), API: dbMod, auth };
      try{ const el=document.getElementById('diagDb'); if(el) el.textContent='Realtime DB ready'; window.__diag.db='realtime-ready'; }catch(e){}
    } else {
      window.__firebase = { driver: 'firestore', app, fs: fsMod.getFirestore(app), API: fsMod, auth };
      try{ const el=document.getElementById('diagDb'); if(el) el.textContent='Firestore ready'; window.__diag.db='firestore-ready'; }catch(e){}
    }
    try{ const el=document.getElementById('diagFb'); if(el) el.textContent='ready'; window.__diag.fb='ready'; }catch(e){}
    

    // Diagnostics test write (amount $1 so it passes secure rules)
    document.addEventListener('firebase-ready', ()=>{
      const btn=document.getElementById('diagTestWrite');
      if (!btn || !window.__firebase) return;
      btn.addEventListener('click', async ()=>{
        const out=document.getElementById('diagWrite');
        try{
          const f=window.__firebase;
          if (f.driver==='realtime'){
            const ref = f.API.ref(f.db, 'donations/__diag__');
            await f.API.set(ref, { name:'__diag__', amount: 1, message:'test', ts: Date.now() });
            out.textContent = 'write ok (realtime)';
          } else {
            const col = f.API.collection(f.fs, 'donations');
            await f.API.addDoc(col, { name:'__diag__', amount: 1, message:'test', ts: Date.now() });
            out.textContent = 'write ok (firestore)';
          }
        }catch(err){
          out.textContent = 'error: ' + (err && err.message ? err.message : String(err));
        }
      });
    });

  }).catch(err => {
    console.error('Firebase load error', err);
  });
}
