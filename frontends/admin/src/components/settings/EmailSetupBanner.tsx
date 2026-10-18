import { useEffect } from 'react';
import { Alert, Button } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEmailSettingsStore } from '@/store/emailSettingsStore';
import { useUserStore } from '@/store/userStore';
import { isSuperAdmin } from '@/utils/systemAccess';

export const EMAIL_SETTINGS_PATH = '/settings/email';

/**
 * Shown on every page until a provider is saved and verified: without it the app cannot send password resets or
 * any other email. Hidden on the settings page itself, which explains the state in more detail.
 */
const EmailSetupBanner = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings, fetchSettings } = useEmailSettingsStore();
  const { currentUser } = useUserStore();
  // The settings routes need SUPER_ADMIN; a scoped staff role could not act on the banner anyway
  const canConfigure = isSuperAdmin(currentUser?.roles);

  useEffect(() => {
    if (canConfigure && !settings) fetchSettings();
  }, [canConfigure, settings, fetchSettings]);

  if (!canConfigure || !settings || settings.verified || location.pathname === EMAIL_SETTINGS_PATH) return null;

  return (
    <Alert
      severity="warning"
      sx={{ mb: 3 }}
      action={
        <Button color="inherit" size="small" onClick={() => navigate(EMAIL_SETTINGS_PATH)}>
          {settings.configured ? 'Send a test email' : 'Set up email'}
        </Button>
      }
    >
      {settings.configured
        ? 'Outgoing email is saved but not verified yet. Password reset and sign in links stay off until a test email goes through.'
        : 'Outgoing email is not set up. Password reset and sign in links are off until an email provider is connected.'}
    </Alert>
  );
};

export default EmailSetupBanner;
