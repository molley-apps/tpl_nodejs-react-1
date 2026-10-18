import cronstrue from 'cronstrue';

/** "15 3 * * *" → "At 03:15 AM"; an unparseable expression gives an empty string so the field can show its own error. */
export const describeCron = (cron: string): string => {
  try {
    return cronstrue.toString(cron.trim(), { use24HourTimeFormat: true });
  } catch {
    return '';
  }
};
