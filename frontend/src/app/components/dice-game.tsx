import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';

interface DiceGameProps {
  balance: number;
  onBalanceChange: (amount: number) => void;
  onGamePlayed: (game: string, bet: number, result: number) => void;
}

export function DiceGame({ balance, onBalanceChange, onGamePlayed }: DiceGameProps) {
  const [dice1, setDice1] = useState(1);
  const [dice2, setDice2] = useState(1);
  const [rolling, setRolling] = useState(false);
  const [bet, setBet] = useState(10);
  const [betType, setBetType] = useState<'under7' | '7' | 'over7'>('over7');
  const [lastResult, setLastResult] = useState<{ total: number; won: boolean } | null>(null);

  const rollDice = () => {
    if (rolling || balance < bet) return;

    setRolling(true);
    setLastResult(null);
    onBalanceChange(-bet);

    let rolls = 0;
    const interval = setInterval(() => {
      setDice1(Math.floor(Math.random() * 6) + 1);
      setDice2(Math.floor(Math.random() * 6) + 1);
      rolls++;
      
      if (rolls >= 15) {
        clearInterval(interval);
        const finalDice1 = Math.floor(Math.random() * 6) + 1;
        const finalDice2 = Math.floor(Math.random() * 6) + 1;
        setDice1(finalDice1);
        setDice2(finalDice2);
        
        const total = finalDice1 + finalDice2;
        let won = false;
        let multiplier = 0;

        if (betType === 'under7' && total < 7) {
          won = true;
          multiplier = 2;
        } else if (betType === '7' && total === 7) {
          won = true;
          multiplier = 5;
        } else if (betType === 'over7' && total > 7) {
          won = true;
          multiplier = 2;
        }

        const winAmount = won ? bet * multiplier : 0;
        setLastResult({ total, won });
        
        if (winAmount > 0) {
          onBalanceChange(winAmount);
        }
        
        onGamePlayed('Dice', bet, winAmount - bet);
        setRolling(false);
      }
    }, 100);
  };

  const DiceFace = ({ value }: { value: number }) => {
    const renderDots = () => {
      const positions: { [key: number]: string[] } = {
        1: ['center'],
        2: ['top-left', 'bottom-right'],
        3: ['top-left', 'center', 'bottom-right'],
        4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
        5: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
        6: ['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right'],
      };

      const dotPositions: { [key: string]: string } = {
        'top-left': 'top-2 left-2',
        'top-right': 'top-2 right-2',
        'middle-left': 'top-1/2 -translate-y-1/2 left-2',
        'middle-right': 'top-1/2 -translate-y-1/2 right-2',
        'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
        'bottom-left': 'bottom-2 left-2',
        'bottom-right': 'bottom-2 right-2',
      };

      return positions[value].map((pos, i) => (
        <div
          key={i}
          className={`absolute w-3 h-3 bg-blue-600 rounded-full ${dotPositions[pos]}`}
        />
      ));
    };

    return (
      <div className="relative w-24 h-24 bg-white rounded-2xl shadow-2xl border-4 border-slate-200">
        {renderDots()}
      </div>
    );
  };

  return (
    <Card className="p-8 bg-gradient-to-br from-blue-900/40 to-cyan-900/40 border-blue-500/30 backdrop-blur-xl">
      <div className="flex flex-col items-center gap-8">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-blue-400" />
          <h2 className="text-3xl text-white">Dice Game</h2>
          <Sparkles className="w-6 h-6 text-cyan-400" />
        </div>
        
        {/* Dice Display */}
        <div className="flex gap-6 p-8 bg-slate-900/50 rounded-2xl border-2 border-blue-500/30">
          <motion.div
            animate={rolling ? { 
              rotateX: [0, 360, 720],
              rotateY: [0, 360, 720],
            } : {}}
            transition={{ duration: 0.1, repeat: rolling ? Infinity : 0 }}
          >
            <DiceFace value={dice1} />
          </motion.div>
          <motion.div
            animate={rolling ? { 
              rotateX: [0, -360, -720],
              rotateY: [0, -360, -720],
            } : {}}
            transition={{ duration: 0.1, repeat: rolling ? Infinity : 0 }}
          >
            <DiceFace value={dice2} />
          </motion.div>
        </div>

        {/* Total Display */}
        {!rolling && !lastResult && (
          <div className="text-white text-3xl px-8 py-3 bg-slate-900/50 rounded-full border border-blue-500/30">
            Total: {dice1 + dice2}
          </div>
        )}

        {/* Result Animation */}
        <AnimatePresence>
          {lastResult && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              className="flex flex-col items-center gap-2"
            >
              <div className="text-white text-4xl px-8 py-3 bg-slate-900/80 rounded-full border-2 border-blue-400">
                Total: {lastResult.total}
              </div>
              <div className={`text-2xl px-6 py-2 rounded-full ${
                lastResult.won 
                  ? 'bg-gradient-to-r from-green-400 to-emerald-400 text-black' 
                  : 'bg-gradient-to-r from-red-400 to-rose-400 text-white'
              }`}>
                {lastResult.won 
                  ? `Won $${betType === '7' ? bet * 5 : bet * 2}! 🎉` 
                  : 'Try Again!'}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bet Type Selection */}
        <div className="grid grid-cols-3 gap-3 w-full">
          <Button
            onClick={() => setBetType('under7')}
            variant={betType === 'under7' ? 'default' : 'outline'}
            className={`h-16 ${
              betType === 'under7' 
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 border-0' 
                : 'border-blue-500/30 hover:bg-blue-500/10'
            }`}
            disabled={rolling}
          >
            <div className="text-center">
              <div className="text-lg">Under 7</div>
              <div className="text-xs opacity-75">2x payout</div>
            </div>
          </Button>
          <Button
            onClick={() => setBetType('7')}
            variant={betType === '7' ? 'default' : 'outline'}
            className={`h-16 ${
              betType === '7' 
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black border-0' 
                : 'border-blue-500/30 hover:bg-blue-500/10'
            }`}
            disabled={rolling}
          >
            <div className="text-center">
              <div className="text-lg">Lucky 7</div>
              <div className="text-xs opacity-75">5x payout</div>
            </div>
          </Button>
          <Button
            onClick={() => setBetType('over7')}
            variant={betType === 'over7' ? 'default' : 'outline'}
            className={`h-16 ${
              betType === 'over7' 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-0' 
                : 'border-blue-500/30 hover:bg-blue-500/10'
            }`}
            disabled={rolling}
          >
            <div className="text-center">
              <div className="text-lg">Over 7</div>
              <div className="text-xs opacity-75">2x payout</div>
            </div>
          </Button>
        </div>

        {/* Bet Amount Selection */}
        <div className="flex flex-wrap gap-3 justify-center">
          {[10, 25, 50, 100].map((amount) => (
            <Button
              key={amount}
              onClick={() => setBet(amount)}
              variant={bet === amount ? 'default' : 'outline'}
              className={`min-w-20 ${
                bet === amount 
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black border-0' 
                  : 'border-blue-500/30 hover:bg-blue-500/10'
              }`}
              disabled={rolling}
              size="lg"
            >
              ${amount}
            </Button>
          ))}
        </div>

        {/* Roll Button */}
        <Button
          onClick={rollDice}
          disabled={rolling || balance < bet}
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-2xl py-8 rounded-xl shadow-lg shadow-blue-500/50 border-0"
          size="lg"
        >
          {rolling ? (
            <span className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                🎲
              </motion.div>
              ROLLING...
            </span>
          ) : (
            `ROLL - $${bet}`
          )}
        </Button>

        {/* Info */}
        <div className="w-full p-4 bg-slate-900/50 rounded-xl border border-blue-500/20">
          <p className="text-slate-400 text-sm text-center">
            Predict the total of two dice. Lucky 7 pays 5x!
          </p>
        </div>
      </div>
    </Card>
  );
}
