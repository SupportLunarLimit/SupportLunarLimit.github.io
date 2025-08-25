// Config + Admin SHA-256 hex passcode
window.DONATION_APP_CONFIG = {
  useFirebase: true,
  firebaseDriver: 'realtime',
  adminAuth: {
    method: 'sha256',
    encoding: 'hex',
    minLength: 8,
    hash: '008c70392e3abfbd0fa47bbc2ed96aa99bd49e159727fcba0f2e6abeb3a9d601'
  },
  goalAmount: 10000,
  paymentLinks: {
    cashapp: 'https://cash.app/$YourCashtag',
    venmo: 'https://venmo.com/u/YourVenmo',
    paypal: 'https://paypal.me/YourPayPalMe/1',
    zelleEmail: 'YOUR-ZELLE-EMAIL@example.com',
    zellePhone: ''
  },
  demoMode: false,
  firebaseConfig: {
    apiKey: "AIzaSyB1EzbFTErSEOzG7zhVwjOauKxg8g_TcX4",
    authDomain: "one-dollar-plan.firebaseapp.com",
    databaseURL: "https://one-dollar-plan-default-rtdb.firebaseio.com",
    projectId: "one-dollar-plan",
    storageBucket: "one-dollar-plan.firebasestorage.app",
    messagingSenderId: "1081960263217",
    appId: "1:1081960263217:web:2dbbd55617cffb4bc5ef10",
    measurementId: "G-QXQRK16VD0"
  }
};
