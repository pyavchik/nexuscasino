import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react';
import { motion } from 'motion/react';

interface GameRecord {
  id: number;
  gameType: string;
  bet: number;
  result: number;
  timestamp: string;
}

interface GameHistoryProps {
  history: GameRecord[];
}

export function GameHistory({ history }: GameHistoryProps) {
  // Format currency to avoid floating-point precision issues
  const formatCurrency = (amount: number, showSign: boolean = false): string => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    
    // Add + sign for positive values if requested
    if (showSign && amount >= 0) {
      return formatted.replace('$', '+$');
    }
    return formatted;
  };

  const totalWagered = history.reduce((sum, record) => sum + record.bet, 0);
  const totalProfit = history.reduce((sum, record) => sum + record.result, 0);
  const wins = history.filter(r => r.result > 0).length;
  const losses = history.filter(r => r.result < 0).length;

  const getGameEmoji = (gameType: string) => {
    const game = gameType.toLowerCase();
    if (game.includes('slot')) return '🎰';
    if (game.includes('roulette')) return '🎡';
    if (game.includes('blackjack')) return '🃏';
    if (game.includes('dice')) return '🎲';
    return '🎮';
  };

  const formatGameName = (gameType: string) => {
    return gameType.charAt(0).toUpperCase() + gameType.slice(1);
  };

  return (
    <Card className="p-6 bg-slate-900/50 backdrop-blur-xl border-slate-800">
      <h2 className="text-2xl text-white mb-6 flex items-center gap-2">
        <Target className="w-6 h-6 text-purple-400" />
        Game History
      </h2>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-4 rounded-xl border border-blue-500/30"
        >
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-blue-400" />
            <div className="text-xs text-slate-400">Total Wagered</div>
          </div>
          <div className="text-2xl text-white">{formatCurrency(totalWagered)}</div>
        </motion.div>

        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className={`p-4 rounded-xl border ${
            totalProfit >= 0 
              ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30' 
              : 'bg-gradient-to-br from-red-500/20 to-rose-500/20 border-red-500/30'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            {totalProfit >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400" />
            )}
            <div className="text-xs text-slate-400">Total P&L</div>
          </div>
          <div className={`text-2xl ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(totalProfit, true)}
          </div>
        </motion.div>

        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-4 rounded-xl border border-green-500/30"
        >
          <div className="text-xs text-slate-400 mb-1">Wins</div>
          <div className="text-2xl text-green-400">{wins}</div>
        </motion.div>

        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-red-500/20 to-rose-500/20 p-4 rounded-xl border border-red-500/30"
        >
          <div className="text-xs text-slate-400 mb-1">Losses</div>
          <div className="text-2xl text-red-400">{losses}</div>
        </motion.div>
      </div>

      {/* History List */}
      <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800">
        <ScrollArea className="h-64">
          <div className="space-y-2 pr-4 select-text">
            {history.length === 0 ? (
              <div className="text-center text-slate-500 py-12">
                <div className="text-4xl mb-2">🎮</div>
                <div>No games played yet</div>
                <div className="text-sm mt-1">Start playing to see your history!</div>
              </div>
            ) : (
              history.map((record, index) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-800 hover:border-purple-500/30 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-2xl">{getGameEmoji(record.gameType)}</div>
                    <div className="flex-1">
                      <div className="text-white">{formatGameName(record.gameType)}</div>
                      <div className="text-xs text-slate-500">
                        {new Date(record.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Bet: {formatCurrency(record.bet)}</div>
                    <div className={`text-lg ${record.result >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(record.result, true)}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
}
