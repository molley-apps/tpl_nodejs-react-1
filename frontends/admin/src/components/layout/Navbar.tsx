import { useEffect, useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import { useColorScheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LogoutIcon from '@mui/icons-material/Logout';
import { AuthService } from 'services';
import config from '@/config';
import { useLayoutStore } from '@/store/layoutStore';
import { useUserStore } from '@/store/userStore';

const Navbar = () => {
  const { toggleSidebar } = useLayoutStore();
  const { mode, setMode } = useColorScheme();
  const { currentUser, fetchCurrentUser } = useUserStore();

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // User menu state
  const [userAnchorEl, setUserAnchorEl] = useState<null | HTMLElement>(null);
  const userMenuOpen = Boolean(userAnchorEl);

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserAnchorEl(null);
  };

  // Better Auth sign out (POST /api/auth/sign-out) through the shared client, then back to the users app sign in
  const handleLogout = async () => {
    await AuthService.logout();
    window.location.href = '/users/';
  };

  const toggleDarkMode = () => {
    setMode(mode === 'light' ? 'dark' : 'light');
  };

  const getUserInitials = () => {
    if (!currentUser) return '?';
    if (currentUser.firstName && currentUser.lastName) {
      return `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase();
    }
    if (currentUser.name) {
      const parts = currentUser.name.split(' ');
      return parts.length > 1
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : parts[0][0].toUpperCase();
    }
    return currentUser.email?.[0]?.toUpperCase() || '?';
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="toggle sidebar"
          edge="start"
          onClick={toggleSidebar}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700 }}>
            {config.app.name}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              px: 1,
              py: 0.5,
              borderRadius: 1,
              fontWeight: 600,
              fontSize: '0.7rem',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            Admin
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {/* User Menu */}
        <IconButton
          color="inherit"
          onClick={handleUserMenuOpen}
          aria-label="user menu"
          aria-controls={userMenuOpen ? 'user-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={userMenuOpen ? 'true' : undefined}
          sx={{ mr: 1 }}
        >
          <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>{getUserInitials()}</Avatar>
        </IconButton>
        <Menu
          id="user-menu"
          anchorEl={userAnchorEl}
          open={userMenuOpen}
          onClose={handleUserMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{
            paper: { sx: { minWidth: 220 } }
          }}
        >
          {/* User Info Header */}
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {currentUser?.name || `${currentUser?.firstName} ${currentUser?.lastName}`}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {currentUser?.email}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Sign out</ListItemText>
          </MenuItem>
        </Menu>

        <IconButton
          color="inherit"
          onClick={toggleDarkMode}
          aria-label="toggle dark mode"
          title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {mode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
