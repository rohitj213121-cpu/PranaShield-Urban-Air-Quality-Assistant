export class ApiRequestError extends Error {
  status?: number;
  isHtmlOrMissingRoute: boolean;

  constructor(message: string, options?: { status?: number; isHtmlOrMissingRoute?: boolean }) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = options?.status;
    this.isHtmlOrMissingRoute = Boolean(options?.isHtmlOrMissingRoute);
  }
}

export async function postJsonSafe<T>(
  url: string,
  payload: unknown,
  options?: { signal?: AbortSignal; timeoutMs?: number }
): Promise<T> {
  const timeoutMs = options?.timeoutMs ?? 12000;
  const controller = new AbortController();

  const onExternalAbort = () => controller.abort();
  if (options?.signal) {
    if (options.signal.aborted) {
      controller.abort();
    } else {
      options.signal.addEventListener('abort', onExternalAbort, { once: true });
    }
  }

  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify(payload),
    });

    const rawText = await res.text();
    const trimmed = rawText.trim();
    const contentType = res.headers.get('content-type') || '';

    const looksLikeHtml =
      trimmed.startsWith('<!') ||
      trimmed.startsWith('<html') ||
      contentType.toLowerCase().includes('text/html');

    if (looksLikeHtml) {
      throw new ApiRequestError('Backend API route returned HTML instead of JSON.', {
        status: res.status,
        isHtmlOrMissingRoute: true,
      });
    }

    let parsed: Record<string, unknown> | null = null;
    if (trimmed.length > 0) {
      try {
        parsed = JSON.parse(trimmed) as Record<string, unknown>;
      } catch {
        throw new ApiRequestError('Received an unexpected non-JSON response from the server.', {
          status: res.status,
        });
      }
    }

    if (!res.ok) {
      const errorMsg =
        (parsed && typeof parsed.error === 'string' && parsed.error) ||
        `Server returned status ${res.status}.`;
      throw new ApiRequestError(errorMsg, { status: res.status });
    }

    if (!parsed) {
      throw new ApiRequestError('Server returned an empty response.', { status: res.status });
    }

    return parsed as T;
  } catch (err) {
    if (err instanceof ApiRequestError) {
      throw err;
    }
    if ((err as { name?: string })?.name === 'AbortError') {
      if (options?.signal?.aborted) {
        throw err;
      }
      throw new ApiRequestError('Request timed out while waiting for Gemini AI.', { status: 504 });
    }
    throw new ApiRequestError(err instanceof Error ? err.message : 'Network request failed.');
  } finally {
    clearTimeout(timer);
    if (options?.signal) {
      options.signal.removeEventListener('abort', onExternalAbort);
    }
  }
}
