function resolveApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (envUrl) {
    const stripped = envUrl.replace(/\/+$/, "");
    if (stripped.endsWith("/api")) {
      return stripped;
    }
    return `${stripped}/api`;
  }
  // Local and fallback: when deployed without env variable, relative /api uses Next.js rewrite proxy
  return typeof window !== "undefined" ? "/api" : "http://127.0.0.1:8000/api";
}

const API_BASE_URL = resolveApiBaseUrl();

let initTokenPromise: Promise<string | null> | null = null;

export async function getOrEnsureToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  let token = localStorage.getItem("medicare_token");
  if (!token) {
    if (!initTokenPromise) {
      initTokenPromise = fetch(`${API_BASE_URL}/auth/demo-login`, { method: "POST" })
        .then((r) => r.json())
        .then((data) => {
          if (data && data.access_token) {
            localStorage.setItem("medicare_token", data.access_token);
            return data.access_token as string;
          }
          return null;
        })
        .catch(() => null)
        .finally(() => {
          initTokenPromise = null;
        });
    }
    token = await initTokenPromise;
  }
  return token;
}

export function getToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("medicare_token");
  }
  return null;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  let token = await getOrEnsureToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Set default JSON Content-Type if body is not FormData
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  let response = await fetch(url, {
    ...options,
    headers,
  });

  // If unauthorized and not a login request, try auto-refreshing demo session once
  if (response.status === 401 && !endpoint.includes("/auth/login") && typeof window !== "undefined") {
    localStorage.removeItem("medicare_token");
    token = await getOrEnsureToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
      response = await fetch(url, {
        ...options,
        headers,
      });
    }
  }

  if (!response.ok) {
    let errorDetail = "An unexpected error occurred";
    try {
      const errJson = await response.json();
      if (Array.isArray(errJson.detail)) {
        errorDetail = errJson.detail
          .map((item: any) => {
            const loc = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : "field";
            return `${loc}: ${item.msg}`;
          })
          .join(" | ");
      } else if (typeof errJson.detail === "string") {
        errorDetail = errJson.detail;
      } else if (errJson.message) {
        errorDetail = errJson.message;
      } else {
        errorDetail = JSON.stringify(errJson);
      }
    } catch {
      errorDetail = await response.text();
    }
    throw new Error(errorDetail || `HTTP ${response.status}`);
  }

  // Handle empty or text responses
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  return response.text() as any;
}

