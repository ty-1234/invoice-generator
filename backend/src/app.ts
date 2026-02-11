import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import clientRoutes from './routes/clientRoutes';
import invoiceRoutes from './routes/invoiceRoutes';
import paymentRoutes from './routes/paymentRoutes';
import attachmentRoutes from './routes/attachmentRoutes';
import webhookRoutes from './routes/webhookRoutes';

const app = express();

// Stripe webhook - raw body MUST come before express.json()
app.use('/api/v1/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

// JSON body for rest of API
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(helmet());
app.use(mongoSanitize());
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  })
);
app.use(requestLogger);

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/clients', clientRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1', paymentRoutes);
app.use('/api/v1/attachments', attachmentRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);

export default app;
