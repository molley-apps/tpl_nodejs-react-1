import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import { useUserStore } from '@/store/userStore';
import { canAccessPath, homePathFor } from '@/utils/systemAccess';

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Users = lazy(() => import('./pages/Users'));
const EmailSettings = lazy(() => import('./pages/EmailSettings'));
const Schedules = lazy(() => import('./pages/Schedules'));
const AppSecrets = lazy(() => import('./pages/AppSecrets'));

/**
 * Scoped staff roles may only open their own pages. Anything else bounces to
 * the first page they are allowed to see. The API enforces the same split;
 * this just keeps the console tidy.
 */
const RoleGate = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, fetchCurrentUser } = useUserStore();
  const location = useLocation();

  useEffect(() => {
    if (!currentUser) fetchCurrentUser();
  }, [currentUser, fetchCurrentUser]);

  if (!currentUser) return <div>Loading...</div>;
  if (!canAccessPath(currentUser.roles, location.pathname)) {
    return <Navigate to={homePathFor(currentUser.roles)} replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <MainLayout>
      <Suspense fallback={<div>Loading...</div>}>
        <RoleGate>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/settings/email" element={<EmailSettings />} />
            <Route path="/schedules" element={<Schedules />} />
            <Route path="/settings/secrets" element={<AppSecrets />} />
          </Routes>
        </RoleGate>
      </Suspense>
    </MainLayout>
  );
}

export default App;
