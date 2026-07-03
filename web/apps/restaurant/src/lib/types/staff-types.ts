export type StaffRole = 'owner' | 'manager' | 'kitchen' | 'cashier' | 'viewer';
export type StaffCapability = 'orders' | 'menu' | 'reports' | 'settings' | 'staff' | 'promotions';
export type StaffShiftStatus = 'scheduled' | 'completed' | 'cancelled';
export type StaffInviteStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

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
}

export interface StaffShift {
  id: string;
  restaurantProfileId: string;
  startsAt: string;
  endsAt: string;
  status: StaffShiftStatus;
  note?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface StaffInvite {
  id: string;
  email: string;
  role: StaffRole;
  permissions: StaffCapability[];
  status: StaffInviteStatus;
  expiresAt: string;
  createdAt: string;
}

export interface StaffOverview {
  staff: StaffMember[];
  invites: StaffInvite[];
  shifts: StaffShift[];
}

export interface StaffInvitePayload {
  emails: string[];
  role: StaffRole;
}
