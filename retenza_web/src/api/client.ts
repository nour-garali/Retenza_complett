import axios from 'axios';

// Base URL points to the Next.js Route Handlers (BFF) which will proxy to the Node.js backend
// OR it points directly to Node.js backend if used from server components
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request Interceptor: Attach token if we are on the client side and managing it manually,
// but since we will use HTTP-Only cookies via Next.js server actions / API routes,
// the client side Axios won't actually have access to the token!
// Instead, Next.js server will attach it. For direct client-to-backend calls, we might need a Next.js proxy route.
apiClient.interceptors.request.use(
  async (config) => {
    // In a browser environment, we will use Next.js API routes as a proxy to attach the HttpOnly cookie
    // If we are in a server environment (e.g. Next.js Server Component), we must manually pass the token
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;
