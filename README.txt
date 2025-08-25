One Dollar Plan — Firebase + Zelle (ZIP contains everything)

What this is
------------
A static site to collect $1 donations with a realtime public counter using Firebase Realtime Database.
Includes Cash App, Venmo, PayPal, and Zelle (copy-to-clipboard).

What's included
---------------
- index.html, contact.html, terms.html
- assets/css/styles.css
- assets/js/main.js (counter + UI, Zelle support)
- assets/js/firebase-config.js (your config; edit adminPin & payment links)
- assets/js/firebase-app.js (Firebase v12 CDN + Anonymous Auth)
- firebase-rules.realtime.json (paste into Firebase → Realtime Database → Rules)

Setup (5 minutes)
-----------------
1) Firebase console → Realtime Database → Create database.
2) Click Rules → paste firebase-rules.realtime.json → Publish.
3) Check assets/js/firebase-config.js:
   - useFirebase: true
   - firebaseDriver: 'realtime'
   - databaseURL: https://one-dollar-plan-default-rtdb.firebaseio.com (change if your console shows a different URL)
   - Change adminPin to a strong value.
   - Set your payment links (Cash App / Venmo / PayPal) and Zelle email/phone.
4) Open index.html and add a test donation to verify it appears in Firebase.

Notes
-----
- Writes require Firebase Auth; the site signs visitors in anonymously.
- If you want to restrict writes further, consider adding App Check, or accept writes only from your own admin page.
- Zelle is informational (email/phone) and uses your bank app to send.
