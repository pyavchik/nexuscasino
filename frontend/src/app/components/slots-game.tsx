import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';

// Classic Vegas slot symbols with multipliers
const SYMBOLS = [
  { emoji: '🍒', name: 'Cherry', multiplier: 2, color: '#ef4444' },
  { emoji: '🍋', name: 'Lemon', multiplier: 2, color: '#fbbf24' },
  { emoji: '🍊', name: 'Orange', multiplier: 2, color: '#f97316' },
  { emoji: '🔔', name: 'Bell', multiplier: 3, color: '#eab308' },
  { emoji: '💎', name: 'Diamond', multiplier: 5, color: '#06b6d4' },
  { emoji: '⭐', name: 'Star', multiplier: 5, color: '#fbbf24' },
  { emoji: '🍇', name: 'Grape', multiplier: 3, color: '#a855f7' },
  { emoji: '🃏', name: 'Joker', multiplier: 10, color: '#ec4899' },
  { emoji: '7️⃣', name: 'Seven', multiplier: 20, color: '#fbbf24' },
  { emoji: 'BAR', name: 'Bar', multiplier: 15, color: '#ffffff' },
];

interface SlotsGameProps {
  balance: number;
  onBalanceChange: (amount: number) => void;
  onGamePlayed: (game: string, bet: number, result: number) => void;
}

interface ReelState {
  position: number; // Current scroll position (in symbol heights)
  speed: number; // Current speed (symbols per second)
  targetPosition: number; // Target position to stop at
  isSpinning: boolean;
  isStopping: boolean;
  finalSymbol: number; // The symbol index to land on
  stopTime: number; // Time in seconds when this reel should start stopping
}

