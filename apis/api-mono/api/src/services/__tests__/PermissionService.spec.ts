import express from 'express';
import PermissionService from '@/services/PermissionService';
import { ForbiddenException } from '@/http/nodegen/errors';
import NodegenRequest from '@/http/interfaces/NodegenRequest';

const run = (permission: string, userRoles: string[] | undefined): unknown => {
  const req = {
    sessionData: userRoles ? { userId: 'u1', sessionId: 's1', user: {}, userRoles } : undefined,
  } as unknown as NodegenRequest;
  let result: unknown = 'not called';
  PermissionService.middleware(req, {} as express.Response, (err?: unknown) => (result = err), permission);
  return result;
};

describe('PermissionService', () => {
  it('lets any signed in user call non-admin routes', () => {
    expect(run('apiUserCurrentRead', [])).toBeUndefined();
  });

  it('lets a SUPER_ADMIN call admin routes', () => {
    expect(run('apiAdminUsersRead', ['SUPER_ADMIN'])).toBeUndefined();
  });

  it('refuses admin routes to a user without the role', () => {
    expect(run('apiAdminUsersUserIdDelete', [])).toBeInstanceOf(ForbiddenException);
  });

  it('refuses admin routes when there is no session at all', () => {
    expect(run('apiAdminUsersRead', undefined)).toBeInstanceOf(ForbiddenException);
  });

  it('recognises every admin permission code by its prefix', () => {
    expect(PermissionService.isAdminPermission('apiAdminUsersUserIdSessionsRead')).toBe(true);
    expect(PermissionService.isAdminPermission('apiUserCurrentUpdate')).toBe(false);
  });
});
