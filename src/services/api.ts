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
     AUTH: POST /api/v1/auth/login
     ======================================================= */
  async login(
    personnelId: string,
    password?: string,
    requestedRole?: string
  ): Promise<{ token: string; profile: PersonnelProfile }> {
    if (!personnelId.trim()) {
      throw new Error('Please enter your Personnel ID or Username.');
    }

    const cleanUsername = personnelId.trim().toLowerCase();

    // Check locally registered users first if available
    try {
      const stored = localStorage.getItem('sahyogx_registered_users');
      if (stored) {
        const regUsers = JSON.parse(stored);
        const userRec = regUsers[cleanUsername];
        if (userRec) {
          if (password && userRec.password && userRec.password !== password) {
            throw new Error('Incorrect password for registered account.');
          }
          const token = `token-reg-${Date.now()}`;
          sessionStorage.setItem(STORAGE_KEYS.TOKEN, token);
          const fRole = userRec.role || requestedRole || 'PERSONNEL';
          const profile: PersonnelProfile = {
            id: `usr-${cleanUsername}`,
            personnelId: cleanUsername.toUpperCase(),
            name: userRec.fullName || cleanUsername.toUpperCase(),
            rank: userRec.rank || (fRole === 'COMMANDER' ? 'Colonel' : fRole === 'MEDICAL_OFFICER' ? 'Major (Medical)' : 'Havildar'),
            unit: userRec.unit || '14 Rajputana Rifles',
            station: 'Forward Base Northern Sector',
            serviceYears: 6,
            tradeSpecialty: fRole === 'COMMANDER' ? 'Commanding Officer' : fRole === 'MEDICAL_OFFICER' ? 'Medical Officer' : 'Tactical Signals Specialist',
            emailContact: `${cleanUsername}@sahyogx.internal`,
            role: fRole,
          };
          return { token, profile };
        }
      }
    } catch (e: any) {
      if (e.message?.includes('Incorrect password')) throw e;
    }

    // Attempt real backend authentication
    try {
      const endpoint = `${API_BASE_URL}/api/v1/auth/login`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, password: password || '' })
      });

      if (res.ok) {
        const data = await res.json();
        const token = data.access_token || data.token;
        if (token) {
          sessionStorage.setItem(STORAGE_KEYS.TOKEN, token);
          
          // Hydrate user profile from backend
          try {
            const meRes = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            });
            if (meRes.ok) {
              const user = await meRes.json();
              const backendRole: string = (user.role || requestedRole || 'PERSONNEL').toUpperCase();
              let frontendRole: string;
              if (backendRole === 'COMMANDER') {
                frontendRole = 'COMMANDER';
              } else if (backendRole === 'MEDICAL_OFFICER') {
                frontendRole = 'MEDICAL_OFFICER';
              } else {
                frontendRole = 'PERSONNEL';
              }
              const profile: PersonnelProfile = {
                id: String(user.id || 'usr-prs-003'),
                personnelId: (user.username || cleanUsername).toUpperCase(),
                name: user.full_name || (frontendRole === 'COMMANDER' ? 'Col. R. Sharma (Commanding Officer)' : frontendRole === 'MEDICAL_OFFICER' ? 'Maj. Dr. A. Verma (Regimental Medical Officer)' : 'Hav. K. Singh'),
                rank: frontendRole === 'COMMANDER' ? 'Colonel' : frontendRole === 'MEDICAL_OFFICER' ? 'Major (Medical)' : 'Havildar',
                unit: '14 Rajputana Rifles',
                station: 'Forward Base Northern Sector',
                serviceYears: 9,
                tradeSpecialty: frontendRole === 'COMMANDER' ? 'Commanding Officer' : frontendRole === 'MEDICAL_OFFICER' ? 'Medical Officer' : 'Tactical Signals Specialist',
                emailContact: user.email || `${cleanUsername}@sahyogx.internal`,
                role: frontendRole
              };
              return { token, profile };
            }
          } catch {
            // Profile fetch fallback
          }

          const resolvedRole = (cleanUsername.includes('cmd') || cleanUsername.includes('command') || requestedRole === 'COMMANDER')
            ? 'COMMANDER'
            : (cleanUsername.includes('med') || cleanUsername.includes('welfare') || cleanUsername.includes('officer') || requestedRole === 'MEDICAL_OFFICER')
            ? 'MEDICAL_OFFICER'
            : 'PERSONNEL';

          const profile = {
            ...MOCK_PERSONNEL_PROFILE,
            personnelId: cleanUsername.toUpperCase(),
            role: resolvedRole,
          };
          return { token, profile };
        }
      } else if (res.status === 401 || res.status === 400 || res.status === 403) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || 'Authentication failed. Check your credentials.');
      }
    } catch (err: any) {
      if (err.message && (err.message.includes('Authentication failed') || err.message.includes('Incorrect') || err.message.includes('credentials') || err.message.includes('required') || err.message.includes('deactivated'))) {
        throw err;
      }
      if (!USE_MOCK && API_BASE_URL) {
        throw new Error('Backend authentication service unavailable. Check connection.');
      }
    }

    // Development / Mock fallback when backend is unreachable
    await delay(100);
    const token = `mock-token-${Date.now()}`;
    sessionStorage.setItem(STORAGE_KEYS.TOKEN, token);
    const resolvedRole = requestedRole || (
      cleanUsername.includes('cmd') || cleanUsername.includes('command') ? 'COMMANDER'
      : cleanUsername.includes('med') || cleanUsername.includes('verma') || cleanUsername.includes('welfare') ? 'MEDICAL_OFFICER'
      : 'PERSONNEL'
    );
    const profile: PersonnelProfile = {
      ...MOCK_PERSONNEL_PROFILE,
      personnelId: cleanUsername.toUpperCase(),
      name: resolvedRole === 'COMMANDER' ? 'Col. R. Sharma (Commanding Officer)' : resolvedRole === 'MEDICAL_OFFICER' ? 'Maj. Dr. A. Verma (Regimental Medical Officer)' : 'Havildar Rajesh Kumar',
      rank: resolvedRole === 'COMMANDER' ? 'Colonel' : resolvedRole === 'MEDICAL_OFFICER' ? 'Major (Medical)' : 'Havildar',
      role: resolvedRole,
    };
    return { token, profile };
  }

  /* =======================================================
     AUTH: POST /api/v1/auth/register
     ======================================================= */
  async register(data: {
    username: string;
    password: string;
    role: string;
    fullName?: string;
    rank?: string;
    unit?: string;
  }): Promise<{ token: string; profile: PersonnelProfile }> {
    const cleanUsername = data.username.trim().toLowerCase();
    
    // 1. Try registering with backend
    try {
      const endpoint = `${API_BASE_URL}/api/v1/auth/register`;
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanUsername,
          password: data.password,
          role: data.role,
          full_name: data.fullName || cleanUsername.toUpperCase(),
        }),
      });
    } catch {
      // Ignore network errors on register — will save locally
    }

    // 2. Persist in local storage so next time only login is needed
    try {
      const stored = localStorage.getItem('sahyogx_registered_users');
      const regUsers = stored ? JSON.parse(stored) : {};
      regUsers[cleanUsername] = {
        username: cleanUsername,
        password: data.password,
        role: data.role,
        fullName: data.fullName,
        rank: data.rank,
        unit: data.unit,
        registeredAt: new Date().toISOString(),
      };
      localStorage.setItem('sahyogx_registered_users', JSON.stringify(regUsers));
    } catch {
      // ignore
    }

    // 3. Immediately log in the registered user
    return this.login(cleanUsername, data.password, data.role);
  }

  logout(): void {
    sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem('sahyogx_token');
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
  }

  isAuthenticated(): boolean {
    return !!sessionStorage.getItem(STORAGE_KEYS.TOKEN);
  }

  /* =======================================================
     PROFILE: GET /api/v1/auth/me
     ======================================================= */
  async getProfile(): Promise<PersonnelProfile> {
    // 1. Instant return from session cache if available
    try {
      const saved = sessionStorage.getItem('sahyogx_session_profile');
      if (saved) return JSON.parse(saved);
    } catch {}

    const token = sessionStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token && !token.startsWith('mock-token-') && !token.startsWith('token-reg-')) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 600);
        const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
          headers: this.getHeaders(),
          signal: controller.signal,
        });
        clearTimeout(timer);

        if (res.ok) {
          const user = await res.json();
          // Read the actual role from the backend JWT response
          const backendRole: string = (user.role || 'PERSONNEL').toUpperCase();
          let frontendRole: string;
          if (backendRole === 'COMMANDER') {
            frontendRole = 'COMMANDER';
          } else if (backendRole === 'MEDICAL_OFFICER') {
            frontendRole = 'MEDICAL_OFFICER';
          } else {
            frontendRole = 'PERSONNEL';
          }
          const profile: PersonnelProfile = {
            id: String(user.id || 'usr-prs-003'),
            personnelId: (user.username || 'SF-882914').toUpperCase(),
            name: user.full_name || (frontendRole === 'COMMANDER' ? 'Col. R. Sharma (Commanding Officer)' : frontendRole === 'MEDICAL_OFFICER' ? 'Maj. Dr. A. Verma (Regimental Medical Officer)' : 'Hav. K. Singh'),
            rank: frontendRole === 'COMMANDER' ? 'Colonel' : frontendRole === 'MEDICAL_OFFICER' ? 'Major (Medical)' : 'Havildar',
            unit: '14 Rajputana Rifles',
            station: 'Forward Base Northern Sector',
            serviceYears: 9,
            tradeSpecialty: frontendRole === 'COMMANDER' ? 'Commanding Officer' : frontendRole === 'MEDICAL_OFFICER' ? 'Medical Officer' : 'Tactical Signals Specialist',
            emailContact: user.email || `${user.username}@sahyogx.internal`,
            role: frontendRole
          };
          try {
            sessionStorage.setItem('sahyogx_session_profile', JSON.stringify(profile));
          } catch {}
          return profile;
        }
      } catch {
        // Fallback to local profile
      }
    }
    return MOCK_PERSONNEL_PROFILE;
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
