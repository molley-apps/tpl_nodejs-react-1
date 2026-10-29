/**
 * Whether a name is acceptable for an app secret: upper case letters, digits and underscores, 2 to 64 characters,
 * starting with a letter (eg ANTHROPIC_API_KEY). Mirrors the API's pathSecretKey pattern.
 */
export const isValidSecretKey = (key: string): boolean => /^[A-Z][A-Z0-9_]{1,63}$/.test(key);
