import { useState, useEffect, useRef } from "react";

export function PromptDialog({ isOpen, title, placeholder, onConfirm, onCancel }) {
  const [value, setValue] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setValue("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function handleSubmit(e) {
    e.preventDefault();
    if (value.trim()) {
      onConfirm(value.trim());
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Escape") {
      onCancel();
    }
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <input
              ref={inputRef}
              type="text"
              className="modal-input"
              placeholder={placeholder}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          
          <div className="modal-footer">
            <button type="button" className="modal-btn-cancel" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="modal-btn-confirm">
              OK
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        
        <div className="modal-body">
          <p>{message}</p>
        </div>
        
        <div className="modal-footer">
          <button className="modal-btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="modal-btn-confirm" onClick={onConfirm}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
