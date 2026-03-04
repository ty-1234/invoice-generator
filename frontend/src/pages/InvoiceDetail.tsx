import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import toast from 'react-hot-toast';
import { invoicesApi } from '../api/invoices';

const statusClass: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  sent: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-slate-100 text-slate-500',
};

const stripePublicKey = (import.meta.env.VITE_STRIPE_PUBLIC_KEY ?? '').trim();
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

interface CheckoutFormProps {
  amount: number;
  currency: string;
  onCancel: () => void;
  onSuccess: () => Promise<void> | void;
}

function CheckoutForm({ amount, currency, onCancel, onSuccess }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: 'if_required',
      });

      if (error) {
        toast.error(error.message || 'Payment failed');
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        toast.success('Payment successful');
        await onSuccess();
        return;
      }

      toast.error('Payment did not complete');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="mb-3 text-sm text-slate-600">
          Amount due: <span className="font-semibold text-slate-900">{currency} {amount.toFixed(2)}</span>
        </p>
        <PaymentElement />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isProcessing || !stripe || !elements}
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition disabled:opacity-50"
        >
          {isProcessing ? 'Processing...' : 'Confirm payment'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoicesApi.get(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => invoicesApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice deleted');
      navigate('/invoices');
    },
  });

  const createPaymentIntentMutation = useMutation({
    mutationFn: () => invoicesApi.createPaymentIntent(id!),
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      setShowCheckout(true);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to initialize payment');
    },
  });

  if (isLoading || !invoice) {
    return <div className="text-slate-500">Loading...</div>;
  }

  const client = typeof invoice.clientId === 'object' ? invoice.clientId : null;

  const handleDownloadPdf = async () => {
    if (!id) return;

    setIsDownloadingPdf(true);
    try {
      const pdfBlob = await invoicesApi.downloadPdf(id);
      const objectUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `${invoice.number}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to download PDF');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleStartCheckout = () => {
    if (!stripePromise) {
      toast.error('Stripe is not configured on frontend. Set VITE_STRIPE_PUBLIC_KEY.');
      return;
    }
    createPaymentIntentMutation.mutate();
  };

  const handleCheckoutSuccess = async () => {
    setShowCheckout(false);
    setClientSecret(null);
    await queryClient.invalidateQueries({ queryKey: ['invoice', id] });
    await queryClient.invalidateQueries({ queryKey: ['invoices'] });
  };

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{invoice.number}</h1>
          <span className={`inline-block mt-1 px-2 py-0.5 rounded text-sm font-medium ${statusClass[invoice.status] ?? 'bg-slate-100'}`}>
            {invoice.status}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition disabled:opacity-50"
          >
            {isDownloadingPdf ? 'Downloading...' : 'Download PDF'}
          </button>
          <Link
            to={`/invoices/${id}/edit`}
            className="px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition"
          >
            Edit
          </Link>
          {invoice.status !== 'paid' && (
            <button
              onClick={handleStartCheckout}
              disabled={createPaymentIntentMutation.isPending}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {createPaymentIntentMutation.isPending ? 'Preparing payment...' : 'Pay'}
            </button>
          )}
          {invoice.status !== 'paid' && (
            <button
              onClick={() => {
                if (window.confirm('Delete this invoice?')) {
                  deleteMutation.mutate();
                }
              }}
              disabled={deleteMutation.isPending}
              className="px-4 py-2 rounded-lg border border-red-300 text-red-600 font-medium hover:bg-red-50 transition"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-slate-500 uppercase">From</h3>
            <p className="font-medium mt-1">Invoice Generator</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-500 uppercase">Bill To</h3>
            {client ? (
              <>
                <p className="font-medium mt-1">{client.name}</p>
                <p className="text-slate-600">{client.email}</p>
              </>
            ) : (
              <p className="text-slate-500 mt-1">—</p>
            )}
          </div>
        </div>

        <div className="p-6 border-b border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-slate-500">Issue Date</p>
            <p className="font-medium">{new Date(invoice.issueDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Due Date</p>
            <p className="font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Currency</p>
            <p className="font-medium">{invoice.currency}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Status</p>
            <p className="font-medium capitalize">{invoice.status}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-700">Description</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-slate-700">Qty</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-slate-700">Unit Price</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-slate-700">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.lineItems?.map((item, i) => (
                <tr key={i}>
                  <td className="px-6 py-4">{item.description}</td>
                  <td className="px-6 py-4 text-right">{item.quantity}</td>
                  <td className="px-6 py-4 text-right">{item.unitPrice.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">{item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-6 border-t border-slate-200 flex justify-end">
          <div className="text-right space-y-1">
            <p className="text-slate-600">
              Subtotal: {invoice.currency} {invoice.subtotal.toFixed(2)}
            </p>
            {invoice.tax > 0 && (
              <p className="text-slate-600">Tax: {invoice.currency} {invoice.tax.toFixed(2)}</p>
            )}
            <p className="text-lg font-bold">
              Total: {invoice.currency} {invoice.total.toFixed(2)}
            </p>
          </div>
        </div>

        {invoice.status !== 'paid' && showCheckout && clientSecret && stripePromise && (
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
            <h4 className="text-sm font-medium text-slate-700 mb-3">Pay invoice</h4>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm
                amount={invoice.total}
                currency={invoice.currency}
                onCancel={() => {
                  setShowCheckout(false);
                  setClientSecret(null);
                }}
                onSuccess={handleCheckoutSuccess}
              />
            </Elements>
          </div>
        )}

        {invoice.notes && (
          <div className="px-6 py-4 border-t border-slate-200">
            <h4 className="text-sm font-medium text-slate-700 mb-1">Notes</h4>
            <p className="text-slate-600">{invoice.notes}</p>
          </div>
        )}
        {invoice.terms && (
          <div className="px-6 py-4 border-t border-slate-200">
            <h4 className="text-sm font-medium text-slate-700 mb-1">Terms</h4>
            <p className="text-slate-600">{invoice.terms}</p>
          </div>
        )}
      </div>
    </div>
  );
}
