import { describe, it, expect } from 'vitest';
import HttpService from './HttpService';

describe('HttpService', () => {
  describe('injectParamsToPath', () => {
    it('replaces single parameter in path', () => {
      const result = HttpService.injectParamsToPath(
        { userId: '123' },
        '/users/:userId'
      );
      expect(result).toBe('/users/123');
    });

    it('replaces multiple parameters in path', () => {
      const result = HttpService.injectParamsToPath(
        { companyId: 'abc', userId: '123' },
        '/companies/:companyId/users/:userId'
      );
      expect(result).toBe('/companies/abc/users/123');
    });

    it('handles empty params object', () => {
      const result = HttpService.injectParamsToPath({}, '/users/:userId');
      expect(result).toBe('/users/:userId');
    });

    it('handles undefined params', () => {
      const result = HttpService.injectParamsToPath(undefined, '/users/:userId');
      expect(result).toBe('/users/:userId');
    });

    it('handles path with no parameters', () => {
      const result = HttpService.injectParamsToPath(
        { userId: '123' },
        '/users/list'
      );
      expect(result).toBe('/users/list');
    });

    it('handles numeric parameter values', () => {
      const result = HttpService.injectParamsToPath(
        { page: 1, limit: 10 },
        '/items?page=:page&limit=:limit'
      );
      expect(result).toBe('/items?page=1&limit=10');
    });

    it('replaces only matching parameters', () => {
      const result = HttpService.injectParamsToPath(
        { userId: '123' },
        '/companies/:companyId/users/:userId'
      );
      expect(result).toBe('/companies/:companyId/users/123');
    });
  });

  describe('isLogoutRoute', () => {
    it('returns true for logout route', () => {
      expect(HttpService.isLogoutRoute('/api/auth/sign-out')).toBe(true);
    });

    it('returns true for logout route with base URL', () => {
      expect(HttpService.isLogoutRoute('https://api.example.com/api/auth/sign-out')).toBe(true);
    });

    it('returns true for logout route with query params', () => {
      expect(HttpService.isLogoutRoute('/api/auth/sign-out?redirect=/')).toBe(true);
    });

    it('returns false for login route', () => {
      expect(HttpService.isLogoutRoute('/api/auth/sign-in/email')).toBe(false);
      expect(HttpService.isLogoutRoute('/auth/logout')).toBe(false);
    });

    it('returns false for other routes', () => {
      expect(HttpService.isLogoutRoute('/users/123')).toBe(false);
      expect(HttpService.isLogoutRoute('/api/data')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(HttpService.isLogoutRoute('')).toBe(false);
    });

    it('returns false for partial match (logout in different context)', () => {
      expect(HttpService.isLogoutRoute('/users/sign-out-history')).toBe(false);
    });
  });
});
