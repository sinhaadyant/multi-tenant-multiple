// Store types to avoid circular dependencies
export interface RootState {
  auth: {
    user: any;
    tenant: any;
    tokens: any;
    roles: string[];
    permissions: string[];
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
  };
  authApi: any;
}
