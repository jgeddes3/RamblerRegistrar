// useDataSaleOptOut — the "Do not sell or share my personal information"
// choice for the signed-in account, for the places that offer the switch
// outside Profile: the Terms and Privacy Policy readers (the sign-in consent
// gate and More).
//
// { available, optedOut, setOptedOut }
// available: false for anonymous browsers and signed-out sessions (there is
// no account to record the choice on).
// setOptedOut(bool): shows the choice at once, then saves it. The export side
// (backend/export-sale-data.js) reads the saved flag, so a switch that looks
// on while the save failed would be a false statement: on failure it goes
// back and says so.
import { useCallback } from 'react';
import { useAppContext } from '../../AppContext';
import { saveUserProfile } from '../../firestore-data';
import showAlert from '../../alert';

export default function useDataSaleOptOut() {
  const { user, dataSaleOptOut, setDataSaleOptOut } = useAppContext();
  const uid = user && !user.isAnonymous ? user.uid : null;

  const setOptedOut = useCallback(async (value) => {
    if (!uid) return;
    const next = value === true;
    setDataSaleOptOut(next);
    const res = await saveUserProfile(uid, { dataSaleOptOut: next });
    if (!res) {
      setDataSaleOptOut(!next);
      showAlert('Could not save', 'Your choice did not reach the server. Check your connection and try again.');
    }
  }, [uid, setDataSaleOptOut]);

  return { available: !!uid, optedOut: dataSaleOptOut === true, setOptedOut };
}
