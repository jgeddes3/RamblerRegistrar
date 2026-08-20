// list-feedback.js — read the write-only `feedback` mailbox (clients can only
// CREATE; reading happens here via Admin SDK, which bypasses rules).
// Usage: node list-feedback.js [--limit=50]
const path = require('path');
const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require(path.join(__dirname, 'serviceAccountKey.json'))),
  });
}

(async () => {
  const limitArg = (process.argv.find((a) => a.startsWith('--limit=')) || '').split('=')[1];
  const limit = Math.max(1, parseInt(limitArg, 10) || 50);
  const snap = await admin.firestore()
    .collection('feedback')
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  if (snap.empty) {
    console.log('No feedback yet.');
    process.exit(0);
  }
  for (const d of snap.docs) {
    const f = d.data();
    const when = f.createdAt && f.createdAt.toDate ? f.createdAt.toDate().toISOString() : '?';
    console.log(`\n[${when}] ${String(f.type || '?').toUpperCase()}  (${f.context || 'no context'})  uid=${f.uid}`);
    console.log(`  ${String(f.message || '').replace(/\n/g, '\n  ')}`);
  }
  console.log(`\n${snap.size} item(s).`);
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
