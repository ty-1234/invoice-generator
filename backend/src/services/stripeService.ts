import Stripe from 'stripe';
import { config } from '../config';
import { Invoice } from '../models/Invoice';
import { Payment } from '../models/Payment';
import { AppError } from '../middleware/errorHandler';

let stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!config.stripe.secretKey) {
    throw new AppError('Stripe is not configured', 500);
  }
  if (!stripe) {
    stripe = new Stripe(config.stripe.secretKey, { apiVersion: '2023-10-16' });
  }
  return stripe;
}

export const createPaymentIntent = async (
  invoiceId: string
): Promise<{ clientSecret: string; amount: number }> => {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }
  if (invoice.status === 'paid') {
    throw new AppError('Invoice already paid', 400);
  }

  const amountInCents = Math.round(invoice.total * 100);

  const paymentIntent = await getStripe().paymentIntents.create({
    amount: amountInCents,
    currency: invoice.currency.toLowerCase(),
    metadata: { invoiceId: invoice._id.toString() },
    automatic_payment_methods: { enabled: true },
  });

  return {
    clientSecret: paymentIntent.client_secret!,
    amount: invoice.total,
  };
};

export const handleWebhook = async (payload: Buffer, signature: string): Promise<void> => {
  const s = getStripe();
  let event: Stripe.Event;
  try {
    event = s.webhooks.constructEvent(payload, signature, config.stripe.webhookSecret);
  } catch (err) {
    throw new AppError('Invalid webhook signature', 400);
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent;
    const invoiceId = pi.metadata?.invoiceId;
    if (!invoiceId) return;

    await Invoice.updateOne(
      { _id: invoiceId },
      { $set: { status: 'paid' } }
    );

    await Payment.create({
      invoiceId,
      provider: 'stripe',
      providerPaymentId: pi.id,
      amount: (pi.amount || 0) / 100,
      currency: pi.currency,
      status: 'succeeded',
      paidAt: new Date(),
    });
  }
}
