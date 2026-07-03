export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description: string;
  address?: string;
  addressLine?: string;
  phone: string;
  logoUrl?: string | null;
  coverUrl?: string | null;
  logo?: string | null;
  coverImage?: string | null;
  isActive: boolean;
  isOpen?: boolean;
  cuisines?: string[];
  cuisineTypes?: string[];
  minOrderAmount?: number;
  deliveryFee?: number;
  bankAccount?: string;
  bankName?: string;
  openingHours: OpeningHours;
  holidayClosures?: HolidayClosure[];
  createdAt: string;
  updatedAt: string;
}

export interface HolidayClosure {
  id?: string;
  date: string;
  reason?: string | null;
}

export interface OpeningHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface DayHours {
  open: string;
  close: string;
  isClosed: boolean;
}
