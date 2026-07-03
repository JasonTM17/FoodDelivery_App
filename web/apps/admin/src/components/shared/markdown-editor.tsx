'use client';

import {
  Fragment,
  useState,
  type ComponentType,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { useTranslations } from 'next-intl';
import { Bold, Code, Eye, Italic, LinkIcon, List, ListOrdered, Quote, Underline } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  preview?: boolean;
}

type ToolbarLabelKey =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'quote'
  | 'code'
  | 'link'
  | 'bulletList'
  | 'numberedList';

type ToolbarAction = {
  icon: ComponentType<{ className?: string }>;
  labelKey: ToolbarLabelKey;
  prefix: string;
  suffix: string;
  block?: boolean;
};

const toolbarActions: ToolbarAction[] = [
  { icon: Bold, labelKey: 'bold', prefix: '**', suffix: '**' },
  { icon: Italic, labelKey: 'italic', prefix: '*', suffix: '*' },
  { icon: Underline, labelKey: 'underline', prefix: '<u>', suffix: '</u>' },
  { icon: Quote, labelKey: 'quote', prefix: '> ', suffix: '', block: true },
  { icon: Code, labelKey: 'code', prefix: '`', suffix: '`' },
  { icon: LinkIcon, labelKey: 'link', prefix: '[', suffix: '](url)' },
  { icon: List, labelKey: 'bulletList', prefix: '- ', suffix: '', block: true },
  { icon: ListOrdered, labelKey: 'numberedList', prefix: '1. ', suffix: '', block: true },
];

const renderInlinePreview = (text: string): ReactNode[] => {
  const parts: ReactNode[] = [];
  const tokenPattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenPattern.exec(text)) !== null) {
    if (match.index > cursor) {
      parts.push(<Fragment key={`text-${cursor}`}>{text.slice(cursor, match.index)}</Fragment>);
    }

    const token = match[0];
    const key = `${match.index}-${token}`;
    if (token.startsWith('**')) {
      parts.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('`')) {
      parts.push(
        <code key={key} className="rounded bg-muted px-1 text-xs">
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      parts.push(<em key={key}>{token.slice(1, -1)}</em>);
    }
    cursor = match.index + token.length;
  }

  if (cursor < text.length) {
    parts.push(<Fragment key={`text-${cursor}`}>{text.slice(cursor)}</Fragment>);
  }

  return parts;
};

const renderPreview = (text: string) => {
  return text.split('\n').map((line, index) => {
    const key = `${index}-${line}`;
    if (!line.trim()) {
      return <br key={key} />;
    }

    if (line.startsWith('> ')) {
      return (
        <blockquote key={key} className="my-1 border-l-2 border-muted-foreground/30 pl-3">
          {renderInlinePreview(line.slice(2))}
        </blockquote>
      );
    }

    if (line.startsWith('- ')) {
      return (
        <li key={key} className="ml-4 list-disc">
          {renderInlinePreview(line.slice(2))}
        </li>
      );
    }

    return (
      <Fragment key={key}>
        {renderInlinePreview(line)}
        <br />
      </Fragment>
    );
  });
};

export default function MarkdownEditor({
  value,
  onChange,
  placeholder,
  className,
  rows = 6,
  preview = false,
}: MarkdownEditorProps) {
  const t = useTranslations('shared.markdownEditor');
  const [showPreview, setShowPreview] = useState(false);

  const insertFormatting = (action: ToolbarAction) => {
    const textarea = document.querySelector<HTMLTextAreaElement>('[data-markdown-editor]');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    if (action.block) {
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const beforeLine = value.substring(0, lineStart);
      const afterLine = value.substring(lineStart);
      onChange(beforeLine + action.prefix + afterLine);
      return;
    }

    const newText = action.prefix + (selectedText || action.prefix) + action.suffix;
    onChange(value.substring(0, start) + newText + value.substring(end));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      onChange(value.substring(0, start) + '  ' + value.substring(end));
    }
  };

  return (
    <div className={cn('rounded-lg border', className)} data-testid="markdown-editor">
      <div className="flex items-center gap-0.5 border-b bg-muted/30 px-2 py-1">
        {toolbarActions.map((action) => {
          const Icon = action.icon;
          const label = t(`toolbar.${action.labelKey}`);
          return (
            <Button
              key={action.labelKey}
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title={label}
              aria-label={label}
              type="button"
              onClick={() => insertFormatting(action)}
            >
              <Icon className="h-3.5 w-3.5" />
            </Button>
          );
        })}
        {preview && (
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="icon"
              className={cn('h-7 w-7', showPreview && 'bg-accent')}
              title={t('preview')}
              aria-label={t('preview')}
              type="button"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {showPreview ? (
        <div className="min-h-[120px] p-3 text-sm prose prose-sm dark:prose-invert">
          {renderPreview(value)}
        </div>
      ) : (
        <Textarea
          data-markdown-editor
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? t('placeholder')}
          rows={rows}
          className="border-0 rounded-t-none focus-visible:ring-0 resize-y"
        />
      )}
    </div>
  );
}
