/* SahyogX Personnel Data Types */

export interface PersonnelProfile {
  id: string;
  personnelId: string;
  name: string;
  rank: string;
  unit: string;
  station: string;
  serviceYears: number;
  tradeSpecialty: string;
  emailContact?: string;
  role: 'personnel' | 'commander' | 'medical_officer' | 'officer' | string;
}

export type WelfareRiskLevel = 'Optimal' | 'Balanced' | 'Moderate Attention' | 'Elevated Review';

export interface WelfareIndicator {
  name: string;
  status: 'Good' | 'Moderate' | 'Watch';
  value: string;
  detail: string;
}

export interface WelfareTrendPoint {
  date: string;
  score: number; // 0 to 100
  indicator: WelfareRiskLevel;
}

export interface WelfareStatus {
  currentRisk: WelfareRiskLevel;
  lastAssessmentDate: string;
  nextAssessmentDueDate: string;
  neutralSummary: string;
  contributingIndicators: WelfareIndicator[];
  trendHistory: WelfareTrendPoint[];
  recommendedActions: string[];
}

export interface SelfAssessmentQuestion {
  id: string;
  category: 'sleep' | 'workload' | 'fatigue' | 'duty_pressure' | 'recovery' | 'social_support' | 'wellbeing';
  categoryLabel: string;
  text: string;
  guidance?: string;
}

export interface SelfAssessmentSubmission {
  id?: string;
  submittedAt?: string;
  ratings: Record<string, number>; // questionId -> 1..5
  additionalNotes?: string;
  overallScore?: number;
}

export interface PastAssessment {
  id: string;
  date: string;
  categoryScores: Record<string, number>;
  statusSummary: WelfareRiskLevel;
}

export interface DutyDay {
  date: string;
  dayOfWeek: string;
  hours: number;
  shiftType: 'Day Shift' | 'Night Shift' | 'Extended Duty' | 'Scheduled Rest';
  operationalZone: string;
}

export interface DutyWorkloadData {
  weeklyAverageHours: number;
  consecutiveDutyDays: number;
  activeDeploymentStation: string;
  deploymentZone: string;
  deploymentStartDate: string;
  deploymentDaysTotal: number;
  dailyDutyLog: DutyDay[];
  recentOperationalPeriods: {
    periodName: string;
    dateRange: string;
    intensity: 'Standard' | 'Elevated' | 'Rest & Maintenance';
    notes: string;
  }[];
}

export interface LeaveRecord {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  status: 'Approved' | 'Completed' | 'Upcoming';
  sanctionAuthority: string;
}

export interface LeaveBalance {
  leaveType: string;
  entitled: number;
  availed: number;
  remaining: number;
}

export interface LeaveRecoveryData {
  balances: LeaveBalance[];
  recentLeaves: LeaveRecord[];
  upcomingLeaves: LeaveRecord[];
  lastRestCycleDate: string;
  nextRestCycleDate: string;
}

export interface WelfareResource {
  id: string;
  category: 'Rest & Recovery' | 'Unit Contacts' | 'Confidential Helpline' | 'Family & Peer Support';
  title: string;
  description: string;
  contact?: string;
  hours?: string;
  tips?: string[];
}

export type ReviewCategory = 
  | 'Routine Welfare Check-in' 
  | 'Workload Adjustment Request' 
  | 'Rest & Fatigue Consultation' 
  | 'Personal / Family Circumstance';

export type ContactMethod = 
  | 'In-Person Confidential Meeting' 
  | 'Unit Welfare Officer Phone Call' 
  | 'Secure System Dispatch';

export interface WelfareReviewRequest {
  id: string;
  referenceNumber: string;
  category: ReviewCategory;
  message?: string;
  preferredContact: ContactMethod;
  status: 'Submitted' | 'Under Review' | 'Scheduled' | 'Completed';
  submittedAt: string;
  lastUpdated?: string;
}

export interface NotificationItem {
  id: string;
  type: 'assessment' | 'review' | 'administrative';
  title: string;
  message: string;
  date: string;
  isRead: boolean;
  actionRoute?: string;
}
