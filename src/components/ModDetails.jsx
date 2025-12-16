import { useRef, useState } from "react";

export default function ModDetails({ mod, allTags, onUpdateNotes, onUploadPreview, onUpdateTags, onUpdateName }) {
  const fileInputRef = useRef(null);
  const [tagInput, setTagInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");

  if (!mod) {
    return (
      <div className="right-panel">
        <div className="panel-header">Preview</div>
        <div className="empty-panel">No mod selected.</div>
      </div>
    );
  }

  const modTags = mod.tags || [];
  const suggestions = allTags.filter(tag => 
    tag.toLowerCase().includes(tagInput.toLowerCase()) &&
    !modTags.includes(tag) &&
    tagInput.length > 0
  );

  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      onUploadPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        onUploadPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  function addTag(tag) {
    if (tag && !modTags.includes(tag)) {
      onUpdateTags([...modTags, tag]);
    }
    setTagInput("");
    setShowSuggestions(false);
  }

  function removeTag(tag) {
    onUpdateTags(modTags.filter(t => t !== tag));
  }

  function handleTagKeyDown(e) {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput.trim());
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  }

  function startEditName() {
    setEditedName(mod.name);
    setIsEditingName(true);
  }

  function saveEditName() {
    if (editedName.trim() && editedName !== mod.name) {
      onUpdateName(editedName.trim());
    }
    setIsEditingName(false);
  }

  function handleNameKeyDown(e) {
    if (e.key === "Enter") {
      saveEditName();
    } else if (e.key === "Escape") {
      setIsEditingName(false);
    }
  }

  return (
    <div className="right-panel">
      <div className="panel-header">Preview</div>
      
      <div className="preview-section">
        <div className="mod-name-section">
          {isEditingName ? (
            <input
              type="text"
              className="mod-name-input"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onKeyDown={handleNameKeyDown}
              onBlur={saveEditName}
              autoFocus
            />
          ) : (
            <div className="mod-name-display">
              <span className="mod-name-text">{mod.name}</span>
              <button className="mod-name-edit" onClick={startEditName}>
                ✏️
              </button>
            </div>
          )}
        </div>

        <div className="preview-image-container">
          {mod.preview ? (
            <img 
              src={mod.preview} 
              alt="Preview" 
              className="preview-image"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            />
          ) : (
            <div 
              className="preview-placeholder"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <span style={{ fontSize: 48 }}>🖼️</span>
              <span>Drag image here or click Upload</span>
            </div>
          )}
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleImageUpload}
        />
        
        <button
          className="upload-btn secondary-button"
          onClick={() => fileInputRef.current?.click()}
        >
          <span>⬆️</span> Upload Image
        </button>
      </div>

      <div className="tags-section">
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Tags</div>
        
        <div className="tag-input-container-inline">
          <input
            type="text"
            className="tag-input-inline"
            placeholder="Add tag..."
            value={tagInput}
            onChange={(e) => {
              setTagInput(e.target.value);
              setShowSuggestions(true);
            }}
            onKeyDown={handleTagKeyDown}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          
          {showSuggestions && suggestions.length > 0 && (
            <div className="tag-suggestions-inline">
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

        <div className="tag-chips-container">
          {modTags.length > 0 ? (
            modTags.map(tag => (
              <div key={tag} className="tag-chip">
                {tag}
                <button 
                  className="tag-remove"
                  onClick={() => removeTag(tag)}
                >
                  ×
                </button>
              </div>
            ))
          ) : (
            <div className="empty-tags-hint">No tags</div>
          )}
        </div>
      </div>

      <div className="notes-section">
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Notes</div>
        <textarea
          className="notes-textarea"
          value={mod.notes}
          onChange={(e) => onUpdateNotes(e.target.value)}
          placeholder="Add notes about this mod..."
        />
      </div>
    </div>
  );
}
