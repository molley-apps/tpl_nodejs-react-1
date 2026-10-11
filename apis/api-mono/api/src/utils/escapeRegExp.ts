/**
 * Escape a string so it matches literally inside a RegExp (for user-typed search terms).
 */
export const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
