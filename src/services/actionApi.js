import { API_BASE_URL, DEFAULT_TIMEOUT_MS } from '../config/api.js';

const joinUrl = (path) => `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

const withTimeout = (promise, timeoutMs) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Tiempo de espera agotado')), timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });

export async function runActionRequest(requestConfig, { inputValue } = {}) {
  if (!requestConfig?.path) {
    throw new Error('No hay endpoint configurado para esta opción.');
  }

  const method = requestConfig.method || 'GET';
  const params =
    typeof requestConfig.buildParams === 'function'
      ? requestConfig.buildParams({ inputValue })
      : { ...(requestConfig.params || {}) };

  const urlObj = new URL(joinUrl(requestConfig.path));
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      urlObj.searchParams.set(key, value);
    }
  });

  const headers = {
    ...(requestConfig.headers || {}),
  };

  const fetchPromise = fetch(urlObj.toString(), { method, headers });
  const response = await withTimeout(fetchPromise, requestConfig.timeoutMs || DEFAULT_TIMEOUT_MS);
  const contentType = response.headers.get('content-type') || '';

  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const detail = typeof payload === 'string' ? payload : JSON.stringify(payload);
    throw new Error(`Solicitud fallida (${response.status}): ${detail}`);
  }

  return {
    payload,
    status: response.status,
    url: urlObj.toString(),
    params,
  };
}

export const formatApiPayload = (payload) => {
  if (payload === null || payload === undefined) return 'La API no devolvió contenido.';
  if (typeof payload === 'string') return payload;
  try {
    return JSON.stringify(payload, null, 2);
  } catch (error) {
    return String(payload);
  }
};
