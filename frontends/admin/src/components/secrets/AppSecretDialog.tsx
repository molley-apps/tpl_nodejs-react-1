import { FormEvent, useEffect, useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from '@mui/material';
import { AdminSecret } from 'apis/api-mono/services/interfaces/AdminSecret';
import { AdminSecretsSecretKeyPutPut } from 'apis/api-mono/services/interfaces/AdminSecretsSecretKeyPutPut';
import { apiErrorMessage } from '@/utils/apiErrorMessage';
import { isValidSecretKey } from '@/utils/isValidSecretKey';

interface AppSecretDialogProps {
  open: boolean;
  /** The secret being edited, or null to create one. */
  secret: AdminSecret | null;
  onClose: () => void;
  onSave: (key: string, body: AdminSecretsSecretKeyPutPut) => Promise<void>;
}

/** Typed names become the stored form as they are typed: upper case, spaces and dashes to underscores. */
const normaliseKey = (raw: string): string => raw.toUpperCase().replace(/[\s-]+/g, '_').replace(/[^A-Z0-9_]/g, '');

/**
 * Create or edit one app secret. The name is fixed once created (the code reads the secret by it). The value is
 * never shown back: when editing, leaving it blank keeps the stored value and saves only the description.
 */
const AppSecretDialog = ({ open, secret, onClose, onSave }: AppSecretDialogProps) => {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const editing = secret !== null;

  useEffect(() => {
    if (open) {
      setKey(secret?.key ?? '');
      setValue('');
      setDescription(secret?.description ?? '');
      setError('');
    }
  }, [open, secret]);

  const keyError = key && !isValidSecretKey(key) ? 'Upper case letters, digits and underscores, starting with a letter, eg ANTHROPIC_API_KEY' : '';
  const canSubmit = isValidSecretKey(key) && (editing || value.trim().length > 0) && !submitting;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      await onSave(key, { value: value.trim() || undefined, description: description.trim() || undefined });
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save the secret'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <form onSubmit={submit}>
        <DialogTitle>{editing ? `Edit ${secret.key}` : 'Add a secret'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Name"
              value={key}
              onChange={(e) => setKey(normaliseKey(e.target.value))}
              disabled={editing || submitting}
              required
              autoFocus={!editing}
              error={!!keyError}
              helperText={keyError || 'How the code refers to it. It cannot be changed later.'}
              inputProps={{ spellCheck: false, autoCapitalize: 'characters' }}
            />
            <TextField
              label="Value"
              type="password"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={submitting}
              required={!editing}
              autoFocus={editing}
              autoComplete="off"
              helperText={
                editing
                  ? `Leave blank to keep the stored value${secret.valueLast4 ? ` (ending ${secret.valueLast4})` : ''}.`
                  : 'Stored encrypted. Only its last four characters are shown afterwards.'
              }
            />
            <TextField
              label="What it is for"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              inputProps={{ maxLength: 200 }}
              helperText="Optional, eg Anthropic API key used by the summariser"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={!canSubmit}>
            {submitting ? 'Saving…' : editing ? 'Save' : 'Add secret'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AppSecretDialog;
