// privacy-policy-content.js — the in-app privacy policy, converted from
// PRIVACY_POLICY.md (repo root). That file is the source of truth: when it
// changes materially, update the sections here AND bump POLICY_VERSION —
// the consent gate compares users' accepted version against this constant.

// 2026-08-20 bump: material change — added the "Data sharing and sale"
// disclosure (matching the marketing site's /privacy/ page) and removed the
// "we never sell your data" claims it contradicted. Every account re-consents.
export const POLICY_VERSION = '2026-08-20';

export const POLICY_TITLE = 'Privacy Policy';

export const POLICY_SECTIONS = [
  {
    title: '',
    paragraphs: [
      'Effective date: August 20, 2026',
      'RamblerRegistrar is an independent, student-built class planning app for Loyola University Chicago students. It is not affiliated with, endorsed by, or operated by Loyola University Chicago.',
      'This policy explains what information the app collects, why, where it lives, who we may share or sell it to, and what your choices are. The short version: we collect what the app’s features need; we may share and, in some cases, sell certain personal information (your name, your email address, and the personal data you enter in the app) to third parties; you can turn all selling and sharing off by emailing johngeddes@pm.me; and there are no ads or third-party analytics in the app.',
    ],
  },
  {
    title: 'What we collect',
    paragraphs: [
      'Account information. When you create an account: your email address and the display name you choose. Before you sign up, the app uses an anonymous session so you can browse the course catalog; if you create an account, that session becomes your account.',
      'Academic profile, provided by you. Your selected major(s), minors, focus area, class year, expected graduation year, honors/athlete status, courses you mark as completed (optionally with grades), quiz answers and results from the interests quiz, and scheduling preferences. We never access your LOCUS account or university records. Everything in your profile is what you typed or tapped; course catalog and seat-count data comes from Loyola’s public guest class search.',
      'Home address (optional). If you add a home address (for commute times and leave-by alerts), we store the address text and its map coordinates. You can skip this feature entirely; the app works without it.',
      'Planning data. Your saved schedules, multi-year course plans, and the sections you watch for open seats.',
      'Push notification token. If you enable seat alerts on a device, a push token (a device identifier issued by the notification service) is stored so alerts can reach that device.',
      'Feedback. If you send feedback, we store your message, its category, the screen or course it was about, and your account ID so we can follow up on bugs.',
      'What we do NOT collect: your LOCUS/university credentials, your device’s GPS location (the address feature uses only the address you type), contacts, photos, advertising identifiers, or browsing analytics.',
    ],
  },
  {
    title: 'How we use it',
    paragraphs: [
      'To run the app’s features: schedules, plans, degree progress, graduation outlook, commute times, seat-open alerts, and personalized warnings (for example, “this course filled before sophomore registration opened”).',
      'To notify you when a seat opens in a section you watch.',
      'To fix problems you report.',
      'We also may share and, in some cases, sell certain personal information to third parties, as described in “Data sharing and sale” below. We do not use your information for advertising inside the app, and we never share it with other students: within the app, your profile, grades, address, and plans are readable only by you (enforced by per-user database security rules).',
    ],
  },
  {
    title: 'Where your data lives',
    paragraphs: [
      'Your data is stored in Google Firebase (Cloud Firestore and Firebase Authentication) in Google Cloud’s United States region. Google acts as our hosting provider and processes data on our behalf under its privacy commitments (firebase.google.com/support/privacy).',
      'Two features send limited data to other services:',
      'Address lookup: when you save a home address, the address text is sent to OpenStreetMap’s Nominatim geocoding service to find its coordinates (OSMF privacy policy: wiki.osmfoundation.org/wiki/Privacy_Policy).',
      'Seat-alert delivery: push notifications are delivered through Expo’s notification service (Expo privacy policy: expo.dev/privacy).',
      'Third-party recipients of shared or sold data (see “Data sharing and sale” below) are a separate category in addition to the service providers above.',
    ],
  },
  {
    title: 'Data sharing and sale',
    paragraphs: [
      'We may share and, in some cases, sell certain personal information to third parties. The categories we may share or sell are: your name, your email address, and the personal data you input into the app (such as your schedules, preferences, interests-quiz answers, and degree-progress entries).',
      'You can turn off all third-party selling and sharing at any time with the “Do not sell or share my personal information” switch in Settings (Profile), or by emailing johngeddes@pm.me. Either route covers every third-party recipient.',
    ],
  },
  {
    title: 'Your choices and rights',
    paragraphs: [
      'See or change your data: your profile, courses, plans, schedules, and address are all editable in the app.',
      'Remove your address: replace or clear it in Profile at any time.',
      'Stop seat alerts: unwatch sections, or disable notifications for the app in your device settings.',
      'Opt out of selling and sharing: turn on “Do not sell or share my personal information” in Settings (Profile), or email us (address below); either way we stop selling and sharing your personal information with third parties.',
      'Delete your account and data: email us (address below) from your account email and we will delete your account and all associated data within 30 days. (In-app account deletion is planned.)',
    ],
  },
  {
    title: 'Data retention',
    paragraphs: [
      'Your data is kept while your account exists. Feedback reports are kept until resolved or for at most two years. If you request deletion, all personal data is removed; anonymous, aggregate enrollment statistics (which contain no student data) are unaffected.',
    ],
  },
  {
    title: 'Children',
    paragraphs: [
      'RamblerRegistrar is intended for college students and is not directed at children under 13. We do not knowingly collect information from children under 13; if you believe a child has created an account, contact us and we will delete it.',
    ],
  },
  {
    title: 'Security',
    paragraphs: [
      'Access to your data is controlled by per-user security rules; no other user of the app can read your profile, grades, address, plans, or watches. Traffic between the app and our servers is encrypted in transit (TLS).',
    ],
  },
  {
    title: 'Changes',
    paragraphs: [
      'If this policy changes materially, we’ll update the effective date and note the change in the app before it takes effect.',
    ],
  },
  {
    title: 'Contact',
    paragraphs: [
      'Questions, requests, or deletion: johngeddes@pm.me',
    ],
  },
];
