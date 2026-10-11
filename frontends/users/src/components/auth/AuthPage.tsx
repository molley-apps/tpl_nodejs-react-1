import { useState } from 'react';
import SignInPage from './SignInPage';
import SignUpPage from './SignUpPage';
import ForgotPasswordPage from './ForgotPasswordPage';
import ResetPasswordPage from './ResetPasswordPage';

type Screen = 'sign-in' | 'sign-up' | 'forgot-password' | 'reset-password';

// The password reset email links back here with ?token=…
const resetToken = new URLSearchParams(window.location.search).get('token');

/**
 * Switches between the four auth screens. There is no router in this app yet,
 * so the screen is local state; the only URL-driven entry is the reset token.
 */
export default function AuthPage() {
  const [screen, setScreen] = useState<Screen>(resetToken ? 'reset-password' : 'sign-in');

  const backToSignIn = () => {
    if (resetToken) {
      // Drop the consumed token from the address bar
      window.history.replaceState({}, '', window.location.pathname);
    }
    setScreen('sign-in');
  };

  switch (screen) {
    case 'sign-up':
      return <SignUpPage onSignIn={backToSignIn} />;
    case 'forgot-password':
      return <ForgotPasswordPage onSignIn={backToSignIn} />;
    case 'reset-password':
      return <ResetPasswordPage token={resetToken || ''} onDone={backToSignIn} />;
    default:
      return <SignInPage onSignUp={() => setScreen('sign-up')} onForgotPassword={() => setScreen('forgot-password')} />;
  }
}
