import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Box } from '@mui/material';
import { alpha } from '@mui/material/styles';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLayoutStore } from '@/store/layoutStore';
import { useUserStore } from '@/store/userStore';
import { canAccessPath } from '@/utils/systemAccess';

const DRAWER_WIDTH = 240;

// Add a page: a route in App.tsx, an entry here, and (for a scoped role) its path in utils/systemAccess.
const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Users', icon: <PeopleIcon />, path: '/users' },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarOpen } = useLayoutStore();
  const { currentUser } = useUserStore();
  // Scoped staff roles only see the pages they may open (see utils/systemAccess).
  const visibleItems = menuItems.filter((item) => canAccessPath(currentUser?.roles, item.path));
  // Nested routes keep their section highlighted.
  const isSelected = (path: string) =>
    location.pathname === path || (path !== '/' && location.pathname.startsWith(`${path}/`));

  return (
    <Drawer
      variant="persistent"
      open={sidebarOpen}
      sx={{
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ overflow: 'auto', mt: 10 }}>
        <List>
          {visibleItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={isSelected(item.path)}
                onClick={() => navigate(item.path)}
                sx={{
                  mx: 1,
                  borderRadius: 1,
                  '&.Mui-selected': {
                    backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.12),
                    '&:hover': {
                      backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.2),
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
