export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  name: string;
}

class AuthService {
  private currentUser: User | null = null;
  private isAuthenticated = false;

  // In a real app, these would be API calls to your backend
  async login(data: LoginData): Promise<User> {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock validation - in real app, validate against backend
    if (data.email === 'test@example.com' && data.password === 'password') {
      const user: User = {
        id: '1',
        email: data.email,
        name: 'Test User',
        createdAt: new Date().toISOString(),
      };
      this.currentUser = user;
      this.isAuthenticated = true;
      return user;
    }

    throw new Error('Invalid email or password');
  }

  async signup(data: SignupData): Promise<User> {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock validation - in real app, validate and create user in backend
    if (data.email && data.password && data.name) {
      const user: User = {
        id: Date.now().toString(),
        email: data.email,
        name: data.name,
        createdAt: new Date().toISOString(),
      };
      this.currentUser = user;
      this.isAuthenticated = true;
      return user;
    }

    throw new Error('Invalid signup data');
  }

  async logout(): Promise<void> {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    this.currentUser = null;
    this.isAuthenticated = false;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated;
  }

  // In a real app, you would also have methods to:
  // - Refresh tokens
  // - Reset password
  // - Update profile
  // - Handle token expiration
}

export default new AuthService();
