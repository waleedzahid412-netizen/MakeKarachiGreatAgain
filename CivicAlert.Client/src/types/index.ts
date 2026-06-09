export interface AuthUser {
  userId: number | null;
  email: string | null;
  role: string | null;
  districtId: number | null;
  townId: number | null;
  fullName: string | null;
  preferredLanguage: string | null;
  departmentId?: number | null;
  departmentName?: string | null;
  departmentFullName?: string | null;
  departmentDescription?: string | null;
}

export interface LookupItem {
  id: number;
  name: string;
}

export interface ReportSummary {
  id: number;
  title: string;
  categoryName: string;
  statusName: string;
  priorityScore: number;
  latitude: number;
  longitude: number;
  isEmergency: boolean;
  createdAt: string;
  reporterName: string;
  imageUrl: string | null;
  departmentName: string;
  confirmCount: number;
}

export interface ReportDetail extends ReportSummary {
  description: string | null;
  districtName: string;
  townName: string;
  confirmCount: number;
  reporterEmail: string | null;
  hasVerified: boolean;
  reporterId: number;
  statusHistories: StatusHistoryItem[];
  departmentFullName?: string | null;
  departmentDescription?: string | null;
}

export interface StatusHistoryItem {
  oldStatus: string;
  newStatus: string;
  note: string | null;
  changedAt: string;
  changedByName: string;
}

export interface AuthResponse {
  success: boolean;
  errorMessage: string | null;
  userId: number | null;
  email: string | null;
  role: string | null;
  districtId: number | null;
  townId: number | null;
  fullName: string | null;
  preferredLanguage: string | null;
  departmentId?: number | null;
  departmentName?: string | null;
  departmentFullName?: string | null;
  departmentDescription?: string | null;
}
