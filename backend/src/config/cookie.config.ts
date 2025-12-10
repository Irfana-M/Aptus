export interface CookieConfig {
  maxAge: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
}

export const cookieConfig: CookieConfig = {
  maxAge: parseInt(process.env.COOKIE_MAX_AGE_DAYS || '7') * 24 * 60 * 60 * 1000,
  httpOnly: process.env.COOKIE_HTTP_ONLY !== 'false', 
  secure: process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true',
  sameSite: (process.env.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none') || 'strict'
};
