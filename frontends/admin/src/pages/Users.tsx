import { Fragment, useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
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
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AdminService from 'apis/api-mono/services/AdminService';
import { User } from 'apis/api-mono/services/interfaces/User';
import { AdminSession } from 'apis/api-mono/services/interfaces/AdminSession';
import EditUserSystemRoleDialog from '@/components/dialogs/EditUserSystemRoleDialog';
import UserFilters from '@/components/users/UserFilters';
import { relativeTime } from '@/utils/relativeTime';
import { roleLabel } from '@/utils/systemAccess';

/**
 * Everyone with an account. Accounts are created by sign up (Better Auth), so
 * this page only reads, grants system roles, revokes sessions and deletes.
 *
 * API contract (see README): GET /admin/users, PUT /admin/users/{userId}/roles,
 * GET and DELETE /admin/users/{userId}/sessions, DELETE /admin/users/{userId}.
 */
const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | null>(null);

  const [roleDialogUser, setRoleDialogUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [userSessions, setUserSessions] = useState<Map<string, AdminSession[]>>(new Map());
  const [loadingSessions, setLoadingSessions] = useState<string | null>(null);

  // Debounce the search box so typing does not fire a request per keystroke
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const result = await AdminService.adminUsersGet({
        offset: page * rowsPerPage,
        limit: rowsPerPage,
        search: debouncedSearch || undefined,
        role: roleFilter || undefined,
      });
      setUsers(result?.data ?? []);
      setTotalCount(result?.meta?.totalResultCount ?? 0);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearch, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Back to the first page whenever the filters change
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, roleFilter]);

  const toggleSessions = async (userId: string) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      return;
    }
    setExpandedUserId(userId);
    if (userSessions.has(userId)) return;

    setLoadingSessions(userId);
    try {
      const sessions = await AdminService.adminUsersUserIdSessionsGet({ userId });
      setUserSessions((prev) => new Map(prev).set(userId, sessions ?? []));
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      setUserSessions((prev) => new Map(prev).set(userId, []));
    } finally {
      setLoadingSessions(null);
    }
  };

  const revokeSessions = async (userId: string) => {
    try {
      await AdminService.adminUsersUserIdSessionsDelete({ userId });
      setUserSessions((prev) => new Map(prev).set(userId, []));
    } catch (error) {
      console.error('Failed to revoke sessions:', error);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await AdminService.adminUsersUserIdDelete({ userId: deleteTarget._id });
      setDeleteTarget(null);
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
        Users
      </Typography>

      <UserFilters
        search={search}
        onSearchChange={setSearch}
        roleFilter={roleFilter}
        onRoleChange={setRoleFilter}
        matchingCount={totalCount}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>System roles</TableCell>
              <TableCell>Joined</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No users match.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const isExpanded = expandedUserId === user._id;
                const sessions = userSessions.get(user._id) ?? [];
                return (
                  <Fragment key={user._id}>
                    <TableRow hover>
                      <TableCell padding="checkbox">
                        <Tooltip title={isExpanded ? 'Hide sessions' : 'Show sessions'}>
                          <IconButton size="small" onClick={() => toggleSessions(user._id)}>
                            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{user.name || `${user.firstName} ${user.lastName}`}</Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="body2">{user.email}</Typography>
                          {!user.emailVerified && <Chip label="Unverified" size="small" color="warning" variant="outlined" />}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        {user.roles.length === 0 ? (
                          <Typography variant="body2" color="text.secondary">
                            Standard user
                          </Typography>
                        ) : (
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                            {user.roles.map((role) => (
                              <Chip key={role} label={roleLabel(role)} size="small" color="primary" />
                            ))}
                          </Stack>
                        )}
                      </TableCell>
                      <TableCell>
                        <Tooltip title={new Date(user.createdAt).toLocaleString()}>
                          <Typography variant="body2">{relativeTime(user.createdAt)}</Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit system roles">
                          <IconButton size="small" onClick={() => setRoleDialogUser(user)}>
                            <AdminPanelSettingsIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete user">
                          <IconButton size="small" color="error" onClick={() => setDeleteTarget(user)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={6} sx={{ py: 0, borderBottom: isExpanded ? undefined : 'none' }}>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Box sx={{ py: 2 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                              <Typography variant="subtitle2">Active sessions</Typography>
                              <Button
                                size="small"
                                color="error"
                                disabled={sessions.length === 0}
                                onClick={() => revokeSessions(user._id)}
                              >
                                Sign out everywhere
                              </Button>
                            </Stack>
                            {loadingSessions === user._id ? (
                              <CircularProgress size={20} />
                            ) : sessions.length === 0 ? (
                              <Typography variant="body2" color="text.secondary">
                                No active sessions.
                              </Typography>
                            ) : (
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Signed in</TableCell>
                                    <TableCell>Last active</TableCell>
                                    <TableCell>Expires</TableCell>
                                    <TableCell>IP</TableCell>
                                    <TableCell>Browser</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {sessions.map((session) => (
                                    <TableRow key={session._id}>
                                      <TableCell>{new Date(session.createdAt).toLocaleString()}</TableCell>
                                      <TableCell>
                                        {relativeTime(session.updatedAt)}
                                      </TableCell>
                                      <TableCell>{new Date(session.expiresAt).toLocaleString()}</TableCell>
                                      <TableCell>{session.ipAddress || '—'}</TableCell>
                                      <TableCell sx={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {session.userAgent || '—'}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            )}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </TableContainer>

      <EditUserSystemRoleDialog
        open={roleDialogUser !== null}
        onClose={() => setRoleDialogUser(null)}
        user={roleDialogUser}
        onSuccess={fetchUsers}
      />

      <Dialog open={deleteTarget !== null} onClose={() => !deleting && setDeleteTarget(null)}>
        <DialogTitle>Delete user</DialogTitle>
        <DialogContent>
          <Typography>
            Delete <strong>{deleteTarget?.email}</strong>? Their account and sessions are removed; this cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained" disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;
