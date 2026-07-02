export type StaffRole = 'owner' | 'manager' | 'kitchen' | 'cashier' | 'viewer';
export type StaffCapability = 'orders' | 'menu' | 'reports' | 'settings' | 'staff' | 'promotions';

export interface StaffMember {
  id: string;
  userId?: string;
  name: string;
  email: string;
  role: StaffRole;
  avatar?: string | null;
  lastActive?: string;
  joinedAt?: string;
  isActive?: boolean;
  permissions: StaffCapability[];
  schedule?: StaffShift[];
}

export interface StaffShift {
  day: number;
  startHour: number;
  endHour: number;
}

export interface StaffInvitePayload {
  emails: string[];
  role: StaffRole;
}
