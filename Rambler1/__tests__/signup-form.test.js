// signup-form.test.js — Create Account shows Next from the start and says,
// field by field, what is missing; Login fields carry labels and autofill.
// RNTL v14: render() is ASYNC — always `await render(...)`.
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { validateSignup } from '../signup-validation';

const OK = { year: 2028, classYear: 'Junior', email: 'sam@luc.edu', password: 'hunter22', termsAccepted: true, policyAccepted: true };

describe('validateSignup', () => {
  test('a complete form has no errors', () => {
    expect(validateSignup(OK)).toEqual({});
  });

  test('each missing or bad field gets its own message', () => {
    expect(validateSignup({})).toEqual({
      year: 'Pick your expected graduation year.',
      classYear: 'Pick your class year.',
      email: 'Enter your email.',
      password: 'Enter a password.',
      consent: 'Agree to the Terms of Service and the Privacy Policy to continue.',
    });
    expect(validateSignup({ ...OK, email: 'sam@luc' }).email).toBe("That doesn't look like an email address.");
    expect(validateSignup({ ...OK, password: 'abc' }).password).toBe('Use at least 6 characters.');
    expect(validateSignup({ ...OK, termsAccepted: false }).consent).toMatch(/Agree to the Terms/);
  });

  test('surrounding spaces in the email are ignored', () => {
    expect(validateSignup({ ...OK, email: '  sam@luc.edu ' })).toEqual({});
  });
});

describe('Login fields', () => {
  jest.mock('../auth', () => ({ signIn: jest.fn(async () => { throw Object.assign(new Error('x'), { code: 'auth/invalid-credential' }); }) }));
  jest.mock('../AppContext', () => ({ useAppContext: () => ({}) }));
  jest.mock('../components/PrivacyPolicyModal', () => () => null);
  jest.mock('../styleComponents/BackgroundImage', () => ({ children }) => children);

  test('email and password are labelled and tell the OS what to autofill', async () => {
    const Login = require('../Login').default;
    await render(<Login navigation={{ navigate: jest.fn() }} />);
    const email = screen.getByLabelText('Email');
    const password = screen.getByLabelText('Password');
    expect(screen.getByText('Email')).toBeTruthy(); // a visible label, not only a placeholder
    expect(email.props.autoComplete).toBe('email');
    expect(email.props.textContentType).toBe('username');
    expect(password.props.autoComplete).toBe('current-password');
    expect(password.props.textContentType).toBe('password');
    expect(password.props.secureTextEntry).toBe(true);
  });

  test('a failed sign-in is announced as an alert', async () => {
    const Login = require('../Login').default;
    await render(<Login navigation={{ navigate: jest.fn() }} />);
    await fireEvent.changeText(screen.getByLabelText('Email'), 'sam@luc.edu');
    await fireEvent.changeText(screen.getByLabelText('Password'), 'wrong-pass');
    await fireEvent.press(screen.getByText('Login'));
    expect(await screen.findByRole('alert')).toBeTruthy();
  });
});
