import { Box } from '@mui/material';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useLayoutStore } from '@/store/layoutStore';

interface MainLayoutProps {
  children: React.ReactNode;
}

const DRAWER_WIDTH = 240;

const MainLayout = ({ children }: MainLayoutProps) => {
  const { sidebarOpen } = useLayoutStore();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Navbar />
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          ml: sidebarOpen ? `${DRAWER_WIDTH}px` : 0,
          transition: (theme) =>
            theme.transitions.create(['margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
          backgroundColor: 'background.default',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;
