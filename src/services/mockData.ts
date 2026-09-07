/* SahyogX Personnel Portal - Mock Data Store
   Isolated mock data for development and testing. Real backend APIs will connect seamlessly via the service layer.
*/

import type {
  PersonnelProfile,
  WelfareStatus,
  SelfAssessmentQuestion,
  PastAssessment,
  DutyWorkloadData,
  LeaveRecoveryData,
  WelfareResource,
  WelfareReviewRequest,
  NotificationItem
} from './types';

export const MOCK_PERSONNEL_PROFILE: PersonnelProfile = {
  id: 'usr-882914',
  personnelId: 'SF-882914',
  name: 'Havildar Rajesh Kumar',
  rank: 'Havildar',
  unit: '14 Rajputana Rifles (Bravo Coy)',
  station: 'Forward Base Northern Sector',
  serviceYears: 9,
  tradeSpecialty: 'Tactical Signals Specialist',
  emailContact: 'r.kumar.8829@sahyogx.internal',
  role: 'personnel'
};

export const MOCK_WELFARE_STATUS: WelfareStatus = {
  currentRisk: 'Balanced',
  lastAssessmentDate: '2026-08-28',
  nextAssessmentDueDate: '2026-09-12',
  neutralSummary: 'Operational metrics and self-reported rest indicators show balanced endurance with standard duty cycles. Recommended actions prioritize consistent hydration and scheduled decompression.',
  contributingIndicators: [
    {
      name: 'Sleep Regularity',
      status: 'Good',
      value: '7.1 hrs/night',
      detail: 'Consistent rest duration maintained across current operational rotation.'
    },
    {
      name: 'Shift Intensity',
      status: 'Moderate',
      value: '42 hrs/week',
      detail: 'Within standard duty parameters; night watches scheduled with post-shift recovery.'
    },
    {
      name: 'Recovery Interval',
      status: 'Good',
      value: '14 hrs between shifts',
      detail: 'Meets minimum unit rest protocol standards.'
    },
    {
      name: 'Peer & Unit Connectivity',
      status: 'Good',
      value: 'Active Support',
      detail: 'Regular check-ins recorded with Coy support structure.'
    }
  ],
  trendHistory: [
    { date: '2026-06-15', score: 82, indicator: 'Optimal' },
    { date: '2026-07-01', score: 78, indicator: 'Balanced' },
    { date: '2026-07-15', score: 72, indicator: 'Balanced' },
    { date: '2026-08-01', score: 65, indicator: 'Moderate Attention' },
    { date: '2026-08-15', score: 74, indicator: 'Balanced' },
    { date: '2026-08-28', score: 76, indicator: 'Balanced' }
  ],
  recommendedActions: [
    'Schedule 20 minutes of daily post-watch tactical decompression.',
    'Maintain hydration discipline during perimeter surveillance duty.',
    'Confirm your upcoming recovery cycle window with your Coy Havildar Major.',
    'Explore peer wellness resources in the Welfare Resources tab.'
  ]
};

export const ASSESSMENT_QUESTIONS: SelfAssessmentQuestion[] = [
  {
    id: 'q_sleep_1',
    category: 'sleep',
    categoryLabel: 'Sleep & Rest',
    text: 'How consistently were you able to achieve restful, uninterrupted sleep over the past 7 days?',
    guidance: 'Consider total sleep duration and sleep quality between duty watches.'
  },
  {
    id: 'q_workload_1',
    category: 'workload',
    categoryLabel: 'Workload Perception',
    text: 'How manageable did your daily assigned tasks and patrol duties feel during your recent shifts?',
    guidance: 'Reflect on whether duty pacing allowed standard operational performance.'
  },
  {
    id: 'q_fatigue_1',
    category: 'fatigue',
    categoryLabel: 'Physical & Mental Fatigue',
    text: 'How often did you feel clear-headed and physically ready at the commencement of your shifts?',
    guidance: 'Think about physical readiness and stamina during briefings.'
  },
  {
    id: 'q_duty_pressure_1',
    category: 'duty_pressure',
    categoryLabel: 'Duty Pressure & Pacing',
    text: 'To what extent were you able to manage tempo and operational tasks without feeling overwhelmed?',
    guidance: 'Includes situational changes, unexpected watches, and communications load.'
  },
  {
    id: 'q_recovery_1',
    category: 'recovery',
    categoryLabel: 'Recovery & Off-Duty Periods',
    text: 'How effective was your off-duty time for physical decompression, reading, or quiet rest?',
    guidance: 'Focus on whether rest periods felt sufficient to reset your focus.'
  },
  {
    id: 'q_social_support_1',
    category: 'social_support',
    categoryLabel: 'Social & Unit Support',
    text: 'How supported do you feel by your section peers and immediate unit team members?',
    guidance: 'Consider camaraderie, willingness of peers to assist, and unit morale.'
  },
  {
    id: 'q_wellbeing_1',
    category: 'wellbeing',
    categoryLabel: 'General Wellbeing',
    text: 'Overall, how would you rate your sense of balance and day-to-day focus over the past week?',
    guidance: 'A high-level view of your current morale, focus, and general balance.'
  }
];

