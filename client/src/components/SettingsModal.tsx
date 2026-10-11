import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono">
      <div className="bg-[#0a0a0a] border border-[#222222] rounded-xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#222222] bg-black flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Settings</h3>
            <p className="text-xs text-[#71717a]">Configure AI keys and runtime preferences</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#71717a] hover:text-white hover:bg-[#141414] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 bg-[#0a0a0a]">
          {/* Gemini AI API Key */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-[#a1a1aa]">
                Gemini API Key
              </label>
              <span className="text-[10px] text-[#71717a]">Optional</span>
            </div>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-black border border-[#222222] focus:border-white rounded-md px-3 py-1.5 text-xs font-mono text-white focus:outline-none placeholder-[#71717a]"
            />
            <p className="text-[11px] text-[#71717a] mt-1 leading-relaxed">
              If omitted, HookFlow uses the built-in offline AST schema synthesizer.
            </p>
          </div>

          {/* Sound Notification */}
          <div className="pt-2 border-t border-[#222222] flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-white">
                Audio Notification
              </div>
              <p className="text-[11px] text-[#71717a]">Play tone on incoming request</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleTestSound}
                className="text-xs text-[#a1a1aa] hover:text-white hover:underline"
              >
                Test
              </button>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-[#222222] bg-black accent-white"
              />
            </div>
          </div>

          {/* Storage Engine Status */}
          <div className="pt-2 border-t border-[#222222] flex items-center justify-between text-xs">
            <div>
              <div className="font-medium text-white">Storage</div>
              <div className="text-[11px] text-[#71717a]">
                {isMongoConnected ? 'MongoDB cluster' : 'Embedded local storage'}
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black text-[#4ade80] border border-[#222222]">
              {isMongoConnected ? 'mongo' : 'json'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#222222] bg-black flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="btn text-xs py-1.5 px-3"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn primary text-xs py-1.5 px-4 font-bold flex items-center gap-1"
          >
            {savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-black" />
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
