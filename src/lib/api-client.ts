const API_BASE = '/api';

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('winelog_token', token);
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('winelog_token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('winelog_token');
    }
  }

  async fetch(path: string, options: RequestInit = {}) {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    if (res.status === 401) {
      this.clearToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Unauthorized');
    }
    return res;
  }

  async get(path: string) {
    const res = await this.fetch(path);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async post(path: string, body: unknown) {
    const res = await this.fetch(path, { method: 'POST', body: JSON.stringify(body) });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async patch(path: string, body: unknown) {
    const res = await this.fetch(path, { method: 'PATCH', body: JSON.stringify(body) });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async delete(path: string) {
    const res = await this.fetch(path, { method: 'DELETE' });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
}

export const api = new ApiClient();
