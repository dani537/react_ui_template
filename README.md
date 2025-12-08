# Financial Bot (UI)

Interfaz React (Vite) para lanzar consultas a FastAPI mediante Action Cards y mostrar las respuestas en el chat.

## Arranque rápido
- Instalar deps: `npm install`
- Entorno local: `npm run dev`
- Build: `npm run build`

## Configuración de API
- Base URL: `VITE_API_BASE_URL` (fallback local `http://localhost:8000`). Crea `.env` si quieres cambiarla:
  ```bash
  echo "VITE_API_BASE_URL=https://api.midominio.com" > .env
  ```
- Timeout por defecto: `DEFAULT_TIMEOUT_MS` en `src/config/api.js`.

## Flujo de Action Cards (Visión Comercial)
- Selecciona nivel (Sucursal / DC / Mediador) y escribe la unidad.
- Al pulsar Run se llama a FastAPI:
  - Endpoint: `/v1/action_cards/vision_comercial`
  - Método: GET
  - Parámetros: `nivel` (según opción), `unidad` (input del usuario)
- Respuesta:
  - Si es JSON se formatea y se vuelca al chat junto con endpoint y parámetros usados.
  - Si falla, el chat muestra el error.

## Dónde tocar
- Base API y timeout: `src/config/api.js`
- Mapeo de opciones y requests: `src/config/options.js`
- Cliente fetch y formateo: `src/services/actionApi.js`
- Disparo desde UI (sidebar) y escritura en chat: `src/components/Sidebar.jsx`, `src/App.jsx`

## Añadir nuevas Action Cards con backend
1) En `src/config/options.js`, añade `request` a la opción:
   ```js
   request: {
     path: '/v1/mi_endpoint',
     method: 'GET', // o POST
     buildParams: ({ inputValue }) => ({ foo: 'bar', userInput: inputValue }),
   }
   ```
2) Si necesita input manual, marca `needsInput: true`.
3) El handler reutiliza `runActionRequest` y mostrará la respuesta en el chat.
