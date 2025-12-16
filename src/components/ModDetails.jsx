import { useRef } from "react";

export default function ModDetails({ mod, onUpdateNotes, onUploadPreview }) {
  const fileInputRef = useRef(null);

  if (!mod) {
    return (
      <div className="right-panel">
        <div className="panel-header">Preview</div>
        <div className="empty-panel">No mod selected.</div>
      </div>
    );
  }

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

  return (
    <div className="right-panel">
      <div className="panel-header">Preview</div>
      
      <div className="preview-section">
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
