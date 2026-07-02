'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Check, Loader2, RotateCcw, Search, UserCheck, Users } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { cn } from '@/lib/utils';

interface SupportAgentResponse {
  id: string;
  fullName: string | null;
  email: string;
}

interface Agent {
  id: string;
  name: string;
  email: string;
}

interface TicketAssigneePickerProps {
  currentAssignee: string | null;
  currentAssigneeName: string | null;
  onAssign: (agentId: string | null) => Promise<void>;
  className?: string;
}

function toAgent(agent: SupportAgentResponse): Agent {
  return {
    id: agent.id,
    name: agent.fullName?.trim() || agent.email,
    email: agent.email,
  };
}

export default function TicketAssigneePicker({
  currentAssignee,
  currentAssigneeName,
  onAssign,
  className,
}: TicketAssigneePickerProps) {
  const t = useTranslations('support.assignee');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');

  const agentsQuery = useQuery({
    queryKey: ['support-agents'],
    queryFn: () => apiGet<SupportAgentResponse[]>('/admin/support-agents'),
    enabled: open,
  });

  const agents = useMemo(() => (agentsQuery.data ?? []).map(toAgent), [agentsQuery.data]);
  const normalizedSearch = search.trim().toLowerCase();
  const filtered = agents.filter((agent) => {
    if (!normalizedSearch) return true;
    return (
      agent.name.toLowerCase().includes(normalizedSearch) ||
      agent.email.toLowerCase().includes(normalizedSearch)
    );
  });

  const handleAssign = async (agentId: string | null) => {
    setAssigning(true);
    setAssignError('');
    try {
      await onAssign(agentId);
      setOpen(false);
    } catch (err) {
      setAssignError((err as { message?: string }).message || t('assignError'));
    } finally {
      setAssigning(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('gap-2', className)}
          data-testid="assignee-picker-trigger"
        >
          <UserCheck className="h-4 w-4" />
          {currentAssigneeName || t('assign')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="border-b p-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-8 pl-8 text-sm"
              autoFocus
            />
          </div>
        </div>
        <ScrollArea className="h-56">
          <div className="p-1">
            {currentAssignee && (
              <button
                type="button"
                className="w-full rounded-md p-2 text-left text-sm text-muted-foreground transition-colors hover:bg-accent"
                onClick={() => handleAssign(null)}
                disabled={assigning}
              >
                <Users className="mr-2 inline h-4 w-4" />
                {t('clear')}
              </button>
            )}
            {agentsQuery.isLoading && (
              <p className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('loading')}
              </p>
            )}
            {agentsQuery.isError && (
              <div className="space-y-2 px-3 py-5 text-center">
                <p className="text-sm text-destructive">{t('loadError')}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => agentsQuery.refetch()}
                >
                  <RotateCcw className="mr-2 h-3.5 w-3.5" />
                  {t('retry')}
                </Button>
              </div>
            )}
            {!agentsQuery.isLoading && !agentsQuery.isError && filtered.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {agents.length === 0 ? t('empty') : t('noResults')}
              </p>
            ) : null}
            {!agentsQuery.isLoading && !agentsQuery.isError && filtered.map((agent) => {
              const isActive = currentAssignee === agent.id;
              return (
                <button
                  key={agent.id}
                  type="button"
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-accent',
                    isActive && 'bg-primary/5',
                  )}
                  onClick={() => handleAssign(agent.id)}
                  disabled={assigning}
                  data-testid={`assignee-${agent.id}`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {agent.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium">{agent.name}</span>
                      {isActive && <Check className="h-3.5 w-3.5 text-primary" />}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{agent.email}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
        {assignError && <p className="border-t px-3 py-2 text-xs text-destructive">{assignError}</p>}
      </PopoverContent>
    </Popover>
  );
}
