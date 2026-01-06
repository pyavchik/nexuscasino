import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { apiClient } from '../../../lib/api';
import { wsClient } from '../../../lib/websocket';
import { ForgotPassword } from './ForgotPassword';
import { ResetPassword } from './ResetPassword';
import { Eye, EyeOff, Check, X, Loader2 } from 'lucide-react';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthSuccess: () => void;
}

// Password strength calculation
function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score <= 4) return { score, label: 'Medium', color: 'bg-yellow-500' };
  return { score, label: 'Strong', color: 'bg-green-500' };
}

// Password requirements
const passwordRequirements = [
  { test: (p: string) => p.length >= 6, label: 'At least 6 characters' },
  { test: (p: string) => p.length >= 8, label: 'At least 8 characters (recommended)' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'Contains uppercase letter' },
  { test: (p: string) => /[a-z]/.test(p), label: 'Contains lowercase letter' },
  { test: (p: string) => /[0-9]/.test(p), label: 'Contains number' },
  { test: (p: string) => /[^a-zA-Z0-9]/.test(p), label: 'Contains special character' },
];

export function AuthDialog({ open, onOpenChange, onAuthSuccess }: AuthDialogProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const emailRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);

  // Auto-focus on first input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (isLogin) {
          emailRef.current?.focus();
        } else {
          usernameRef.current?.focus();
        }
      }, 100);
    }
  }, [open, isLogin]);

  const passwordStrength = getPasswordStrength(password);

  // Validation
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const usernameValid = username.length >= 3;
  const passwordValid = password.length >= 6;
  const confirmPasswordValid = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate all fields
    if (!isLogin) {
      if (!usernameValid) {
        setError('Username must be at least 3 characters');
        return;
      }
      if (!confirmPasswordValid) {
        setError('Passwords do not match');
        return;
      }
    }

    if (!emailValid) {
      setError('Please enter a valid email address');
      return;
    }

    if (!passwordValid) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      let response;
      if (isLogin) {
        response = await apiClient.login(email, password);
      } else {
        response = await apiClient.register(username, email, password);
      }

      localStorage.setItem('token', response.token);
      wsClient.connect(response.token);
      onAuthSuccess();
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      const errorMessage = err.message || 'Authentication failed';
      // Make error messages more user-friendly
      if (errorMessage.includes('Invalid email or password') || errorMessage.includes('401')) {
        setError('Invalid email or password. Please check your credentials and try again.');
      } else if (errorMessage.includes('User not found') || errorMessage.includes('Failed to find user')) {
        setError('No account found with this email. Please check your email or register a new account.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setTouched({});
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError('');
    resetForm();
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {isLogin ? 'Enter your credentials to access your account' : 'Fill in your details to get started'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-300 flex items-center gap-2">
                Username
                {touched.username && (
                  usernameValid 
                    ? <Check className="w-4 h-4 text-green-400" />
                    : <X className="w-4 h-4 text-red-400" />
                )}
              </Label>
              <Input
                ref={usernameRef}
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onBlur={() => handleBlur('username')}
                className={`bg-slate-800 border-slate-700 text-white ${
                  touched.username && !usernameValid ? 'border-red-500 focus:border-red-500' : ''
                }`}
                placeholder="Choose a username (min 3 chars)"
                required={!isLogin}
                minLength={3}
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-300 flex items-center gap-2">
              Email
              {touched.email && (
                emailValid 
                  ? <Check className="w-4 h-4 text-green-400" />
                  : <X className="w-4 h-4 text-red-400" />
              )}
            </Label>
            <Input
              ref={emailRef}
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => handleBlur('email')}
              className={`bg-slate-800 border-slate-700 text-white ${
                touched.email && !emailValid ? 'border-red-500 focus:border-red-500' : ''
              }`}
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-300 flex items-center gap-2">
              Password
              {!isLogin && touched.password && (
                passwordValid 
                  ? <Check className="w-4 h-4 text-green-400" />
                  : <X className="w-4 h-4 text-red-400" />
              )}
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur('password')}
                className={`bg-slate-800 border-slate-700 text-white pr-10 ${
                  touched.password && !passwordValid ? 'border-red-500 focus:border-red-500' : ''
                }`}
                placeholder="Enter your password"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            {/* Password Strength Indicator - only show for registration */}
            {!isLogin && password.length > 0 && (
              <div className="space-y-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5, 6].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-all ${
                        passwordStrength.score >= level ? passwordStrength.color : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs">
                  <span className={`${
                    passwordStrength.color === 'bg-red-500' ? 'text-red-400' :
                    passwordStrength.color === 'bg-yellow-500' ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {passwordStrength.label}
                  </span>
                </div>
                
                {/* Password Requirements */}
                <div className="mt-2 space-y-1">
                  {passwordRequirements.slice(0, 4).map((req, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      {req.test(password) 
                        ? <Check className="w-3 h-3 text-green-400" />
                        : <X className="w-3 h-3 text-slate-500" />
                      }
                      <span className={req.test(password) ? 'text-green-400' : 'text-slate-500'}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Confirm Password - only for registration */}
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-300 flex items-center gap-2">
                Confirm Password
                {touched.confirmPassword && (
                  confirmPasswordValid 
                    ? <Check className="w-4 h-4 text-green-400" />
                    : <X className="w-4 h-4 text-red-400" />
                )}
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => handleBlur('confirmPassword')}
                  className={`bg-slate-800 border-slate-700 text-white pr-10 ${
                    touched.confirmPassword && !confirmPasswordValid ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                  placeholder="Confirm your password"
                  required={!isLogin}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {touched.confirmPassword && confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-400">Passwords do not match</p>
              )}
            </div>
          )}
          
          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
              <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <span className="font-medium">{error}</span>
                {isLogin && error.includes('Invalid email or password') && (
                  <div className="mt-2 text-xs text-red-300">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(true);
                        setError('');
                      }}
                      className="underline hover:text-red-200"
                    >
                      Forgot your password?
                    </button>
                    {' or '}
                    <button
                      type="button"
                      onClick={switchMode}
                      className="underline hover:text-red-200"
                    >
                      create a new account
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-11"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {isLogin ? 'Signing in...' : 'Creating account...'}
              </span>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </Button>
          
          <div className="space-y-2">
            <div className="text-center text-sm text-slate-400">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={switchMode}
                className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                {isLogin ? 'Create one' : 'Sign in'}
              </button>
            </div>
            {isLogin && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-slate-500 hover:text-slate-400 transition-colors"
                >
                  Forgot your password?
                </button>
              </div>
            )}
          </div>
        </form>
      </DialogContent>

      {/* Forgot Password Dialog */}
      <ForgotPassword
        open={showForgotPassword}
        onOpenChange={setShowForgotPassword}
        onResetRequested={(token) => {
          setResetToken(token);
          setShowResetPassword(true);
        }}
      />

      {/* Reset Password Dialog */}
      <ResetPassword
        open={showResetPassword}
        onOpenChange={setShowResetPassword}
        token={resetToken}
        onSuccess={() => {
          setIsLogin(true);
          setResetToken('');
        }}
      />
    </Dialog>
  );
}
