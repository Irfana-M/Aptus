const REFRESH_TOKEN_COOKIE_DAYS = parseInt(process.env.REFRESH_TOKEN_COOKIE_DAYS || "7", 10);

if (isNaN(REFRESH_TOKEN_COOKIE_DAYS) || REFRESH_TOKEN_COOKIE_DAYS <= 0) {
  throw new Error("REFRESH_TOKEN_COOKIE_DAYS must be a positive number");
}

export const config = {
  cookie: {
    refreshToken: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      path: "/",
      maxAge: REFRESH_TOKEN_COOKIE_DAYS * 24 * 60 * 60 * 1000,
    }
  },
  jwt: {
    refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d"
  }
};