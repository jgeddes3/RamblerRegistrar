import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  linkWithCredential,
  EmailAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { auth } from './firebaseConfig';

export const signUp = async (email, password, displayName) => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await updateProfile(credential.user, { displayName });
  }
  return credential.user;
};

export const signIn = async (email, password) => {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
};

export const signOut = async () => {
  await firebaseSignOut(auth);
  // Re-establish anonymous auth so Firestore catalog reads (which require any
  // auth) keep working while the user is signed out. The resulting anonymous
  // user fires onAuthStateChanged with isAnonymous:true, which AppContext
  // treats as logged out. Never throw — sign-out itself already succeeded.
  try {
    await signInAnonymously(auth);
  } catch (error) {
    console.log('Anonymous re-sign-in after sign-out skipped:', error.message);
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Helper to get the ID token for backend API calls
export const getIdToken = async () => {
  const user = auth.currentUser;
  if (!user) return null;
  return await user.getIdToken();
};

// Wait for Firebase to finish restoring any persisted session (fires once).
const waitForAuthReady = () =>
  new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        resolve(user);
      },
      () => {
        unsubscribe();
        resolve(null);
      }
    );
  });

// Sign in anonymously at app launch so Firestore catalog reads are permitted
// (security rules require any auth, anonymous counts). Waits for persisted
// session restore first so we never mint a duplicate anonymous account over a
// real one. Never throws — offline launch must not crash the app.
export const ensureAnonymousSignIn = async () => {
  try {
    const existing = auth.currentUser || (await waitForAuthReady());
    if (existing) return existing;
    const credential = await signInAnonymously(auth);
    return credential.user;
  } catch (error) {
    console.log('Anonymous sign-in skipped:', error.message);
    return null;
  }
};

// Upgrade the current anonymous session into a real email/password account,
// preserving the uid (and any Firestore data already written under it).
// Falls back to a plain createUserWithEmailAndPassword if there is no
// anonymous user to upgrade. Throws Firebase auth errors (auth/email-already-in-use,
// auth/credential-already-in-use, auth/invalid-email, auth/weak-password) so
// callers can show the same error messages as before.
export const upgradeAnonymousAccount = async (email, password, displayName) => {
  const current = auth.currentUser;
  let user;
  if (current && current.isAnonymous) {
    const emailCredential = EmailAuthProvider.credential(email, password);
    const result = await linkWithCredential(current, emailCredential);
    user = result.user;
    // Force a server reload so the persisted session snapshot records
    // isAnonymous:false. Without this, the pre-link ANONYMOUS snapshot can
    // survive in storage — the next cold start would restore a user that
    // still looks anonymous and AppContext would treat it as logged out
    // ("I signed up but it didn't keep me signed in", B11). reload() also
    // re-persists the corrected user. Best-effort: signup already succeeded.
    try {
      await user.reload();
    } catch (e) {
      console.log('Post-link reload skipped:', e.message);
    }
  } else {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    user = credential.user;
  }
  if (displayName) {
    await updateProfile(user, { displayName });
  }
  return user;
};
