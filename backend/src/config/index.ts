export const config = {
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/aptus',
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  nodeEnv: process.env.NODE_ENV || 'development'
};