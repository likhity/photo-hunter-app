import * as SecureStore from 'expo-secure-store';

import { getBaseUrl, API_CONFIG } from '~/config/api';

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface ApiError {
  message: string;
  status?: number;
  details?: any;
}

// API Client class
class ApiClient {
  private baseURL: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private initializationPromise: Promise<void> | null = null;

  constructor(baseURL: string = getBaseUrl()) {
    this.baseURL = baseURL;
    console.log('ApiClient: Initialized with base URL:', this.baseURL);
    this.initializationPromise = this.initializeTokens();
  }

  // Initialize tokens from secure storage
  private async initializeTokens() {
    try {
      console.log('ApiClient: Loading tokens from SecureStore...');
      this.accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      this.refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      console.log(
        'ApiClient: Tokens loaded - accessToken:',
        !!this.accessToken,
        'refreshToken:',
        !!this.refreshToken
      );
    } catch (error) {
      console.error('ApiClient: Error loading tokens:', error);
    }
  }

  // Wait for token initialization to complete
  async waitForInitialization(): Promise<void> {
    if (this.initializationPromise) {
      await this.initializationPromise;
      this.initializationPromise = null;
    }
  }

  // Store tokens securely
  private async storeTokens(tokens: AuthTokens) {
    try {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.access);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refresh);
      this.accessToken = tokens.access;
      this.refreshToken = tokens.refresh;
    } catch (error) {
      console.error('Error storing tokens:', error);
      throw new Error('Failed to store authentication tokens');
    }
  }

  // Clear stored tokens
  private async clearTokens() {
    try {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      this.accessToken = null;
      this.refreshToken = null;
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  // Refresh access token
  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseURL}${API_CONFIG.ENDPOINTS.AUTH.REFRESH}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh: this.refreshToken,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        await this.storeTokens({
          access: data.access,
          refresh: this.refreshToken,
        });
        return true;
      } else {
        // Refresh token is invalid, clear all tokens
        await this.clearTokens();
        return false;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      await this.clearTokens();
      return false;
    }
  }

  // Make authenticated request
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    params?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    // // ('ApiClient: Making request to:', endpoint);
    const url = `${this.baseURL}${endpoint}`;

    // Add authorization header if token exists
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    try {
      //   // ('ApiClient: Making HTTP request to:', url);
      //   // ('ApiClient: Request headers:', headers);
      //   // ('ApiClient: Request body:', options.body);

      let response = await fetch(url, {
        ...options,
        headers,
        ...(params ? { params } : {}),
      });

      //   // ('ApiClient: Response status:', response.status);
      //   // ('ApiClient: Response headers:', response.headers);

      // If unauthorized and we have a refresh token, try to refresh
      if (response.status === 401 && this.refreshToken) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry the request with new token
          headers.Authorization = `Bearer ${this.accessToken}`;
          response = await fetch(url, {
            ...options,
            headers,
          });
        }
      }

      // Read raw text first so we can report HTML or other non-JSON responses
      const responseHeaders = response.headers
        ? Object.fromEntries(response.headers.entries())
        : null;
      const contentType = response.headers?.get('content-type') || '';
      const rawText = await response.text();

      let parsed: any | undefined;
      if (rawText && contentType.includes('application/json')) {
        try {
          parsed = JSON.parse(rawText);
        } catch (e) {
          // JSON parse failed; log useful diagnostics
          console.error('Response JSON parse failed. Raw body will be shown below.');
        }
      }

      if (!response.ok) {
        // Enhanced logging for error responses, including raw body
        let parsedRequestBody: any = null;
        if (options.body && typeof options.body === 'string') {
          try {
            parsedRequestBody = JSON.parse(options.body);
          } catch (_) {
            parsedRequestBody = options.body;
          }
        }

        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          url,
          method: options.method || 'GET',
          headers: responseHeaders,
          contentType,
        });
        if (parsed !== undefined) {
          console.error('Error response (parsed JSON):', JSON.stringify(parsed, null, 2));
        }
        console.error('Error response raw body (truncated to 10KB):');
        console.error(
          rawText.length > 10_000 ? rawText.slice(0, 10_000) + '... [truncated]' : rawText
        );
        if (parsedRequestBody !== null) {
          console.error('Request body (pretty):', JSON.stringify(parsedRequestBody, null, 2));
        }

        const message = (parsed && (parsed.error || parsed.message)) || 'Request failed';
        throw {
          message,
          status: response.status,
          details: {
            headers: responseHeaders,
            contentType,
            parsedBody: parsed,
            rawBody: rawText,
          },
        } as ApiError;
      }

      // Success path: return parsed JSON when available; otherwise include raw text
      const data = (parsed !== undefined ? parsed : (undefined as unknown)) as T;
      return {
        data,
        message: parsed === undefined && rawText ? 'Non-JSON response received' : undefined,
      };
    } catch (error) {
      if (error instanceof TypeError) {
        // Network error
        throw {
          message: 'Network error. Please check your connection.',
          status: 0,
        } as ApiError;
      }
      throw error;
    }
  }

  // Public methods for different HTTP verbs
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(
      endpoint,
      {
        method: 'GET',
      },
      params
    );
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'DELETE',
    });
  }

  // Upload file with multipart/form-data
  async uploadFile<T>(
    endpoint: string,
    file: { uri: string; type: string; name: string },
    additionalData?: Record<string, any>,
    fileFieldName: string = 'reference_image_file',
    method: string = 'POST'
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append(fileFieldName, {
      uri: file.uri,
      type: file.type,
      name: file.name,
    } as any);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {};

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: formData,
      });

      const responseHeaders = response.headers
        ? Object.fromEntries(response.headers.entries())
        : null;
      const contentType = response.headers?.get('content-type') || '';
      const rawText = await response.text();

      let parsed: any | undefined;
      if (rawText && contentType.includes('application/json')) {
        try {
          parsed = JSON.parse(rawText);
        } catch (e) {
          console.error('Upload response JSON parse failed. Raw body will be shown below.');
        }
      }

      if (!response.ok) {
        console.error('File Upload Error Response:', {
          status: response.status,
          statusText: response.statusText,
          url,
          method,
          fileName: file.name,
          fileType: file.type,
          headers: responseHeaders,
          contentType,
        });
        if (parsed !== undefined) {
          console.error('Upload error response (parsed JSON):', JSON.stringify(parsed, null, 2));
        }
        console.error('Upload error response raw body (truncated to 10KB):');
        console.error(
          rawText.length > 10_000 ? rawText.slice(0, 10_000) + '... [truncated]' : rawText
        );
        if (additionalData) {
          console.error('Additional data (pretty):', JSON.stringify(additionalData, null, 2));
        }

        const message = (parsed && (parsed.error || parsed.message)) || 'Upload failed';
        throw {
          message,
          status: response.status,
          details: {
            headers: responseHeaders,
            contentType,
            parsedBody: parsed,
            rawBody: rawText,
          },
        } as ApiError;
      }

      const data = (parsed !== undefined ? parsed : (undefined as unknown)) as T;
      return {
        data,
        message: parsed === undefined && rawText ? 'Non-JSON response received' : undefined,
      };
    } catch (error) {
      if (error instanceof TypeError) {
        throw {
          message: 'Network error. Please check your connection.',
          status: 0,
        } as ApiError;
      }
      throw error;
    }
  }

  // Authentication methods
  async login(
    email: string,
    password: string
  ): Promise<ApiResponse<{ user: any; access: string; refresh: string }>> {
    // // (
    //   'ApiClient: Making login request to:',
    //   `${this.baseURL}${API_CONFIG.ENDPOINTS.AUTH.LOGIN}`
    // );
    const response = await this.post<{ user: any; access: string; refresh: string }>(
      API_CONFIG.ENDPOINTS.AUTH.LOGIN,
      { email, password }
    );
    // // ('ApiClient: Login response:', response);

    if (response.data) {
      // ('ApiClient: Storing tokens');
      await this.storeTokens({
        access: response.data.access,
        refresh: response.data.refresh,
      });
    }

    return response;
  }

  async register(userData: {
    email: string;
    password: string;
    password_confirm: string;
    name: string;
  }): Promise<ApiResponse<{ user: any; access: string; refresh: string }>> {
    // // (
    //   'ApiClient: Making register request to:',
    //   `${this.baseURL}${API_CONFIG.ENDPOINTS.AUTH.REGISTER}`
    // );
    // // ('ApiClient: Register data:', userData);
    // // ('ApiClient: Full request body:', JSON.stringify(userData, null, 2));
    const response = await this.post<{ user: any; access: string; refresh: string }>(
      API_CONFIG.ENDPOINTS.AUTH.REGISTER,
      userData
    );
    // // ('ApiClient: Register response:', response);

    if (response.data) {
      //   // ('ApiClient: Storing tokens for new user');
      await this.storeTokens({
        access: response.data.access,
        refresh: response.data.refresh,
      });
    }

    return response;
  }

  async logout(): Promise<void> {
    try {
      if (this.refreshToken) {
        await this.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, { refresh: this.refreshToken });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      await this.clearTokens();
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // Get current access token
  getAccessToken(): string | null {
    return this.accessToken;
  }
}

// Export singleton instance
export default new ApiClient();
export { ApiClient };
