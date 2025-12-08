import { useMemo, useState } from 'react';
import { TEXT } from '../config/content.js';

function ChatMessage({ role, content, isHighlighted, isStreaming }) {
  const isUser = role === 'user';
  const [copied, setCopied] = useState(false);

  const confettiPieces = useMemo(
    () =>
      Array.from({ length: 10 }).map((_, idx) => ({
        id: idx,
        hue: Math.floor(Math.random() * 50) + 190,
        delay: Math.random() * 80,
      })),
    [],
  );

  const handleCopy = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(content);
      } else {
        const temp = document.createElement('textarea');
        temp.value = content;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch (error) {
      console.error('No se pudo copiar', error);
    }
  };

  return (
    <div
      className={`message ${isUser ? 'from-user' : 'from-assistant'} ${isHighlighted ? 'is-highlighted' : ''} ${isStreaming ? 'is-streaming' : ''}`}
    >
      <div className={`avatar ${isUser ? 'avatar-user' : 'avatar-ai'}`}>
        {isStreaming && !isUser && <span className="progress-ring" aria-hidden />}
        {isUser ? 'Tú' : 'AI'}
      </div>
      <div className="message__body">
        <p className="message__content">
          {content}
          {isStreaming && <span className="cursor" />}
        </p>
        {!isUser && (
          <div className="message__actions">
            <button className={`ghost tiny ${copied ? 'copied' : ''}`} type="button" onClick={handleCopy}>
              {copied ? TEXT.copySuccess : TEXT.copyLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MessageList({ messages, isThinking, highlightId, spinnerHint }) {
  return (
    <section className="message-pane">
      <div className="message-list">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            role={message.role}
            content={message.content}
            isHighlighted={message.id === highlightId}
            isStreaming={Boolean(message.isStreaming)}
          />
        ))}
        {isThinking && (
          <div className="message from-assistant ghosted spinner-block">
            <div className="avatar avatar-ai thinking">
              <span className="progress-ring" aria-hidden />AI
            </div>
            <div className="message__body">
              <div className="typing">
                <span />
                <span />
                <span />
              </div>
              <p className="spinner-hint">{spinnerHint}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
