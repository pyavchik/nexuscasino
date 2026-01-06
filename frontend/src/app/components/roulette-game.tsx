import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';

const NUMBERS = Array.from({ length: 37 }, (_, i) => i);
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

interface RouletteGameProps {
  balance: number;
  onBalanceChange: (amount: number) => void;
  onGamePlayed: (game: string, bet: number, result: number) => void;
}

export function RouletteGame({ balance, onBalanceChange, onGamePlayed }: RouletteGameProps) {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [bet, setBet] = useState(10);
  const [betType, setBetType] = useState<'red' | 'black' | 'even' | 'odd'>('red');
  const [rotation, setRotation] = useState(0);
  const [won, setWon] = useState(false);

  const spin = () => {
    if (spinning || balance < bet) return;

    setSpinning(true);
    setResult(null);
    setWon(false);
    onBalanceChange(-bet);

    const winningNumber = Math.floor(Math.random() * 37);
    const spins = 5 + Math.random() * 3;
    const newRotation = rotation + 360 * spins + (winningNumber / 37) * 360;
    setRotation(newRotation);

    setTimeout(() => {
      setResult(winningNumber);
      
      let didWin = false;
      if (betType === 'red' && RED_NUMBERS.includes(winningNumber)) didWin = true;
      if (betType === 'black' && BLACK_NUMBERS.includes(winningNumber)) didWin = true;
      if (betType === 'even' && winningNumber > 0 && winningNumber % 2 === 0) didWin = true;
      if (betType === 'odd' && winningNumber % 2 === 1) didWin = true;

      setWon(didWin);
      const winAmount = didWin ? bet * 2 : 0;
      if (winAmount > 0) {
        onBalanceChange(winAmount);
      }

      onGamePlayed('Roulette', bet, winAmount - bet);
      setSpinning(false);
    }, 4000);
  };

  const getNumberColor = (num: number) => {
    if (num === 0) return 'green';
    return RED_NUMBERS.includes(num) ? 'red' : 'black';
  };

  return (
    <Card className="p-8 bg-gradient-to-br from-red-900/40 to-orange-900/40 border-red-500/30 backdrop-blur-xl">
      <div className="flex flex-col items-center gap-8">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-red-400" />
          <h2 className="text-3xl text-white">Roulette</h2>
          <Sparkles className="w-6 h-6 text-orange-400" />
        </div>
        
        {/* Roulette Wheel */}
        <div className="relative w-72 h-72">
          {/* Outer Ring */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-600 to-yellow-700 p-2 shadow-2xl">
            {/* Inner Wheel */}
            <motion.div
              className="relative w-full h-full rounded-full bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center overflow-hidden border-4 border-yellow-500"
              animate={{ rotate: rotation }}
              transition={{ duration: 4, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {/* Wheel Segments */}
              {NUMBERS.slice(0, 12).map((num, i) => {
                const angle = (i / 12) * 360;
                return (
                  <div
                    key={num}
                    className="absolute w-1 h-32 origin-bottom"
                    style={{
                      transform: `rotate(${angle}deg)`,
                      left: '50%',
                      bottom: '50%',
                    }}
                  >
                    <div className={`w-full h-full ${i % 2 === 0 ? 'bg-red-600' : 'bg-black'}`} />
                  </div>
                );
              })}
              
              {/* Center */}
              <div className="relative z-10 w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-xl">
                <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-yellow-400" />
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* Pointer */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20">
            <div className="w-0 h-0 border-l-8 border-r-8 border-t-12 border-l-transparent border-r-transparent border-t-white drop-shadow-lg" />
          </div>
        </div>

        {/* Result Display */}
        <AnimatePresence>
          {result !== null && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              className="flex flex-col items-center gap-2"
            >
              <div 
                className={`text-5xl rounded-full w-20 h-20 flex items-center justify-center shadow-2xl ${
                  getNumberColor(result) === 'red' ? 'bg-red-600' : 
                  getNumberColor(result) === 'black' ? 'bg-black' : 'bg-green-600'
                } text-white border-4 border-white`}
              >
                {result}
              </div>
              <div className={`text-2xl px-6 py-2 rounded-full ${
                won 
                  ? 'bg-gradient-to-r from-green-400 to-emerald-400 text-black' 
                  : 'bg-gradient-to-r from-red-400 to-rose-400 text-white'
              }`}>
                {won ? `Won $${bet * 2}! 🎉` : 'Try Again!'}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bet Type Selection */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
          {(['red', 'black', 'even', 'odd'] as const).map((type) => (
            <Button
              key={type}
              onClick={() => setBetType(type)}
              variant={betType === type ? 'default' : 'outline'}
              className={`${
                betType === type 
                  ? type === 'red' ? 'bg-red-600 hover:bg-red-700 border-0' :
                    type === 'black' ? 'bg-black hover:bg-slate-900 border-0' :
                    'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black border-0'
                  : 'border-red-500/30 hover:bg-red-500/10'
              }`}
              disabled={spinning}
              size="lg"
            >
              {type.toUpperCase()}
            </Button>
          ))}
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
                  : 'border-red-500/30 hover:bg-red-500/10'
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
          className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white text-2xl py-8 rounded-xl shadow-lg shadow-red-500/50 border-0"
          size="lg"
        >
          {spinning ? (
            <span className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                🎡
              </motion.div>
              SPINNING...
            </span>
          ) : (
            `SPIN - $${bet}`
          )}
        </Button>

        {/* Info */}
        <div className="w-full p-4 bg-slate-900/50 rounded-xl border border-red-500/20">
          <p className="text-slate-400 text-sm text-center">Win 2x your bet on correct prediction</p>
        </div>
      </div>
    </Card>
  );
}
