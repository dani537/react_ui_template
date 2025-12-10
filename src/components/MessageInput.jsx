import { TEXT } from '../config/content.js';

export default function MessageInput({ value, onChange, onSend, onClear, disabled }) {
  const handleSubmit = (event) => {
    event.preventDefault();
    onSend();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };

  return (
    <form className="input-bar" onSubmit={handleSubmit}>
      <div className="input-wrapper">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={TEXT.inputPlaceholder}
          rows={2}
          disabled={disabled}
        />
        <div className="input-actions">
          <button type="button" className="ghost" onClick={onClear} disabled={disabled}>
            {TEXT.clearLabel}
          </button>
          <button type="submit" className="primary" disabled={disabled}>
            Enviar
          </button>
        </div>
      </div>
      <p className="muted tiny">Enter para enviar, Shift+Enter para salto de linea.</p>
    </form>
  );
}