export const api = {
  // Auth
  demoLogin: () => apiRequest("/auth/demo-login", { method: "POST" }),
  login: (data: { email: string; password: string }) =>
    apiRequest("/auth/login-json", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  register: (data: { email: string; password: string; full_name: string }) =>
    apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getMe: () => apiRequest("/auth/me"),
  updateProfile: (profile: any) =>
    apiRequest("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(profile),
    }),

  // Documents
  getDocuments: (search?: string, category?: string) => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (category) params.append("category", category);
    return apiRequest(`/documents?${params.toString()}`);
  },
  getDocument: (id: number) => apiRequest(`/documents/${id}`),
  uploadDocument: (formData: FormData) =>
    apiRequest("/documents/upload", {
      method: "POST",
      body: formData,
    }),
  reprocessDocument: (id: number) =>
    apiRequest(`/documents/${id}/reprocess`, { method: "POST" }),
  deleteDocument: (id: number) =>
    apiRequest(`/documents/${id}`, { method: "DELETE" }),

  // Reports
  getReportSummary: (id: number) => apiRequest(`/reports/${id}/summary`),
  downloadSummaryUrl: (id: number, viewMode: "simple" | "medical" = "simple") =>
    `${API_BASE_URL}/reports/${id}/download?view_mode=${viewMode}`,

  // Health Tracking
  getHealthOverview: () => apiRequest("/health/overview"),
  getParameterTrend: (name: string) =>
    apiRequest(`/health/trends/${encodeURIComponent(name)}`),
  compareReports: (rep1Id: number, rep2Id: number) =>
    apiRequest(`/health/compare?report_1_id=${rep1Id}&report_2_id=${rep2Id}`),
  getHealthTimeline: () => apiRequest("/health/timeline"),

  // Medications
  getMedications: (activeOnly = false) =>
    apiRequest(`/medications?active_only=${activeOnly}`),
  createMedication: (data: any) =>
    apiRequest("/medications", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateMedication: (id: number, data: any) =>
    apiRequest(`/medications/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteMedication: (id: number) =>
    apiRequest(`/medications/${id}`, { method: "DELETE" }),
  logMedication: (medId: number, data: any) =>
    apiRequest(`/medications/${medId}/log`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getTodayMedSchedule: () => apiRequest("/medications/schedule/today"),

  // Reminders & Appointments
  getReminders: (status?: string) =>
    apiRequest(status ? `/reminders?status_filter=${status}` : "/reminders"),
  createReminder: (data: any) => {
    const payload = {
      title: data.title,
      description: data.description || data.notes || "",
      reminder_type: data.reminder_type || "MEDICATION",
      reminder_time: data.reminder_time || data.scheduled_time,
      recurrence: data.recurrence || "NONE",
      status: data.status || "ACTIVE",
      is_confirmed: data.is_confirmed !== undefined ? data.is_confirmed : true,
      document_id: data.document_id || null,
      extracted_from_doc: !!data.extracted_from_doc,
    };
    return apiRequest("/reminders", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updateReminder: (id: number, data: any) =>
    apiRequest(`/reminders/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  completeReminder: (id: number) =>
    apiRequest(`/reminders/${id}/complete`, { method: "POST" }),
  confirmReminder: (id: number) =>
    apiRequest(`/reminders/${id}/confirm`, { method: "POST" }),
  deleteReminder: (id: number) =>
    apiRequest(`/reminders/${id}`, { method: "DELETE" }),
  getNotifications: () => apiRequest("/reminders/notifications"),

  getAppointments: () => apiRequest("/appointments"),
  createAppointment: (data: any) => {
    const payload = {
      doctor_name: data.doctor_name,
      specialty: data.specialty || "General Physician",
      hospital_or_clinic: data.hospital_or_clinic || data.clinic_or_hospital || "",
      appointment_date: data.appointment_date || data.appointment_time,
      reason: data.reason || "",
      notes: data.notes || data.instructions || "",
      status: data.status || "SCHEDULED",
      document_id: data.document_id || null,
    };
    return apiRequest("/appointments", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  deleteAppointment: (id: number) =>
    apiRequest(`/appointments/${id}`, { method: "DELETE" }),

  // Family & Caregivers
  getFamilyConnections: () => apiRequest("/family/connections"),
  inviteFamily: (data: any) =>
    apiRequest("/family/invite", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateFamilyPermissions: (id: number, data: any) =>
    apiRequest(`/family/connections/${id}/permissions`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  revokeFamilyConnection: (id: number) =>
    apiRequest(`/family/connections/${id}/revoke`, { method: "POST" }),
  acceptFamilyConnection: (id: number) =>
    apiRequest(`/family/connections/${id}/accept`, { method: "POST" }),

  // Chat / Assistant
  getChatSessions: () => apiRequest("/chat/sessions"),
  createChatSession: (title: string, language = "en") =>
    apiRequest(`/chat/sessions?title=${encodeURIComponent(title)}&language=${language}`, {
      method: "POST",
    }),
  getSessionMessages: (sessionId: number) =>
    apiRequest(`/chat/sessions/${sessionId}/messages`),
  sendChatQuery: (data: { message: string; session_id?: number; language?: string }) =>
    apiRequest("/chat/query", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteChatSession: (sessionId: number) =>
    apiRequest(`/chat/sessions/${sessionId}`, { method: "DELETE" }),
};
