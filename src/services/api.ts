/* SahyogX Personnel Portal - API Service Layer
   Connects the personnel frontend with backend endpoints.
   Defaults to realistic mock service while FastAPI endpoints are in development.
*/

import type {
  PersonnelProfile,
  WelfareStatus,
  SelfAssessmentSubmission,
  PastAssessment,
  DutyWorkloadData,
  LeaveRecoveryData,
  WelfareResource,
  WelfareReviewRequest,
  NotificationItem,
  ReviewCategory,
  ContactMethod
} from './types';

import {
  MOCK_PERSONNEL_PROFILE,
  MOCK_WELFARE_STATUS,
  MOCK_PAST_ASSESSMENTS,
  MOCK_DUTY_WORKLOAD,
  MOCK_LEAVE_RECOVERY,
  MOCK_WELFARE_RESOURCES,
  MOCK_REVIEW_REQUESTS,
  MOCK_NOTIFICATIONS
} from './mockData';

// Configuration: can be overridden with VITE_API_URL environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const USE_MOCK = !API_BASE_URL;

// Local storage state keys for session mutations (submitting review requests or surveys in mock mode)
const STORAGE_KEYS = {
  TOKEN: 'sahyogx_token',
  ASSESSMENTS: 'sahyogx_assessments',
  REVIEWS: 'sahyogx_reviews',
  NOTIFICATIONS: 'sahyogx_notifications',
  WELFARE: 'sahyogx_welfare'
};

// Helper to simulate network latency for realism
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

