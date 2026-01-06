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

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const error = await response.json();
          errorMessage = error.message || error.error || errorMessage;
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      // Spring Boot returns data directly, not wrapped
      return data;
    } catch (error) {
      if (error instanceof Error) {
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
  async playGame(gameType: string, bet: number): Promise<GameRecord> {
    return this.request<GameRecord>('/games/play', {
      method: 'POST',
      body: JSON.stringify({ gameType, bet }),
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
  async requestPasswordReset(email: string): Promise<{ message: string; token: string; note: string }> {
    return this.request<{ message: string; token: string; note: string }>('/auth/password-reset/request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async confirmPasswordReset(token: string, newPassword: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/password-reset/confirm', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

