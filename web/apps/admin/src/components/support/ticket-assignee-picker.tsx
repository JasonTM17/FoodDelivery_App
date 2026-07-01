'use client';

import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Check, Search, UserCheck, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Agent {
  id: string;
  name: string;
  email: string;
  role: string;
  ticketCount: number;
}

interface TicketAssigneePickerProps {
  currentAssignee: string | null;
  currentAssigneeName: string | null;
  onAssign: (agentId: string | null) => Promise<void>;
  className?: string;
}

const MOCK_AGENTS: Agent[] = [
  { id: 'agent_1', name: 'Nguyễn Văn A', email: 'a@foodflow.vn', role: 'Trưởng nhóm', ticketCount: 5 },
  { id: 'agent_2', name: 'Trần Thị B', email: 'b@foodflow.vn', role: 'Hỗ trợ viên', ticketCount: 12 },
  { id: 'agent_3', name: 'Lê Văn C', email: 'c@foodflow.vn', role: 'Hỗ trợ viên', ticketCount: 3 },
  { id: 'agent_pool', name: 'Tổ hỗ trợ', email: 'support@foodflow.vn', role: 'Nhóm', ticketCount: 0 },
];

export default function TicketAssigneePicker({
  currentAssignee,
  currentAssigneeName,
  onAssign,
  className,
}: TicketAssigneePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');

  const filtered = MOCK_AGENTS.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      a.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleAssign = async (agentId: string | null) => {
    setAssigning(true);
    setAssignError('');
    try {
      await onAssign(agentId);
      setOpen(false);
    } catch (err) {
      setAssignError((err as { message?: string }).message || 'Không thể phân công ticket');
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
          {currentAssigneeName || 'Phân công'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="border-b p-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm người hỗ trợ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
              autoFocus
            />
          </div>
        </div>
        <ScrollArea className="h-56">
          <div className="p-1">
            {currentAssignee && (
              <button
                type="button"
                className="w-full rounded-md p-2 text-left text-sm text-muted-foreground hover:bg-accent transition-colors"
                onClick={() => handleAssign(null)}
                disabled={assigning}
              >
                <Users className="mr-2 inline h-4 w-4" />
                Bỏ phân công
              </button>
            )}
            {filtered.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Không tìm thấy</p>
            ) : (
              filtered.map((agent) => {
                const isActive = currentAssignee === agent.id;
                return (
                  <button
                    key={agent.id}
                    type="button"
                    className={cn(
                      'w-full flex items-center gap-3 rounded-md p-2 text-left hover:bg-accent transition-colors',
                      isActive && 'bg-primary/5'
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
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium truncate">{agent.name}</span>
                        {isActive && <Check className="h-3.5 w-3.5 text-primary" />}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{agent.role}</span>
                        {agent.ticketCount > 0 && (
                          <Badge variant="outline" className="text-[10px] py-0 h-4">
                            {agent.ticketCount} ticket
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>
        {assignError && <p className="border-t px-3 py-2 text-xs text-destructive">{assignError}</p>}
      </PopoverContent>
    </Popover>
  );
}