class ApiService {
  // Auth Headers
  private getHeaders(): HeadersInit {
    const token = sessionStorage.getItem(STORAGE_KEYS.TOKEN);
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  /* =======================================================
     AUTH: POST /api/auth/login
     ======================================================= */
  async login(personnelId: string, _password?: string): Promise<{ token: string; profile: PersonnelProfile }> {
    if (USE_MOCK) {
      await delay(400);
      if (!personnelId.trim()) {
        throw new Error('Please enter your Personnel ID or Username.');
      }
      const token = `mock-token-${Date.now()}`;
      sessionStorage.setItem(STORAGE_KEYS.TOKEN, token);
      
      const profile = {
        ...MOCK_PERSONNEL_PROFILE,
        personnelId: personnelId.toUpperCase()
      };
      return { token, profile };
    }

    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: personnelId, password: _password })
    });
    if (!res.ok) throw new Error('Authentication failed. Check your credentials.');
    return res.json();
  }

  logout(): void {
    sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
  }

  isAuthenticated(): boolean {
    return !!sessionStorage.getItem(STORAGE_KEYS.TOKEN);
  }

  /* =======================================================
     PROFILE: GET /api/me
     ======================================================= */
  async getProfile(): Promise<PersonnelProfile> {
    if (USE_MOCK) {
      await delay(200);
      return MOCK_PERSONNEL_PROFILE;
    }
    const res = await fetch(`${API_BASE_URL}/api/me`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to load profile information');
    return res.json();
  }

  /* =======================================================
     WELFARE STATUS: GET /api/me/welfare
     ======================================================= */
  async getWelfareStatus(): Promise<WelfareStatus> {
    if (USE_MOCK) {
      await delay(250);
      const saved = localStorage.getItem(STORAGE_KEYS.WELFARE);
      return saved ? JSON.parse(saved) : MOCK_WELFARE_STATUS;
    }
    const res = await fetch(`${API_BASE_URL}/api/me/welfare`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch welfare status');
    return res.json();
  }

  /* =======================================================
     WORKLOAD: GET /api/me/workload
     ======================================================= */
  async getWorkload(): Promise<DutyWorkloadData> {
    if (USE_MOCK) {
      await delay(250);
      return MOCK_DUTY_WORKLOAD;
    }
    const res = await fetch(`${API_BASE_URL}/api/me/workload`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch workload data');
    return res.json();
  }

  /* =======================================================
     DEPLOYMENTS: GET /api/me/deployments
     ======================================================= */
  async getDeployments(): Promise<{
    activeStation: string;
    zone: string;
    startDate: string;
    totalDays: number;
    operationalPeriods: DutyWorkloadData['recentOperationalPeriods'];
  }> {
    if (USE_MOCK) {
      await delay(200);
      return {
        activeStation: MOCK_DUTY_WORKLOAD.activeDeploymentStation,
        zone: MOCK_DUTY_WORKLOAD.deploymentZone,
        startDate: MOCK_DUTY_WORKLOAD.deploymentStartDate,
        totalDays: MOCK_DUTY_WORKLOAD.deploymentDaysTotal,
        operationalPeriods: MOCK_DUTY_WORKLOAD.recentOperationalPeriods
      };
    }
    const res = await fetch(`${API_BASE_URL}/api/me/deployments`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch deployment details');
    return res.json();
  }

  /* =======================================================
     LEAVES: GET /api/me/leaves
     ======================================================= */
  async getLeaves(): Promise<LeaveRecoveryData> {
    if (USE_MOCK) {
      await delay(200);
      return MOCK_LEAVE_RECOVERY;
    }
    const res = await fetch(`${API_BASE_URL}/api/me/leaves`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch leave and recovery data');
    return res.json();
  }

  /* =======================================================
     ASSESSMENTS: GET /api/me/assessments
     ======================================================= */
  async getPastAssessments(): Promise<PastAssessment[]> {
    if (USE_MOCK) {
      await delay(250);
      const saved = localStorage.getItem(STORAGE_KEYS.ASSESSMENTS);
      return saved ? JSON.parse(saved) : MOCK_PAST_ASSESSMENTS;
    }
    const res = await fetch(`${API_BASE_URL}/api/me/assessments`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch assessment history');
    return res.json();
  }

  /* =======================================================
     SUBMIT ASSESSMENT: POST /api/surveys
     ======================================================= */
  async submitSurvey(data: SelfAssessmentSubmission): Promise<{ success: boolean; assessmentId: string; message: string }> {
    if (USE_MOCK) {
      await delay(500);
      const today = new Date().toISOString().split('T')[0];
      const newAssessment: PastAssessment = {
        id: `asmt-${Date.now()}`,
        date: today,
        categoryScores: data.ratings,
        statusSummary: 'Balanced'
      };

      const existing = await this.getPastAssessments();
      const updated = [newAssessment, ...existing];
      localStorage.setItem(STORAGE_KEYS.ASSESSMENTS, JSON.stringify(updated));

      // Also update last assessment date in welfare status
      const welfare = await this.getWelfareStatus();
      welfare.lastAssessmentDate = today;
      localStorage.setItem(STORAGE_KEYS.WELFARE, JSON.stringify(welfare));

      return {
        success: true,
        assessmentId: newAssessment.id,
        message: 'Self-assessment submitted successfully. Your welfare dashboard has been updated.'
      };
    }

    const res = await fetch(`${API_BASE_URL}/api/surveys`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Submission failed. Please check your connectivity.');
    return res.json();
  }

  /* =======================================================
     PREDICTIONS: GET /api/me/predictions
     (Returns personnel-safe welfare trend indicators only, no command ML internals)
     ======================================================= */
  async getPredictions(): Promise<{ trend: WelfareStatus['trendHistory']; currentRisk: WelfareStatus['currentRisk'] }> {
    if (USE_MOCK) {
      await delay(200);
      return {
        trend: MOCK_WELFARE_STATUS.trendHistory,
        currentRisk: MOCK_WELFARE_STATUS.currentRisk
      };
    }
    const res = await fetch(`${API_BASE_URL}/api/me/predictions`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch welfare indicators');
    return res.json();
  }

  /* =======================================================
     WELFARE RESOURCES: GET /api/welfare/resources
     ======================================================= */
  async getWelfareResources(): Promise<WelfareResource[]> {
    if (USE_MOCK) {
      await delay(200);
      return MOCK_WELFARE_RESOURCES;
    }
    const res = await fetch(`${API_BASE_URL}/api/welfare/resources`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch welfare resources');
    return res.json();
  }

  /* =======================================================
     REVIEW REQUESTS:
     GET /api/welfare/review-requests
     POST /api/welfare/review-request
     ======================================================= */
  async getReviewRequests(): Promise<WelfareReviewRequest[]> {
    if (USE_MOCK) {
      await delay(250);
      const saved = localStorage.getItem(STORAGE_KEYS.REVIEWS);
      return saved ? JSON.parse(saved) : MOCK_REVIEW_REQUESTS;
    }
    const res = await fetch(`${API_BASE_URL}/api/welfare/review-requests`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch review requests');
    return res.json();
  }

  async submitReviewRequest(data: {
    category: ReviewCategory;
    message?: string;
    preferredContact: ContactMethod;
  }): Promise<{ success: boolean; reviewId: string; referenceNumber: string; message: string }> {
    if (USE_MOCK) {
      await delay(500);
      const refNum = `WR-2026-${Math.floor(100 + Math.random() * 900)}`;
      const now = new Date();
      const dateStr = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      const newReview: WelfareReviewRequest = {
        id: `rev-${Date.now()}`,
        referenceNumber: refNum,
        category: data.category,
        message: data.message,
        preferredContact: data.preferredContact,
        status: 'Submitted',
        submittedAt: dateStr,
        lastUpdated: dateStr
      };

      const existing = await this.getReviewRequests();
      const updated = [newReview, ...existing];
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(updated));

      return {
        success: true,
        reviewId: newReview.id,
        referenceNumber: refNum,
        message: `Review request ${refNum} submitted confidentially to your Unit Welfare Cell.`
      };
    }

    const res = await fetch(`${API_BASE_URL}/api/welfare/review-request`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to submit review request');
    return res.json();
  }

  /* =======================================================
     NOTIFICATIONS:
     GET /api/notifications
     PATCH /api/notifications/:id/read
     ======================================================= */
  async getNotifications(): Promise<NotificationItem[]> {
    if (USE_MOCK) {
      await delay(200);
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return saved ? JSON.parse(saved) : MOCK_NOTIFICATIONS;
    }
    const res = await fetch(`${API_BASE_URL}/api/notifications`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  }

  async markNotificationRead(id: string): Promise<void> {
    if (USE_MOCK) {
      const list = await this.getNotifications();
      const updated = list.map(n => n.id === id ? { ...n, isRead: true } : n);
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
      return;
    }
    await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
      method: 'PATCH',
      headers: this.getHeaders()
    });
  }

  async markAllNotificationsRead(): Promise<void> {
    if (USE_MOCK) {
      const list = await this.getNotifications();
      const updated = list.map(n => ({ ...n, isRead: true }));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
      return;
    }
    await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
      method: 'POST',
      headers: this.getHeaders()
    });
  }
}

export const api = new ApiService();
