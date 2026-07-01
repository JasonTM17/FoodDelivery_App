'use client';

import { useState, type KeyboardEvent } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Bold, Italic, Underline, List, ListOrdered, Quote, Code, LinkIcon, Eye } from 'lucide-react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  preview?: boolean;
}

type ToolbarAction = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  prefix: string;
  suffix: string;
  block?: boolean;
};

const toolbarActions: ToolbarAction[] = [
  { icon: Bold, label: 'In đậm', prefix: '**', suffix: '**' },
  { icon: Italic, label: 'In nghiêng', prefix: '*', suffix: '*' },
  { icon: Underline, label: 'Gạch chân', prefix: '<u>', suffix: '</u>' },
  { icon: Quote, label: 'Trích dẫn', prefix: '> ', suffix: '', block: true },
  { icon: Code, label: 'Code', prefix: '`', suffix: '`' },
  { icon: LinkIcon, label: 'Link', prefix: '[', suffix: '](url)' },
  { icon: List, label: 'Danh sách', prefix: '- ', suffix: '', block: true },
  { icon: ListOrdered, label: 'Danh sách số', prefix: '1. ', suffix: '', block: true },
];

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Nhập nội dung... (hỗ trợ Markdown)',
  className,
  rows = 6,
  preview = false,
}: MarkdownEditorProps) {
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
      const start = (e.target as HTMLTextAreaElement).selectionStart;
      const end = (e.target as HTMLTextAreaElement).selectionEnd;
      onChange(value.substring(0, start) + '  ' + value.substring(end));
    }
  };

  const simplePreview = (text: string) => {
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code class="rounded bg-muted px-1 text-xs">$1</code>')
      .replace(/^> (.+)$/gm, '<blockquote class="border-l-2 border-muted-foreground/30 pl-3 my-1">$1</blockquote>')
      .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
      .replace(/\n/g, '<br/>');
    return html;
  };

  return (
    <div className={cn('rounded-lg border', className)} data-testid="markdown-editor">
      <div className="flex items-center gap-0.5 border-b bg-muted/30 px-2 py-1">
        {toolbarActions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.label}
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title={action.label}
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
              title="Xem trước"
              type="button"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {showPreview ? (
        <div
          className="min-h-[120px] p-3 text-sm prose prose-sm dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: simplePreview(value) }}
        />
      ) : (
        <Textarea
          data-markdown-editor
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={rows}
          className="border-0 rounded-t-none focus-visible:ring-0 resize-y"
        />
      )}
    </div>
  );
}
