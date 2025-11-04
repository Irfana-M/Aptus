// export function getEnvVar(key: string): string {
//   const value = process.env[key];
//   if (!value) {
//     throw new Error(`Missing environment variable: ${key}`);
//   }
//   return value;
// }

// export const env = {
//   google: {
//     clientID: getEnvVar("GOOGLE_CLIENT_ID"),
//     clientSecret: getEnvVar("GOOGLE_CLIENT_SECRET"),
//     callbackURL: getEnvVar("GOOGLE_CALLBACK_URL"),
//   },

//   frontend: {
//     url: getEnvVar("CLIENT_URL"),
//     loginUrl: getEnvVar("CLIENT_LOGIN_URL"),
//     googleCallbackUrl: getEnvVar("CLIENT_GOOGLE_CALLBACK_URL"), // ← Fix this line
//   },

//   backend: {
//     url: getEnvVar("BACKEND_URL"),
//   },

//   jwt: {
//     secret: getEnvVar("JWT_SECRET"),
//     refreshSecret: getEnvVar("JWT_REFRESH_SECRET"),
//   },
// };
export function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value) {
    if (defaultValue !== undefined) {
      console.warn(`⚠️ Missing environment variable: ${key}, using default: ${defaultValue}`);
      return defaultValue;
    }
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

export const env = {
  google: {
    clientID: getEnvVar("GOOGLE_CLIENT_ID"),
    clientSecret: getEnvVar("GOOGLE_CLIENT_SECRET"),
    callbackURL: getEnvVar("GOOGLE_CALLBACK_URL"),
  },

  frontend: {
    url: getEnvVar("CLIENT_URL", "http://localhost:5173"),
    loginUrl: getEnvVar("CLIENT_LOGIN_URL", "http://localhost:5173/login"),
    googleCallbackUrl: getEnvVar("CLIENT_GOOGLE_CALLBACK_URL", "http://localhost:5173/auth/google/callback"),
  },

  backend: {
    url: getEnvVar("BACKEND_URL", "http://localhost:5000"),
  },

  jwt: {
    secret: getEnvVar("JWT_SECRET"),
    refreshSecret: getEnvVar("JWT_REFRESH_SECRET"),
  },
};