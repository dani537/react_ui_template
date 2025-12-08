const fallbackBaseUrl = 'http://localhost:8000';

// Base de la API. Usa VITE_API_BASE_URL cuando se despliegue en la webapp.
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || fallbackBaseUrl).replace(/\/$/, '');

// Timeout genérico para peticiones críticas; editable según entorno.
export const DEFAULT_TIMEOUT_MS = 20000;
