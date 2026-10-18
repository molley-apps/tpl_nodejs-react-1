import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  Link,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Provider } from 'apis/api-mono/services/interfaces/AdminSettingsEmailPutPut';
import { AdminSettingsEmail } from 'apis/api-mono/services/interfaces/AdminSettingsEmail';
import { useEmailSettingsStore } from '@/store/emailSettingsStore';
import { useUserStore } from '@/store/userStore';
import { EMAIL_PROVIDERS, emailProviderPreset } from '@/utils/emailProviders';
import { apiErrorMessage } from '@/utils/apiErrorMessage';
import { relativeTime } from '@/utils/relativeTime';

interface FormState {
  provider: Provider;
  host: string;
  port: string;
  secure: boolean;
  username: string;
  password: string;
  fromAddress: string;
  fromName: string;
  replyTo: string;
}

const IMPLICIT_TLS_PORT = 465;

const formFrom = (settings: AdminSettingsEmail | null): FormState => {
  const preset = emailProviderPreset(settings?.provider);
  return {
    provider: preset.provider,
    host: settings?.host ?? preset.host,
    port: String(settings?.port ?? preset.port),
    secure: settings?.secure ?? preset.port === IMPLICIT_TLS_PORT,
    username: settings?.username ?? preset.username ?? '',
    password: '',
    fromAddress: settings?.fromAddress ?? '',
    fromName: settings?.fromName ?? '',
    replyTo: settings?.replyTo ?? '',
  };
};

const statusOf = (settings: AdminSettingsEmail): { severity: 'info' | 'warning' | 'success' | 'error'; text: string } => {
  if (!settings.configured) {
    return { severity: 'info', text: 'Not configured. The app cannot send email until a provider is connected.' };
  }
  const label = emailProviderPreset(settings.provider).label;
  if (settings.lastError) {
    const when = settings.lastSendAt ? ` ${relativeTime(settings.lastSendAt)}` : '';
    return { severity: 'error', text: `Last send failed${when}: ${settings.lastError}` };
  }
  if (!settings.verified) {
    return { severity: 'warning', text: 'Saved, not yet verified. Send a test email to switch outgoing email on.' };
  }
  return {
    severity: 'success',
    text: `Sending through ${label} as ${settings.fromAddress}. Verified ${relativeTime(settings.verifiedAt as Date)}.`,
  };
};

/**
 * Settings → Email: the administrator connects their own email provider (bring your own key). Molley never sends
 * on the app's behalf. API: GET/PUT/DELETE /admin/settings/email, POST /admin/settings/email/test.
 */
