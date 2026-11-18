// signup-validation.js — what Create Account still needs, one message per
// field, so Next can stay visible and say what's missing instead of hiding
// until everything is filled.
// Returns {} when the form is complete; otherwise only the fields that fail.

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD = 6; // Firebase Auth's minimum

export function validateSignup({ year, classYear, email, password, termsAccepted, policyAccepted } = {}) {
  const errors = {};
  if (!year) errors.year = 'Pick your expected graduation year.';
  if (!classYear) errors.classYear = 'Pick your class year.';
  const e = String(email || '').trim();
  if (!e) errors.email = 'Enter your email.';
  else if (!EMAIL_SHAPE.test(e)) errors.email = "That doesn't look like an email address.";
  if (!password) errors.password = 'Enter a password.';
  else if (password.length < MIN_PASSWORD) errors.password = `Use at least ${MIN_PASSWORD} characters.`;
  if (!termsAccepted || !policyAccepted) {
    errors.consent = 'Agree to the Terms of Service and the Privacy Policy to continue.';
  }
  return errors;
}
