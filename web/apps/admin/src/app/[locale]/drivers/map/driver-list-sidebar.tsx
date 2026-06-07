'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Star } from 'lucide-react';
import type { DriverLocation } from '@/hooks/use-realtime-driver-locations';

const statusColors: Record<string, string> = {
  online: 'bg-green-500',
  free: 'bg-green-500',
  delivering: 'bg-orange-500',
  busy: 'bg-red-500',
};

const statusLabels: Record<string, string> = {
  online: 'Rảnh',
  free: 'Rảnh',
  delivering: 'Đang giao',
  busy: 'Bận',
};

interface DriverListSidebarProps {
  drivers: DriverLocation[];
  selectedDriverId?: string;
  onSelect: (driver: DriverLocation) => void;
}

export default function DriverListSidebar({
  drivers,
  selectedDriverId,
  onSelect,
}: DriverListSidebarProps) {
  return (
    <Card className="w-80 flex-shrink-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          Tài xế trực tuyến
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {drivers.length} tài xế đang hoạt động
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-16rem)]">
          <div className="divide-y px-3">
            {drivers.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Không có tài xế nào trực tuyến
              </p>
            ) : (
              drivers.map((driver) => (
                <Button
                  key={driver.id}
                  variant="ghost"
                  className={`flex w-full h-auto items-center gap-3 py-3 justify-start rounded-none font-normal ${
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
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium truncate">{driver.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {driver.rating.toFixed(1)}
                      </span>
                      <span>{statusLabels[driver.status] || driver.status}</span>
                    </div>
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
