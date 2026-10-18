import { describe, expect, it } from 'vitest';
import { apiErrorMessage } from './apiErrorMessage';

describe('apiErrorMessage', () => {
  it('prefers the specific body string the API puts on an HttpException', () => {
    const error = { response: { data: { message: 'Bad Request', body: 'A password or API key is required' } } };
    expect(apiErrorMessage(error, 'fallback')).toBe('A password or API key is required');
  });

  it('reads the first celebrate validation detail', () => {
    const error = { response: { data: { body: { details: [{ message: '"fromAddress" must be a valid email' }] } } } };
    expect(apiErrorMessage(error, 'fallback')).toBe('"fromAddress" must be a valid email');
  });

  it('falls back to the generic message, then the error message, then the default', () => {
    expect(apiErrorMessage({ response: { data: { message: 'Forbidden' } } }, 'fallback')).toBe('Forbidden');
    expect(apiErrorMessage(new Error('Network Error'), 'fallback')).toBe('Network Error');
    expect(apiErrorMessage(undefined, 'fallback')).toBe('fallback');
  });
});
