const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface GameRecord {
  id: number;
  gameType: string;
  bet: number;
  result: number;
  timestamp: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  balance: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${this.baseUrl}${endpoint}`;
    console.log('🔵 [API] Making request:', options.method || 'GET', url);
    console.log('🔵 [API] Headers:', headers);
    console.log('🔵 [API] Body:', options.body);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      console.log('🔵 [API] Response status:', response.status, response.statusText);
      console.log('🔵 [API] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        let errorData = null;
        try {
          errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          console.error('❌ [API] Error response data:', errorData);
        } catch (e) {
          // If response is not JSON, use status text
          const text = await response.text();
          console.error('❌ [API] Error response text:', text);
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('✅ [API] Response data:', data);
      // Spring Boot returns data directly, not wrapped
      return data;
    } catch (error) {
      console.error('❌ [API] Request failed:', error);
      if (error instanceof Error) {
        console.error('❌ [API] Error message:', error.message);
        console.error('❌ [API] Error stack:', error.stack);
        throw error;
      }
      throw new Error('An unknown error occurred');
    }
  }

  // Auth endpoints
  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // Game endpoints
  async playGame(gameType: string, bet: number, winAmount?: number): Promise<GameRecord> {
    const body: any = { gameType, bet };
    if (winAmount !== undefined) {
      body.winAmount = winAmount;
    }
    return this.request<GameRecord>('/games/play', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async getGameHistory(): Promise<GameRecord[]> {
    return this.request<GameRecord[]>('/games/history');
  }

  async clearGameHistory(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/games/history', {
      method: 'DELETE',
    });
  }

  // User endpoints
  async updateBalance(amount: number): Promise<User> {
    return this.request<User>('/users/balance', {
      method: 'PUT',
      body: JSON.stringify({ amount }),
    });
  }

  async getBalance(): Promise<number> {
    return this.request<number>('/users/balance');
  }

  async resetBalance(): Promise<User> {
    return this.request<User>('/users/balance/reset', {
      method: 'POST',
    });
  }

  // Password reset endpoints
  async requestPasswordReset(email: string): Promise<{ message: string; token?: string }> {
    console.log('🔵 [API] requestPasswordReset called with email:', email);
    console.log('🔵 [API] Base URL:', this.baseUrl);
    console.log('🔵 [API] Full URL:', `${this.baseUrl}/auth/password-reset/request`);
    
    try {
      const result = await this.request<{ message: string; token?: string }>('/auth/password-reset/request', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      console.log('✅ [API] requestPasswordReset success:', result);
      return result;
    } catch (error) {
      console.error('❌ [API] requestPasswordReset error:', error);
      throw error;
    }
  }

  async confirmPasswordReset(token: string, newPassword: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/password-reset/confirm', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

