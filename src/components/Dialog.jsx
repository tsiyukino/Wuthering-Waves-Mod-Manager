import React, { useState, useEffect, useRef } from "react";

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

export function DataMigrationDialog({ 
  isOpen, 
  fromLocation, 
  toLocation, 
  fromSummary,
  toSummary,
  onKeep, 
  onCancel 
}) {
  const [createBackup, setCreateBackup] = React.useState(true);

  if (!isOpen) return null;

  const fromLabel = fromLocation === "appdata" ? "AppData" : "Local Folder";
  const toLabel = toLocation === "appdata" ? "AppData" : "Local Folder";

  return (
    <div className="modal-overlay">
      <div className="modal-dialog modal-dialog-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Data Migration - Choose Which Data to Keep</h3>
        </div>
        
        <div className="modal-body">
          <p style={{ marginBottom: 16 }}>
            Both locations contain data. Please review the details and choose which one to keep:
          </p>

          <div className="migration-comparison">
            <div className="migration-option">
              <div className="migration-option-header">{fromLabel} (Current)</div>
              {fromSummary ? (
                <div className="migration-details">
                  <div className="detail-row">
                    <span className="detail-label">Categories:</span>
                    <span className="detail-value">{fromSummary.categories}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Mods:</span>
                    <span className="detail-value">{fromSummary.mods}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Root Folder:</span>
                    <span className="detail-value detail-path">{fromSummary.root_folder}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Strategy:</span>
                    <span className="detail-value">{fromSummary.mod_strategy}</span>
                  </div>
                </div>
              ) : (
                <div className="migration-details">No data</div>
              )}
            </div>

            <div className="migration-arrow">→</div>

            <div className="migration-option">
              <div className="migration-option-header">{toLabel} (Target)</div>
              {toSummary ? (
                <div className="migration-details">
                  <div className="detail-row">
                    <span className="detail-label">Categories:</span>
                    <span className="detail-value">{toSummary.categories}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Mods:</span>
                    <span className="detail-value">{toSummary.mods}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Root Folder:</span>
                    <span className="detail-value detail-path">{toSummary.root_folder}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Strategy:</span>
                    <span className="detail-value">{toSummary.mod_strategy}</span>
                  </div>
                </div>
              ) : (
                <div className="migration-details">No data</div>
              )}
            </div>
          </div>

          <div className="migration-backup-option">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={createBackup}
                onChange={(e) => setCreateBackup(e.target.checked)}
              />
              <span>Create backup of discarded data (.json.backup)</span>
            </label>
          </div>
          
          <div className="migration-warning">
            ⚠️ The data you don't keep will be {createBackup ? 'backed up and then ' : ''}deleted. 
            {createBackup && ' You can restore from the .backup file if needed.'}
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="modal-btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button 
            className="modal-btn-secondary" 
            onClick={() => onKeep(fromLocation, createBackup)}
          >
            Keep {fromLabel}
          </button>
          <button 
            className="modal-btn-confirm" 
            onClick={() => onKeep(toLocation, createBackup)}
          >
            Keep {toLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TagDialog({ isOpen, currentTags, allTags, onConfirm, onCancel }) {
  const [inputValue, setInputValue] = React.useState("");
  const [selectedTags, setSelectedTags] = React.useState([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedTags([...currentTags]);
      setInputValue("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, currentTags]);

  if (!isOpen) return null;

  const suggestions = allTags.filter(tag => 
    tag.toLowerCase().includes(inputValue.toLowerCase()) &&
    !selectedTags.includes(tag)
  );

  function addTag(tag) {
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
    setInputValue("");
    setShowSuggestions(false);
  }

  function removeTag(tag) {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue.trim());
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Manage Tags</h3>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="tag-input-container">
            <input
              ref={inputRef}
              type="text"
              className="modal-input"
              placeholder="Type tag name..."
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setShowSuggestions(true);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
            />
            
            {showSuggestions && suggestions.length > 0 && (
              <div className="tag-suggestions">
                {suggestions.map(tag => (
                  <div 
                    key={tag}
                    className="tag-suggestion"
                    onClick={() => addTag(tag)}
                  >
                    {tag}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="selected-tags">
            {selectedTags.map(tag => (
              <div key={tag} className="tag-chip">
                {tag}
                <button 
                  className="tag-remove"
                  onClick={() => removeTag(tag)}
                >
                  ×
                </button>
              </div>
            ))}
            {selectedTags.length === 0 && (
              <div className="empty-tags">No tags selected</div>
            )}
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="modal-btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="modal-btn-confirm" onClick={() => onConfirm(selectedTags)}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
