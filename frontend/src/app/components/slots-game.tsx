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

  const spin = () => {
    if (spinning || balance < bet) return;

    setSpinning(true);
    setLastWin(null);
    onBalanceChange(-bet);

    // Animation: 0.5s duration * 3 repeats = 1.5s, plus max delay (0.2s for 3rd reel) = 1.7s
    // Add buffer for smooth completion
    const animationDuration = 0.5 * 3 + 0.2 + 0.3; // 2 seconds total
    
    setTimeout(() => {
      const newReels = [
        Math.floor(Math.random() * SYMBOLS.length),
        Math.floor(Math.random() * SYMBOLS.length),
        Math.floor(Math.random() * SYMBOLS.length),
      ];
      setReels(newReels);

      // Check for wins
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
      
      // Small delay to ensure animation completes before resetting
      setTimeout(() => {
        setSpinning(false);
      }, 100);
    }, animationDuration * 1000);
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
        <div className="flex gap-4 p-8 bg-slate-900/50 rounded-2xl border-2 border-purple-500/30 overflow-hidden">
          {reels.map((reelIndex, i) => {
            const Symbol = SYMBOLS[reelIndex].icon;
            const color = SYMBOLS[reelIndex].color;
            return (
              <motion.div
                key={i}
                className="w-28 h-28 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center border-2 border-purple-500/50 shadow-xl"
                animate={spinning ? { 
                  y: [0, -120, 0],
                  rotateX: [0, 360, 720]
                } : {
                  y: 0,
                  rotateX: 0
                }}
                transition={{ 
                  duration: 0.5, 
                  repeat: spinning ? 3 : 0,
                  delay: spinning ? i * 0.1 : 0,
                  ease: "easeInOut"
                }}
              >
                <Symbol className={`w-16 h-16 ${color} drop-shadow-lg`} />
              </motion.div>
            );
          })}
        </div>

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