export function SlotsGame({ balance, onBalanceChange, onGamePlayed }: SlotsGameProps) {
  const [reels, setReels] = useState<ReelState[]>([
    { position: 0, speed: 0, targetPosition: 0, isSpinning: false, isStopping: false, finalSymbol: 0, stopTime: 0 },
    { position: 0, speed: 0, targetPosition: 0, isSpinning: false, isStopping: false, finalSymbol: 1, stopTime: 0 },
    { position: 0, speed: 0, targetPosition: 0, isSpinning: false, isStopping: false, finalSymbol: 2, stopTime: 0 },
  ]);
  const [spinning, setSpinning] = useState(false);
  const [bet, setBet] = useState(10);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [winningReels, setWinningReels] = useState<boolean[]>([false, false, false]);
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const spinStartTimeRef = useRef<number>(0);
  const hasCheckedWinRef = useRef<boolean>(false);
  const fallbackTimeoutRef = useRef<number | null>(null);

  // Physics constants
  const INITIAL_SPEED = 50; // symbols per second
  const SYMBOL_HEIGHT = 120; // Height of each symbol in pixels
  const VISIBLE_SYMBOLS = 3; // Number of fully visible symbols
  const PARTIAL_SYMBOLS = 1; // Number of partial symbols above/below

  const checkWin = useCallback((finalReels: ReelState[]) => {
    const symbols = finalReels.map(reel => reel.finalSymbol);
    
    let winAmount = 0;
    const winning: boolean[] = [false, false, false];

    // Check for three of a kind
    if (symbols[0] === symbols[1] && symbols[1] === symbols[2]) {
      winAmount = bet * SYMBOLS[symbols[0]].multiplier;
      winning[0] = winning[1] = winning[2] = true;
    } 
    // Check for two of a kind (adjacent)
    else if (symbols[0] === symbols[1]) {
      winAmount = bet * 1.5;
      winning[0] = winning[1] = true;
    } else if (symbols[1] === symbols[2]) {
      winAmount = bet * 1.5;
      winning[1] = winning[2] = true;
    }

    if (winAmount > 0) {
      setLastWin(winAmount);
      setWinningReels(winning);
      onBalanceChange(winAmount);
      
      // Clear win highlight after 3 seconds
      setTimeout(() => {
        setWinningReels([false, false, false]);
      }, 3000);
    } else {
      setWinningReels([false, false, false]);
    }

    onGamePlayed('Slots', bet, winAmount - bet);
  }, [bet, onBalanceChange, onGamePlayed]);

  // Animation loop using requestAnimationFrame for smooth 60fps
  useEffect(() => {
    const animate = (currentTime: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = currentTime;
      const deltaTime = Math.min((currentTime - lastTimeRef.current) / 1000, 0.1); // Cap deltaTime to prevent large jumps
      lastTimeRef.current = currentTime;

      setReels(prevReels => {
        const newReels = prevReels.map((reel) => {
          if (!reel.isSpinning && !reel.isStopping) return reel;

          let newPosition = reel.position;
          let newSpeed = reel.speed;
          let newIsStopping = reel.isStopping;
          let newIsSpinning = reel.isSpinning;

          if (reel.isSpinning && !reel.isStopping) {
            // Accelerate to initial speed
            newSpeed = Math.min(INITIAL_SPEED, reel.speed + INITIAL_SPEED * deltaTime * 5);
            newPosition = reel.position + newSpeed * deltaTime;
            
            // Start stopping after the predetermined stop time
            const elapsed = (currentTime - spinStartTimeRef.current) / 1000; // Convert to seconds
            
            if (elapsed > reel.stopTime) {
              newIsStopping = true;
            }
          } else if (reel.isStopping) {
            // Calculate distance to target
            const totalSymbols = SYMBOLS.length;
            let distanceToTarget = reel.targetPosition - reel.position;
            
            // Since we're using absolute positions that can be very large,
            // we need to ensure we're calculating the shortest path to target
            // Check if we should use modulo-based distance instead
            const currentMod = ((reel.position % totalSymbols) + totalSymbols) % totalSymbols;
            const targetMod = ((reel.targetPosition % totalSymbols) + totalSymbols) % totalSymbols;
            
            // Calculate modulo-based distance (shortest path around the circle)
            let modDistance = targetMod - currentMod;
            if (modDistance < 0) modDistance += totalSymbols;
            if (modDistance > totalSymbols / 2) modDistance -= totalSymbols;
            
            // Use modulo distance if it's shorter, or if absolute distance seems wrong
            if (Math.abs(modDistance) < Math.abs(distanceToTarget) || Math.abs(distanceToTarget) > totalSymbols * 3) {
              // Use modulo distance, but maintain direction
              distanceToTarget = modDistance;
            }
            
            // Calculate deceleration based on distance to target
            // As we get closer, slow down more aggressively
            const decelerationFactor = Math.max(0.85, Math.min(0.98, 0.92 + (Math.abs(distanceToTarget) / totalSymbols) * 0.06));
            newSpeed = reel.speed * Math.pow(decelerationFactor, deltaTime * 60);
            
            // If very close to target and moving slowly, gradually align
            if (Math.abs(distanceToTarget) < 0.3 && newSpeed < 2) {
              // Gradually move towards exact target position
              const alignmentSpeed = Math.min(0.5, Math.abs(distanceToTarget) * 2);
              newPosition = reel.position + Math.sign(distanceToTarget) * alignmentSpeed * deltaTime;
              newSpeed = alignmentSpeed;
              
              // Snap to final position when very close
              if (Math.abs(distanceToTarget) < 0.05) {
                newPosition = reel.targetPosition;
                newSpeed = 0;
                newIsStopping = false;
                newIsSpinning = false;
              }
            } else {
              // Continue moving with deceleration
              newPosition = reel.position + newSpeed * deltaTime;
              
              // Prevent overshooting - if we're about to pass target, slow down more
              if ((distanceToTarget > 0 && newPosition > reel.targetPosition) ||
                  (distanceToTarget < 0 && newPosition < reel.targetPosition)) {
                // We've reached/passed target - snap to it
                newPosition = reel.targetPosition;
                newSpeed = 0;
                newIsStopping = false;
                newIsSpinning = false;
              }
            }
          }

          // Don't wrap position during animation - keep absolute position for smooth scrolling
          // We'll only use modulo when rendering to determine which symbol to show

          return {
            ...reel,
            position: newPosition,
            speed: newSpeed,
            isStopping: newIsStopping,
            isSpinning: newIsSpinning,
          };
        });

        // Check if all reels have stopped
        const allStopped = newReels.every(reel => !reel.isSpinning && !reel.isStopping);
        const hasActiveReels = newReels.some(reel => reel.isSpinning || reel.isStopping);
        
        // If all reels have stopped and we haven't checked for wins yet
        if (allStopped && !hasActiveReels && spinning && !hasCheckedWinRef.current) {
          // Mark that we've checked for wins to prevent multiple calls
          hasCheckedWinRef.current = true;
          
          // All reels stopped, check for wins and stop spinning
          checkWin(newReels);
          setSpinning(false);
        }

        // Continue animation if there are active reels
        if (hasActiveReels) {
          animationFrameRef.current = requestAnimationFrame(animate);
        }

        return newReels;
      });
    };

    // Start animation if spinning
    if (spinning) {
      lastTimeRef.current = performance.now();
      spinStartTimeRef.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      // If not spinning, ensure animation stops
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [spinning, checkWin]);

  const spin = () => {
    if (spinning || balance < bet) return;

    setSpinning(true);
    setLastWin(null);
    setWinningReels([false, false, false]);
    hasCheckedWinRef.current = false; // Reset win check flag
    onBalanceChange(-bet);

    // Generate random outcomes
    const newReels: ReelState[] = reels.map((_, index) => {
      const finalSymbol = Math.floor(Math.random() * SYMBOLS.length);
      const currentPosition = reels[index].position;
      const totalSymbols = SYMBOLS.length;
      
      // Calculate how many full cycles to scroll through (at least 3-5 cycles for realism)
      const minCycles = 3;
      const maxCycles = 5;
      const cycles = minCycles + Math.floor(Math.random() * (maxCycles - minCycles + 1));
      
      // Calculate target position so final symbol naturally appears in center
      // We want: (targetPosition % totalSymbols) ≈ finalSymbol (for center alignment)
      const currentNormalized = ((currentPosition % totalSymbols) + totalSymbols) % totalSymbols;
      const cyclesAhead = cycles * totalSymbols;
      
      // Calculate distance from current normalized position to final symbol
      // Account for center offset (we want final symbol in center, not at start)
      const centerOffset = Math.floor(VISIBLE_SYMBOLS / 2); // Usually 1 (middle of 3)
      let distanceToFinal = finalSymbol - currentNormalized;
      if (distanceToFinal < 0) distanceToFinal += totalSymbols;
      
      // Add center offset so final symbol appears in center slot
      distanceToFinal += centerOffset;
      
      // Target position = current + cycles + distance to final symbol
      const targetPosition = currentPosition + cyclesAhead + distanceToFinal;
      
      // Calculate stop time with randomization (staggered: 1.5s, 1.8s, 2.1s base)
      const baseStopTime = 1.5 + index * 0.3;
      const randomVariation = (Math.random() - 0.5) * 0.2; // ±0.1s variation
      const stopTime = baseStopTime + randomVariation;
      
      return {
        position: currentPosition,
        speed: 0,
        targetPosition,
        isSpinning: true,
        isStopping: false,
        finalSymbol,
        stopTime,
      };
    });

    setReels(newReels);
    const now = performance.now();
    lastTimeRef.current = now;
    spinStartTimeRef.current = now;
    
    // Clear any existing fallback timeout
    if (fallbackTimeoutRef.current) {
      clearTimeout(fallbackTimeoutRef.current);
    }
    
    // Fallback timeout to ensure spinning stops (max 5 seconds)
    fallbackTimeoutRef.current = setTimeout(() => {
      setReels(prevReels => {
        const hasActive = prevReels.some(r => r.isSpinning || r.isStopping);
        if (hasActive && !hasCheckedWinRef.current) {
          // Force stop all reels
          const stoppedReels = prevReels.map(reel => ({
            ...reel,
            isSpinning: false,
            isStopping: false,
            speed: 0,
            position: reel.targetPosition, // Snap to target
          }));
          checkWin(stoppedReels);
          setSpinning(false);
          hasCheckedWinRef.current = true;
          return stoppedReels;
        }
        return prevReels;
      });
    }, 5000);
  };

  // Render a single reel with multiple visible symbols
  const renderReel = (reel: ReelState, index: number) => {
    const isWinning = winningReels[index];
    const isSpinning = reel.isSpinning || reel.isStopping;
    
    // Calculate which symbols to show using modulo for wrapping
    const totalSymbols = SYMBOLS.length;
    const normalizedPosition = reel.position % totalSymbols;
    const normalizedPositionPositive = normalizedPosition < 0 ? normalizedPosition + totalSymbols : normalizedPosition;
    const startSymbol = Math.floor(normalizedPositionPositive);
    const offset = normalizedPositionPositive - startSymbol;
    
    // Get symbols to display (visible + partial above/below)
    const symbolsToShow: number[] = [];
    for (let i = -PARTIAL_SYMBOLS; i < VISIBLE_SYMBOLS + PARTIAL_SYMBOLS; i++) {
      let symbolIndex = startSymbol + i;
      // Wrap around using modulo
      symbolIndex = ((symbolIndex % totalSymbols) + totalSymbols) % totalSymbols;
      symbolsToShow.push(symbolIndex);
    }

    return (
      <div
        key={index}
        className="relative w-32 h-96 overflow-hidden rounded-lg"
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e293b 100%)',
          border: `3px solid ${isWinning ? '#fbbf24' : '#475569'}`,
          boxShadow: isWinning
            ? '0 0 30px rgba(251, 191, 36, 0.8), inset 0 0 20px rgba(251, 191, 36, 0.2)'
            : 'inset 0 0 30px rgba(0, 0, 0, 0.5), 0 4px 20px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Chrome/metallic frame effect */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.3) 100%)',
            borderRadius: 'inherit',
          }}
        />
        
        {/* Motion blur overlay during spinning */}
        {isSpinning && (
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.1) 20%, rgba(255,255,255,0.1) 80%, transparent 100%)',
              filter: 'blur(2px)',
            }}
          />
        )}

        {/* Symbol container with smooth scrolling */}
        <motion.div
          className="absolute w-full"
          style={{
            top: `-${offset * SYMBOL_HEIGHT}px`,
            transition: isSpinning ? 'none' : 'top 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
          animate={isSpinning ? {
            y: 0,
          } : {}}
        >
          {symbolsToShow.map((symbolIndex, i) => {
            const symbol = SYMBOLS[symbolIndex];
            const isCenter = i === PARTIAL_SYMBOLS + Math.floor(VISIBLE_SYMBOLS / 2);
            // Check if this is the final symbol in the center position
            const normalizedFinal = ((reel.finalSymbol % totalSymbols) + totalSymbols) % totalSymbols;
            const isFinal = !isSpinning && symbolIndex === normalizedFinal && isCenter;
            
            return (
              <motion.div
                key={`${index}-${symbolIndex}-${i}`}
                className="flex items-center justify-center"
                style={{
                  height: `${SYMBOL_HEIGHT}px`,
                  fontSize: '4rem',
                  filter: isSpinning ? 'blur(1px)' : 'blur(0px)',
                  opacity: isSpinning ? 0.8 : 1,
                  transition: 'filter 0.1s, opacity 0.1s',
                }}
                animate={isFinal && isWinning ? {
                  scale: [1, 1.2, 1],
                  rotate: [0, 5, -5, 0],
                } : {
                  scale: 1,
                  rotate: 0,
                }}
                transition={{
                  duration: 0.5,
                  repeat: isFinal && isWinning ? Infinity : 0,
                  ease: 'easeInOut',
                }}
              >
                <span
                  style={{
                    textShadow: isWinning
                      ? `0 0 20px ${symbol.color}, 0 0 40px ${symbol.color}`
                      : '0 2px 10px rgba(0,0,0,0.5)',
                    filter: isWinning ? 'drop-shadow(0 0 10px currentColor)' : 'none',
                  }}
                >
                  {symbol.emoji === 'BAR' ? (
                    <span className="text-3xl font-bold text-white" style={{ textShadow: '0 0 10px rgba(255,255,255,0.8)' }}>
                      BAR
                    </span>
                  ) : (
                    symbol.emoji
                  )}
                </span>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Top and bottom masks for partial symbol visibility */}
        <div
          className="absolute top-0 left-0 right-0 h-8 pointer-events-none z-20"
          style={{
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, transparent 100%)',
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none z-20"
          style={{
            background: 'linear-gradient(0deg, rgba(15, 23, 42, 0.95) 0%, transparent 100%)',
          }}
        />

        {/* Center line indicator */}
        <div
          className="absolute top-1/2 left-0 right-0 h-1 pointer-events-none z-30"
          style={{
            transform: 'translateY(-50%)',
            background: 'linear-gradient(90deg, transparent 0%, rgba(251, 191, 36, 0.5) 50%, transparent 100%)',
            boxShadow: '0 0 10px rgba(251, 191, 36, 0.5)',
          }}
        />
      </div>
    );
  };

  return (
    <Card className="p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-yellow-500/30 backdrop-blur-xl shadow-2xl">
      <div className="flex flex-col items-center gap-8">
        {/* Vegas-style header */}
        <div className="flex items-center gap-4">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-8 h-8 text-yellow-400" />
          </motion.div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 bg-clip-text text-transparent drop-shadow-lg">
            VEGAS SLOTS
          </h2>
          <motion.div
            animate={{ rotate: [360, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-8 h-8 text-yellow-400" />
          </motion.div>
        </div>

        {/* Credits Display */}
        <div className="w-full max-w-md px-6 py-4 bg-gradient-to-r from-yellow-600/20 to-yellow-500/20 rounded-xl border-2 border-yellow-500/50">
          <div className="flex justify-between items-center">
            <span className="text-yellow-300 font-semibold">CREDITS:</span>
            <span className="text-2xl font-bold text-yellow-400">${balance.toLocaleString()}</span>
          </div>
        </div>

        {/* Reels Container */}
        <div className="relative p-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border-4 border-yellow-500/40 shadow-[0_0_40px_rgba(251,191,36,0.3)]">
          {/* Chrome frame effect */}
          <div
            className="absolute inset-0 pointer-events-none rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.3) 100%)',
            }}
          />
          
          <div className="flex gap-6 relative z-10">
            {reels.map((reel, index) => renderReel(reel, index))}
          </div>
        </div>

        {/* Win Animation */}
        <AnimatePresence>
          {lastWin !== null && lastWin > 0 && (
            <motion.div
              initial={{ scale: 0, rotate: -180, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0, rotate: 180, opacity: 0 }}
              className="relative"
            >
              <motion.div
                className="absolute inset-0 bg-yellow-400/30 blur-3xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <div className="relative px-12 py-6 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 rounded-full border-4 border-yellow-500 shadow-[0_0_30px_rgba(251,191,36,0.8)]">
                <motion.p
                  className="text-4xl font-bold text-black"
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  🎉 JACKPOT! ${lastWin.toLocaleString()} 🎉
                </motion.p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bet Selection */}
        <div className="flex flex-wrap gap-3 justify-center">
          <span className="text-yellow-300 font-semibold w-full text-center mb-2">BET AMOUNT:</span>
          {[10, 25, 50, 100].map((amount) => (
            <Button
              key={amount}
              onClick={() => setBet(amount)}
              variant={bet === amount ? 'default' : 'outline'}
              className={`min-w-24 h-12 text-lg font-bold ${
                bet === amount 
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-600 hover:to-yellow-500 text-black border-2 border-yellow-600 shadow-lg' 
                  : 'border-2 border-yellow-500/50 hover:bg-yellow-500/20 text-yellow-300'
              }`}
              disabled={spinning}
            >
              ${amount}
            </Button>
          ))}
        </div>

        {/* SPIN Button */}
        <Button
          onClick={spin}
          disabled={spinning || balance < bet}
          className="w-full max-w-md h-16 text-3xl font-bold bg-gradient-to-r from-red-600 via-red-500 to-red-600 hover:from-red-700 hover:via-red-600 hover:to-red-700 text-white border-4 border-red-700 shadow-[0_0_30px_rgba(220,38,38,0.6)] hover:shadow-[0_0_40px_rgba(220,38,38,0.8)] transition-all"
          size="lg"
        >
          {spinning ? (
            <span className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                className="text-4xl"
              >
                🎰
              </motion.div>
              <span>SPINNING...</span>
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <span>🎰</span>
              <span>SPIN</span>
              <span className="text-xl">${bet}</span>
            </span>
          )}
        </Button>

        {/* Paytable */}
        <div className="w-full max-w-2xl p-6 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl border-2 border-yellow-500/30 backdrop-blur-sm">
          <p className="text-yellow-300 font-bold text-xl text-center mb-4">PAYTABLE</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {SYMBOLS.map((symbol, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-2 rounded bg-slate-900/50 border border-yellow-500/20"
              >
                <span className="text-2xl">{symbol.emoji === 'BAR' ? 'BAR' : symbol.emoji}</span>
                <span className="text-yellow-300">{symbol.name}</span>
                <span className="ml-auto text-yellow-400 font-bold">{symbol.multiplier}x</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-yellow-500/20 text-center text-yellow-300">
            <p className="font-semibold">2 Matching: 1.5x | 3 Matching: Symbol Multiplier</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
