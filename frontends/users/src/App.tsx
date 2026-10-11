import { AuthService } from 'services';
import Greeting from './components/Greeting';
import AuthGate from './components/auth/AuthGate';
import config from './config';

function Shell() {
  const { data: session } = AuthService.auth.useSession();

  return (
    <>
      <header className="app-header">
        <h1 className="app-header__title">{config.app.name}</h1>
        <span className="app-header__user">{session?.user.name || session?.user.email}</span>
        <button type="button" className="btn" onClick={() => AuthService.logout()}>
          Sign out
        </button>
      </header>
      <main className="app-main">
        <Greeting />
      </main>
    </>
  );
}

function App() {
  return (
    <AuthGate>
      <Shell />
    </AuthGate>
  );
}

export default App;
