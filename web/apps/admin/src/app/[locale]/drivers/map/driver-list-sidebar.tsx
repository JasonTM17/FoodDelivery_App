'use client';

import { AlertCircle, MapPin, RefreshCw, Star } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { DriverLocation } from '@/hooks/use-realtime-driver-locations';

const statusColors: Record<string, string> = {
  online: 'bg-green-500',
  free: 'bg-green-500',
  delivering: 'bg-orange-500',
  busy: 'bg-red-500',
};

interface DriverListSidebarProps {
  drivers: DriverLocation[];
  isLoading: boolean;
  error: string | null;
  selectedDriverId?: string;
  statusLabels: Record<DriverLocation['status'], string>;
  copy: {
    title: string;
    activeCount: string;
    empty: string;
    retry: string;
    lastSeen: string;
  };
  formatTimestamp: (value: string) => string;
  onSelect: (driver: DriverLocation) => void;
  onRetry: () => void;
}

export default function DriverListSidebar({
  drivers,
  isLoading,
  error,
  selectedDriverId,
  statusLabels,
  copy,
  formatTimestamp,
  onSelect,
  onRetry,
}: DriverListSidebarProps) {
  return (
    <Card className="w-full flex-shrink-0 lg:w-80">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="h-4 w-4 text-primary" />
          {copy.title}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{copy.activeCount}</p>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-16rem)]">
          <div className="divide-y px-3">
            {error ? (
              <div className="space-y-3 py-8 text-center text-sm text-muted-foreground">
                <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
                <p>{error}</p>
                <Button variant="outline" size="sm" onClick={onRetry}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {copy.retry}
                </Button>
              </div>
            ) : isLoading ? (
              <div className="space-y-3 py-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-3 py-3">
                    <div className="h-10 w-10 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-2/3 rounded bg-muted" />
                      <div className="h-3 w-1/2 rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : drivers.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{copy.empty}</p>
            ) : (
              drivers.map((driver) => (
                <Button
                  key={driver.id}
                  variant="ghost"
                  className={`flex h-auto w-full items-center justify-start gap-3 rounded-none py-3 font-normal ${
                    selectedDriverId === driver.id ? 'bg-muted hover:bg-muted' : ''
                  }`}
                  onClick={() => onSelect(driver)}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-xs">
                        {driver.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                        statusColors[driver.status] || 'bg-muted-foreground'
                      }`}
                    />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-medium">{driver.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {driver.rating.toFixed(1)}
                      </span>
                      <span>{statusLabels[driver.status]}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {copy.lastSeen}: {formatTimestamp(driver.lastSeenAt)}
                    </p>
                  </div>
                </Button>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
