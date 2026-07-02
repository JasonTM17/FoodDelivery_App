export interface TicketDetail {
  id: string;
  issueType: string;
  subject: string;
  description: string;
  userId: string;
  userName: string;
  userEmail: string;
  orderId?: string;
  priority: 'critical' | 'high' | 'normal' | 'low';
  status: string;
  assignedTo: string | null;
  assignedToName: string | null;
  tags: string[];
  createdAt: string;
  slaPercentRemaining: number;
  slaOverdue: boolean;
}
