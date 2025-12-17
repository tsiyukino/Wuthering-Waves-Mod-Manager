import { useState, useEffect, useRef } from "react";

export default function GameDialog({ isOpen, game, onConfirm, onCancel, onDelete }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [preview, setPreview] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (game) {
        // Editing existing game
        setName(game.name || "");
        setDescription(game.description || "");
        setPreview(game.preview || null);
      } else {
        // Adding new game
        setName("");
        setDescription("");
        setPreview(null);
      }
      setShowDeleteConfirm(false);
    }
  }, [isOpen, game]);

  if (!isOpen) return null;

  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      alert("Please enter a game name");
      return;
    }
    onConfirm({ name: name.trim(), description: description.trim(), preview });
  }

  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{game ? "Edit Game" : "Add New Game"}</h3>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="game-dialog-content">
              <div className="game-dialog-preview">
                <label>Game Image</label>
                <div 
                  className="game-dialog-preview-area"
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  {preview ? (
                    <img src={preview} alt="Preview" />
                  ) : (
                    <div className="game-dialog-preview-placeholder">
                      <span style={{ fontSize: 48 }}>🎮</span>
                      <span>Click or drag image here</span>
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
              </div>

              <div className="game-dialog-fields">
                <div className="game-dialog-field">
                  <label>Game Name *</label>
                  <input
                    type="text"
                    className="modal-input"
                    placeholder="Enter game name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="game-dialog-field">
                  <label>Description</label>
                  <textarea
                    className="modal-input game-dialog-textarea"
                    placeholder="Enter game description (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            {game && (
              <button 
                type="button" 
                className="modal-btn-delete" 
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete Game
              </button>
            )}
            <div style={{ flex: 1 }}></div>
            <button type="button" className="modal-btn-cancel" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="modal-btn-confirm">
              {game ? "Save Changes" : "Add Game"}
            </button>
          </div>
        </form>

        {showDeleteConfirm && (
          <div className="delete-confirm-overlay">
            <div className="delete-confirm-box">
              <h4>Delete Game Profile?</h4>
              <p>This will delete the game profile and all associated data.</p>
              <p><strong>Would you like to export the configuration before deleting?</strong></p>
              <div className="delete-confirm-actions">
                <button 
                  className="modal-btn-cancel" 
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>
                <button 
                  className="modal-btn-secondary" 
                  onClick={() => onDelete(game, true)}
                >
                  Export & Delete
                </button>
                <button 
                  className="modal-btn-delete" 
                  onClick={() => onDelete(game, false)}
                >
                  Delete Without Export
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
