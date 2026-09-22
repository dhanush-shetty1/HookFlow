import React, { useState, useEffect } from 'react';
import { X, Volume2, VolumeX, Database, Check } from 'lucide-react';
import { playWebhookChime } from '../utils/audio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMongoConnected: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isMongoConnected
}) => {
  const [apiKey, setApiKey] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const storedKey = localStorage.getItem('hookflow_gemini_key') || '';
      const storedSound = localStorage.getItem('hookflow_sound_enabled');
      setApiKey(storedKey);
      setSoundEnabled(storedSound !== 'false');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('hookflow_gemini_key', apiKey.trim());
    localStorage.setItem('hookflow_sound_enabled', String(soundEnabled));
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 500);
  };

  const handleTestSound = () => {
    playWebhookChime();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Settings</h3>
            <p className="text-xs text-zinc-500">Configure AI keys and runtime preferences</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Gemini AI API Key */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-zinc-400">
                Gemini API Key
              </label>
              <span className="text-[10px] text-zinc-500">Optional</span>
            </div>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-700 rounded-md px-3 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none placeholder-zinc-600"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              If omitted, HookFlow uses the built-in offline AST schema synthesizer.
            </p>
          </div>

          {/* Sound Notification */}
          <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-zinc-300">
                Audio Notification
              </div>
              <p className="text-[11px] text-zinc-500">Play tone on incoming request</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleTestSound}
                className="text-[11px] text-zinc-400 hover:text-zinc-200"
              >
                Test
              </button>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-800 bg-zinc-900 text-zinc-100 accent-zinc-100"
              />
            </div>
          </div>

          {/* Storage Engine Status */}
          <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs">
            <div>
              <div className="font-medium text-zinc-300">Storage</div>
              <div className="text-[11px] text-zinc-500">
                {isMongoConnected ? 'MongoDB cluster' : 'Embedded local storage'}
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
              {isMongoConnected ? 'mongo' : 'json'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-100 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-md text-xs font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-900 transition-colors flex items-center gap-1"
          >
            {savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Saved</span>
              </>
            ) : (
              <span>Save</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
