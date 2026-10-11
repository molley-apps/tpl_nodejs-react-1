// set jest values and setup any test settings here
process.env.AUTH_SECRET = process.env.AUTH_SECRET || 'test-only-secret-that-is-at-least-32-characters-long';
process.env.AUTH_BASE_URL = process.env.AUTH_BASE_URL || '';

// The app's logger bootstrap (src/http/nodegen/utils/logger.ts) adds console.verbose at runtime.
// It is not loaded under jest, so give the services that log through it a silent stand-in.
console.verbose = console.verbose || (() => {});
