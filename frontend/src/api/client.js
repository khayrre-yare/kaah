const PRODUCTION_API_BASE = 'https://kaah-production.up.railway.app/api';
const DEFAULT_API_BASE = import.meta.env.DEV ? '/api' : PRODUCTION_API_BASE;

function normalizeApiBase(value) {
  const cleanBase = (value || DEFAULT_API_BASE).replace(/\/$/, '');
  if (cleanBase === '/api' || cleanBase.endsWith('/api')) return cleanBase;
  return `${cleanBase}/api`;
}

const API_BASE = normalizeApiBase(import.meta.env.VITE_API_BASE_URL);
const AUTH_STORAGE_KEY = 'kaah3_auth_v1';

function decodeJwtPayload(token) {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

function tokenExpired(token) {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  return payload.exp * 1000 <= Date.now();
}

function getStoredAuth() {
  try {
    const value = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!value) return null;

    const auth = JSON.parse(value);
    if (!auth?.token || tokenExpired(auth.token)) {
      clearAuth();
      return null;
    }

    return {
      token: auth.token,
      name: auth.name || auth.Name || 'User',
      role: auth.role || auth.Role || 'User',
    };
  } catch {
    clearAuth();
    return null;
  }
}

export function saveAuth(auth) {
  const cleanAuth = {
    token: auth.token,
    name: auth.name || 'User',
    role: auth.role || 'User',
  };
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(cleanAuth));
}


export function clearAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem('kaah2_auth_v2');
  localStorage.removeItem('kaah_auth');
  localStorage.removeItem('token');
  localStorage.removeItem('name');
  localStorage.removeItem('role');
}


function notifyUnauthorized() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('kaah:unauthorized'));
  }
}

export function readAuth() {
  return getStoredAuth();
}

function getErrorMessage(payload, fallback) {
  if (!payload) return fallback;
  if (typeof payload === 'string') return payload;
  if (payload.message) return payload.message;
  if (payload.title) return payload.title;
  if (payload.errors) {
    const firstError = Object.values(payload.errors).flat()[0];
    if (firstError) return firstError;
  }
  return fallback;
}

export async function apiRequest(endpoint, options = {}) {
  const auth = getStoredAuth();
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (response.status === 401) {
    clearAuth();
    notifyUnauthorized();
    throw new Error('Session-ka login-ka wuu dhacay ama token-ku sax ma aha. Logout/Login mar kale samee.');
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(data, `Request failed (${response.status})`));
  }

  return response.status === 204 ? null : data;
}

export const authApi = {
  login: ({ email, password }) => apiRequest('/Auth/login', {
    method: 'POST',
    body: JSON.stringify({ Email: email, Password: password }),
  }),
  register: ({ fullName, email, password }) => apiRequest('/Auth/register', {
    method: 'POST',
    body: JSON.stringify({ FullName: fullName, Email: email, Password: password }),
  }),
};

export const booksApi = {
  getAll: () => apiRequest('/Books'),
  getById: (id) => apiRequest(`/Books/${id}`),
  create: (book) => apiRequest('/Books', {
    method: 'POST',
    body: JSON.stringify({
      Title: book.title,
      Author: book.author,
      Price: Number(book.price),
      Quantity: Number(book.quantity),
      CategoryId: Number(book.categoryId),
    }),
  }),
  update: (id, book) => apiRequest(`/Books/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      Title: book.title,
      Author: book.author,
      Price: Number(book.price),
      Quantity: Number(book.quantity),
      CategoryId: Number(book.categoryId),
    }),
  }),
  delete: (id) => apiRequest(`/Books/${id}`, { method: 'DELETE' }),
};

export const categoriesApi = {
  getAll: () => apiRequest('/Categories'),
  create: ({ name }) => apiRequest('/Categories', {
    method: 'POST',
    body: JSON.stringify({ Name: name }),
  }),
  update: (id, { name }) => apiRequest(`/Categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ Name: name }),
  }),
  delete: (id) => apiRequest(`/Categories/${id}`, { method: 'DELETE' }),
};

export const borrowsApi = {
  getAll: () => apiRequest('/Borrows'),
  create: ({ bookId, returnDate }) => apiRequest('/Borrows', {
    method: 'POST',
    body: JSON.stringify({ BookId: Number(bookId), ReturnDate: returnDate }),
  }),
  approve: (id) => apiRequest(`/Borrows/${id}/approve`, { method: 'PUT' }),
  reject: (id) => apiRequest(`/Borrows/${id}/reject`, { method: 'PUT' }),
  returnBook: (id) => apiRequest(`/Borrows/${id}/return`, { method: 'PUT' }),
};

export const ordersApi = {
  getAll: () => apiRequest('/Orders'),
  getById: (id) => apiRequest(`/Orders/${id}`),
  create: ({ items }) => apiRequest('/Orders', {
    method: 'POST',
    body: JSON.stringify({
      Items: items.map((item) => ({ BookId: Number(item.id || item.bookId), Quantity: Number(item.quantity) })),
    }),
  }),
  approve: (id) => apiRequest(`/Orders/${id}/approve`, { method: 'PUT' }),
  reject: (id) => apiRequest(`/Orders/${id}/reject`, { method: 'PUT' }),
};

export const usersApi = {
  getAll: () => apiRequest('/Users'),
  create: (user) => apiRequest('/Users', {
    method: 'POST',
    body: JSON.stringify({
      FullName: user.fullName,
      Email: user.email,
      Password: user.password,
      Role: user.role,
    }),
  }),
  update: (id, user) => apiRequest(`/Users/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      FullName: user.fullName,
      Email: user.email,
      Role: user.role,
    }),
  }),
  delete: (id) => apiRequest(`/Users/${id}`, { method: 'DELETE' }),
};

export const contactMessagesApi = {
  getAll: () => apiRequest('/ContactMessages'),
  create: ({ message }) => apiRequest('/ContactMessages', {
    method: 'POST',
    body: JSON.stringify({ Message: message }),
  }),
  reply: (id, { adminReply }) => apiRequest(`/ContactMessages/${id}/reply`, {
    method: 'PUT',
    body: JSON.stringify({ AdminReply: adminReply }),
  }),
};