export const MOCK_PAST_ASSESSMENTS: PastAssessment[] = [
  {
    id: 'asmt-2026-08-28',
    date: '2026-08-28',
    categoryScores: {
      sleep: 4,
      workload: 3,
      fatigue: 4,
      duty_pressure: 4,
      recovery: 4,
      social_support: 5,
      wellbeing: 4
    },
    statusSummary: 'Balanced'
  },
  {
    id: 'asmt-2026-08-15',
    date: '2026-08-15',
    categoryScores: {
      sleep: 3,
      workload: 3,
      fatigue: 3,
      duty_pressure: 3,
      recovery: 3,
      social_support: 4,
      wellbeing: 3
    },
    statusSummary: 'Balanced'
  },
  {
    id: 'asmt-2026-08-01',
    date: '2026-08-01',
    categoryScores: {
      sleep: 2,
      workload: 2,
      fatigue: 2,
      duty_pressure: 3,
      recovery: 2,
      social_support: 4,
      wellbeing: 3
    },
    statusSummary: 'Moderate Attention'
  }
];

export const MOCK_DUTY_WORKLOAD: DutyWorkloadData = {
  weeklyAverageHours: 41.5,
  consecutiveDutyDays: 5,
  activeDeploymentStation: 'Northern Sector - Forward Post Falcon',
  deploymentZone: 'High Altitude Area (HAA Tier II)',
  deploymentStartDate: '2026-05-10',
  deploymentDaysTotal: 119,
  dailyDutyLog: [
    { date: '2026-09-06', dayOfWeek: 'Sun', hours: 7.5, shiftType: 'Day Shift', operationalZone: 'Sector Comms Post' },
    { date: '2026-09-05', dayOfWeek: 'Sat', hours: 8.0, shiftType: 'Day Shift', operationalZone: 'Sector Comms Post' },
    { date: '2026-09-04', dayOfWeek: 'Fri', hours: 6.0, shiftType: 'Scheduled Rest', operationalZone: 'Unit Lines' },
    { date: '2026-09-03', dayOfWeek: 'Thu', hours: 8.5, shiftType: 'Night Shift', operationalZone: 'Signals Relay Tower' },
    { date: '2026-09-02', dayOfWeek: 'Wed', hours: 8.0, shiftType: 'Day Shift', operationalZone: 'Sector Comms Post' },
    { date: '2026-09-01', dayOfWeek: 'Tue', hours: 7.5, shiftType: 'Day Shift', operationalZone: 'Sector Comms Post' },
    { date: '2026-08-31', dayOfWeek: 'Mon', hours: 8.0, shiftType: 'Day Shift', operationalZone: 'Sector Comms Post' },
    { date: '2026-08-30', dayOfWeek: 'Sun', hours: 6.0, shiftType: 'Scheduled Rest', operationalZone: 'Unit Lines' },
    { date: '2026-08-29', dayOfWeek: 'Sat', hours: 8.5, shiftType: 'Night Shift', operationalZone: 'Signals Relay Tower' },
    { date: '2026-08-28', dayOfWeek: 'Fri', hours: 7.5, shiftType: 'Day Shift', operationalZone: 'Sector Comms Post' }
  ],
  recentOperationalPeriods: [
    {
      periodName: 'Signals Network Modernization Sprint',
      dateRange: '15 Aug 2026 – 28 Aug 2026',
      intensity: 'Standard',
      notes: 'Routine upgrade of HF/VHF relay stations with scheduled relief watches.'
    },
    {
      periodName: 'Annual Monsoon Sector Patrol Support',
      dateRange: '01 Jul 2026 – 25 Jul 2026',
      intensity: 'Elevated',
      notes: 'Inclement weather communication standby. Post-operation 4-day recovery cycle completed.'
    },
    {
      periodName: 'Station Maintenance & Calibration',
      dateRange: '10 Jun 2026 – 22 Jun 2026',
      intensity: 'Rest & Maintenance',
      notes: 'Equip repair and depot overhaul duty with balanced 6-hour daily shifts.'
    }
  ]
};

