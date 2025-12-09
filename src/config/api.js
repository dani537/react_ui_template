const fallbackBaseUrl = 'http://localhost:8000';

// Normaliza la base de la API. Si alguien pone "http:localhost:8000" lo convierte en "http://localhost:8000".
const normalizeBaseUrl = (raw) => {
  if (!raw) return fallbackBaseUrl;
  let value = raw.trim();
  if (!/^https?:\/\//i.test(value) && /^https?:/i.test(value)) {
    value = value.replace(/^https?:/i, (match) => `${match}//`);
  }
  if (!/^https?:\/\//i.test(value)) {
    value = `http://${value}`;
  }
  return value.replace(/\/$/, '');
};

// Base de la API. Usa VITE_API_BASE_URL cuando se despliegue en la webapp.
export const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);

// Timeout genérico para peticiones críticas; editable según entorno.
export const DEFAULT_TIMEOUT_MS = 20000;
