import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { apiClient } from '../../../lib/api';
import { Mail, CheckCircle2, Copy, Check, Loader2, ArrowLeft } from 'lucide-react';

interface ForgotPasswordProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResetRequested: (token: string) => void;
}

export function ForgotPassword({ open, onOpenChange, onResetRequested }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [copied, setCopied] = useState(false);
  const [touched, setTouched] = useState(false);
  
  const emailRef = useRef<HTMLInputElement>(null);

  // Auto-focus email input when dialog opens
  useEffect(() => {
    if (open && !success) {
      setTimeout(() => emailRef.current?.focus(), 100);
    }
  }, [open, success]);

  // Email validation
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!emailValid) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.requestPasswordReset(email);
      setResetToken(response.token);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to request password reset');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToken = async () => {
    try {
      await navigator.clipboard.writeText(resetToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = resetToken;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleContinue = () => {
    if (resetToken) {
      onResetRequested(resetToken);
      onOpenChange(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setEmail('');
    setError('');
    setSuccess(false);
    setResetToken('');
    setCopied(false);
    setTouched(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-900 border-slate-800 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl flex items-center gap-2">
            <Mail className="w-6 h-6 text-purple-400" />
            {success ? 'Check Your Email' : 'Reset Password'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {success 
              ? 'We\'ve generated a password reset token for your account'
              : 'Enter your email address and we\'ll send you a reset link'
            }
          </DialogDescription>
        </DialogHeader>

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email" className="text-slate-300 flex items-center gap-2">
                Email Address
                {touched && (
                  emailValid 
                    ? <Check className="w-4 h-4 text-green-400" />
                    : <span className="text-xs text-red-400">Invalid email</span>
                )}
              </Label>
              <Input
                ref={emailRef}
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(true)}
                className={`bg-slate-800 border-slate-700 text-white ${
                  touched && !emailValid ? 'border-red-500 focus:border-red-500' : ''
                }`}
                placeholder="Enter your email address"
                required
              />
              <p className="text-xs text-slate-500">
                We'll send a password reset token to this email address
              </p>
            </div>
            
            {error && (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                {error}
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
                disabled={loading || (touched && !emailValid)}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </span>
                ) : (
                  'Send Reset Token'
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-green-400 font-semibold">Token Generated Successfully</div>
                <div className="text-slate-400 text-sm mt-1">
                  In production, this would be sent to <span className="text-white">{email}</span>. 
                  For demo purposes, use the token below.
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-300">Reset Token</Label>
              <div className="relative">
                <div className="p-3 pr-12 bg-slate-800 border border-slate-700 rounded-lg font-mono text-sm text-purple-400 break-all select-all">
                  {resetToken}
                </div>
                <button
                  type="button"
                  onClick={handleCopyToken}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                Token expires in 1 hour
              </div>
            </div>
            
            <Button
              onClick={handleContinue}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-11"
            >
              Continue to Set New Password
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
