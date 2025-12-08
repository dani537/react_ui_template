import { useMemo, useState } from 'react';
import { actionTree, quickAutomationOptions } from '../config/options.js';
import { TEXT } from '../config/content.js';

function OptionList({ options, onSelect, selectedId, level, isOpen, onToggle }) {
  const selectedLabel = selectedId ? options.find((o) => o.id === selectedId)?.label : TEXT.selectPlaceholder;
  const toggle = (next) => {
    if (typeof onToggle === 'function') {
      onToggle(next);
    }
  };
  return (
    <div className="dropdown" data-level={level}>
      <button className="dropdown__toggle" type="button" onClick={() => toggle()}>
        {selectedLabel}
      </button>
      {isOpen && (
        <div className="dropdown__menu">
          {options.map((option) => (
            <button
              key={option.id}
              className={`dropdown__item ${selectedId === option.id ? 'is-active' : ''}`}
              onClick={() => {
                onSelect(option);
                toggle(false);
              }}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ onActionRun }) {
  const [activeSection, setActiveSection] = useState('actions');
  const [level1, setLevel1] = useState(null);
  const [level2, setLevel2] = useState(null);
  const [level3, setLevel3] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [justRan, setJustRan] = useState(false);
  const [open1, setOpen1] = useState(true);
  const [open2, setOpen2] = useState(false);
  const [open3, setOpen3] = useState(false);
  const [automationOption, setAutomationOption] = useState(null);
  const [automationFiles, setAutomationFiles] = useState([]);
  const [automationDrag, setAutomationDrag] = useState(false);
  const [automationRan, setAutomationRan] = useState(false);

  const level2Options = useMemo(() => level1?.children ?? [], [level1]);
  const level3Options = useMemo(() => level2?.children ?? [], [level2]);
  const finalOption = useMemo(() => {
    if (level3) return level3;
    if (level2 && level3Options.length === 0) return level2;
    if (level1 && level2Options.length === 0) return level1;
    return null;
  }, [level1, level2, level3, level2Options.length, level3Options.length]);
  const needsInput = finalOption?.needsInput ?? false;
  const pathLabels = useMemo(
    () => [level1?.label, level2?.label, level3?.label].filter(Boolean),
    [level1?.label, level2?.label, level3?.label],
  );

  const handleRun = () => {
    setJustRan(true);
    setTimeout(() => setJustRan(false), 1200);

    if (onActionRun && finalOption) {
      onActionRun({
        option: finalOption,
        inputValue,
        pathLabels,
      });
    }
  };

  const addFiles = (fileList) => {
    const incoming = Array.from(fileList || []);
    if (incoming.length === 0) return;
    setAutomationFiles((prev) => [...prev, ...incoming]);
  };

  const handleAutomationRun = () => {
    setAutomationRan(true);
    setTimeout(() => setAutomationRan(false), 1200);
    // Acción de automatización: usar automationOption y automationFiles
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setAutomationDrag(false);
    addFiles(event.dataTransfer?.files);
  };

  const handleRemoveFile = (index) => {
    setAutomationFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleFileChange = (event) => {
    addFiles(event.target.files);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <img src="/assets/Allianz.svg" alt="Allianz" />
      </div>
      <div className="sidebar__title">{TEXT.appTitle}</div>

      <div className="section-tabs">
        <button
          type="button"
          className={`tab ${activeSection === 'actions' ? 'is-active' : ''}`}
          onClick={() => setActiveSection('actions')}
        >
          {TEXT.actionCardsTitle}
        </button>
        <button
          type="button"
          className={`tab ${activeSection === 'automations' ? 'is-active' : ''}`}
          onClick={() => setActiveSection('automations')}
        >
          {TEXT.quickAutomationsTitle}
        </button>
      </div>

      {activeSection === 'actions' && (
        <div className="actions-card">
          <p className="actions-card__title">{TEXT.actionCardsTitle}</p>
          <div className="stack">
            <OptionList
              options={actionTree}
              level={1}
              selectedId={level1?.id ?? null}
              isOpen={open1}
              onToggle={(next) => setOpen1((prev) => (typeof next === 'boolean' ? next : !prev))}
              onSelect={(option) => {
                setLevel1(option);
                setLevel2(null);
                setLevel3(null);
                setInputValue('');
                setOpen1(false);
                setOpen2(Boolean(option.children?.length));
                setOpen3(false);
              }}
            />

            {level2Options.length > 0 && (
              <OptionList
                options={level2Options}
                level={2}
                selectedId={level2?.id ?? null}
                isOpen={open2}
                onToggle={(next) => setOpen2((prev) => (typeof next === 'boolean' ? next : !prev))}
                onSelect={(option) => {
                  setLevel2(option);
                  setLevel3(null);
                  setInputValue('');
                  setOpen2(false);
                  setOpen3(Boolean(option.children?.length));
                }}
              />
            )}

            {level3Options.length > 0 && (
              <OptionList
                options={level3Options}
                level={3}
                selectedId={level3?.id ?? null}
                isOpen={open3}
                onToggle={(next) => setOpen3((prev) => (typeof next === 'boolean' ? next : !prev))}
                onSelect={(option) => {
                  setLevel3(option);
                  setInputValue('');
                  setOpen3(false);
                }}
              />
            )}

            {needsInput && (
              <label className="manual-input">
                <span>{TEXT.manualInputLabel}</span>
                <input
                  type="text"
                  placeholder={TEXT.inputPlaceholder}
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                />
              </label>
            )}

            {finalOption && (!needsInput || inputValue.trim()) && (
              <button
                className={`run-btn ${justRan ? 'is-success' : ''}`}
                type="button"
                onClick={handleRun}
              >
                {justRan ? TEXT.runSuccess : TEXT.runLabel}
              </button>
            )}
          </div>
        </div>
      )}

      {activeSection === 'automations' && (
        <div className="actions-card">
          <p className="actions-card__title">{TEXT.quickAutomationsTitle}</p>
          <div className="stack">
            <OptionList
              options={quickAutomationOptions}
              level={1}
              selectedId={automationOption?.id ?? null}
              isOpen={open1}
              onToggle={(next) => setOpen1((prev) => (typeof next === 'boolean' ? next : !prev))}
              onSelect={(option) => {
                setAutomationOption(option);
                setAutomationFiles([]);
                setOpen1(false);
              }}
            />

            <div
              className={`dropzone ${automationDrag ? 'is-drag' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setAutomationDrag(true);
              }}
              onDragLeave={() => setAutomationDrag(false)}
              onDrop={handleDrop}
            >
              <div className="dropzone__clickzone">
                <input
                  type="file"
                  id="upload"
                  className="dropzone__input"
                  onChange={handleFileChange}
                  multiple
                />
                <label htmlFor="upload" className="dropzone__content">
                  <span className="dropzone__title">{TEXT.dropzoneTitle}</span>
                  <span className="dropzone__hint">{TEXT.dropzoneHint}</span>
                  <span className="dropzone__cta">{TEXT.dropzoneCta}</span>
                </label>
              </div>
              {automationFiles.length > 0 && (
                <div className="file-list">
                  {automationFiles.map((file, idx) => (
                    <div key={`${file.name}-${idx}`} className="file-pill">
                      <span className="file-pill__name">{file.name}</span>
                      <button type="button" className="file-pill__remove" onClick={() => handleRemoveFile(idx)}>
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {automationOption && automationFiles.length > 0 && (
              <button
                className={`run-btn ${automationRan ? 'is-success' : ''}`}
                type="button"
                onClick={handleAutomationRun}
              >
                {automationRan ? TEXT.runSuccess : TEXT.runLabel}
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
