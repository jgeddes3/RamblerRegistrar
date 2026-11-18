// account-deletion.js — the part of deleting an account that runs while the
// Delete account panel is open, so its errors can be shown there.
// No react, no firebase: the steps are passed in.
//
// eraseAccountData(password, uid, deps) -> { ok: true } | { ok: false, step, code? }
//   1. reauthenticate(password): Firebase only deletes a recently signed-in
//      account, and asking for the password confirms the user means it.
//   2. deleteAllUserData(uid): every Firestore doc the account owns.
//   3. clearLocalData(): what this phone keeps for the account.
// Deleting the sign-in itself (auth.js deleteCurrentAccount) comes after,
// once the panel has closed: it swaps the whole signed-in screen tree.

export async function eraseAccountData(password, uid, deps) {
  try {
    await deps.reauthenticate(password);
  } catch (e) {
    return { ok: false, step: 'password', code: e && e.code };
  }
  try {
    await deps.deleteAllUserData(uid);
  } catch (e) {
    return { ok: false, step: 'data' };
  }
  try {
    await deps.clearLocalData();
  } catch (e) {
    // The account's data is gone from the server. A leftover on this phone
    // (recent searches) isn't worth reporting the deletion as failed.
  }
  return { ok: true };
}

export function deletionErrorMessage(result) {
  if (!result || result.ok) return '';
  if (result.step === 'password') {
    switch (result.code) {
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
      case 'auth/invalid-login-credentials':
        return "That password isn't right.";
      case 'auth/too-many-requests':
        return 'Too many tries. Wait a few minutes, then try again.';
      case 'auth/network-request-failed':
        return "Couldn't reach the server. Check your connection, then try again.";
      default:
        return "Couldn't confirm your password. Try again.";
    }
  }
  return "Couldn't finish deleting your data. Check your connection, then try again. Your account stays open until everything is deleted.";
}
