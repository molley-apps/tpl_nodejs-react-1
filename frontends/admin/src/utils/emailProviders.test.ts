import { describe, expect, it } from 'vitest';
import { Provider } from 'apis/api-mono/services/interfaces/AdminSettingsEmailPutPut';
import { EMAIL_PROVIDERS, emailProviderPreset } from './emailProviders';

describe('emailProviders', () => {
  it('offers every provider of the API enum exactly once', () => {
    expect(EMAIL_PROVIDERS.map((preset) => preset.provider).sort()).toEqual(Object.values(Provider).sort());
  });

  it('uses TLS ports only and a fixed login where the provider has one', () => {
    for (const preset of EMAIL_PROVIDERS) {
      expect([465, 587]).toContain(preset.port);
    }
    expect(emailProviderPreset(Provider.Resend)).toMatchObject({ host: 'smtp.resend.com', port: 465, username: 'resend' });
    expect(emailProviderPreset(Provider.Brevo).username).toBeNull();
  });

  it('falls back to the first preset for an unknown or missing provider', () => {
    expect(emailProviderPreset(undefined)).toBe(EMAIL_PROVIDERS[0]);
    expect(emailProviderPreset('pigeon')).toBe(EMAIL_PROVIDERS[0]);
  });
});
