import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export const CodeBlock: React.FC<{ code: string; language?: string; className?: string }> = ({
  code, language, className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className={`relative rounded-xl border border-zinc-800 bg-[#0d0d0f] overflow-hidden ${className}`}>
      {language && (
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 bg-zinc-900/50">
          <span className="text-[10px] font-mono text-zinc-600">{language}</span>
          <button onClick={copy} className="text-zinc-600 hover:text-zinc-300 transition-colors">
            {copied
              ? <Check className="w-3.5 h-3.5 text-emerald-400" />
              : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
      <div className="overflow-auto max-h-80">
        <pre className="p-4 text-[11px] font-mono text-zinc-300 leading-relaxed whitespace-pre">{code}</pre>
      </div>
    </div>
  );
};
