import React, { useState } from 'react';
import { Copy, Check, FileCode2 } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  showDots?: boolean;
  highlightLines?: number[];
  className?: string;
  maxHeight?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language,
  filename,
  showLineNumbers = true,
  showDots = true,
  highlightLines = [],
  className = '',
  maxHeight = 'max-h-96',
}) => {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.trimEnd().split('\n');
  const byteCount = new Blob([code]).size;
  const sizeFormatted = byteCount < 1024 ? `${byteCount} B` : `${(byteCount / 1024).toFixed(1)} KB`;

  return (
    <div className={`relative rounded-xl border border-[#222222] bg-[#0a0a0a] overflow-hidden flex flex-col shadow-[0_8px_30px_rgba(0,0,0,0.6)] ${className}`}>
      {/* Chrome header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#222222] bg-[#121212] select-none">
        <div className="flex items-center gap-3">
          {showDots && (
            <div className="flex items-center gap-1.5" aria-hidden="true">
              <span className="w-2.5 h-2.5 rounded-full bg-[#333333]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#333333]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#333333]" />
            </div>
          )}

          <div className="flex items-center gap-1.5 font-mono text-xs text-[#a1a1aa]">
            {filename && (
              <>
                <FileCode2 className="w-3.5 h-3.5 text-white" />
                <span className="text-white font-medium">{filename}</span>
              </>
            )}
            {!filename && language && (
              <span className="text-[#a1a1aa] uppercase text-[11px] tracking-wider font-semibold">{language}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px] text-[#71717a]">
          <span className="hidden sm:inline-block tabular-nums text-[#52525b]">
            {lines.length} lines · {sizeFormatted}
          </span>
          {language && filename && (
            <span className="px-1.5 py-0.5 rounded bg-[#181818] border border-[#27272a] text-[10px] uppercase text-[#a1a1aa]">
              {language}
            </span>
          )}
          <button
            onClick={copy}
            className="flex items-center gap-1 px-2 py-1 rounded bg-[#181818] border border-[#27272a] text-[#a1a1aa] hover:text-white hover:border-[#444444] transition-colors"
            title="Copy code"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-[#4ade80]" />
                <span className="text-[10px] text-[#4ade80]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span className="text-[10px]">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code body with optional line numbers */}
      <div className={`overflow-auto font-mono text-xs leading-relaxed flex-1 ${maxHeight}`}>
        <div className="flex min-w-full">
          {showLineNumbers && (
            <div
              className="py-3.5 px-3 select-none text-right font-mono text-[11px] text-[#52525b] bg-[#080808] border-r border-[#1f1f1f]"
              aria-hidden="true"
            >
              {lines.map((_, idx) => {
                const lineNum = idx + 1;
                const isHighlighted = highlightLines.includes(lineNum);
                return (
                  <div
                    key={idx}
                    className={`leading-relaxed tabular-nums ${isHighlighted ? 'text-white font-bold' : ''}`}
                  >
                    {lineNum}
                  </div>
                );
              })}
            </div>
          )}

          <pre className="py-3.5 px-4 text-[#e4e4e7] font-mono text-xs leading-relaxed overflow-x-auto flex-1 selection:bg-white/20 selection:text-white">
            {lines.map((line, idx) => {
              const lineNum = idx + 1;
              const isHighlighted = highlightLines.includes(lineNum);
              return (
                <div
                  key={idx}
                  className={`leading-relaxed ${
                    isHighlighted ? 'bg-white/5 -mx-4 px-4 border-l-2 border-white' : ''
                  }`}
                >
                  {line || ' '}
                </div>
              );
            })}
          </pre>
        </div>
      </div>
    </div>
  );
};
