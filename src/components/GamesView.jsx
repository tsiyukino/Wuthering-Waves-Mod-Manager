import { useState } from "react";

export default function GamesView({ games, onSelectGame, onAddGame, onEditGame }) {
  const [hoveredGame, setHoveredGame] = useState(null);

  function handleGameClick(game) {
    setHoveredGame(hoveredGame === game.id ? null : game.id);
  }

  function handleOpen(game) {
    onSelectGame(game);
  }

  function handleEdit(game) {
    onEditGame(game);
  }

  return (
    <div className="games-view">
      <div className="games-header">
        <h1 className="games-title">Choose The Game To Mod</h1>
      </div>

      <div className="games-scroll-container">
        <div className="games-grid">
          {games.map(game => (
            <div
              key={game.id}
              className={`game-card ${hoveredGame === game.id ? 'hovered' : ''}`}
              onClick={() => handleGameClick(game)}
            >
              <div className="game-card-image">
                {game.preview ? (
                  <img src={game.preview} alt={game.name} />
                ) : (
                  <div className="game-card-placeholder">🎮</div>
                )}
                <div className="game-card-overlay"></div>
              </div>
              <div className="game-card-name">{game.name}</div>
              
              {hoveredGame === game.id && (
                <div className="game-card-actions">
                  <button 
                    className="game-action-btn game-action-open"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpen(game);
                    }}
                  >
                    Open
                  </button>
                  <button 
                    className="game-action-btn game-action-edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(game);
                    }}
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          ))}

          <div 
            className="game-card game-card-add"
            onClick={onAddGame}
          >
            <div className="game-card-add-content">
              <div className="game-card-add-icon">+</div>
              <div className="game-card-add-text">Add Game</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
