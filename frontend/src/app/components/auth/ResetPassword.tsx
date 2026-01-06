import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { apiClient } from '../../../lib/api';
import { KeyRound, CheckCircle2, Eye, EyeOff, Check, X, Loader2, ArrowLeft } from 'lucide-react';

interface ResetPasswordProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token?: string;
  onSuccess: () => void;
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

const passwordRequirements = [
  { test: (p: string) => p.length >= 6, label: 'At least 6 characters' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'Contains uppercase letter' },
  { test: (p: string) => /[a-z]/.test(p), label: 'Contains lowercase letter' },
  { test: (p: string) => /[0-9]/.test(p), label: 'Contains number' },
];

export function ResetPassword({ open, onOpenChange, token: initialToken, onSuccess }: ResetPasswordProps) {
  const [token, setToken] = useState(initialToken || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  const tokenRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Update token when initialToken changes
  useEffect(() => {
    if (initialToken) {
      setToken(initialToken);
    }
  }, [initialToken]);

  // Auto-focus on appropriate input when dialog opens
  useEffect(() => {
    if (open && !success) {
      setTimeout(() => {
        if (initialToken) {
          passwordRef.current?.focus();
        } else {
          tokenRef.current?.focus();
        }
      }, 100);
    }
  }, [open, success, initialToken]);

  const passwordStrength = getPasswordStrength(newPassword);
  const passwordValid = newPassword.length >= 6;
  const confirmPasswordValid = newPassword === confirmPassword && confirmPassword.length > 0;
  const tokenValid = token.length > 20;
  const hasPrefilledToken = Boolean(initialToken);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!tokenValid) {
      setError('Invalid reset token');
      return;
    }

    if (!passwordValid) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!confirmPasswordValid) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await apiClient.confirmPasswordReset(token, newPassword);
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
        resetForm();
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Token may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setToken(initialToken || '');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setTouched({});
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-900 border-slate-800 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl flex items-center gap-2">
            <KeyRound className="w-6 h-6 text-purple-400" />
            {success ? 'Password Updated' : 'Set New Password'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {success 
              ? 'Your password has been successfully reset'
              : 'Enter your reset token and choose a new password'
            }
          </DialogDescription>
        </DialogHeader>

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {!hasPrefilledToken && (
              <div className="space-y-2">
                <Label htmlFor="reset-token" className="text-slate-300 flex items-center gap-2">
                  Reset Token
                  {touched.token && (
                    tokenValid 
                      ? <Check className="w-4 h-4 text-green-400" />
                      : <X className="w-4 h-4 text-red-400" />
                  )}
                </Label>
                <Input
                  ref={tokenRef}
                  id="reset-token"
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  onBlur={() => handleBlur('token')}
                  className={`bg-slate-800 border-slate-700 text-white font-mono text-sm ${
                    touched.token && !tokenValid ? 'border-red-500' : ''
                  }`}
                  placeholder="Paste your reset token here"
                  required
                  disabled={!!initialToken}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-slate-300 flex items-center gap-2">
                New Password
                {touched.password && (
                  passwordValid 
                    ? <Check className="w-4 h-4 text-green-400" />
                    : <X className="w-4 h-4 text-red-400" />
                )}
              </Label>
              <div className="relative">
                <Input
                  ref={passwordRef}
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onBlur={() => handleBlur('password')}
                  className={`bg-slate-800 border-slate-700 text-white pr-10 ${
                    touched.password && !passwordValid ? 'border-red-500' : ''
                  }`}
                  placeholder="Enter new password"
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
              
              {/* Password Strength Indicator */}
              {newPassword.length > 0 && (
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
                  <div className="flex justify-between items-center">
                    <span className={`text-xs ${
                      passwordStrength.color === 'bg-red-500' ? 'text-red-400' :
                      passwordStrength.color === 'bg-yellow-500' ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  
                  {/* Password Requirements */}
                  <div className="grid grid-cols-2 gap-1">
                    {passwordRequirements.map((req, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-xs">
                        {req.test(newPassword) 
                          ? <Check className="w-3 h-3 text-green-400" />
                          : <X className="w-3 h-3 text-slate-500" />
                        }
                        <span className={req.test(newPassword) ? 'text-green-400' : 'text-slate-500'}>
                          {req.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-slate-300 flex items-center gap-2">
                Confirm Password
                {touched.confirmPassword && (
                  confirmPasswordValid 
                    ? <Check className="w-4 h-4 text-green-400" />
                    : <X className="w-4 h-4 text-red-400" />
                )}
              </Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => handleBlur('confirmPassword')}
                  className={`bg-slate-800 border-slate-700 text-white pr-10 ${
                    touched.confirmPassword && !confirmPasswordValid ? 'border-red-500' : ''
                  }`}
                  placeholder="Confirm new password"
                  required
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
              {touched.confirmPassword && confirmPassword && !confirmPasswordValid && (
                <p className="text-xs text-red-400">Passwords do not match</p>
              )}
            </div>
            
            {error && (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2">
                <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 border-slate-700 hover:bg-slate-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Resetting...
                  </span>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <div className="text-center">
                <div className="text-green-400 font-semibold text-lg">Password Reset Successful!</div>
                <div className="text-slate-400 text-sm mt-2">
                  Your password has been updated. You will be redirected to login shortly.
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Redirecting...
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
