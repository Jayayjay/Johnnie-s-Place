import { API_URL } from '../config'

// Single fetch wrapper: JSON in/out, timeout, consistent error surface.
async function request(path, { method = 'GET', body, signal, timeout = 15000 } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  if (signal) signal.addEventListener('abort', () => controller.abort())

  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
    const text = await res.text()
    const data = text ? JSON.parse(text) : null
    if (!res.ok) {
      const message = data?.detail || data?.error || `Request failed (${res.status})`
      throw new ApiError(message, res.status, data)
    }
    return data
  } catch (err) {
    if (err.name === 'AbortError') throw new ApiError('Request timed out', 0)
    if (err instanceof ApiError) throw err
    throw new ApiError('Network error — is the server running?', 0)
  } finally {
    clearTimeout(timer)
  }
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export const api = {
  categories: () => request('/categories/'),
  products: (category) =>
    request(`/products/${category && category !== 'all' ? `?category=${encodeURIComponent(category)}` : ''}`),
  product: (slug) => request(`/products/${slug}/`),
  createOrder: (payload) => request('/orders/', { method: 'POST', body: payload }),
  order: (id) => request(`/orders/${id}/`),
}
