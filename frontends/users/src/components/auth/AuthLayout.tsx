import { ReactNode } from 'react';
import config from '@/config';

interface AuthLayoutProps {
  title: string;
  intro?: string;
  children: ReactNode;
  /** Links shown under the form, eg "Forgot your password?" */
  footer?: ReactNode;
}

/**
 * The card every auth screen renders inside: product name, a heading, the
 * form, and the links to the other screens.
 */
export default function AuthLayout({ title, intro, children, footer }: AuthLayoutProps) {
  return (
    <div className="centered-screen">
      <section className="card auth-card" aria-labelledby="auth-title">
        <div className="auth-card__brand">{config.app.name}</div>
        <h1 id="auth-title" className="auth-card__title">
          {title}
        </h1>
        {intro && <p className="auth-card__intro">{intro}</p>}
        {children}
        {footer && <div className="auth-card__footer">{footer}</div>}
      </section>
    </div>
  );
}
