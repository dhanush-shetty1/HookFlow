import React, { useState } from 'react';
import { X, Lock, User as UserIcon, Mail, Key, ArrowRight, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login'
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'register') {
        if (!name.trim()) throw new Error('Please enter your name');
        if (password.length < 6) throw new Error('Password must be at least 6 characters');
        const res = await api.register({ email, password, name });
        onSuccess(res.user);
        onClose();
      } else {
        const res = await api.login({ email, password });
        onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-mono">
      <div className="bg-[#0a0a0a] border border-[#222222] rounded-xl w-full max-w-md overflow-hidden shadow-2xl relative">
        {/* Header */}
        <div className="p-5 border-b border-[#222222] bg-black flex items-start justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#141414] border border-[#222222] text-[#a1a1aa] text-[11px] font-medium mb-1">
              <Lock className="w-3 h-3 text-white" />
              <span>Private Studio Vault</span>
            </div>
            <h3 className="text-base font-bold text-white">
              {mode === 'login' ? 'Sign In to Your Studio' : 'Create Your HookFlow Account'}
            </h3>
            <p className="text-xs text-[#71717a]">
              {mode === 'login'
                ? 'Access your private endpoints and isolated real-time webhook streams.'
                : 'Get dedicated private endpoints with zero data leaks and local persistence.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#71717a] hover:text-white hover:bg-[#141414] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switch Tabs */}
        <div className="flex border-b border-[#222222] bg-black p-1">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-1.5 text-xs font-medium rounded transition-all ${
              mode === 'login'
                ? 'bg-[#141414] text-white border border-[#222222] font-semibold shadow-sm'
                : 'text-[#71717a] hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 py-1.5 text-xs font-medium rounded transition-all ${
              mode === 'register'
                ? 'bg-[#141414] text-white border border-[#222222] font-semibold shadow-sm'
                : 'text-[#71717a] hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 bg-[#0a0a0a]">
          {error && (
            <div className="p-3 bg-[#f87171]/10 border border-[#f87171]/40 rounded-lg text-xs text-[#f87171] flex items-start gap-2">
              <span className="font-bold">Error:</span>
              <span>{error}</span>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a]" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Dhanush Shetty"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black border border-[#222222] focus:border-white rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-[#71717a] focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a]" />
              <input
                type="email"
                required
                placeholder="dev@hookflow.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black border border-[#222222] focus:border-white rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-[#71717a] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
              Password
            </label>
            <div className="relative">
              <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717a]" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border border-[#222222] focus:border-white rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-[#71717a] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="btn primary w-full justify-center text-xs py-2.5 font-bold"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span>{mode === 'login' ? 'Sign In' : 'Create Free Account'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              )}
            </button>
          </div>

          {/* Privacy badge */}
          <div className="pt-2 border-t border-[#222222] flex items-center justify-center gap-1.5 text-[11px] text-[#71717a]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#4ade80]" />
            <span>Encrypted JWT Sessions & Strict Isolation</span>
          </div>
        </form>
      </div>
    </div>
  );
};
