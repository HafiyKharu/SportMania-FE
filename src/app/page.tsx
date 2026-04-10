'use client';

import { useEffect, useState } from 'react';
import { planService } from '@/services/planService';
import { transactionService } from '@/services/transactionService';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { PlanDto } from '@/types';
import { toast } from 'sonner';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { ScrollReveal } from '@/components/ScrollReveal';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5235';

export default function HomePage() {
  const prefersReducedMotion = useReducedMotion();
  const [plans, setPlans] = useState<PlanDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<PlanDto | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const [formErrors, setFormErrors] = useState<{ email?: string; phoneNumber?: string }>({});

  const { scrollYProgress } = useScroll();

  const heroY = useTransform(scrollYProgress, [0, 1], [0, -44]);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.3]);

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    try {
      const data = await planService.getAllPlans();
      setPlans(data);
    } catch {
      setErrorMessage('Failed to load plans. Please try again later.');
      toast.error('Failed to load plans.');
    } finally {
      setLoading(false);
    }
  }

  function openModal(plan: PlanDto) {
    setSelectedPlan(plan);
    setEmail('');
    setPhone('');
    setSubmissionError('');
    setFormErrors({});
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setSelectedPlan(null);
    setEmail('');
    setPhone('');
    setSubmissionError('');
    setFormErrors({});
  }

  async function handleSubscription(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPlan) return;

    setIsSubmitting(true);
    setSubmissionError('');
    setFormErrors({});

    const trimmedEmail = email.trim();
    const trimmedPhone = phoneNumber.trim();
    const errors: { email?: string; phoneNumber?: string } = {};

    if (!trimmedEmail) {
      errors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Enter a valid email address.';
    }

    if (!trimmedPhone) {
      errors.phoneNumber = 'Phone number is required.';
    } else if (!/^\+?\d{8,15}$/.test(trimmedPhone.replace(/[\s-]/g, ''))) {
      errors.phoneNumber = 'Enter a valid phone number.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setSubmissionError('Please fix the highlighted fields.');
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await transactionService.initiatePayment(trimmedEmail, selectedPlan.planId, trimmedPhone);
      if (result.isSuccess && result.redirectUrl) {
        const redirectUrl = normalizePaymentRedirectUrl(result.redirectUrl);
        window.location.assign(redirectUrl);
        toast.success('Payment initiated.');
        closeModal();
      } else {
        setSubmissionError(result.error || 'Payment initiation failed.');
        toast.error(result.error || 'Payment initiation failed.');
      }
    } catch {
      setSubmissionError('An error occurred. Please try again.');
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function normalizePaymentRedirectUrl(rawUrl: string): string {
    try {
      const parsedUrl = new URL(rawUrl, window.location.origin);
      const normalizeToFrontendOrigin = (urlToNormalize: URL): URL => {
        urlToNormalize.protocol = window.location.protocol;
        urlToNormalize.host = window.location.host;
        return urlToNormalize;
      };

      const isTransactionResultPath = (pathname: string): boolean =>
        pathname.startsWith('/transactions/success/') || pathname.startsWith('/transactions/failed/');

      if (isTransactionResultPath(parsedUrl.pathname)) {
        normalizeToFrontendOrigin(parsedUrl);
      }

      parsedUrl.searchParams.forEach((value, key) => {
        try {
          const nestedUrl = new URL(value);
          if (isTransactionResultPath(nestedUrl.pathname)) {
            parsedUrl.searchParams.set(key, normalizeToFrontendOrigin(nestedUrl).toString());
          }
        } catch {
          // Ignore non-URL query parameter values.
        }
      });

      return parsedUrl.toString();
    } catch {
      return rawUrl;
    }
  }

  const isPopular = (plan: PlanDto) => plan.name.toLowerCase().includes('monthly');

  if (loading) return <LoadingSpinner text="Loading plans..." />;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section */}
      <motion.section
        className="text-center py-16 px-4"
        style={prefersReducedMotion ? undefined : { y: heroY, opacity: heroOpacity }}
      >
        <ScrollReveal>
          <h1 className="text-5xl font-bold mb-4 ">
            <span className="text-gradient">Stream Your Favorite Content</span>
          </h1>
        </ScrollReveal>
        <ScrollReveal delay={0.08}>
          <p className="text-sm-muted text-lg max-w-2xl mx-auto">
            Choose the perfect plan for your streaming needs. Access premium content with our flexible subscription options.
          </p>
        </ScrollReveal>
      </motion.section>

      {/* Error */}
      {errorMessage && (
        <ScrollReveal>
          <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded mb-6 shadow-lg shadow-red-500/10">
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              {errorMessage}
            </div>
          </div>
        </ScrollReveal>
      )}

      {/* Pricing Cards */}
      <section className="pb-16 px-4">
        <ScrollReveal>
          <h2 className="text-3xl font-bold text-center text-sm-text-light mb-8">
            Choose Your Plan
          </h2>
        </ScrollReveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <ScrollReveal key={plan.planId} delay={index * 0.08} y={22}>
              <div
                className={`relative flex flex-col bg-sm-card border rounded-lg overflow-hidden transition-transform duration-300 hover:scale-[1.03] hover:shadow-[0_10px_30px_rgba(13,110,253,0.3)] ${
                  isPopular(plan) ? 'border-sm-primary' : 'border-sm-border'
                }`}
              >
              {isPopular(plan) && (
                <div className="absolute top-3 right-3 bg-sm-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}

              {plan.imageUrl && (
                <img
                  src={`${API_BASE_URL}${plan.imageUrl}`}
                  alt={plan.name}
                  className="w-full h-48 object-cover"
                />
              )}

              <div className="flex flex-col flex-1 p-6">
                <h3 className="text-xl font-bold text-sm-text-light mb-2">{plan.name}</h3>
                <p className="text-sm-muted text-sm mb-4">{plan.description}</p>

                <div className="mb-4">
                  <span className="text-3xl font-bold text-sm-primary">RM{plan.price}</span>
                  <span className="text-sm-muted text-sm ml-1">/ {plan.duration} days</span>
                </div>

                {plan.details && plan.details.length > 0 && (
                  <ul className="space-y-2 mb-6 flex-1">
                    {plan.details.map((detail) => (
                      <li key={detail.planDetailsId} className="flex items-center text-sm text-sm-text">
                        <svg className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {detail.value}
                      </li>
                    ))}
                  </ul>
                )}

                <button
                  onClick={() => openModal(plan)}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                    isPopular(plan)
                      ? 'bg-sm-primary text-white hover:bg-blue-600'
                      : 'bg-sm-btn-sec text-sm-text-light border border-sm-btn-sec-border hover:bg-sm-hover'
                  }`}
                >
                  Subscribe Now
                </button>
              </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Subscription Modal */}
      {showModal && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={closeModal}>
          <div className="bg-sm-card border border-sm-border rounded-lg p-6 w-full max-w-md mx-4 animate-scale-in shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-sm-text-light">
                Subscribe to {selectedPlan.name}
              </h3>
              <button onClick={closeModal} className="text-sm-muted hover:text-sm-text-light text-xl">&times;</button>
            </div>

            <form onSubmit={handleSubscription} noValidate>
              <div className="mb-4">
                <label className="block text-sm text-sm-muted mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-3 py-2 bg-sm-bg border rounded text-sm-text focus:outline-none focus:border-sm-primary focus:ring-1 focus:ring-sm-primary transition-all duration-200 ${
                    formErrors.email ? 'border-red-500' : 'border-sm-border'
                  }`}
                  placeholder="your@email.com"
                />
                {formErrors.email && <p className="text-xs text-red-400 mt-1">{formErrors.email}</p>}
              </div>

              <div className="mb-4">
                <label className="block text-sm text-sm-muted mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`w-full px-3 py-2 bg-sm-bg border rounded text-sm-text focus:outline-none focus:border-sm-primary focus:ring-1 focus:ring-sm-primary transition-all duration-200 ${
                    formErrors.phoneNumber ? 'border-red-500' : 'border-sm-border'
                  }`}
                  placeholder="+60123456789"
                />
                {formErrors.phoneNumber && (
                  <p className="text-xs text-red-400 mt-1">{formErrors.phoneNumber}</p>
                )}
              </div>

              {submissionError && (
                <div className="bg-red-500/10 border border-red-500 text-red-400 px-3 py-2 rounded mb-4 text-sm animate-fade-in flex items-center gap-2">
                  <span>⚠️</span> {submissionError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2 px-4 bg-sm-btn-sec border border-sm-btn-sec-border rounded text-sm-text-light hover:bg-sm-hover"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 px-4 bg-sm-primary text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    'Proceed to Payment'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
