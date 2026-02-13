
import React, { useState, useEffect, useCallback } from 'react';
import { Card, GameState, Difficulty, Suit, Tableau } from './types';
import { createDeck, dealInitial, isValidMove, canMoveSequence, checkAndRemoveCompleteSet } from './utils/gameLogic';
import CardUI from './components/CardUI';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [selectedCards, setSelectedCards] = useState<{ colIndex: number; cardIndex: number } | null>(null);
  const [gameWon, setGameWon] = useState(false);

  const initGame = useCallback((diff: Difficulty = difficulty) => {
    const deck = createDeck(diff);
    const { tableau, remainingStock } = dealInitial(deck);
    setGameState({
      tableau,
      stock: remainingStock,
      foundations: 0,
      moves: 0,
      score: 500,
    });
    setGameWon(false);
    setSelectedCards(null);
  }, [difficulty]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handleDeal = () => {
    if (!gameState || gameState.stock.length === 0) return;
    
    // In Spider, some versions allow dealing to empty columns, but standard rules usually require all columns to have at least one card.
    // However, for user friendliness, we'll allow it but check if the user wants strict mode? 
    // Let's stick to standard: all columns must have at least one card.
    if (gameState.tableau.some(col => col.length === 0)) {
      alert("All columns must have at least one card before dealing from the stock.");
      return;
    }

    const newStock = [...gameState.stock];
    const newTableau = gameState.tableau.map(col => [...col]);

    for (let i = 0; i < 10; i++) {
      const card = newStock.pop();
      if (card) {
        card.isFaceUp = true;
        newTableau[i].push(card);
      }
    }

    setGameState({
      ...gameState,
      stock: newStock,
      tableau: newTableau,
      moves: gameState.moves + 1,
    });
  };

  const handleCardClick = (colIndex: number, cardIndex: number) => {
    if (!gameState) return;

    const column = gameState.tableau[colIndex];
    const card = column[cardIndex];

    // Case 1: Already selected cards, trying to move them to this column
    if (selectedCards) {
      // If we clicked the same selection, deselect
      if (selectedCards.colIndex === colIndex) {
        setSelectedCards(null);
        return;
      }

      const sourceCol = gameState.tableau[selectedCards.colIndex];
      const movingCards = sourceCol.slice(selectedCards.cardIndex);
      const destCol = gameState.tableau[colIndex];
      const destCard = destCol[destCol.length - 1];

      if (isValidMove(movingCards, destCard)) {
        // Move cards
        const newTableau = gameState.tableau.map((col, idx) => {
          if (idx === selectedCards.colIndex) {
            const nextCol = col.slice(0, selectedCards.cardIndex);
            if (nextCol.length > 0) nextCol[nextCol.length - 1].isFaceUp = true;
            return nextCol;
          }
          if (idx === colIndex) {
            return [...col, ...movingCards];
          }
          return col;
        });

        // Check for complete sets (K to A)
        let removedCount = 0;
        const finalTableau = newTableau.map(col => {
          const { newColumn, removed } = checkAndRemoveCompleteSet(col);
          if (removed) removedCount++;
          return newColumn;
        });

        const newFoundations = gameState.foundations + removedCount;
        
        setGameState({
          ...gameState,
          tableau: finalTableau,
          foundations: newFoundations,
          moves: gameState.moves + 1,
          score: gameState.score + (removedCount * 100) - 1,
        });

        setSelectedCards(null);

        if (newFoundations === 8) {
          setGameWon(true);
        }
      } else {
        // Invalid move, change selection if the clicked card is movable
        const potentialMovingCards = column.slice(cardIndex);
        if (canMoveSequence(potentialMovingCards)) {
          setSelectedCards({ colIndex, cardIndex });
        } else {
          setSelectedCards(null);
        }
      }
      return;
    }

    // Case 2: No cards selected, trying to select a sequence
    const movingCards = column.slice(cardIndex);
    if (canMoveSequence(movingCards)) {
      setSelectedCards({ colIndex, cardIndex });
    }
  };

  const handleEmptyColumnClick = (colIndex: number) => {
    if (!gameState || !selectedCards) return;

    const sourceCol = gameState.tableau[selectedCards.colIndex];
    const movingCards = sourceCol.slice(selectedCards.cardIndex);

    // Can always move a sequence to an empty column
    const newTableau = gameState.tableau.map((col, idx) => {
      if (idx === selectedCards.colIndex) {
        const nextCol = col.slice(0, selectedCards.cardIndex);
        if (nextCol.length > 0) nextCol[nextCol.length - 1].isFaceUp = true;
        return nextCol;
      }
      if (idx === colIndex) {
        return [...movingCards];
      }
      return col;
    });

    setGameState({
      ...gameState,
      tableau: newTableau,
      moves: gameState.moves + 1,
      score: gameState.score - 1,
    });

    setSelectedCards(null);
  };

  if (!gameState) return null;

  return (
    <div className="min-h-screen felt-gradient p-4 text-white overflow-hidden flex flex-col">
      {/* HUD */}
      <div className="flex justify-between items-center mb-6 bg-black/30 p-4 rounded-xl backdrop-blur-sm border border-white/10">
        <div className="flex gap-8">
          <div>
            <span className="text-emerald-300 text-xs font-bold uppercase tracking-wider">Score</span>
            <div className="text-2xl font-bold font-mono">{gameState.score}</div>
          </div>
          <div>
            <span className="text-emerald-300 text-xs font-bold uppercase tracking-wider">Moves</span>
            <div className="text-2xl font-bold font-mono">{gameState.moves}</div>
          </div>
          <div className="hidden sm:block">
            <span className="text-emerald-300 text-xs font-bold uppercase tracking-wider">Foundations</span>
            <div className="flex gap-1 mt-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className={`w-6 h-8 rounded border ${i < gameState.foundations ? 'bg-emerald-500 border-white' : 'bg-black/20 border-white/20'}`} />
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
           <select 
            value={difficulty} 
            onChange={(e) => {
              const d = parseInt(e.target.value) as Difficulty;
              setDifficulty(d);
              initGame(d);
            }}
            className="bg-emerald-800 text-white text-sm px-3 py-1 rounded border border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <option value={1}>1 Suit (Easy)</option>
            <option value={2}>2 Suits (Medium)</option>
            <option value={4}>4 Suits (Hard)</option>
          </select>
          <button 
            onClick={() => initGame()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-sm font-semibold transition-colors"
          >
            New Game
          </button>
        </div>
      </div>

      {/* Tableau Container */}
      <div className="flex-1 relative flex justify-center items-start overflow-x-auto">
        <div className="flex gap-1 md:gap-2 lg:gap-4 w-fit min-w-full lg:min-w-0">
          {gameState.tableau.map((column, colIdx) => (
            <div 
              key={colIdx} 
              className="relative flex flex-col items-center w-16 md:w-20 lg:w-24 min-h-[400px]"
              onClick={(e) => {
                if (column.length === 0) {
                  handleEmptyColumnClick(colIdx);
                }
              }}
            >
              {/* Slot Placeholder */}
              <div className="absolute top-0 w-full h-24 md:h-28 lg:h-36 rounded-md border-2 border-dashed border-white/10" />
              
              {column.map((card, cardIdx) => (
                <CardUI
                  key={card.id}
                  card={card}
                  isSelected={selectedCards?.colIndex === colIdx && cardIdx >= selectedCards.cardIndex}
                  onClick={() => handleCardClick(colIdx, cardIdx)}
                  style={{
                    position: 'absolute',
                    top: cardIdx * (window.innerWidth < 768 ? 16 : 24), // Dynamic stacking
                    zIndex: cardIdx,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Stock & Foundations HUD */}
      <div className="mt-8 flex justify-between items-end">
        <div className="flex items-end gap-6">
          {/* Stock */}
          <div className="flex flex-col items-center">
             <span className="text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">Stock</span>
             <div className="relative h-24 w-16 md:h-36 md:w-24">
              {gameState.stock.length > 0 ? (
                Array.from({ length: Math.ceil(gameState.stock.length / 10) }).map((_, i) => (
                  <div 
                    key={i}
                    onClick={handleDeal}
                    className="absolute cursor-pointer"
                    style={{ left: i * 4 }}
                  >
                    <CardUI card={{ id: 'back', suit: Suit.Spades, rank: 'A', isFaceUp: false }} className="hover:scale-105 active:scale-95 transition-all" />
                  </div>
                ))
              ) : (
                <div className="w-16 h-24 md:w-24 md:h-36 rounded border-2 border-dashed border-white/20 flex items-center justify-center">
                  <span className="text-white/20 text-xs">Empty</span>
                </div>
              )}
             </div>
          </div>
        </div>

        <div className="hidden lg:flex flex-col items-center">
           <span className="text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">Foundations (Completed)</span>
           <div className="flex gap-2">
             {Array.from({ length: 8 }).map((_, i) => (
               <div key={i} className="w-16 h-24 bg-black/20 border-2 border-white/10 rounded-md flex items-center justify-center relative overflow-hidden">
                 {i < gameState.foundations ? (
                   <div className="w-full h-full bg-emerald-500/50 flex items-center justify-center">
                     <span className="text-4xl">👑</span>
                   </div>
                 ) : (
                   <span className="text-white/5 text-4xl">♠</span>
                 )}
               </div>
             ))}
           </div>
        </div>
      </div>

      {/* Win Modal */}
      {gameWon && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] animate-in fade-in duration-500">
          <div className="bg-emerald-900 border-2 border-emerald-400 p-8 rounded-2xl text-center shadow-2xl max-w-sm w-full mx-4">
            <h2 className="text-4xl font-bold text-white mb-2">Victory!</h2>
            <p className="text-emerald-200 mb-6">You've completed the Spider Solitaire in {gameState.moves} moves.</p>
            <div className="bg-black/30 p-4 rounded-xl mb-8">
               <div className="text-xs text-emerald-300 uppercase font-bold">Final Score</div>
               <div className="text-4xl font-mono font-bold text-yellow-400">{gameState.score}</div>
            </div>
            <button 
              onClick={() => initGame()}
              className="w-full py-4 bg-yellow-400 hover:bg-yellow-300 text-emerald-900 font-bold rounded-xl transition-all scale-100 hover:scale-105 active:scale-95 shadow-lg shadow-yellow-400/20"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
