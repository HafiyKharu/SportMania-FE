import { apiFetch } from '@/lib/api';
import type {
  TransactionDto,
  PaymentResponseDto,
  ErrorResponseDto,
  TransactionViewResponse,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5235';

export const transactionService = {
  async initiatePayment(
    email: string,
    planId: string,
    phoneNumber: string
  ): Promise<{ isSuccess: boolean; redirectUrl?: string; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/transactions/initiate-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, planId, phoneNumber }),
      });

      if (response.ok) {
        const result: PaymentResponseDto = await response.json();
        return { isSuccess: true, redirectUrl: result.redirectUrl ?? undefined };
      } else {
        const errorResult: ErrorResponseDto = await response.json();
        return { isSuccess: false, error: errorResult.error ?? 'Payment initiation failed.' };
      }
    } catch (error) {
      return { isSuccess: false, error: `Error: ${(error as Error).message}` };
    }
  },

  async getTransaction(transactionId: string): Promise<TransactionDto | null> {
    try {
      return await apiFetch<TransactionDto>(`api/transactions/${transactionId}`);
    } catch (error) {
      console.error(`Error fetching transaction ${transactionId}:`, error);
      return null;
    }
  },

  async getTransactionView(transactionId: string): Promise<TransactionViewResponse | null> {
    return this.fetchTransactionViewFromEndpoints([`api/transactions/${transactionId}`]);
  },

  async completePaymentTransaction(transactionId: string): Promise<TransactionViewResponse | null> {
    return this.fetchTransactionViewFromEndpoints([
      `api/payments/complete/${transactionId}`,
      `api/transactions/${transactionId}`,
    ]);
  },

  async fetchTransactionViewFromEndpoints(endpoints: string[]): Promise<TransactionViewResponse | null> {
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${API_BASE_URL}/${endpoint.replace(/^\//, '')}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
        });

        if (!response.ok) {
          continue;
        }

        return (await response.json()) as TransactionViewResponse;
      } catch {
        // Continue trying fallback endpoint variants.
      }
    }

    return null;
  },

  async getAllTransactions(): Promise<TransactionDto[]> {
    try {
      return await apiFetch<TransactionDto[]>('api/transactions');
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  },
};