const EmailSettings = () => {
  const { settings, loading, fetchSettings, saveSettings, sendTest, removeSettings } = useEmailSettingsStore();
  const { currentUser } = useUserStore();

  const [form, setForm] = useState<FormState>(() => formFrom(null));
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<'save' | 'test' | 'remove' | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Load the saved values into the form once, and again after a save or removal (dirty resets then)
  useEffect(() => {
    if (settings && !dirty) setForm(formFrom(settings));
  }, [settings, dirty]);

  const preset = useMemo(() => emailProviderPreset(form.provider), [form.provider]);
  const isCustom = preset.provider === Provider.Smtp;
  const configured = !!settings?.configured;

  const update = (patch: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  };

  const choosePreset = (provider: Provider) => {
    const next = emailProviderPreset(provider);
    update({
      provider,
      host: next.host,
      port: String(next.port),
      secure: next.port === IMPLICIT_TLS_PORT,
      username: next.username ?? '',
    });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy('save');
    setError('');
    setNotice('');
    try {
      await saveSettings({
        provider: form.provider,
        host: form.host.trim(),
        port: Number(form.port),
        secure: form.secure,
        username: form.username.trim(),
        password: form.password || undefined,
        fromAddress: form.fromAddress.trim(),
        fromName: form.fromName.trim() || undefined,
        replyTo: form.replyTo.trim() || undefined,
      });
      setDirty(false);
      setNotice('Settings saved. Send a test email to verify them and switch outgoing email on.');
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save the settings'));
    } finally {
      setBusy(null);
    }
  };

  const test = async () => {
    setBusy('test');
    setError('');
    setNotice('');
    try {
      const result = await sendTest();
      if (result.success) {
        setNotice(`Test email sent to ${currentUser?.email}. Outgoing email is on.`);
      } else {
        setError(`The provider rejected the test email: ${result.providerResponse || 'no response'}`);
      }
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not send the test email'));
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    setBusy('remove');
    setError('');
    setNotice('');
    try {
      await removeSettings();
      setConfirmRemove(false);
      setDirty(false);
      setForm(formFrom(null));
      setNotice('Email settings removed. The app no longer sends email.');
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not remove the settings'));
    } finally {
      setBusy(null);
    }
  };

  const status = settings ? statusOf(settings) : null;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
        Email
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Connect your own email provider. The app sends password resets, sign in links and any other notifications
        through it, from an address on a domain you have verified with that provider.
      </Typography>

      {status && (
        <Alert severity={status.severity} sx={{ mb: 3 }}>
          {status.text}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      {notice && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {notice}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper component="form" onSubmit={submit} sx={{ p: 3 }}>
            <Stack spacing={2}>
              <TextField
                select
                label="Provider"
                value={form.provider}
                onChange={(e) => choosePreset(e.target.value as Provider)}
                disabled={loading || busy !== null}
              >
                {EMAIL_PROVIDERS.map((option) => (
                  <MenuItem key={option.provider} value={option.provider}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="SMTP host"
                  value={form.host}
                  onChange={(e) => update({ host: e.target.value })}
                  required
                  fullWidth
                  InputProps={{ readOnly: !isCustom }}
                  helperText={isCustom ? undefined : `Fixed for ${preset.label}`}
                />
                <TextField
                  label="Port"
                  type="number"
                  value={form.port}
                  onChange={(e) => update({ port: e.target.value, secure: Number(e.target.value) === IMPLICIT_TLS_PORT })}
                  required
                  sx={{ width: { sm: 140 } }}
                  InputProps={{ readOnly: !isCustom }}
                />
              </Stack>
              {isCustom && (
                <FormControlLabel
                  control={<Checkbox checked={form.secure} onChange={(e) => update({ secure: e.target.checked })} />}
                  label="Implicit TLS (port 465). Unticked, the server must offer STARTTLS; plain text is never used."
                />
              )}

              <TextField
                label={preset.usernameLabel}
                value={form.username}
                onChange={(e) => update({ username: e.target.value })}
                required
                InputProps={{ readOnly: preset.username !== null }}
                helperText={preset.username !== null ? `Fixed for ${preset.label}` : undefined}
              />
              <TextField
                label={configured ? `Replace ${preset.secretLabel}` : preset.secretLabel}
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => update({ password: e.target.value })}
                required={!configured}
                helperText={
                  configured
                    ? `Stored key ends in …${settings?.passwordLast4}. Leave empty to keep it. The key is encrypted at rest and never shown again.`
                    : 'Encrypted at rest and never shown again, only its last four characters.'
                }
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="From address"
                  type="email"
                  value={form.fromAddress}
                  onChange={(e) => update({ fromAddress: e.target.value })}
                  required
                  fullWidth
                  helperText="On a domain verified at the provider, or nothing arrives"
                />
                <TextField
                  label="From name"
                  value={form.fromName}
                  onChange={(e) => update({ fromName: e.target.value })}
                  fullWidth
                  helperText="Defaults to the app name"
                />
              </Stack>
              <TextField
                label="Reply-to address (optional)"
                type="email"
                value={form.replyTo}
                onChange={(e) => update({ replyTo: e.target.value })}
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ pt: 1 }}>
                <Button type="submit" variant="contained" disabled={busy !== null || loading || (!dirty && configured)}>
                  {busy === 'save' ? 'Saving…' : 'Save settings'}
                </Button>
                <Button variant="outlined" onClick={test} disabled={busy !== null || loading || !configured || dirty}>
                  {busy === 'test' ? 'Sending…' : `Send test email to ${currentUser?.email ?? 'me'}`}
                </Button>
                {configured && (
                  <Button color="error" onClick={() => setConfirmRemove(true)} disabled={busy !== null} sx={{ ml: { sm: 'auto' } }}>
                    Remove settings
                  </Button>
                )}
              </Stack>
              {dirty && configured && (
                <Typography variant="caption" color="text.secondary">
                  Save the changes before sending a test.
                </Typography>
              )}
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
              Before the test will arrive
            </Typography>
            <Box component="ol" sx={{ pl: 2.5, m: 0 }}>
              {preset.checklist.map((step) => (
                <Typography component="li" variant="body2" key={step} sx={{ mb: 1 }}>
                  {step}
                </Typography>
              ))}
            </Box>
            {preset.docsUrl && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                <Link href={preset.docsUrl} target="_blank" rel="noreferrer">
                  {preset.label} SMTP documentation
                </Link>
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              An unverified from domain is the usual reason a saved key sends nothing. The test email goes to your own
              address and shows the provider&apos;s exact response when it fails.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              The key is encrypted with this deployment&apos;s auth secret. If that secret is ever rotated, enter the key
              again here.
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={confirmRemove} onClose={() => setConfirmRemove(false)}>
        <DialogTitle>Remove the email settings?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            The provider key is deleted and the app stops sending email. Password reset and sign in links are switched
            off on the users app until a provider is connected and verified again.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmRemove(false)} disabled={busy === 'remove'}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={remove} disabled={busy === 'remove'}>
            {busy === 'remove' ? 'Removing…' : 'Remove settings'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmailSettings;
