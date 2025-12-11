import { API_BASE_URL, DEFAULT_TIMEOUT_MS } from '../config/api.js';

const joinUrl = (path) => `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

const withTimeout = (promise, timeoutMs) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Tiempo de espera agotado al subir archivos')), timeoutMs);
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

export async function uploadAutomationFiles(files, { optionId, uploadPath = '/v1/automations/upload' } = {}) {
  if (!files || files.length === 0) {
    throw new Error('No hay archivos para subir.');
  }

  const formData = new FormData();
  files.forEach((file) => formData.append('files', file, file.name));
  if (optionId) {
    formData.append('automation_id', optionId);
  }

  const fetchPromise = fetch(joinUrl(uploadPath), {
    method: 'POST',
    body: formData,
  });

  const response = await withTimeout(fetchPromise, DEFAULT_TIMEOUT_MS);
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const detail = typeof payload === 'string' ? payload : JSON.stringify(payload);
    throw new Error(`Fallo al subir archivos (${response.status}): ${detail}`);
  }

  return { payload, status: response.status };
}
