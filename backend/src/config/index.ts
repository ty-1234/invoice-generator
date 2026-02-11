import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/invoice-generator',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'access-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
    accessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  storage: {
    type: process.env.STORAGE_TYPE || 'local',
    localPath: process.env.STORAGE_LOCAL_PATH || './uploads',
    s3: {
      accessKey: process.env.AWS_ACCESS_KEY_ID || '',
      secretKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      region: process.env.AWS_REGION || 'us-east-1',
      bucket: process.env.S3_BUCKET || '',
    },
  },
};
