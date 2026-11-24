// PrivacyPolicyModal.test.js — the "Do not sell or share" switch on the legal
// documents, and the hook that saves it for a signed-in account.
// RNTL v14: render() is ASYNC — always `await render(...)`.
import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

const mockSaveProfile = jest.fn();
jest.mock('../firestore-data', () => ({ saveUserProfile: (...a) => mockSaveProfile(...a) }));
const mockCtx = { user: { uid: 'u1', isAnonymous: false }, dataSaleOptOut: false, setDataSaleOptOut: jest.fn() };
jest.mock('../AppContext', () => ({ useAppContext: () => mockCtx }));
jest.mock('../alert', () => jest.fn());

import PrivacyPolicyModal from '../components/PrivacyPolicyModal';
import useDataSaleOptOut from '../components/ui/useDataSaleOptOut';
import showAlert from '../alert';

const LABEL = 'Do not sell or share my personal information';
const SECTIONS = [{ title: 'One', paragraphs: ['Text.'] }];

describe('the switch on a document', () => {
  test('is not there unless the caller asks for it', async () => {
    await render(<PrivacyPolicyModal visible mode="view" sections={SECTIONS} onClose={() => {}} />);
    expect(screen.queryByLabelText(LABEL)).toBeNull();
  });

  test('sits above "I agree" in a consent gate, and reports a change', async () => {
    const onOptOutChange = jest.fn();
    await render(
      <PrivacyPolicyModal
        visible mode="consent" sections={SECTIONS}
        onAccept={() => {}} onDecline={() => {}}
        optOut={false} onOptOutChange={onOptOutChange}
      />
    );
    const toggle = screen.getByLabelText(LABEL);
    expect(toggle.props.value).toBe(false);
    expect(screen.getByText('I agree to the Privacy Policy')).toBeTruthy();

    await fireEvent(toggle, 'valueChange', true);
    expect(onOptOutChange).toHaveBeenCalledWith(true);
  });

  test('shows when just reading, and reflects a choice already made', async () => {
    await render(
      <PrivacyPolicyModal
        visible mode="view" sections={SECTIONS} onClose={() => {}}
        optOut onOptOutChange={() => {}}
      />
    );
    expect(screen.getByLabelText(LABEL).props.value).toBe(true);
    expect(screen.queryByText('Not now')).toBeNull(); // still a reader, not a gate
  });
});

describe('useDataSaleOptOut', () => {
  // A stand-in for a screen using the hook.
  const Probe = () => {
    const { available, optedOut, setOptedOut } = useDataSaleOptOut();
    return (
      <>
        <Text>{available ? 'available' : 'unavailable'}</Text>
        <Text>{optedOut ? 'opted out' : 'not opted out'}</Text>
        <TouchableOpacity onPress={() => setOptedOut(true)}><Text>opt out</Text></TouchableOpacity>
      </>
    );
  };

  beforeEach(() => {
    mockSaveProfile.mockReset();
    mockCtx.setDataSaleOptOut.mockClear();
    showAlert.mockClear();
    mockCtx.user = { uid: 'u1', isAnonymous: false };
    mockCtx.dataSaleOptOut = false;
  });

  test('saves the choice to the account', async () => {
    mockSaveProfile.mockResolvedValue({ success: true });
    await render(<Probe />);
    expect(screen.getByText('available')).toBeTruthy();

    await fireEvent.press(screen.getByText('opt out'));
    await waitFor(() => expect(mockSaveProfile).toHaveBeenCalledWith('u1', { dataSaleOptOut: true }));
    expect(mockCtx.setDataSaleOptOut).toHaveBeenCalledTimes(1);
    expect(mockCtx.setDataSaleOptOut).toHaveBeenCalledWith(true);
    expect(showAlert).not.toHaveBeenCalled();
  });

  test('a save that fails puts the switch back and says so', async () => {
    mockSaveProfile.mockResolvedValue(null); // the data layer's "failed"
    await render(<Probe />);

    await fireEvent.press(screen.getByText('opt out'));
    await waitFor(() => expect(showAlert).toHaveBeenCalledWith('Could not save', expect.any(String)));
    expect(mockCtx.setDataSaleOptOut.mock.calls).toEqual([[true], [false]]);
  });

  test('an anonymous session has no account to record it on', async () => {
    mockCtx.user = { uid: 'anon', isAnonymous: true };
    await render(<Probe />);
    expect(screen.getByText('unavailable')).toBeTruthy();

    await fireEvent.press(screen.getByText('opt out'));
    expect(mockSaveProfile).not.toHaveBeenCalled();
  });
});
