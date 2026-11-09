import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Simple, robust markdown block parser
  const renderFormattedText = (text: string) => {
    // Process code blocks first
    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        const lang = lines[0].trim();
        const code = lines.length > 1 ? lines.slice(1).join('\n') : lines[0];

        return <CodeBlock key={index} code={code} language={lang} />;
      }

      // Inline elements parsing
      return <ParagraphBlock key={index} text={part} />;
    });
  };

  return <div className="space-y-3 leading-relaxed text-[18px]">{renderFormattedText(content)}</div>;
};

const CodeBlock: React.FC<{ code: string; language?: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-900 text-stone-100 overflow-hidden font-mono text-sm shadow-sm">
      <div className="flex items-center justify-between px-4 py-1.5 bg-stone-800/80 border-b border-stone-800 text-xs text-stone-400">
        <span>{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-stone-700/60 text-stone-300 transition-colors"
          title="Sao chép mã"
        >
          {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-[16px] leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
};

const ParagraphBlock: React.FC<{ text: string }> = ({ text }) => {
  if (!text.trim()) return null;

  const lines = text.split('\n');
  return (
    <div className="space-y-2">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Headers
        if (trimmed.startsWith('### ')) {
          return <h3 key={idx} className="text-lg font-semibold text-stone-900 dark:text-stone-100 pt-2 pb-1">{renderInline(trimmed.slice(4))}</h3>;
        }
        if (trimmed.startsWith('## ')) {
          return <h2 key={idx} className="text-xl font-bold text-stone-900 dark:text-stone-100 pt-3 pb-1">{renderInline(trimmed.slice(3))}</h2>;
        }
        if (trimmed.startsWith('# ')) {
          return <h1 key={idx} className="text-2xl font-bold text-stone-900 dark:text-stone-100 pt-4 pb-2">{renderInline(trimmed.slice(2))}</h1>;
        }

        // Bullet lists
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-2 text-stone-800 dark:text-stone-200">
              <span className="text-amber-500 font-bold mt-1 text-xs">•</span>
              <span className="flex-1">{renderInline(trimmed.slice(2))}</span>
            </div>
          );
        }

        // Numbered lists
        const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numberedMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2 text-stone-800 dark:text-stone-200">
              <span className="font-semibold text-stone-500 text-xs mt-0.5 min-w-[16px]">{numberedMatch[1]}.</span>
              <span className="flex-1">{renderInline(numberedMatch[2])}</span>
            </div>
          );
        }

        // Blockquote
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote key={idx} className="border-l-3 border-amber-500 pl-3.5 py-1 italic text-stone-600 dark:text-stone-400 bg-stone-100/50 dark:bg-stone-900/40 rounded-r-lg">
              {renderInline(trimmed.slice(2))}
            </blockquote>
          );
        }

        // Standard paragraph
        return (
          <p key={idx} className="text-stone-800 dark:text-stone-200">
            {renderInline(line)}
          </p>
        );
      })}
    </div>
  );
};

function renderInline(text: string): React.ReactNode {
  // Regex to parse **bold**, *italic*, `inline code`, and [links](url)
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\))/g);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-stone-900 dark:text-stone-50">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i} className="italic text-stone-700 dark:text-stone-300">{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-amber-600 dark:text-amber-400 font-mono text-[16px] border border-stone-200 dark:border-stone-700">
          {part.slice(1, -1)}
        </code>
      );
    }
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      return (
        <a
          key={i}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:opacity-80"
        >
          {linkMatch[1]}
        </a>
      );
    }
    return part;
  });
}
