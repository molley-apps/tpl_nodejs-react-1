import { Box, Typography, Paper, Card, CardActionArea, CardContent, Grid } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import EmailIcon from '@mui/icons-material/Email';
import { useNavigate } from 'react-router-dom';
import config from '@/config';
import { useUserStore } from '@/store/userStore';
import { roleLabel } from '@/utils/systemAccess';

/**
 * Landing page of the console. A blank canvas on purpose: add a card per
 * area as the product grows one (each card is a route in App.tsx and an
 * entry in the sidebar).
 */
const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useUserStore();

  const areas = [
    {
      title: 'Users',
      description: 'Everyone with an account: search, system roles, active sessions, deletion.',
      icon: <PeopleIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      path: '/users',
    },
    {
      title: 'Email',
      description: 'Connect your own email provider so the app can send password resets and notifications.',
      icon: <EmailIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      path: '/settings/email',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {areas.map((area) => (
          <Grid item xs={12} sm={6} md={4} key={area.path}>
            <Card>
              <CardActionArea onClick={() => navigate(area.path)}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {area.icon}
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {area.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {area.description}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ mt: 4, p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Welcome to the {config.app.name} admin console
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {currentUser
            ? `You are signed in as ${currentUser.email} (${
                currentUser.roles.length ? currentUser.roles.map(roleLabel).join(', ') : 'no system role'
              }).`
            : 'Loading your account…'}{' '}
          Use the sidebar to move between sections.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Dashboard;
