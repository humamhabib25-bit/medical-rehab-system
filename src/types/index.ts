export type SessionStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'RESCHEDULED';
export type PlanStatus = 'ACTIVE' | 'COMPLETED' | 'SUSPENDED' | 'CANCELLED';

export type SchedulePattern = 'SAT_MON_WED' | 'SUN_TUE_THU' | 'DAILY' | 'CUSTOM';

export interface Patient {
  id: string;
  fullName: string;
  phone: string;
  nationalId?: string;
  initialDiagnosis: string;
  notes?: string;
  createdAt: string;
}

export type PaymentStatus = 'PAID' | 'PARTIALLY_PAID' | 'UNPAID';

export interface TreatmentPlan {
  id: string;
  patientId: string;
  totalSessions: number;
  completedSessions: number;
  status: PlanStatus;
  startDate: string;
  preferredPattern: SchedulePattern;
  preferredDays: number[]; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  pricePerSession?: number;
  totalPrice: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  notes?: string;
  createdAt: string;
}

export interface Session {
  id: string;
  planId: string;
  patientId: string;
  sessionNumber: number; // 1, 2, 3...
  sessionDate: string; // YYYY-MM-DD
  status: SessionStatus;
  therapistName?: string;
  notes?: string;
  isOverride?: boolean;
  rescheduledFromDate?: string;
  createdAt: string;
}

export interface DailyCapacitySetting {
  date: string; // YYYY-MM-DD
  maxCapacity: number;
  isWorkingDay: boolean;
  notes?: string;
}

export interface DayCapacitySummary {
  date: string; // YYYY-MM-DD
  dayNameAr: string;
  dayOfWeek: number; // 0-6
  bookedCount: number;
  maxCapacity: number;
  isWorkingDay: boolean;
  percentage: number;
  status: 'available' | 'near_full' | 'full' | 'holiday';
  notes?: string;
}

export interface AutoSchedulePreviewItem {
  sessionNumber: number;
  date: string;
  dayNameAr: string;
  dayCapacity: number;
  dayBookedCount: number;
  isOverrideNeeded: boolean;
}

export interface SkippedDateItem {
  date: string;
  dayNameAr: string;
  reason: string;
}

export interface AutoScheduleResult {
  scheduledSessions: AutoSchedulePreviewItem[];
  skippedDates: SkippedDateItem[];
  endDate: string;
}
