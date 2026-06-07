const BASE = '/api';

function getToken() {
  return localStorage.getItem('oj_token');
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${url}`, { ...options, headers });

  if (!res.ok) {
    if (res.status === 401 && !url.includes('/auth/login') && !url.includes('/auth/register')) {
      localStorage.removeItem('oj_token');
      window.location.href = '/login';
      throw new Error('登录已过期，请重新登录');
    }
    const err = await res.json().catch(() => ({ error: '网络错误' }));
    throw new Error(err.error || `请求失败 (${res.status})`);
  }

  return res.json();
}

const api = {
  auth: {
    register: (body: { username: string; email: string; password: string }) =>
      request<{ token: string; user: import('../types').User }>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body: { email: string; password: string; rememberMe?: boolean }) =>
      request<{ token: string; user: import('../types').User }>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    profile: () => request<import('../types').User>('/auth/profile'),
    leaderboard: () => request<any[]>('/auth/leaderboard'),
    changePassword: (body: { currentPassword: string; newPassword: string }) =>
      request<{ message: string }>('/auth/password', { method: 'PUT', body: JSON.stringify(body) }),
    difficultyStats: () => request<{ difficulties: { difficulty: string; count: number }[] }>('/auth/difficulty-stats'),
    recentSubmissions: () => request<{ submissions: any[] }>('/auth/recent-submissions'),
    deleteAccount: () => request<{ message: string }>('/auth/profile', { method: 'DELETE' }),
  },

  problems: {
    list: (params?: { type?: string; difficulty?: string; search?: string; page?: number; limit?: number; sort?: string; untried?: string }) => {
      const q = new URLSearchParams();
      if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined) q.set(k, String(v)); });
      return request<import('../types').PaginatedResponse<import('../types').Problem>>(`/problems?${q}`);
    },
    get: (id: number) => request<import('../types').Problem>(`/problems/${id}`),
    getSimilar: (id: number, tags: string) => request<import('../types').Problem[]>(`/problems/${id}/similar?tags=${encodeURIComponent(tags)}`),
    getTemplate: (language: string) => request<{ template: string }>(`/problems/templates/${language}`),
    create: (body: Partial<import('../types').Problem>) =>
      request<{ id: number; message: string }>('/problems', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: number, body: Partial<import('../types').Problem>) =>
      request<{ message: string }>(`/problems/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: number) => request<{ message: string }>(`/problems/${id}`, { method: 'DELETE' }),
    stats: () => request<import('../types').ProblemStats>('/problems/stats'),
    getAdminStats: () => request<import('../types').AdminStats>('/problems/admin/stats'),
    getTags: () => request<{ tags: { name: string; count: number }[] }>('/problems/tags'),
    getDaily: () => request<{ problem: import('../types').Problem; date: string }>('/problems/daily'),
  },

  submissions: {
    submit: (body: { problem_id: number; code?: string; language?: string; answer?: string | number }) =>
      request<import('../types').Submission>('/submissions', { method: 'POST', body: JSON.stringify(body) }),
    list: (params?: { problem_id?: number; status?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined) q.set(k, String(v)); });
      return request<import('../types').PaginatedResponse<import('../types').Submission>>(`/submissions?${q}`);
    },
    get: (id: string) => request<import('../types').Submission>(`/submissions/${id}`),
  },
};

export default api;
