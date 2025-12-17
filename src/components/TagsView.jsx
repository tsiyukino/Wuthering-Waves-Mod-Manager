import { useState } from "react";
import Icon from "./IconSimple";

export default function TagsView({
  tags,
  tagMetadata,
  mods,
  selectedTag,
  searchQuery,
  onSelectTag,
  onUpdateTagMetadata,
  onEnableAllInTag,
  onDisableAllInTag,
  onSearchInMods,
  onSearchChange,
  onAddTag,
  onRemoveTag
}) {
  const [filterConflict, setFilterConflict] = useState(false);

  function getTagStatus(tagName) {
    const modsWithTag = mods.filter(m => m.tags && m.tags.includes(tagName));
    if (modsWithTag.length === 0) return { status: 'empty', color: '#999' };
    
    const enabledCount = modsWithTag.filter(m => m.enabled).length;
    const totalCount = modsWithTag.length;
    
    const metadata = tagMetadata.find(tm => tm.name === tagName);
    const isMutuallyExclusive = metadata?.mutually_exclusive || false;
    
    if (isMutuallyExclusive && enabledCount > 1) {
      return { status: 'conflict', color: '#e74c3c', text: 'Conflict' };
    }
    
    if (enabledCount === 0) {
      return { status: 'disabled', color: '#764ba2', text: 'Disabled' };
    } else if (enabledCount === totalCount) {
      return { status: 'enabled', color: '#27ae60', text: 'Enabled' };
    } else {
      return { status: 'partial', color: '#f39c12', text: 'Partial' };
    }
  }

  function getTagMetadata(tagName) {
    return tagMetadata.find(tm => tm.name === tagName) || {
      name: tagName,
      description: '',
      preview: null,
      mutually_exclusive: false
    };
  }

  let displayTags = tags;
  
  if (searchQuery) {
    displayTags = displayTags.filter(tag => 
      tag.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  
  if (filterConflict) {
    displayTags = displayTags.filter(tag => 
      getTagStatus(tag).status === 'conflict'
    );
  }

  const selectedMeta = selectedTag ? getTagMetadata(selectedTag) : null;
  const selectedStatus = selectedTag ? getTagStatus(selectedTag) : null;
  const modsWithSelectedTag = selectedTag 
    ? mods.filter(m => m.tags && m.tags.includes(selectedTag))
    : [];

  return (
    <div className="tags-view">
      <div className="tags-main">
        <div className="tags-header">
          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
            <Icon name="search" size={20} style={{ marginRight: 8 }} />
            <input
              type="text"
              className="search-input"
              placeholder="Search tags..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <button 
            className={`filter-conflict-btn ${filterConflict ? 'active' : ''}`}
            onClick={() => setFilterConflict(!filterConflict)}
          >
            {filterConflict ? '✓ ' : ''}Show Conflicts Only
          </button>
        </div>

        <div className="tags-grid">
          {displayTags.length === 0 ? (
            <div className="empty-message">
              {searchQuery || filterConflict ? "No tags match your criteria." : "No tags created yet."}
            </div>
          ) : (
            displayTags.map(tag => {
              const meta = getTagMetadata(tag);
              const status = getTagStatus(tag);
              const isSelected = tag === selectedTag;
              
              return (
                <div
                  key={tag}
                  className={`tag-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => isSelected ? onSelectTag(null) : onSelectTag(tag)}
                >
                  <div className="tag-card-preview">
                    {meta.preview ? (
                      <img src={meta.preview} alt={tag} />
                    ) : (
                      <div className="tag-card-placeholder">🏷️</div>
                    )}
                  </div>
                  <div className="tag-card-info">
                    <div className="tag-card-name">{tag}</div>
                    <div 
                      className="tag-card-status"
                      style={{ backgroundColor: status.color }}
                    >
                      {status.text || status.status}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="tags-actions">
          <button className="secondary-button" onClick={onAddTag}>
            <Icon name="add" size={18} /> Add Tag
          </button>
          <button 
            className="secondary-button" 
            onClick={onRemoveTag}
            disabled={!selectedTag}
          >
            <Icon name="delete" size={18} /> Remove Tag
          </button>
        </div>
      </div>

      {selectedMeta && (
        <div className="tags-detail">
          <TagDetail
            tag={selectedTag}
            metadata={selectedMeta}
            status={selectedStatus}
            modsCount={modsWithSelectedTag.length}
            onUpdate={onUpdateTagMetadata}
            onEnableAll={onEnableAllInTag}
            onDisableAll={onDisableAllInTag}
            onSearchInMods={onSearchInMods}
          />
        </div>
      )}
    </div>
  );
}

function TagDetail({ 
  tag, 
  metadata, 
  status, 
  modsCount, 
  onUpdate, 
  onEnableAll, 
  onDisableAll,
  onSearchInMods 
}) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(tag);
  const [description, setDescription] = useState(metadata.description || '');
  const [mutuallyExclusive, setMutuallyExclusive] = useState(metadata.mutually_exclusive || false);

  function handleNameEdit() {
    if (editedName.trim() && editedName !== tag) {
      onUpdate(tag, { ...metadata, name: editedName.trim() });
    }
    setIsEditingName(false);
  }

  function handleDescriptionChange(value) {
    setDescription(value);
    onUpdate(tag, { ...metadata, description: value });
  }

  function handleMutuallyExclusiveChange(value) {
    setMutuallyExclusive(value);
    onUpdate(tag, { ...metadata, mutually_exclusive: value });
  }

  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      onUpdate(tag, { ...metadata, preview: e.target.result });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="tag-detail-panel">
      <div className="tag-detail-header">Tag Details</div>

      <div className="tag-preview-section">
        <div className="tag-name-section">
          {isEditingName ? (
            <input
              type="text"
              className="tag-name-input"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={handleNameEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNameEdit();
                if (e.key === 'Escape') setIsEditingName(false);
              }}
              autoFocus
            />
          ) : (
            <div className="tag-name-display">
              <span className="tag-name-text">{tag}</span>
              <button className="tag-name-edit" onClick={() => { setEditedName(tag); setIsEditingName(true); }}>
                ✏️
              </button>
            </div>
          )}
        </div>

        {metadata.preview ? (
          <img src={metadata.preview} alt={tag} className="tag-preview-image" />
        ) : (
          <div className="tag-preview-placeholder">
            <span style={{ fontSize: 64 }}>🏷️</span>
          </div>
        )}
        
        <input
          type="file"
          id="tag-image-upload"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleImageUpload}
        />
        
        <button
          className="upload-btn secondary-button"
          onClick={() => document.getElementById('tag-image-upload').click()}
        >
          <Icon name="upload" size={18} /> Upload Image
        </button>
      </div>

      <div className="tag-info-section">
        <div className="tag-info-row">
          <span className="tag-info-label">Status:</span>
          <span className="tag-info-value" style={{ color: status.color, fontWeight: 600 }}>
            {status.text || status.status}
          </span>
        </div>
        <div className="tag-info-row">
          <span className="tag-info-label">Mods:</span>
          <span className="tag-info-value">{modsCount}</span>
        </div>
      </div>

      <div className="tag-actions">
        <button 
          className="secondary-button"
          onClick={() => onEnableAll(tag)}
        >
          <Icon name="enable" size={18} /> Enable
        </button>
        <button 
          className="secondary-button"
          onClick={() => onDisableAll(tag)}
        >
          <Icon name="disable" size={18} /> Disable
        </button>
        <button 
          className="secondary-button"
          onClick={() => onSearchInMods(tag)}
        >
          <Icon name="find" size={18} /> Find
        </button>
      </div>

      <div className="tag-description-section">
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Description</div>
        <textarea
          className="tag-description-textarea"
          value={description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          placeholder="Add description for this tag..."
        />
      </div>

      <div className="tag-exclusive-section">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={mutuallyExclusive}
            onChange={(e) => handleMutuallyExclusiveChange(e.target.checked)}
          />
          <span>Mutually Exclusive</span>
          <span className="tooltip-trigger" title="Only one mod with this tag should be enabled at a time">
            ⓘ
          </span>
        </label>
        {mutuallyExclusive && status.status === 'conflict' && (
          <div className="conflict-warning">
            ⚠️ Multiple mods are enabled with this tag!
          </div>
        )}
      </div>
    </div>
  );
}
