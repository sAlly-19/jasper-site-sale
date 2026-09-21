export interface AdminUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: "developer_admin";
}

export interface AuthState {
  user: AdminUser | null;
  loading: boolean;
  error: string | null;
}

