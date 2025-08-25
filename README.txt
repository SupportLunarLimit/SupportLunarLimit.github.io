One Dollar Plan — Firebase + Zelle (Diagnostics build, writes $1)
What this is
------------
A static site to collect $1 donations with a realtime public counter using Firebase Realtime Database.
Includes Cash App, Venmo, PayPal, and Zelle (copy-to-clipboard). Diagnostics panel included.

Setup (quick)
-------------
1) Firebase → Realtime Database → Rules → paste firebase-rules.realtime.json → Publish.
2) Authentication → Sign-in method → enable Anonymous. Add your domain in Authorized domains.
3) Edit assets/js/firebase-config.js: set payment links, zelleEmail/Phone, adminPin. Confirm databaseURL.
4) Host on GitHub Pages or test via http://localhost (not file://).

Notes
-----
- Diagnostics button writes a $1 test row so it passes secure rules.
- Real donations require fields: name (string <=64), amount (>=0.5), ts (number).