export const MOCK_LEAVE_RECOVERY: LeaveRecoveryData = {
  balances: [
    { leaveType: 'Annual Leave', entitled: 60, availed: 28, remaining: 32 },
    { leaveType: 'Casual Leave', entitled: 30, availed: 12, remaining: 18 },
    { leaveType: 'Sick / Convalescent', entitled: 20, availed: 0, remaining: 20 },
    { leaveType: 'Compensatory Rest', entitled: 10, availed: 6, remaining: 4 }
  ],
  recentLeaves: [
    {
      id: 'lv-2026-01',
      leaveType: 'Annual Leave',
      startDate: '2026-06-01',
      endDate: '2026-06-20',
      daysCount: 20,
      status: 'Completed',
      sanctionAuthority: 'CO 14 Rajputana Rifles'
    },
    {
      id: 'lv-2026-02',
      leaveType: 'Casual Leave',
      startDate: '2026-04-12',
      endDate: '2026-04-18',
      daysCount: 7,
      status: 'Completed',
      sanctionAuthority: 'OC Bravo Coy'
    }
  ],
  upcomingLeaves: [
    {
      id: 'lv-2026-03',
      leaveType: 'Annual Leave (Phase 2)',
      startDate: '2026-10-15',
      endDate: '2026-10-29',
      daysCount: 15,
      status: 'Upcoming',
      sanctionAuthority: 'CO 14 Rajputana Rifles (Sanctioned)'
    }
  ],
  lastRestCycleDate: '2026-09-04',
  nextRestCycleDate: '2026-09-11'
};

export const MOCK_WELFARE_RESOURCES: WelfareResource[] = [
  {
    id: 'res-rest-1',
    category: 'Rest & Recovery',
    title: 'Tactical Decompression & Sleep Rhythm Protocol',
    description: 'Practical breathing and cool-down techniques tailored for personnel coming off active shifts or high-vigilance night duty.',
    tips: [
      'Practice 4-4-4 Box Breathing for 5 minutes before sleep to reduce heart rate.',
      'Dim white lights 30 minutes prior to bunk rest; use amber or low red light if reading.',
      'Maintain thermal comfort and blackout eye coverings when sleeping during daytime rotations.'
    ]
  },
  {
    id: 'res-contact-1',
    category: 'Unit Contacts',
    title: 'Unit Welfare Officer (UWO)',
    description: 'Direct, confidential point of contact within the battalion for administrative, family welfare, or duty pacing concerns.',
    contact: 'Major S. K. Nair, UWO | Ext: 4421 / Mob: +91 94190 28411',
    hours: 'Available 0800 – 1900 hrs daily; Duty Room available 24/7'
  },
  {
    id: 'res-helpline-1',
    category: 'Confidential Helpline',
    title: 'Armed Forces 24/7 Welfare & Counseling Helpline (Manas)',
    description: 'Completely anonymous and confidential support service staffed by professional psychological counselors specialized in uniformed personnel care.',
    contact: 'Toll-Free: 1800-11-2522 (Toll-Free, 24 Hours)',
    hours: '24 Hours, 365 Days a Year (Fully Confidential)'
  },
  {
    id: 'res-peer-1',
    category: 'Family & Peer Support',
    title: 'Unit Peer Support & Family Assistance Cell',
    description: 'Assistance programs for home station queries, children educational grants, and emergency transit accommodations.',
    contact: 'Family Welfare Center, Station HQ | Ext: 2318',
    hours: '0900 – 1700 hrs (Mon – Sat)'
  }
];

export const MOCK_REVIEW_REQUESTS: WelfareReviewRequest[] = [
  {
    id: 'rev-001',
    referenceNumber: 'WR-2026-089',
    category: 'Workload Adjustment Request',
    message: 'Requesting rotation from night signals watch following 3 continuous weeks in high altitude tower.',
    preferredContact: 'In-Person Confidential Meeting',
    status: 'Completed',
    submittedAt: '2026-08-10 11:30',
    lastUpdated: '2026-08-14 16:00'
  },
  {
    id: 'rev-002',
    referenceNumber: 'WR-2026-104',
    category: 'Routine Welfare Check-in',
    message: 'Follow-up consultation after mid-year deployment cycle.',
    preferredContact: 'Unit Welfare Officer Phone Call',
    status: 'Scheduled',
    submittedAt: '2026-09-02 09:15',
    lastUpdated: '2026-09-03 14:20'
  }
];

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'assessment',
    title: 'Periodic Wellness Check-in Due',
    message: 'Your 14-day wellness self-assessment is scheduled for submission by 12 Sep 2026. Takes ~3 minutes.',
    date: '2026-09-06',
    isRead: false,
    actionRoute: 'assessment'
  },
  {
    id: 'notif-2',
    type: 'review',
    title: 'Review Request #WR-2026-104 Scheduled',
    message: 'Unit Welfare Officer has scheduled your requested discussion for 09 Sep at 1600 hrs.',
    date: '2026-09-03',
    isRead: false,
    actionRoute: 'review'
  },
  {
    id: 'notif-3',
    type: 'administrative',
    title: 'Upcoming Approved Leave Window',
    message: 'Reminder: Your sanctioned Annual Leave (Phase 2) begins on 15 Oct 2026. Travel warrants ready at Admin Office.',
    date: '2026-08-25',
    isRead: true,
    actionRoute: 'leave'
  }
];
