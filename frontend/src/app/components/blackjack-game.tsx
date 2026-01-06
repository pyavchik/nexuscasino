import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';

interface CardType {
  value: number;
  display: string;
  suit: string;
}

const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = [
  { value: 1, display: 'A' },
  { value: 2, display: '2' },
  { value: 3, display: '3' },
  { value: 4, display: '4' },
  { value: 5, display: '5' },
  { value: 6, display: '6' },
  { value: 7, display: '7' },
  { value: 8, display: '8' },
  { value: 9, display: '9' },
  { value: 10, display: '10' },
  { value: 10, display: 'J' },
  { value: 10, display: 'Q' },
  { value: 10, display: 'K' },
];

interface BlackjackGameProps {
  balance: number;
  onBalanceChange: (amount: number) => void;
  onGamePlayed: (game: string, bet: number, result: number) => void;
}

export function BlackjackGame({ balance, onBalanceChange, onGamePlayed }: BlackjackGameProps) {
  const [playerHand, setPlayerHand] = useState<CardType[]>([]);
  const [dealerHand, setDealerHand] = useState<CardType[]>([]);
  const [gameState, setGameState] = useState<'betting' | 'playing' | 'dealer' | 'finished'>('betting');
  const [bet, setBet] = useState(10);
  const [message, setMessage] = useState('');
  const [showDealerCard, setShowDealerCard] = useState(false);
  const [isWin, setIsWin] = useState(false);

  const drawCard = (): CardType => {
    const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
    const valueObj = VALUES[Math.floor(Math.random() * VALUES.length)];
    return { ...valueObj, suit };
  };

  const calculateScore = (hand: CardType[]) => {
    let score = hand.reduce((sum, card) => sum + card.value, 0);
    let aces = hand.filter(card => card.value === 1).length;
    
    while (score <= 11 && aces > 0) {
      score += 10;
      aces--;
    }
    
    return score;
  };

  const startGame = () => {
    if (balance < bet) return;
    
    onBalanceChange(-bet);
    const newPlayerHand = [drawCard(), drawCard()];
    const newDealerHand = [drawCard(), drawCard()];
    
    setPlayerHand(newPlayerHand);
    setDealerHand(newDealerHand);
    setGameState('playing');
    setMessage('');
    setShowDealerCard(false);
    setIsWin(false);

    if (calculateScore(newPlayerHand) === 21) {
      handleStand(newPlayerHand, newDealerHand);
    }
  };

  const hit = () => {
    const newHand = [...playerHand, drawCard()];
    setPlayerHand(newHand);
    
    const score = calculateScore(newHand);
    if (score > 21) {
      endGame(newHand, dealerHand, 'bust');
    } else if (score === 21) {
      handleStand(newHand, dealerHand);
    }
  };

  const handleStand = (pHand = playerHand, dHand = dealerHand) => {
    setGameState('dealer');
    setShowDealerCard(true);
    let newDealerHand = [...dHand];

    setTimeout(() => {
      while (calculateScore(newDealerHand) < 17) {
        newDealerHand.push(drawCard());
      }
      setDealerHand(newDealerHand);
      endGame(pHand, newDealerHand, 'stand');
    }, 1000);
  };

  const endGame = (pHand: CardType[], dHand: CardType[], action: string) => {
    setShowDealerCard(true);
    const playerScore = calculateScore(pHand);
    const dealerScore = calculateScore(dHand);
    
    let result = '';
    let winAmount = 0;
    let didWin = false;

    if (action === 'bust') {
      result = 'Bust! Dealer wins.';
    } else if (dealerScore > 21) {
      result = 'Dealer busts! You win!';
      winAmount = bet * 2;
      didWin = true;
    } else if (playerScore > dealerScore) {
      result = 'You win!';
      winAmount = bet * 2;
      didWin = true;
    } else if (playerScore < dealerScore) {
      result = 'Dealer wins!';
    } else {
      result = 'Push! Bet returned.';
      winAmount = bet;
    }

    if (playerScore === 21 && pHand.length === 2 && dealerScore !== 21) {
      result = 'Blackjack! You win!';
      winAmount = bet * 2.5;
      didWin = true;
    }

    setMessage(result);
    setIsWin(didWin);
    if (winAmount > 0) {
      onBalanceChange(winAmount);
    }
    onGamePlayed('Blackjack', bet, winAmount - bet);
    setGameState('finished');
  };

  const PlayingCard = ({ card, hidden }: { card: CardType; hidden?: boolean }) => (
    <motion.div
      initial={{ scale: 0, rotateY: 180 }}
      animate={{ scale: 1, rotateY: 0 }}
      className={`w-20 h-28 rounded-xl flex flex-col items-center justify-center shadow-xl border-2 ${
        hidden 
          ? 'bg-gradient-to-br from-blue-800 to-blue-900 border-blue-600' 
          : 'bg-white border-slate-200'
      }`}
    >
      {!hidden && (
        <>
          <div className={`text-3xl ${card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : 'text-black'}`}>
            {card.display}
          </div>
          <div className={`text-2xl ${card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : 'text-black'}`}>
            {card.suit}
          </div>
        </>
      )}
      {hidden && (
        <div className="text-4xl">🂠</div>
      )}
    </motion.div>
  );

  return (
    <Card className="p-8 bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-green-500/30 backdrop-blur-xl">
      <div className="flex flex-col items-center gap-8">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-green-400" />
          <h2 className="text-3xl text-white">Blackjack</h2>
          <Sparkles className="w-6 h-6 text-emerald-400" />
        </div>
        
        {gameState !== 'betting' && (
          <div className="w-full space-y-8">
            {/* Dealer Hand */}
            <div className="flex flex-col items-center gap-3 p-4 bg-slate-900/30 rounded-xl">
              <div className="text-slate-300 text-lg">
                Dealer: {showDealerCard ? calculateScore(dealerHand) : '?'}
              </div>
              <div className="flex gap-2 flex-wrap justify-center">
                {dealerHand.map((card, i) => (
                  <PlayingCard key={i} card={card} hidden={i === 1 && !showDealerCard} />
                ))}
              </div>
            </div>

            {/* Player Hand */}
            <div className="flex flex-col items-center gap-3 p-4 bg-slate-900/30 rounded-xl border-2 border-green-500/30">
              <div className="text-white text-xl">
                You: {calculateScore(playerHand)}
              </div>
              <div className="flex gap-2 flex-wrap justify-center">
                {playerHand.map((card, i) => (
                  <PlayingCard key={i} card={card} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Result Message */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              className={`px-8 py-4 rounded-full text-2xl ${
                isWin 
                  ? 'bg-gradient-to-r from-green-400 to-emerald-400 text-black' 
                  : 'bg-gradient-to-r from-slate-600 to-slate-700 text-white'
              }`}
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Betting Phase */}
        {gameState === 'betting' && (
          <div className="w-full space-y-4">
            <div className="flex flex-wrap gap-3 justify-center">
              {[10, 25, 50, 100].map((amount) => (
                <Button
                  key={amount}
                  onClick={() => setBet(amount)}
                  variant={bet === amount ? 'default' : 'outline'}
                  className={`min-w-20 ${
                    bet === amount 
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black border-0' 
                      : 'border-green-500/30 hover:bg-green-500/10'
                  }`}
                  size="lg"
                >
                  ${amount}
                </Button>
              ))}
            </div>
            <Button
              onClick={startGame}
              disabled={balance < bet}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-2xl py-8 rounded-xl shadow-lg shadow-green-500/50 border-0"
              size="lg"
            >
              DEAL - ${bet}
            </Button>
          </div>
        )}

        {/* Playing Phase */}
        {gameState === 'playing' && (
          <div className="flex gap-4 w-full">
            <Button
              onClick={hit}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xl py-6 rounded-xl border-0"
              size="lg"
            >
              HIT
            </Button>
            <Button
              onClick={() => handleStand()}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xl py-6 rounded-xl border-0"
              size="lg"
            >
              STAND
            </Button>
          </div>
        )}

        {/* Finished Phase */}
        {gameState === 'finished' && (
          <Button
            onClick={() => setGameState('betting')}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-2xl py-8 rounded-xl shadow-lg shadow-green-500/50 border-0"
            size="lg"
          >
            NEW GAME
          </Button>
        )}

        {/* Rules */}
        <div className="w-full p-4 bg-slate-900/50 rounded-xl border border-green-500/20">
          <p className="text-slate-400 text-sm text-center">
            Get closer to 21 than the dealer without going over. Blackjack pays 2.5x!
          </p>
        </div>
      </div>
    </Card>
  );
}
