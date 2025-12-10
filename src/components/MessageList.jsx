import { useMemo, useState } from 'react';
import { TEXT } from '../config/content.js';
import { API_BASE_URL } from '../config/api.js';

const escapeHtml = (text) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const markdownToHtml = (text) => {
  if (!text) return '';
  const normalized = text.replace(/\r\n?/g, '\n');
  let html = escapeHtml(normalized);
  html = html.replace(/^\s{0,3}######\s+(.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^\s{0,3}#####\s+(.+)$/gm, '<h5>$1</h5>');
  html = html.replace(/^\s{0,3}####\s+(.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^\s{0,3}###\s+(.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^\s{0,3}##\s+(.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^\s{0,3}#\s+(.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  html = html.replace(/(?<!\*)\*(?!\*)([^*\n]+)(?<!\*)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_\n]+)_/g, '<em>$1</em>');
  html = html.replace(/`(.+?)`/g, '<code>$1</code>');
  html = html.replace(/(?<!\!)\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  html = html.replace(/(?:^|\n)((?:[-*]\s+.*(?:\n|$))+)/g, (match, list) => {
    const items = list
      .trim()
      .split(/\n/)
      .map((line) => line.replace(/^[-*]\s+/, '').trim())
      .filter(Boolean)
      .map((item) => `<li>${item}</li>`)
      .join('');
    return `<ul>${items}</ul>`;
  });
  html = html.replace(/\n{2,}/g, '<br><br>');
  html = html.replace(/\n/g, '<br>');
  return html;
};

const normalizeMediaUrl = (value) => {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) return encodeURI(value);
  if (value.startsWith('file://')) return encodeURI(value);
  if (value.startsWith('/')) return `${API_BASE_URL}${encodeURI(value)}`;
  if (/^[a-zA-Z]:\\/.test(value)) {
    const normalized = value.replace(/\\/g, '/');
    return `file:///${encodeURI(normalized.replace(/^\/+/, ''))}`;
  }
  return `${API_BASE_URL}/${encodeURI(value.replace(/\\/g, '/'))}`;
};

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
          if (!block?.value) return null;
          if (block.type === 'image') {
            return (
              <div key={`${block.type}-${idx}`} className="message-block message-block--image">
                <img
                  src={normalizeMediaUrl(block.value)}
                  alt={block.label || 'Imagen de la API'}
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none';
                  }}
                />
                <div className="image-url-hint">URL: {normalizeMediaUrl(block.value)}</div>
              </div>
            );
          }

          if (block.type === 'file') {
            return (
              <div key={`${block.type}-${idx}`} className="message-block message-block--file">
                <a
                  className="file-pill file-pill--block"
                  href={normalizeMediaUrl(block.value)}
                  target="_self"
                >
                  <span className="file-pill__icon" aria-hidden>
                    ⬇
                  </span>
                  <span className="file-pill__name">{block.label || 'Descargar archivo'}</span>
                </a>
              </div>
            );
          }

          return (
            <div key={`${block.type}-${idx}`} className="message-block message-block--text">
              <div className="message-block__text" dangerouslySetInnerHTML={{ __html: markdownToHtml(block.value) }} />
            </div>
          );
        })}
      </div>
    );
  };

  const copyText = useMemo(() => {
    if (content) return content;
    if (blocks && blocks.length > 0) {
      const lines = blocks.map((block) => block.value);
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
            <span className="message__text" dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }} />
            {isStreaming && <span className="cursor" />}
          </p>
        )}
        {renderBlocks()}
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
