// App-specific token refresh helper.
// Không sửa shared infra (context.js / supabase.js) — chỉ dùng API công khai của chúng.

import { getContext } from '../lib/context.js';
import { bridge } from '../lib/bridge.js';
import { resetSupabaseClients } from '../lib/supabase.js';

const REFRESH_BUFFER_MS = 5 * 60 * 1000; // refresh nếu còn < 5 phút

function parseExp(token) {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const json = JSON.parse(decoded);
    return json.exp ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isTokenExpiringSoon(token) {
  if (!token) return true;
  const exp = parseExp(token);
  if (!exp) return false;
  return Date.now() >= exp - REFRESH_BUFFER_MS;
}

export async function ensureFreshToken() {
  const ctx = getContext();
  if (!ctx.token || !isTokenExpiringSoon(ctx.token)) {
    return ctx;
  }

  try {
    const result = await bridge.refreshToken();
    const newToken = result?.token || result;
    if (typeof newToken === 'string' && newToken.includes('.')) {
      if (typeof window !== 'undefined' && window.__APP_CONTEXT__) {
        window.__APP_CONTEXT__.token = newToken;
      }
      // Buộc tái tạo Supabase client để REST dùng token mới
      resetSupabaseClients();
      return getContext();
    }
  } catch (err) {
    console.warn('[token] refresh failed:', err.message);
  }
  return ctx;
}
