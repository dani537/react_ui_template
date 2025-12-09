import { useMemo, useState } from 'react';
import { TEXT } from '../config/content.js';

function ChatMessage({ role, content, blocks, meta, isHighlighted, isStreaming }) {
  const isUser = role === 'user';
  const [copied, setCopied] = useState(false);
  const hasContent = content !== undefined && content !== null;

  const confettiPieces = useMemo(
    () =>
      Array.from({ length: 10 }).map((_, idx) => ({
        id: idx,
        hue: Math.floor(Math.random() * 50) + 190,
        delay: Math.random() * 80,
      })),
    [],
  );

  const renderBlocks = () => {
    if (!blocks || blocks.length === 0) return null;

    return (
      <div className="message__blocks">
        {blocks.map((block, idx) => {
          if (block.type === 'image') {
            return (
              <div key={`${block.type}-${idx}`} className="message-block message-block--image">
                <span className="message-block__label">{block.label}</span>
                <img src={block.value} alt={block.label || 'Imagen de la API'} loading="lazy" />
              </div>
            );
          }

          if (block.type === 'file') {
            return (
              <div key={`${block.type}-${idx}`} className="message-block message-block--file">
                <span className="message-block__label">{block.label}</span>
                <a
                  className="file-pill file-pill--block"
                  href={block.value}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="file-pill__icon" aria-hidden>
                    FILE
                  </span>
                  <span className="file-pill__name">{block.label || 'Descargar archivo'}</span>
                </a>
              </div>
            );
          }

          return (
            <div key={`${block.type}-${idx}`} className="message-block message-block--text">
              <span className="message-block__label">{block.label}</span>
              <div className="message-block__text">{block.value}</div>
            </div>
          );
        })}
      </div>
    );
  };

  const copyText = useMemo(() => {
    if (content) return content;
    if (blocks && blocks.length > 0) {
      const lines = blocks.map((block) => `${block.label || block.type}: ${block.value}`);
      if (meta?.url) {
        lines.push(`Endpoint: ${meta.url}`);
      }
      if (meta?.params && Object.keys(meta.params).length > 0) {
        lines.push(`Parámetros: ${JSON.stringify(meta.params)}`);
      }
      return lines.join('\n');
    }
    return '';
  }, [blocks, content, meta?.params, meta?.url]);

  const handleCopy = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(copyText);
      } else {
        const temp = document.createElement('textarea');
        temp.value = copyText;
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
        {hasContent && (
          <p className="message__content">
            <span className="message__text">{content}</span>
            {isStreaming && <span className="cursor" />}
          </p>
        )}
        {renderBlocks()}
        {meta && (meta.url || (meta.params && Object.keys(meta.params).length > 0)) && (
          <div className="message__meta">
            {meta.url && <span className="meta-pill">Endpoint: {meta.url}</span>}
            {meta.params && Object.keys(meta.params).length > 0 && (
              <span className="meta-pill">Parámetros: {JSON.stringify(meta.params)}</span>
            )}
          </div>
        )}
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
            blocks={message.blocks}
            meta={message.meta}
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
