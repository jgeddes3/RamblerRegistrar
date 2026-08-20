// terms-content.js — the in-app Terms of Service, converted from the
// marketing site's /terms/ page (RamblerRegistrarWeb src/pages/terms/
// TermsPage.tsx). That page is the source of truth: when it changes
// materially, update the sections here AND bump TERMS_VERSION — the consent
// gate compares users' accepted version against this constant (exactly the
// POLICY_VERSION mechanism in privacy-policy-content.js).

export const TERMS_VERSION = '2026-08-20';

export const TERMS_TITLE = 'Terms of Service';

export const TERMS_SECTIONS = [
  {
    title: '',
    paragraphs: [
      'Effective date: August 20, 2026',
      'These Terms of Service (“Terms”) are a binding agreement between you and Cipher Tracker LLC, the operator of Rambler Registrar (“we,” “us,” or “our”). They govern your use of the Rambler Registrar mobile application, our website, and any related features and services we provide (together, the “Service”).',
      'Please read these Terms carefully. By using the Service, you agree to them. If you do not agree, do not use the Service.',
    ],
  },
  {
    title: 'Agreement to these Terms',
    paragraphs: [
      'How you accept: when you create an account in the app, you are asked to accept these Terms. On the website, submitting the waitlist form or otherwise using the site means you agree to these Terms as they apply to the website.',
      'Who can use the Service: it is intended for enrolled Loyola University Chicago students. You must be old enough to form a binding contract with us. If you use the Service on behalf of another person or an organization, you represent that you are authorized to accept these Terms for them.',
    ],
  },
  {
    title: 'Description of the Service',
    paragraphs: [
      'Rambler Registrar helps Loyola students build and compare class schedules. Depending on your platform and the features available, the Service may let you generate and score candidate schedules, view course and section information, see seat counts and seat-open alerts, view professor ratings, estimate building-to-building walk times, explore degree programs and progress, and take short preference quizzes.',
      'The Service is a planning and information tool. It is not an official Loyola system, an academic advisor, or a registration system.',
      'Course data is read from public sources and may be inaccurate or out of date. We read publicly available Loyola course information (including from LOCUS, the public registration catalog) on a periodic schedule. Seat counts, times, rooms, instructors, prerequisites, and availability can change at any time and may not match what LOCUS shows at the moment you register.',
      'Rambler Registrar does not register you for classes. We do not add, drop, or enroll you in any course.',
      'You are responsible for verifying seats, times, requirements, and everything else in LOCUS before you register. Do not rely on the Service as your sole source of truth. Always confirm the official information in LOCUS (and with your academic advisor and Loyola’s official policies) before you make registration decisions.',
      'We do not guarantee that any schedule, score, recommendation, walk-time estimate, professor rating, degree-progress calculation, or alert is accurate, complete, current, or suitable for your situation. Scores and recommendations are heuristics to help you compare options; they are not advice about what you should take.',
      'Features may be added, changed, or removed at any time.',
    ],
  },
  {
    title: 'Your LOCUS password and Loyola account',
    paragraphs: [
      'We never ask for, collect, store, transmit, or use your LOCUS or Loyola password, and we never log into your LOCUS or Loyola account. You build your schedule in Rambler Registrar and enter the class numbers into LOCUS yourself. The Service reads only public Loyola course data that any student can see. If anyone claiming to be us ever asks for your LOCUS credentials, do not provide them; it is not us.',
    ],
  },
  {
    title: 'Accounts and security',
    paragraphs: [
      'To use the app, you create an account. We use Firebase Authentication (a Google service) to manage sign-in and account identifiers.',
      'You agree to: provide accurate information when you register and keep it current; keep your login credentials confidential and not share your account; be responsible for all activity that happens under your account; and notify us promptly at johngeddes@pm.me if you suspect any unauthorized use of your account.',
      'We are not liable for any loss arising from unauthorized use of your account that results from your failure to safeguard your credentials.',
    ],
  },
  {
    title: 'Acceptable use',
    paragraphs: [
      'You agree not to do any of the following, and not to help or permit anyone else to:',
      '• scrape, crawl, harvest, or bulk-download any part of the Service or its data by automated means, except as we expressly permit;',
      '• reverse engineer, decompile, or disassemble the app or the Service, or attempt to derive its source code, except to the limited extent that applicable law prohibits us from restricting this;',
      '• resell, sublicense, rent, or commercially redistribute the Service, its content, or its data;',
      '• access, extract, or attempt to access another user’s data, account, schedules, or personal information, or otherwise probe, scan, or breach the Service’s security or access controls;',
      '• interfere with, overload, or disrupt the Service or the servers and networks that run it (including circumventing rate limits);',
      '• use the Service for any unlawful purpose, or in violation of Loyola University Chicago’s policies or LOCUS’s terms of use;',
      '• use the Service to infringe anyone’s intellectual property, privacy, or other rights;',
      '• upload or transmit malware or any harmful code; or',
      '• misrepresent your identity or impersonate any person or entity.',
      'We may investigate suspected violations and may suspend or terminate access for conduct that violates these Terms or that we reasonably believe is harmful to the Service or other users.',
    ],
  },
  {
    title: 'Your content and data',
    paragraphs: [
      'You own the content you create. As between you and us, you retain ownership of the schedules, preferences, course and section selections, quiz responses, degree-progress information, watch-alert settings, and other information you create or enter in the Service (“Your Content”).',
      'To operate the Service for you, you grant us a limited, non-exclusive, worldwide, royalty-free license to host, store, copy, process, transmit, display, and use Your Content solely as needed to provide, maintain, secure, and improve the Service and as otherwise described in our Privacy Policy. This license lasts only as long as we hold Your Content and ends when Your Content is deleted from our active systems, except for copies retained as described in the Privacy Policy or required by law.',
      'How we handle Personal Information is governed by our Privacy Policy, which describes what we collect, how we use it, how long we keep it, and your choices. By using the Service you also agree to the Privacy Policy.',
    ],
  },
  {
    title: 'Data sharing and sale',
    paragraphs: [
      'We may share and, in some cases, sell certain personal information to third parties. The categories we may share or sell are your name, your email address, and the personal data you input into the app (such as your schedules, preferences, quiz answers, and degree-progress entries).',
      'Our Privacy Policy explains what data is shared or sold, to whom, and your rights, including how you can turn off all third-party selling and sharing by emailing johngeddes@pm.me. One request covers every third-party recipient. An in-app Settings switch that does the same thing is a launch commitment described in the Privacy Policy; it is not built yet. Please read the Privacy Policy before you use the Service.',
    ],
  },
  {
    title: 'Intellectual property',
    paragraphs: [
      'Our rights: the Service, including the app, our website, our software, design, text, graphics, logos, and the “Rambler Registrar” name and brand, is owned by us or our licensors and is protected by intellectual property and other laws. We grant you a limited, personal, non-exclusive, non-transferable, revocable license to use the Service for your own, non-commercial use as a Loyola student, subject to these Terms. We reserve all rights not expressly granted.',
      'Public course data: course catalog and related information originates from public Loyola sources and third-party sources; we do not claim ownership of that underlying source data, and your use of it must comply with the rights of those sources.',
      'No Loyola marks: Rambler Registrar reads the same public course catalog that any student can access. We do not use Loyola’s name to imply sponsorship or endorsement, and we do not use the Loyola crest, seal, or other official marks. Nothing in the Service should be read as a statement by or on behalf of Loyola University Chicago.',
    ],
  },
  {
    title: 'Disclaimers of warranties',
    paragraphs: [
      'THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE,” WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY. To the fullest extent permitted by law, we disclaim all warranties, including any implied warranties of merchantability, fitness for a particular purpose, title, and non-infringement, and any warranties arising from course of dealing or usage of trade.',
      'Without limiting the above: the course data and other information in the Service are read from public sources and may be inaccurate, incomplete, or out of date; the Service does not register you for classes; and you are solely responsible for verifying seats, times, requirements, and all other information in LOCUS before you register. We do not warrant that the Service will be uninterrupted, secure, or error-free, or that alerts will be delivered in time or at all.',
    ],
  },
  {
    title: 'Limitation of liability',
    paragraphs: [
      'To the fullest extent permitted by law: we will not be liable for any indirect, incidental, special, consequential, exemplary, or punitive damages, or for any lost profits, lost data, lost opportunities, or missed registration, enrollment, or academic outcomes, arising out of or relating to the Service, even if we have been advised of the possibility of such damages.',
      'Our total liability for all claims arising out of or relating to the Service or these Terms will not exceed the greater of (a) the total amounts you paid us, if any, for the Service in the twelve months before the event giving rise to the claim, or (b) one hundred U.S. dollars (US$100). Because the Service is currently free, (a) is expected to be zero.',
      'Some jurisdictions do not allow the exclusion or limitation of certain damages, so some of the above limitations may not apply to you. Nothing in these Terms limits liability that cannot be limited by law (for example, for fraud, gross negligence, or willful misconduct where non-waivable).',
    ],
  },
  {
    title: 'Indemnification',
    paragraphs: [
      'To the extent permitted by law, you agree to indemnify and hold harmless us and our officers, employees, and agents from and against claims, damages, losses, and reasonable expenses (including reasonable attorneys’ fees) arising out of (a) your misuse of the Service, (b) your violation of these Terms or of applicable law, or (c) your violation of the rights of any third party through your use of the Service.',
    ],
  },
  {
    title: 'Termination',
    paragraphs: [
      'You may stop using the Service at any time and may close your account by contacting us at johngeddes@pm.me or using any in-app account-deletion feature we provide.',
      'We may suspend or terminate your access to the Service, in whole or in part, at any time, including if you violate these Terms, if we reasonably believe your use is harmful or unlawful, or if we discontinue the Service.',
      'On termination, your license to use the Service ends. You may request access to or deletion of your data by emailing johngeddes@pm.me; how we handle deletion (including any retention we are required to keep and any identity-verification step) is described in the Privacy Policy.',
      'The sections on your content (as to the limited retained-copy license), intellectual property, disclaimers, limitation of liability, indemnification, dispute resolution and governing law, and miscellaneous terms survive termination, along with any other provision that by its nature should survive.',
    ],
  },
  {
    title: 'Dispute resolution and governing law',
    paragraphs: [
      'We operate from Illinois, and the Service is built for enrolled Loyola University Chicago students wherever they live. These Terms and any dispute arising out of or relating to them or the Service are governed by the laws of the State of Illinois, without regard to its conflict-of-laws rules. You and we agree that the exclusive venue for any dispute will be the state and federal courts located in Illinois, and each party consents to personal jurisdiction there.',
      'This choice of law and venue does not limit any right your own state’s law gives you, and it does not narrow the data-sharing opt-out described above, which we honor for every user regardless of residence.',
    ],
  },
  {
    title: 'Changes to these Terms',
    paragraphs: [
      'We may update these Terms from time to time. If we make a material change, we will provide reasonable advance notice, at least 30 days before the change takes effect, by posting the updated Terms with a new effective date and, where appropriate, notifying you in the app, by email, or by other reasonable means. Your continued use of the Service after a change takes effect means you accept the updated Terms. If you do not agree to a change, you must stop using the Service and may close your account before the change takes effect.',
    ],
  },
  {
    title: 'Miscellaneous',
    paragraphs: [
      'Severability: if any provision of these Terms is found unenforceable, that provision will be limited or removed to the minimum extent necessary, and the remaining provisions will stay in full force.',
      'Entire agreement: these Terms, together with the Privacy Policy and any additional terms we present for specific features, are the entire agreement between you and us about the Service and supersede any prior agreements on that subject.',
      'No waiver: our failure to enforce any provision is not a waiver of our right to do so later.',
      'Assignment: you may not assign or transfer these Terms without our prior written consent. We may assign these Terms in connection with a merger, acquisition, reorganization, or sale of assets.',
      'Force majeure: we are not liable for any failure or delay caused by events beyond our reasonable control.',
      'Relationship to Loyola: these Terms are between you and us only. Loyola University Chicago is not a party to these Terms and has no obligations to you under them.',
      'Location: Rambler Registrar is operated by Cipher Tracker LLC, from Illinois, USA. We do not list a physical mailing address.',
      'Contact: questions about these Terms, or requests to access or delete your data, can be sent to johngeddes@pm.me, the sole contact for all matters.',
    ],
  },
];
