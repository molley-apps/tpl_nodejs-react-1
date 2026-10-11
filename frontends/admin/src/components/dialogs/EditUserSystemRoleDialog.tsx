import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  FormControlLabel,
  Checkbox,
  FormGroup,
} from '@mui/material';
import AdminService from 'apis/api-mono/services/AdminService';
import { User } from 'apis/api-mono/services/interfaces/User';
import { Role } from 'apis/api-mono/services/interfaces/AdminUsersUserIdRolesPutPut';
import { SYSTEM_ROLE_INFO, roleLabel } from '@/utils/systemAccess';

interface EditUserSystemRoleDialogProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  onSuccess?: () => void;
}

const knownRoles = (roles: string[] | undefined): Role[] =>
  SYSTEM_ROLE_INFO.map((info) => info.role).filter((role) => (roles || []).includes(role));

const sameSet = (a: Role[], b: Role[]) => a.length === b.length && a.every((role) => b.includes(role));

// System roles are staff privileges. A user with none is a standard user.
const EditUserSystemRoleDialog = ({ open, onClose, user, onSuccess }: EditUserSystemRoleDialogProps) => {
  const [selected, setSelected] = useState<Role[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const current = knownRoles(user?.roles);

  // Reset to the user's current system roles each time the dialog opens
  useEffect(() => {
    if (open) {
      setSelected(knownRoles(user?.roles));
      setError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user?._id]);

  const toggle = (role: Role) =>
    setSelected((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));

  const handleSubmit = async () => {
    if (!user) return;

    setSubmitting(true);
    setError('');

    try {
      await AdminService.adminUsersUserIdRolesPut({ roles: selected }, { userId: user._id });
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to update system roles:', err);
      setError((err as { message?: string })?.message || 'Failed to update system roles');
    } finally {
      setSubmitting(false);
    }
  };

  const grantingSuperAdmin = selected.includes(Role.SuperAdmin) && !current.includes(Role.SuperAdmin);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit System Roles</DialogTitle>
      <DialogContent>
        {user && (
          <Box sx={{ mb: 2, mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              User: <strong>{user.email}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Current:{' '}
              <strong>{current.length === 0 ? 'Standard user' : current.map(roleLabel).join(', ')}</strong>
            </Typography>
          </Box>
        )}

        <Typography variant="body2" sx={{ mb: 1 }}>
          System roles are for staff only. Leave all unticked for a standard user with no system
          privileges.
        </Typography>

        <FormGroup>
          {SYSTEM_ROLE_INFO.map((info) => (
            <FormControlLabel
              key={info.role}
              control={
                <Checkbox
                  checked={selected.includes(info.role)}
                  onChange={() => toggle(info.role)}
                  disabled={submitting}
                />
              }
              label={
                <Box>
                  <Typography variant="body2">{info.label}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {info.description}
                  </Typography>
                </Box>
              }
              sx={{ alignItems: 'flex-start', mb: 1 }}
            />
          ))}
        </FormGroup>

        {grantingSuperAdmin && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            This grants full admin access to every user and all admin tooling.
          </Alert>
        )}

        {error && (
          <Typography color="error" variant="body2" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={sameSet(selected, current) || submitting}>
          {submitting ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditUserSystemRoleDialog;
