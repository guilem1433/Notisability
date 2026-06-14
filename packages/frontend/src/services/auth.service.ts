import apiService from "./api.service";
import { AuthResponse, LoginPayload, RegisterPayload, User } from "../types/auth.types";

class AuthService {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await apiService.post<AuthResponse>("/auth/login", payload);
    apiService.setTokens(data.accessToken, data.refreshToken);
    return data;
  }

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await apiService.post<AuthResponse>("/auth/register", payload);
    apiService.setTokens(data.accessToken, data.refreshToken);
    return data;
  }

  async getCurrentUser(): Promise<User> {
    const { data } = await apiService.get<User>("/auth/me");
    return data;
  }

  logout(): void {
    apiService.clearTokens();
  }

  isAuthenticated(): boolean {
    return apiService.getAccessToken() !== null;
  }
}

export const authService = new AuthService();
export default authService;
