import nodemailer from 'nodemailer';
import { config } from '../config';
import { logger } from '../utils/logger';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!config.smtp.host || !config.smtp.user) {
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
  }
  return transporter;
}

export const sendEmail = async (options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> => {
  const transport = getTransporter();
  if (!transport) {
    logger.debug('Email not configured, skipping send');
    return false;
  }

  try {
    await transport.sendMail({
      from: `Invoice Generator <${config.smtp.user}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    logger.info({ to: options.to, subject: options.subject }, 'Email sent');
    return true;
  } catch (err) {
    logger.error({ err, to: options.to }, 'Failed to send email');
    return false;
  }
};

export const sendInvoiceCreated = async (
  clientEmail: string,
  invoiceNumber: string,
  total: number,
  currency: string
): Promise<boolean> => {
  return sendEmail({
    to: clientEmail,
    subject: `Invoice ${invoiceNumber} Created`,
    html: `
      <h2>New Invoice</h2>
      <p>Invoice ${invoiceNumber} has been created.</p>
      <p>Total: ${currency} ${total.toFixed(2)}</p>
    `,
  });
};

export const sendInvoicePaid = async (
  clientEmail: string,
  invoiceNumber: string,
  amount: number,
  currency: string
): Promise<boolean> => {
  return sendEmail({
    to: clientEmail,
    subject: `Payment Received - Invoice ${invoiceNumber}`,
    html: `
      <h2>Payment Confirmed</h2>
      <p>We have received payment for Invoice ${invoiceNumber}.</p>
      <p>Amount: ${currency} ${amount.toFixed(2)}</p>
    `,
  });
};
