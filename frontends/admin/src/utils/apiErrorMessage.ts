/**
 * The most specific text from a failed API call. The API's HttpException puts the reason in `body` (a string or a
 * validation object) and the generic status text in `message`; axios wraps the response under `response.data`.
 */
export const apiErrorMessage = (error: unknown, fallback: string): string => {
  const data = (error as { response?: { data?: { body?: unknown; message?: unknown } } })?.response?.data;
  if (typeof data?.body === 'string' && data.body.trim()) return data.body;
  if (data?.body && typeof data.body === 'object') {
    const details = (data.body as { details?: { message?: string }[] }).details;
    if (details?.length && details[0].message) return details[0].message;
  }
  if (typeof data?.message === 'string' && data.message.trim()) return data.message;
  return (error as { message?: string })?.message || fallback;
};
