## Running the API tests (`apis/api-mono/api`)

Tests use `ts-jest` with full project type-checking + always-on coverage, so
each Jest worker is heavy on CPU and RAM. Follow these rules to avoid maxing out
the machine:

- **Always run from `apis/api-mono/api`.**
- **Always pass `--runInBand`** when running tests manually — this forces a
  single worker process. Do NOT run bare `npm run jest` / `npx jest` or use
  `-t` without `--runInBand`: Jest then fans out to multiple `ts-jest` workers
  (each type-checks the whole project) and saturates every core.
- **Pass `--collectCoverage false`** unless you specifically need coverage — it
  removes the instrumentation overhead and is much faster.

Subset / fast feedback (preferred while iterating):
```bash
ENVIRONMENT=test npm run jest -- --collectCoverage false --runInBand \
  src/services/__tests__/SomeService.test.ts
```

Full gate (mirrors CI — lint + entire unit suite, already `--runInBand`):
```bash
npm test
```

Note: `jest.config.js` caps `maxWorkers` to `25%` so even an accidental parallel
run won't saturate the box. `isolatedModules` cannot be enabled (it breaks the
DB/typegoose tests), which is why the type-checking overhead is unavoidable.
