import { useEffect, useMemo, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import MessageList from './components/MessageList.jsx';
import MessageInput from './components/MessageInput.jsx';
import { TEXT } from './config/content.js';
import { SPINNER_MESSAGES } from './config/spinnerMessages.js';
import { formatApiPayload, runActionRequest } from './services/actionApi.js';

const seedConversations = [
  {
    id: 'financial-bot',
    title: TEXT.appTitle,
    pinned: true,
    model: 'gpt-4.1',
    messages: [
      {
        id: 'm-1',
        role: 'assistant',
        content: TEXT.initialMessage,
      },
    ],
  },
];

const generateAssistantReply = (prompt) => {
  const ideas = [
    'Voy a resumir en 3 bullets y darte un CTA para probarlo.',
    'Te devuelvo un paso a paso corto para que puedas iterar rapido.',
    'Anado un bloque de contexto y sugerencias de tono.',
    'Incluyo un ejemplo en JSON listo para probar.',
  ];
  const hook = ideas[Math.floor(Math.random() * ideas.length)];
  return `Recibido: "${prompt.slice(0, 90)}". ${hook}`;
};

const buildBlocksFromPayload = (payload) => {
  const blocks = [];

  const walk = (node) => {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach((item) => walk(item));
      return;
    }
    if (typeof node !== 'object') return;

    Object.entries(node).forEach(([key, value]) => {
      const lowerKey = key.toLowerCase();
      if (typeof value === 'string') {
        if (lowerKey.startsWith('text')) {
          blocks.push({ type: 'text', label: key, value });
          return;
        }
        if (lowerKey.startsWith('image')) {
          blocks.push({ type: 'image', label: key, value });
          return;
        }
        if (lowerKey.startsWith('file')) {
          blocks.push({ type: 'file', label: key, value });
          return;
        }
      }
      if (value && typeof value === 'object') {
        walk(value);
      }
    });
  };

  walk(payload);
  return blocks;
};

export default function App() {
  const [conversations, setConversations] = useState(seedConversations);
  const [activeId, setActiveId] = useState(seedConversations[0].id);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [highlightId, setHighlightId] = useState(null);
  const [spinnerHint, setSpinnerHint] = useState(SPINNER_MESSAGES[0]);
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeId),
    [conversations, activeId],
  );

  useEffect(() => {
    if (!activeConversation) {
      setActiveId(conversations[0]?.id);
    }
  }, [activeConversation, conversations]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || !activeConversation) return;

    const newUserMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
    };

    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === activeId
          ? { ...conversation, messages: [...conversation.messages, newUserMessage] }
          : conversation,
      ),
    );
    setInput('');
    setIsThinking(true);

    const reply = generateAssistantReply(trimmed);
    const assistantId = crypto.randomUUID();
    rotateSpinnerHints();

    // Simula un ligero tiempo de pensamiento antes de empezar a streaminear la respuesta
    setTimeout(() => {
      setIsThinking(false);

      // Inserta el contenedor del mensaje de asistente vacío para ir rellenándolo
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === activeId
            ? {
                ...conversation,
                messages: [
                  ...conversation.messages,
                  {
                    id: assistantId,
                    role: 'assistant',
                    content: '',
                    isStreaming: true,
                  },
                ],
              }
            : conversation,
        ),
      );
      setHighlightId(assistantId);

      // Va agregando el texto poco a poco para simular tokens
      const chunk = Math.max(3, Math.floor(reply.length / 28));
      let cursor = 0;
      const interval = setInterval(() => {
        cursor = Math.min(cursor + chunk, reply.length);
        const partial = reply.slice(0, cursor);

        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.id === activeId
              ? {
                  ...conversation,
                  messages: conversation.messages.map((msg) =>
                    msg.id === assistantId
                      ? { ...msg, content: partial, isStreaming: cursor < reply.length }
                      : msg,
                  ),
                }
              : conversation,
          ),
        );

        if (cursor >= reply.length) {
          clearInterval(interval);
        }
      }, 50 + Math.random() * 70);
    }, 480);
  };

  const handleActionRun = async ({ option, inputValue, pathLabels }) => {
    if (!activeConversation || !option) return;

    const cleanInput = inputValue?.trim() ?? '';
    const readablePath = (pathLabels && pathLabels.length > 0 ? pathLabels : [option.label]).join(' / ');
    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: `Action Card: ${readablePath}${cleanInput ? ` | unidad: ${cleanInput}` : ''}`,
    };
    const assistantId = crypto.randomUUID();

    setIsThinking(true);
    rotateSpinnerHints();
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === activeId
          ? { ...conversation, messages: [...conversation.messages, userMessage] }
          : conversation,
      ),
    );

    try {
      const { payload, url, params } = await runActionRequest(option.request, { inputValue: cleanInput });
      const paramText = params && Object.keys(params).length > 0 ? JSON.stringify(params) : '';
      const blocks = buildBlocksFromPayload(payload);

      const assistantMessage =
        blocks.length > 0
          ? {
              id: assistantId,
              role: 'assistant',
              content: `Respuesta de FastAPI para "${readablePath}":`,
              blocks,
              meta: { url, params },
            }
          : {
              id: assistantId,
              role: 'assistant',
              content: `Respuesta de FastAPI para "${readablePath}":\n${formatApiPayload(payload)}${paramText ? `\nParámetros: ${paramText}` : ''}\nEndpoint: ${url}`,
              meta: { url, params },
            };

      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === activeId
            ? { ...conversation, messages: [...conversation.messages, assistantMessage] }
            : conversation,
        ),
      );
      setHighlightId(assistantId);
    } catch (error) {
      const assistantMessage = {
        id: assistantId,
        role: 'assistant',
        content: `No se pudo recuperar datos para "${readablePath}". Detalle: ${error.message}`,
      };
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === activeId
            ? { ...conversation, messages: [...conversation.messages, assistantMessage] }
            : conversation,
        ),
      );
      setHighlightId(assistantId);
    } finally {
      setIsThinking(false);
    }
  };

  const rotateSpinnerHints = (durationMs = 20000) => {
    let idx = 0;
    setSpinnerHint(SPINNER_MESSAGES[idx]);
    const interval = setInterval(() => {
      idx = (idx + 1) % SPINNER_MESSAGES.length;
      setSpinnerHint(SPINNER_MESSAGES[idx]);
    }, 5000);
    setTimeout(() => clearInterval(interval), durationMs);
  };

  useEffect(() => {
    if (!isResizingSidebar) return undefined;

    const handleMove = (event) => {
      const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
      const nextWidth = clamp(event.clientX, 210, 420);
      setSidebarWidth(nextWidth);
    };

    const handleUp = () => setIsResizingSidebar(false);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isResizingSidebar]);

  const pageStyle = { '--sidebar-width': `${sidebarWidth}px` };

  return (
    <div className="page" style={pageStyle}>
      <div className="sidebar-wrapper">
        <Sidebar onActionRun={handleActionRun} />
        <button
          type="button"
          className={`sidebar-resizer ${isResizingSidebar ? 'is-active' : ''}`}
          aria-label="Ajustar ancho de la barra lateral"
          onMouseDown={() => setIsResizingSidebar(true)}
        />
      </div>
      <div className="main-column">
        <main className="chat-column">
          <MessageList
            messages={activeConversation?.messages ?? []}
            isThinking={isThinking}
            highlightId={highlightId}
            spinnerHint={spinnerHint}
          />
        </main>

        <MessageInput value={input} onChange={setInput} onSend={handleSend} disabled={isThinking} />
      </div>
    </div>
  );
}
