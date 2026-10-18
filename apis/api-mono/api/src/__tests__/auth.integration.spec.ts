import express from 'express';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import http from '@/http';
import { buildHttpOptions } from '@/utils/buildHttpOptions';
import AuthEmailService from '@/services/AuthEmailService';
import EmailService from '@/services/EmailService';
import { SYSTEM_SUPER_ADMIN } from '@/constants/ROLES';

jest.mock('@/services/AuthEmailService', () => ({
  __esModule: true,
  default: {
    sendPasswordReset: jest.fn().mockResolvedValue(undefined),
    sendEmailVerification: jest.fn().mockResolvedValue(undefined),
    sendMagicLink: jest.fn().mockResolvedValue(undefined),
  },
}));

// Email is "configured" unless a test says otherwise; the real resolution is covered by EmailService.spec.ts
jest.mock('@/services/EmailService', () => ({
  __esModule: true,
  default: { isEnabled: jest.fn().mockResolvedValue(true) },
}));

/**
 * End to end through the generated http layer: Better Auth routes, the session middleware, the OpenAPI generated
 * /api/user/current routes reading the Better Auth user documents, and the frontend routing decisions that need
 * no bucket (redirects and the 403 page).
 */
describe('Authentication (integration)', () => {
  let mongod: MongoMemoryServer;
  let app: express.Application;

  const ada = {
    name: 'Ada Lovelace',
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    password: 'correct-horse-battery-staple',
  };

  const cookiesOf = (res: request.Response): string => {
    const setCookie = res.headers['set-cookie'] as unknown as string[] | undefined;
    return (setCookie || []).map((cookie) => cookie.split(';')[0]).join('; ');
  };

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri('api-mono'));
    app = (await http(0, buildHttpOptions())).expressApp;
  }, 180000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  it('serves the public health route without a session', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.http).toBe(true);
  });

  it('reports ready once mongo is connected', async () => {
    const res = await request(app).get('/readyz');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ready: true, mongoConnected: true });
  });

  it('rejects protected routes without a session', async () => {
    const res = await request(app).get('/api/user/current');
    expect(res.status).toBe(401);
  });

  it('serves the public capabilities route without a session', async () => {
    const res = await request(app).get('/api/capabilities');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ email: true });
  });

  describe('cookie session (browser clients)', () => {
    let cookies: string;

    it('signs up, stores the user in mongo and returns a session cookie', async () => {
      const res = await request(app).post('/api/auth/sign-up/email').send(ada);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(ada.email);
      cookies = cookiesOf(res);
      expect(cookies).toContain('better-auth.session_token=');
      expect(AuthEmailService.sendEmailVerification).toHaveBeenCalledTimes(1);

      const stored = await mongoose.connection.collection('users').findOne({ email: ada.email });
      expect(stored).toMatchObject({ firstName: 'Ada', lastName: 'Lovelace', roles: [], emailVerified: false });
      expect(typeof stored?._id).toBe('string');
    });

    it('reads the current user through the generated route', async () => {
      const res = await request(app).get('/api/user/current').set('Cookie', cookies);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ email: ada.email, firstName: 'Ada', lastName: 'Lovelace', roles: [] });
      expect(res.body._id).toEqual(expect.any(String));
    });

    it('updates the current user through the generated route', async () => {
      const res = await request(app)
        .put('/api/user/current')
        .set('Cookie', cookies)
        .send({ firstName: 'Augusta', lastName: 'King', name: 'Augusta King' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ firstName: 'Augusta', lastName: 'King', name: 'Augusta King' });

      const session = await request(app).get('/api/auth/get-session').set('Cookie', cookies);
      expect(session.body.user.name).toBe('Augusta King');
    });

    it('rejects a duplicate sign up for the same email', async () => {
      const res = await request(app).post('/api/auth/sign-up/email').send(ada);
      expect(res.status).toBe(422);
    });

    describe('frontend apps', () => {
      it('sends the bare root to the users app', async () => {
        const res = await request(app).get('/');
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/users/');
      });

      it('canonicalizes the bare app prefix', async () => {
        const res = await request(app).get('/users?tab=home');
        expect(res.status).toBe(301);
        expect(res.headers.location).toBe('/users/?tab=home');
      });

      it('sends an anonymous visitor of the admin app to sign in', async () => {
        const res = await request(app).get('/admin/people');
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/users/?returnTo=%2Fadmin%2Fpeople');
      });

      it('403s a signed in user without a system role', async () => {
        const res = await request(app).get('/admin/').set('Cookie', cookies);
        expect(res.status).toBe(403);
        expect(res.headers['content-type']).toContain('text/html');
        expect(res.text).toContain(ada.email);
      });

      it('lets a user with a system role through to the app assets', async () => {
        await mongoose.connection
          .collection('users')
          .updateOne({ email: ada.email }, { $set: { roles: [SYSTEM_SUPER_ADMIN] } });

        // Not NODE_ENV=local, so the asset is looked up in the (unconfigured) bucket: anything but a redirect
        // or 403 proves the gate opened.
        const res = await request(app).get('/admin/').set('Cookie', cookies);
        expect([302, 403]).not.toContain(res.status);

        await mongoose.connection.collection('users').updateOne({ email: ada.email }, { $set: { roles: [] } });
      });
    });

    describe('admin users API', () => {
      const bob = {
        name: 'Bob Byte',
        firstName: 'Bob',
        lastName: 'Byte',
        email: 'bob@example.com',
        password: 'another-long-password',
      };
      let bobId: string;
      let bobCookies: string;
      let adaId: string;

      const grantAda = (roles: string[]) =>
        mongoose.connection.collection('users').updateOne({ email: ada.email }, { $set: { roles } });

      beforeAll(async () => {
        const signUp = await request(app).post('/api/auth/sign-up/email').send(bob);
        bobId = signUp.body.user.id;
        bobCookies = cookiesOf(signUp);
        const me = await request(app).get('/api/user/current').set('Cookie', cookies);
        adaId = me.body._id;
      });

      afterAll(() => grantAda([]));

      it('refuses every admin route to a user without SUPER_ADMIN', async () => {
        const res = await request(app).get('/api/admin/users').set('Cookie', cookies);
        expect(res.status).toBe(403);
      });

      it('lists and searches users for a SUPER_ADMIN', async () => {
        await grantAda([SYSTEM_SUPER_ADMIN]);

        const all = await request(app).get('/api/admin/users').set('Cookie', cookies);
        expect(all.status).toBe(200);
        expect(all.body.meta.totalResultCount).toBe(2);
        expect(all.body.data.map((u: { email: string }) => u.email).sort()).toEqual([ada.email, bob.email]);

        const found = await request(app).get('/api/admin/users?search=BOB').set('Cookie', cookies);
        expect(found.body.data).toHaveLength(1);
        expect(found.body.data[0].email).toBe(bob.email);

        const admins = await request(app).get('/api/admin/users?role=SUPER_ADMIN').set('Cookie', cookies);
        expect(admins.body.data.map((u: { email: string }) => u.email)).toEqual([ada.email]);
      });

      it("sets and clears another user's system roles", async () => {
        const grant = await request(app)
          .put(`/api/admin/users/${bobId}/roles`)
          .set('Cookie', cookies)
          .send({ roles: ['SUPER_ADMIN'] });
        expect(grant.status).toBe(200);
        expect(grant.body.roles).toEqual(['SUPER_ADMIN']);

        const clear = await request(app)
          .put(`/api/admin/users/${bobId}/roles`)
          .set('Cookie', cookies)
          .send({ roles: [] });
        expect(clear.body.roles).toEqual([]);
      });

      it('rejects a role the spec does not know', async () => {
        const res = await request(app)
          .put(`/api/admin/users/${bobId}/roles`)
          .set('Cookie', cookies)
          .send({ roles: ['OVERLORD'] });
        expect(res.status).toBe(422);
      });

      it('will not let the admin drop their own SUPER_ADMIN role', async () => {
        const res = await request(app)
          .put(`/api/admin/users/${adaId}/roles`)
          .set('Cookie', cookies)
          .send({ roles: [] });
        expect(res.status).toBe(403);
      });

      it("shows a user's sessions without the token and can revoke them", async () => {
        const list = await request(app).get(`/api/admin/users/${bobId}/sessions`).set('Cookie', cookies);
        expect(list.status).toBe(200);
        expect(list.body.length).toBeGreaterThanOrEqual(1);
        expect(list.body[0].userId).toBe(bobId);
        expect(list.body[0].token).toBeUndefined();

        const revoke = await request(app).delete(`/api/admin/users/${bobId}/sessions`).set('Cookie', cookies);
        expect(revoke.status).toBe(200);

        const bobAfter = await request(app).get('/api/user/current').set('Cookie', bobCookies);
        expect(bobAfter.status).toBe(401);
      });

      it('will not let the admin delete their own account', async () => {
        const res = await request(app).delete(`/api/admin/users/${adaId}`).set('Cookie', cookies);
        expect(res.status).toBe(403);
      });

      it('deletes another user with their credentials', async () => {
        const res = await request(app).delete(`/api/admin/users/${bobId}`).set('Cookie', cookies);
        expect(res.status).toBe(200);

        expect(await mongoose.connection.collection('users').findOne({ _id: bobId as never })).toBeNull();
        expect(await mongoose.connection.collection('accounts').findOne({ userId: bobId })).toBeNull();

        const signIn = await request(app)
          .post('/api/auth/sign-in/email')
          .send({ email: bob.email, password: bob.password });
        expect(signIn.status).toBe(401);
      });
    });

    it('ends the session on sign out', async () => {
      const out = await request(app).post('/api/auth/sign-out').set('Cookie', cookies).send({});
      expect(out.status).toBe(200);

      const res = await request(app).get('/api/user/current').set('Cookie', cookies);
      expect(res.status).toBe(401);
    });
  });

  describe('bearer session (native and CLI clients)', () => {
    it('signs in, receives a token header and uses it as a bearer token', async () => {
      const signIn = await request(app)
        .post('/api/auth/sign-in/email')
        .send({ email: ada.email, password: ada.password });

      expect(signIn.status).toBe(200);
      const token = signIn.headers['set-auth-token'];
      expect(token).toEqual(expect.any(String));

      const res = await request(app).get('/api/user/current').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.email).toBe(ada.email);
    });

    it('rejects a wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/sign-in/email')
        .send({ email: ada.email, password: 'not-the-password' });
      expect(res.status).toBe(401);
    });
  });

  describe('password reset', () => {
    it('asks the email service to send the reset link', async () => {
      const res = await request(app)
        .post('/api/auth/request-password-reset')
        .send({ email: ada.email, redirectTo: 'http://localhost:8080/users/reset-password' });

      expect(res.status).toBe(200);
      expect(AuthEmailService.sendPasswordReset).toHaveBeenCalledWith(
        expect.objectContaining({ email: ada.email }),
        expect.stringContaining('/api/auth/reset-password/'),
      );
    });

    it('answers 409 EMAIL_NOT_CONFIGURED instead of pretending to send while email is off', async () => {
      (EmailService.isEnabled as jest.Mock).mockResolvedValueOnce(false);
      (AuthEmailService.sendPasswordReset as jest.Mock).mockClear();

      const res = await request(app)
        .post('/api/auth/request-password-reset')
        .send({ email: ada.email, redirectTo: 'http://localhost:8080/users/reset-password' });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('EMAIL_NOT_CONFIGURED');
      expect(AuthEmailService.sendPasswordReset).not.toHaveBeenCalled();
    });
  });
});
