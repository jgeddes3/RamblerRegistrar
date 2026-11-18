// export-sale-data.js — THE ONLY SANCTIONED PATH for exporting user personal
// data to a third party under the "Data sharing and sale" section of the
// Privacy Policy. Never export user data any other way: this script is the
// enforcement point behind the in-app "Do not sell or share my personal
// information" switch (users/{uid}.dataSaleOptOut) — an export that bypasses
// it turns that switch into a false statement with a UI.
//
// A user is eligible for export ONLY if ALL of these hold:
//   1. dataSaleOptOut is not true (the switch, or an emailed opt-out that was
//      recorded by setting the same flag via the admin console).
//   2. privacyPolicyVersion >= 2026-08-20 — the first policy version that
//      DISCLOSES the sale. Accounts that only accepted the older "we never
//      sell your data" policy have not consented to any sale and must never
//      be exported. (ISO date strings compare correctly as strings.)
//   3. termsVersion is present (accepted the Terms of Service).
//   4. The account has an email in Firebase Auth (anonymous browsers and
//      half-created accounts are excluded).
//   5. That email is VERIFIED in Firebase Auth. Sign-up takes any address
//      without proof, so an unverified account may carry a stranger's email
//      and a consent that stranger never gave.
// The rule itself lives in sale-eligibility.js (tests/sale-eligibility.test.js).
//
// Exported categories are EXACTLY the disclosed ones — name, email address,
// and the personal data the user input into the app (profile selections, quiz
// results, schedules, plans, completed courses, seat watches). Deliberately
// NOT exported:
//   - users/{uid}/locations (home address + coordinates): whether home
//     address is inside the sale scope is an OPEN owner decision — see
//     RamblerRegistrarWeb/docs/legal/app-compliance-todo.md §4. Do not add it
//     here until that decision is written into the Privacy Policy.
//   - expoPushToken (device identifier, not input data) and feedback
//     (not among the disclosed example categories).
//
// Usage:
//   node export-sale-data.js                    # dry run — counts only
//   node export-sale-data.js --write=out.json   # writes the export file
const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require(path.join(__dirname, 'serviceAccountKey.json'))),
  });
}

const { saleExclusion } = require('./sale-eligibility');

// All Firebase Auth users, uid -> { email, emailVerified, displayName }.
async function listAuthUsers() {
  const byUid = new Map();
  let pageToken;
  do {
    const page = await admin.auth().listUsers(1000, pageToken);
    for (const u of page.users) {
      byUid.set(u.uid, {
        email: u.email || null,
        emailVerified: u.emailVerified === true,
        displayName: u.displayName || null,
      });
    }
    pageToken = page.pageToken;
  } while (pageToken);
  return byUid;
}

async function subcollection(uid, name) {
  const snap = await admin.firestore().collection('users').doc(uid).collection(name).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

(async () => {
  const writeArg = (process.argv.find((a) => a.startsWith('--write=')) || '').split('=')[1];

  const [authUsers, profilesSnap] = await Promise.all([
    listAuthUsers(),
    admin.firestore().collection('users').get(),
  ]);

  const eligible = [];
  const excluded = { optedOut: 0, preSalePolicy: 0, noTerms: 0, noEmail: 0, unverifiedEmail: 0 };

  for (const doc of profilesSnap.docs) {
    const p = doc.data();
    const auth = authUsers.get(doc.id);
    const reason = saleExclusion(auth, p);
    if (reason) { excluded[reason]++; continue; }
    eligible.push({ uid: doc.id, auth, profile: p });
  }

  console.log('Sale-export eligibility (enforcement report):');
  console.log(`  eligible:                      ${eligible.length}`);
  console.log(`  excluded — opted out:          ${excluded.optedOut}`);
  console.log(`  excluded — pre-sale policy:    ${excluded.preSalePolicy} (never consented to any sale)`);
  console.log(`  excluded — no Terms accepted:  ${excluded.noTerms}`);
  console.log(`  excluded — no email/anonymous: ${excluded.noEmail}`);
  console.log(`  excluded — email not verified: ${excluded.unverifiedEmail}`);

  if (!writeArg) {
    console.log('\nDry run — no file written. Pass --write=out.json to export.');
    process.exit(0);
  }

  const out = [];
  for (const { uid, auth, profile } of eligible) {
    const [courses, schedules, plans, watches, privateDocs] = await Promise.all([
      subcollection(uid, 'courses'),
      subcollection(uid, 'schedules'),
      subcollection(uid, 'plans'),
      subcollection(uid, 'watches'),
      subcollection(uid, 'private'),
    ]);
    const quiz = privateDocs.find((d) => d.id === 'quiz') || null;
    out.push({
      name: auth.displayName,
      email: auth.email,
      inputData: {
        selectedProgramId: profile.selectedProgramId ?? null,
        selectedProgram2Id: profile.selectedProgram2Id ?? null,
        selectedMinors: profile.selectedMinors ?? [],
        selectedFocusId: profile.selectedFocusId ?? null,
        graduationYear: profile.graduationYear ?? null,
        classYear: profile.classYear ?? null,
        isHonors: profile.isHonors === true,
        isAthlete: profile.isAthlete === true,
        quizResults: quiz,
        completedCourses: courses,
        schedules,
        plans,
        seatWatches: watches,
        // locations (home address) intentionally omitted — see header.
      },
    });
  }

  fs.writeFileSync(writeArg, JSON.stringify(out, null, 2));
  console.log(`\nWrote ${out.length} record(s) to ${writeArg}.`);
  console.log('Reminder: honor future opt-outs for already-transferred data per the Privacy Policy (one emailed request covers every recipient).');
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
