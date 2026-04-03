import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
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
