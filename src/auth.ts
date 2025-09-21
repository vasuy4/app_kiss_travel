// Упрощенная аутентификация для Cloudflare Workers

// Простая функция хеширования паролей (для демо, в production нужен более безопасный подход)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'mechta-salt-2024');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

// Проверка пароля
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const newHash = await hashPassword(password);
  return newHash === hash;
}

// Генерация JWT токена (упрощенная версия)
export function generateToken(userId: number, email: string, role: string): string {
  const payload = {
    userId,
    email,
    role,
    exp: Date.now() + 24 * 60 * 60 * 1000 // 24 часа
  };
  
  // Простая кодировка (в production нужна подпись)
  return btoa(JSON.stringify(payload));
}

// Проверка JWT токена
export function verifyToken(token: string): any {
  try {
    const payload = JSON.parse(atob(token));
    
    // Проверка срока действия
    if (payload.exp < Date.now()) {
      return null;
    }
    
    return payload;
  } catch (error) {
    return null;
  }
}