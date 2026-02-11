import mongoose from 'mongoose';
import { config } from './config';
import app from './app';
import { logger } from './utils/logger';

async function main() {
  try {
    await mongoose.connect(config.mongodbUri);
    logger.info('Connected to MongoDB');
  } catch (err) {
    logger.error({ err }, 'Failed to connect to MongoDB');
    process.exit(1);
  }

  app.listen(config.port, () => {
    logger.info({ port: config.port, env: config.env }, 'Server started');
  });
}

main();
