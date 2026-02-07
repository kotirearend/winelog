const API_BASE = '/api';

class GuestApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('winelog_guest_token', token);
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('winelog_guest_token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('winelog_guest_token');
    }
  }

  getSessionCode(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('winelog_guest_session_code');
    }
    return null;
  }

  setSessionCode(code: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('winelog_guest_session_code', code);
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
      // Redirect to join page if we have a session code
      const code = this.getSessionCode();
      if (typeof window !== 'undefined' && code) {
        window.location.href = `/join/${code}`;
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

  // Join a session (public, no token needed)
  async joinSession(sessionCode: string, guestName: string) {
    const res = await fetch(`${API_BASE}/guest-sessions/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionCode, guestName }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to join session');
    }
    const data = await res.json();
    this.setToken(data.token);
    this.setSessionCode(data.sessionCode);
    return data;
  }
}

export const guestApi = new GuestApiClient();
