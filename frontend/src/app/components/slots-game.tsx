import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { motion, AnimatePresence } from 'motion/react';
import { Cherry, Grape, Citrus, Diamond, Crown, Coins, Sparkles } from 'lucide-react';

const SYMBOLS = [
  { icon: Cherry, name: 'cherry', multiplier: 2, color: 'text-red-500' },
  { icon: Citrus, name: 'citrus', multiplier: 2, color: 'text-yellow-500' },
  { icon: Grape, name: 'grape', multiplier: 3, color: 'text-purple-500' },
  { icon: Coins, name: 'coins', multiplier: 5, color: 'text-yellow-600' },
  { icon: Diamond, name: 'diamond', multiplier: 10, color: 'text-cyan-500' },
  { icon: Crown, name: 'crown', multiplier: 20, color: 'text-yellow-400' },
];

interface SlotsGameProps {
  balance: number;
  onBalanceChange: (amount: number) => void;
  onGamePlayed: (game: string, bet: number, result: number) => void;
}

export function SlotsGame({ balance, onBalanceChange, onGamePlayed }: SlotsGameProps) {
  const [reels, setReels] = useState([0, 1, 2]);
  const [spinning, setSpinning] = useState(false);
  const [bet, setBet] = useState(10);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [reelStopped, setReelStopped] = useState([false, false, false]);

  const spin = () => {
    if (spinning || balance < bet) return;

    setSpinning(true);
    setLastWin(null);
    setReelStopped([false, false, false]);
    onBalanceChange(-bet);

    // Staggered stopping times for more realistic effect
    const baseDuration = 2000; // Base 2 seconds
    const stopTimes = [
      baseDuration + 200,  // First reel stops at 2.2s
      baseDuration + 400,  // Second reel stops at 2.4s
      baseDuration + 600,  // Third reel stops at 2.6s
    ];
    
    // Set final reel positions
    const newReels = [
      Math.floor(Math.random() * SYMBOLS.length),
      Math.floor(Math.random() * SYMBOLS.length),
      Math.floor(Math.random() * SYMBOLS.length),
    ];

    // Stop each reel at different times
    stopTimes.forEach((stopTime, i) => {
      setTimeout(() => {
        setReels(prev => {
          const updated = [...prev];
          updated[i] = newReels[i];
          return updated;
        });
        setReelStopped(prev => {
          const updated = [...prev];
          updated[i] = true;
          return updated;
        });

        // Check for wins after all reels stop
        if (i === 2) {
          setTimeout(() => {
            let winAmount = 0;
            if (newReels[0] === newReels[1] && newReels[1] === newReels[2]) {
              // Three of a kind
              winAmount = bet * SYMBOLS[newReels[0]].multiplier;
            } else if (newReels[0] === newReels[1] || newReels[1] === newReels[2]) {
              // Two of a kind
              winAmount = bet * 1.5;
            }

            if (winAmount > 0) {
              setLastWin(winAmount);
              onBalanceChange(winAmount);
            }

            onGamePlayed('Slots', bet, winAmount - bet);
            setSpinning(false);
          }, 300);
        }
      }, stopTime);
    });
  };

  return (
    <Card className="p-8 bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-purple-500/30 backdrop-blur-xl">
      <div className="flex flex-col items-center gap-8">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-purple-400" />
          <h2 className="text-3xl text-white">Slot Machine</h2>
          <Sparkles className="w-6 h-6 text-pink-400" />
        </div>
        
        {/* Reels */}
        <motion.div 
          className="flex gap-4 p-8 bg-slate-900/50 rounded-2xl border-2 border-purple-500/30 overflow-hidden relative"
          animate={spinning ? {
            borderColor: [
              'rgba(168, 85, 247, 0.3)',
              'rgba(236, 72, 153, 0.5)',
              'rgba(168, 85, 247, 0.3)',
            ],
            boxShadow: [
              '0 0 20px rgba(168, 85, 247, 0.2)',
              '0 0 40px rgba(236, 72, 153, 0.4)',
              '0 0 20px rgba(168, 85, 247, 0.2)',
            ],
          } : {
            borderColor: 'rgba(168, 85, 247, 0.3)',
            boxShadow: 'none',
          }}
          transition={{
            duration: 1,
            repeat: spinning ? Infinity : 0,
            ease: "easeInOut"
          }}
        >
          {/* Glow effect during spinning */}
          {spinning && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 rounded-2xl pointer-events-none"
              animate={{
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}
          
          {reels.map((reelIndex, i) => {
            const Symbol = SYMBOLS[reelIndex].icon;
            const color = SYMBOLS[reelIndex].color;
            const isStopped = reelStopped[i];
            const isSpinning = spinning && !isStopped;
            
            return (
              <motion.div
                key={`${i}-${reelIndex}-${isStopped}`}
                className="relative w-28 h-28 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center border-2 border-purple-500/50 shadow-xl overflow-hidden"
                animate={isSpinning ? { 
                  y: [0, -112, -224, -336, -448, -560, -672, -784, -896, 0],
                  rotateX: [0, 180, 360, 540, 720, 900, 1080, 1260, 1440, 0],
                  scale: [1, 1.03, 1, 1.03, 1],
                } : isStopped && spinning ? {
                  scale: [1, 1.15, 1],
                  y: 0,
                  rotateX: 0,
                } : {
                  y: 0,
                  rotateX: 0,
                  scale: 1
                }}
                transition={isSpinning ? {
                  duration: 0.12,
                  repeat: Infinity,
                  ease: "linear",
                  times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 1]
                } : isStopped && spinning ? {
                  scale: {
                    duration: 0.3,
                    ease: [0.34, 1.56, 0.64, 1], // Elastic bounce
                  },
                  y: {
                    duration: 0.3,
                    ease: "easeOut"
                  },
                  rotateX: {
                    duration: 0.3,
                    ease: "easeOut"
                  }
                } : {
                  duration: 0.4,
                  ease: [0.34, 1.56, 0.64, 1], // Elastic ease-out for snap effect
                  type: "spring",
                  stiffness: 400,
                  damping: 25
                }}
                style={{
                  filter: isSpinning ? 'blur(1px)' : 'blur(0px)',
                }}
              >
                {/* Glow effect during spinning */}
                {isSpinning && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-xl"
                    animate={{
                      opacity: [0.3, 0.7, 0.3],
                    }}
                    transition={{
                      duration: 0.4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                )}
                
                {/* Symbol with enhanced styling */}
                <motion.div
                  className="relative z-10"
                  animate={isSpinning ? {
                    scale: [1, 1.1, 1],
                    rotateZ: [0, 5, -5, 0]
                  } : {
                    scale: 1,
                    rotateZ: 0
                  }}
                  transition={isSpinning ? {
                    duration: 0.2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  } : {
                    duration: 0.2,
                    ease: "easeOut"
                  }}
                >
                  <Symbol className={`w-16 h-16 ${color} drop-shadow-lg`} />
                </motion.div>
                
                {/* Motion blur overlay during spinning */}
                {isSpinning && (
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {/* Win Animation */}
        <AnimatePresence>
          {lastWin !== null && lastWin > 0 && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-yellow-400/20 blur-2xl" />
              <div className="relative px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full">
                <p className="text-3xl text-black">🎉 Won ${lastWin}! 🎉</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bet Selection */}
        <div className="flex flex-wrap gap-3 justify-center">
          {[10, 25, 50, 100].map((amount) => (
            <Button
              key={amount}
              onClick={() => setBet(amount)}
              variant={bet === amount ? 'default' : 'outline'}
              className={`min-w-20 ${
                bet === amount 
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black border-0' 
                  : 'border-purple-500/30 hover:bg-purple-500/10'
              }`}
              disabled={spinning}
              size="lg"
            >
              ${amount}
            </Button>
          ))}
        </div>

        {/* Spin Button */}
        <Button
          onClick={spin}
          disabled={spinning || balance < bet}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-2xl py-8 rounded-xl shadow-lg shadow-purple-500/50 border-0"
          size="lg"
        >
          {spinning ? (
            <span className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                🎰
              </motion.div>
              SPINNING...
            </span>
          ) : (
            `SPIN - $${bet}`
          )}
        </Button>

        {/* Paytable */}
        <div className="w-full p-4 bg-slate-900/50 rounded-xl border border-purple-500/20">
          <p className="text-slate-400 text-sm text-center mb-2">Paytable</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
            <div>3 Matching: Up to {Math.max(...SYMBOLS.map(s => s.multiplier))}x</div>
            <div>2 Matching: 1.5x</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
