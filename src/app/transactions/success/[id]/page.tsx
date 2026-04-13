'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { transactionService } from '@/services/transactionService';
import type { TransactionViewResponse } from '@/types';

const TRANSACTION_LOAD_DEDUPE_WINDOW_MS = 2000;

const transactionLoadCache = new Map<
  string,
  {
    createdAt: number;
    promise: Promise<TransactionViewResponse | null>;
  }
>();

function loadTransactionWithDedupe(transactionId: string): Promise<TransactionViewResponse | null> {
  const cached = transactionLoadCache.get(transactionId);
  const now = Date.now();

  if (cached && now - cached.createdAt <= TRANSACTION_LOAD_DEDUPE_WINDOW_MS) {
    return cached.promise;
  }

  const promise = transactionService.completePaymentTransaction(transactionId);
  transactionLoadCache.set(transactionId, { createdAt: now, promise });

  promise.finally(() => {
    setTimeout(() => {
      const latest = transactionLoadCache.get(transactionId);
      if (latest?.promise === promise) {
        transactionLoadCache.delete(transactionId);
      }
    }, TRANSACTION_LOAD_DEDUPE_WINDOW_MS);
  });

  return promise;
}

export default function PaymentSuccessPage() {
  const router = useRouter();
  const params = useParams();
  const transactionId = params.id as string;

  const [transaction, setTransaction] = useState<TransactionViewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isAcknowledged, setIsAcknowledged] = useState(false);

  useEffect(() => {
    loadTransaction();
  }, [transactionId]);

  async function loadTransaction() {
    try {
      const data = await loadTransactionWithDedupe(transactionId);
      setTransaction(data);
      if (!data) {
        setErrorMessage('Transaction not found. Please verify your payment link.');
      }
    } catch {
      setErrorMessage('Failed to load transaction.');
      toast.error('Failed to load transaction.');
    } finally {
      setLoading(false);
    }
  }

  async function copyKey(key: string) {
    try {
      await navigator.clipboard.writeText(key);
      toast.success('License key copied to clipboard.');
    } catch {
      toast.error('Unable to copy license key.');
    }
  }

  function downloadKeyFile(key: string) {
    const fileContent = [
      'SportMania License Key',
      `Transaction: ${transactionId}`,
      `License Key: ${key}`,
      '',
      'Important: This key is shown only once. Keep this file secure.',
    ].join('\n');

    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sportmania-license-${transactionId}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <LoadingSpinner />;

  if (errorMessage || !transaction) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <div className="bg-sm-card border border-red-500/40 rounded-xl p-8 text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-2">Transaction Not Available</h1>
          <p className="text-sm-muted mb-6">{errorMessage || 'We could not find this transaction.'}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="py-3 px-4 bg-sm-primary text-white rounded-lg hover:bg-blue-600 font-semibold"
            >
              Retry
            </button>
            <a
              href="mailto:support@sportmania.com"
              className="py-3 px-4 bg-sm-btn-sec border border-sm-btn-sec-border text-sm-text-light rounded-lg hover:bg-sm-hover font-semibold"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    );
  }

  const isSuccessStatus = transaction.paymentStatus.toLowerCase() === 'success';
  const hasLicenseKey = Boolean(transaction.licenseKey);

  if (!isSuccessStatus) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <div className="bg-sm-card border border-yellow-500/40 rounded-xl p-8 text-center">
          <h1 className="text-2xl font-bold text-yellow-300 mb-2">Payment Is Not Successful</h1>
          <p className="text-sm-muted mb-6">
            Current payment status: <span className="text-sm-text-light font-semibold">{transaction.paymentStatus}</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push('/')}
              className="py-3 px-4 bg-sm-primary text-white rounded-lg hover:bg-blue-600 font-semibold"
            >
              Back to Home
            </button>
            <a
              href="mailto:support@sportmania.com"
              className="py-3 px-4 bg-sm-btn-sec border border-sm-btn-sec-border text-sm-text-light rounded-lg hover:bg-sm-hover font-semibold"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="bg-sm-card border-2 border-green-500 rounded-xl p-8 text-center shadow-[0_12px_32px_rgba(34,197,94,0.12)]">
        <div className="flex items-center justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-green-400 mb-2">Payment Successful!</h1>
        <p className="text-sm-muted mb-6">Your transaction has been completed successfully.</p>

        <div className="bg-sm-bg rounded-lg p-4 mb-6 text-left">
          <h3 className="text-sm font-semibold text-sm-text-light mb-3">Transaction Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-sm-muted">Transaction ID</p>
              <p className="text-sm-text-light font-mono break-all">{transaction.transactionId}</p>
            </div>
            <div>
              <p className="text-sm-muted">Amount</p>
              <p className="text-sm-text-light">RM{transaction.amount}</p>
            </div>
          </div>
        </div>

        {hasLicenseKey ? (
          <div className="mt-4 p-5 bg-green-500/10 border border-green-500/30 rounded-lg text-left">
            <p className="text-xs uppercase tracking-wide text-green-300 mb-1">Your One-Time License Key</p>
            <p className="text-base sm:text-lg font-mono text-green-200 break-all bg-black/20 rounded px-3 py-2">
              {transaction.licenseKey}
            </p>
            <p className="text-sm text-yellow-200 mt-3">This key is shown only once. Save it now.</p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => copyKey(transaction.licenseKey as string)}
                className="py-2.5 px-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-sm"
              >
                Copy Key
              </button>
              <button
                onClick={() => downloadKeyFile(transaction.licenseKey as string)}
                className="py-2.5 px-3 bg-sm-btn-sec border border-sm-btn-sec-border text-sm-text-light rounded-lg hover:bg-sm-hover font-semibold text-sm"
              >
                Download .txt
              </button>
            </div>
          </div>
        ) : transaction.isKeyViewed ? (
          <div className="mt-4 p-5 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-left">
            <p className="text-sm font-semibold text-yellow-300 mb-2">Key Already Viewed</p>
            <p className="text-sm text-sm-muted">
              Your one-time license key has already been revealed previously and cannot be shown again.
              If you need help recovering access, contact support or check your account records.
            </p>
            <a href="mailto:support@sportmania.com" className="inline-block mt-3 text-sm-primary hover:underline">
              support@sportmania.com
            </a>
          </div>
        ) : (
          <div className="mt-4 p-5 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-left">
            <p className="text-sm text-sm-muted">
              Your payment is successful, but the license key is not available yet. Please contact support for assistance.
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => router.push('/')}
            className="py-3 px-4 bg-sm-primary text-white rounded-lg hover:bg-blue-600 font-semibold"
          >
            Back to Home
          </button>
          <a
            href="mailto:support@sportmania.com"
            className="py-3 px-4 bg-sm-btn-sec border border-sm-btn-sec-border text-sm-text-light rounded-lg hover:bg-sm-hover font-semibold"
          >
            Need Help?
          </a>
        </div>
      </div>
    </div>
  );
}
