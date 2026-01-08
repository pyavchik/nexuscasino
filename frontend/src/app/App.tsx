import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Card } from './components/ui/card';
import { Button } from './components/ui/button';
import { SlotsGame } from './components/slots-game';
import { RouletteGame } from './components/roulette-game';
import { BlackjackGame } from './components/blackjack-game';
import { DiceGame } from './components/dice-game';
import { GameHistory } from './components/game-history';
import { LiveChat } from './components/chat/LiveChat';
import { AuthDialog } from './components/auth/AuthDialog';
import { Wallet, Sparkles, Trophy, Gamepad2, LogOut, User } from 'lucide-react';
import { motion } from 'motion/react';
import { apiClient, GameRecord, User as UserType } from '../lib/api';
import { wsClient } from '../lib/websocket';

export default function App() {
  const [balance, setBalance] = useState(1000);
  const [gameHistory, setGameHistory] = useState<GameRecord[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [resetPasswordToken, setResetPasswordToken] = useState<string | null>(null);

  // Check for reset password token in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      console.log('🔵 [App] Reset password token found in URL:', token.substring(0, 20) + '...');
      setResetPasswordToken(token);
      setAuthDialogOpen(true);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      wsClient.connect(token);
      loadUserData();
      loadCurrentUser();
    }
    return () => {
      wsClient.disconnect();
    };
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await apiClient.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading current user:', error);
      // If token is invalid, logout
      handleLogout();
    }
  };

  const loadUserData = async () => {
    try {
      const balance = await apiClient.getBalance();
      setBalance(balance);
      const history = await apiClient.getGameHistory();
      setGameHistory(history);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleBalanceChange = (amount: number) => {
    setBalance(prev => prev + amount);
  };

  const handleGamePlayed = async (game: string, bet: number, result: number) => {
    try {
      if (isAuthenticated) {
        // Calculate winAmount from result (result = winAmount - bet)
        // So winAmount = result + bet
        const winAmount = result + bet;
        await apiClient.playGame(game, bet, winAmount);
        await loadUserData();
      } else {
        // Demo mode - local state only
        const newRecord: GameRecord = {
          id: Date.now(),
          gameType: game,
          bet,
          result,
          timestamp: new Date().toISOString(),
        };
        setGameHistory(prev => [newRecord, ...prev]);
      }
    } catch (error) {
      console.error('Error saving game result:', error);
    }
  };

  const addFunds = () => {
    setBalance(prev => prev + 500);
  };

  const resetBalance = async () => {
    if (isAuthenticated) {
      try {
        // Reset balance on backend
        const updatedUser = await apiClient.resetBalance();
        setBalance(updatedUser.balance);
        // Clear game history on backend
        await apiClient.clearGameHistory();
        // Reload data to ensure consistency
        await loadUserData();
      } catch (error) {
        console.error('Error resetting balance:', error);
        // Fallback to local reset if backend fails
        setBalance(1000);
        setGameHistory([]);
      }
    } else {
      // Demo mode - just reset local state
      setBalance(1000);
      setGameHistory([]);
    }
  };

  const handleLogout = () => {
    // Clear token
    localStorage.removeItem('token');
    
    // Disconnect WebSocket
    wsClient.disconnect();
    
    // Reset authentication state
    setIsAuthenticated(false);
    setCurrentUser(null);
    
    // Reset to demo mode
    setBalance(1000);
    setGameHistory([]);
  };

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

  const totalProfit = gameHistory.reduce((sum, record) => sum + record.result, 0);
  const winRate = gameHistory.length > 0 
    ? ((gameHistory.filter(g => g.result > 0).length / gameHistory.length) * 100).toFixed(0)
    : 0;

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden select-none">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="relative">
              <Sparkles className="w-10 h-10 text-yellow-400" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0"
              >
                <Sparkles className="w-10 h-10 text-purple-400 opacity-50" />
              </motion.div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent select-none">
              NEXUS CASINO
            </h1>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-6 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-500/20 rounded-xl">
                    <Wallet className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-slate-400">Balance</div>
                    <div className="text-2xl text-white">{formatCurrency(balance)}</div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button 
                    onClick={addFunds}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black"
                    size="sm"
                  >
                    Add $500
                  </Button>
                  <Button 
                    onClick={resetBalance}
                    variant="outline"
                    className="flex-1 border-yellow-500/30 hover:bg-yellow-500/10"
                    size="sm"
                  >
                    Reset
                  </Button>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-500/20 rounded-xl">
                    <Gamepad2 className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">Games Played</div>
                    <div className="text-2xl text-white">{gameHistory.length}</div>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className={`p-6 backdrop-blur-xl border-opacity-20 ${
                totalProfit >= 0 
                  ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20' 
                  : 'bg-gradient-to-br from-red-500/10 to-rose-500/10 border-red-500/20'
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${totalProfit >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                    <Trophy className={`w-6 h-6 ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`} />
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">Total P&L</div>
                    <div className={`text-2xl ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(totalProfit, true)}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="p-6 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-cyan-500/20 rounded-xl">
                    <Sparkles className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">Win Rate</div>
                    <div className="text-2xl text-white">{winRate}%</div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        {/* Games Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2"
          >
            <Tabs defaultValue="slots" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-4 bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-1">
                <TabsTrigger 
                  value="slots"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600"
                >
                  🎰 Slots
                </TabsTrigger>
                <TabsTrigger 
                  value="roulette"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-orange-600"
                >
                  🎡 Roulette
                </TabsTrigger>
                <TabsTrigger 
                  value="blackjack"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600"
                >
                  🃏 Blackjack
                </TabsTrigger>
                <TabsTrigger 
                  value="dice"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600"
                >
                  🎲 Dice
                </TabsTrigger>
              </TabsList>

              <TabsContent value="slots">
                <SlotsGame
                  balance={balance}
                  onBalanceChange={handleBalanceChange}
                  onGamePlayed={handleGamePlayed}
                />
              </TabsContent>

              <TabsContent value="roulette">
                <RouletteGame
                  balance={balance}
                  onBalanceChange={handleBalanceChange}
                  onGamePlayed={handleGamePlayed}
                />
              </TabsContent>

              <TabsContent value="blackjack">
                <BlackjackGame
                  balance={balance}
                  onBalanceChange={handleBalanceChange}
                  onGamePlayed={handleGamePlayed}
                />
              </TabsContent>

              <TabsContent value="dice">
                <DiceGame
                  balance={balance}
                  onBalanceChange={handleBalanceChange}
                  onGamePlayed={handleGamePlayed}
                />
              </TabsContent>
            </Tabs>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <GameHistory history={gameHistory} />
          </motion.div>
        </div>

        {/* Footer Disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="mt-6 p-4 bg-slate-900/50 backdrop-blur-xl border-slate-800">
            <p className="text-slate-500 text-sm text-center">
              🔞 Demo casino for entertainment only • Virtual currency • No real money involved
            </p>
          </Card>
        </motion.div>
      </div>

      {/* Live Chat */}
      <LiveChat isOpen={chatOpen} onToggle={() => setChatOpen(!chatOpen)} />

      {/* Auth Dialog */}
      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        onAuthSuccess={() => {
          setIsAuthenticated(true);
          loadUserData();
          loadCurrentUser();
        }}
        initialResetToken={resetPasswordToken || undefined}
      />

      {/* Authentication UI */}
      {isAuthenticated ? (
        <div className="fixed top-4 right-4 z-20">
          <Card className="px-4 py-3 bg-slate-900/90 backdrop-blur-xl border-slate-800 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 select-text">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <User className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex flex-col">
                  <div className="text-white text-sm font-semibold">
                    {currentUser?.username || 'User'}
                  </div>
                  <div className="text-slate-400 text-xs">
                    {currentUser?.email}
                  </div>
                </div>
              </div>
              <div className="h-6 w-px bg-slate-700"></div>
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white hover:bg-slate-800/50 h-8 px-3"
              >
                <LogOut className="w-4 h-4 mr-1.5" />
                Logout
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        <Button
          onClick={() => setAuthDialogOpen(true)}
          className="fixed top-4 right-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 z-20"
        >
          Login / Register
        </Button>
      )}
    </div>
  );
}
