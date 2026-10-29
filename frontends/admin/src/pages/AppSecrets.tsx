import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/EditOutlined';
import { AdminSecret } from 'apis/api-mono/services/interfaces/AdminSecret';
import AppSecretDialog from '@/components/secrets/AppSecretDialog';
import { useAppSecretsStore } from '@/store/appSecretsStore';
import { apiErrorMessage } from '@/utils/apiErrorMessage';
import { relativeTime } from '@/utils/relativeTime';

/**
 * App secrets: the API keys and tokens for outside services the app integrates with, saved by the administrator
 * and read by the code by name (AppSecretsService.get). Values are stored encrypted and never shown again.
 * API: GET /admin/secrets, PUT and DELETE /admin/secrets/{secretKey}.
 */
const AppSecrets = () => {
  const { secrets, loading, fetchSecrets, saveSecret, removeSecret } = useAppSecretsStore();
  const [editing, setEditing] = useState<AdminSecret | null | undefined>(undefined);
  const [removing, setRemoving] = useState<AdminSecret | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSecrets();
  }, [fetchSecrets]);

  const confirmRemove = async () => {
    if (!removing) return;
    setBusy(true);
    setError('');
    try {
      await removeSecret(removing.key);
      setRemoving(null);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not remove the secret'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2} sx={{ mb: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          App secrets
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditing(null)}>
          Add secret
        </Button>
      </Stack>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        API keys and tokens for the outside services this app uses, such as an AI provider or a payment processor.
        Each is stored encrypted and read by the app when needed, so a new value applies straight away. Only the last
        four characters are ever shown again.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading && secrets.length === 0 ? (
        <CircularProgress />
      ) : secrets.length === 0 ? (
        <Alert severity="info">
          No secrets yet. When a feature needs a key from an outside service, it tells you which name to add here.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>What it is for</TableCell>
                <TableCell>Value</TableCell>
                <TableCell>Updated</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {secrets.map((secret) => (
                <TableRow key={secret.key} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{secret.key}</TableCell>
                  <TableCell>{secret.description || <Typography color="text.disabled">—</Typography>}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{`••••••••${secret.valueLast4}`}</TableCell>
                  <TableCell>{relativeTime(secret.updatedAt)}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Change the value or description">
                      <IconButton size="small" onClick={() => setEditing(secret)} aria-label={`Edit ${secret.key}`}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Remove">
                      <IconButton size="small" onClick={() => setRemoving(secret)} aria-label={`Remove ${secret.key}`}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <AppSecretDialog
        open={editing !== undefined}
        secret={editing ?? null}
        onClose={() => setEditing(undefined)}
        onSave={async (key, body) => {
          await saveSecret(key, body);
        }}
      />

      <Dialog open={removing !== null} onClose={busy ? undefined : () => setRemoving(null)}>
        <DialogTitle>Remove {removing?.key}?</DialogTitle>
        <DialogContent>
          <Typography>
            Any feature that needs this secret will stop working until it is added again. The value cannot be
            recovered from here.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoving(null)} disabled={busy}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={confirmRemove} disabled={busy}>
            {busy ? 'Removing…' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AppSecrets;
