import React, { useState, useEffect } from 'react';
import '../styles/components/PaymentModal.css';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  paymentIntentId: string;
  clientKey: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  amount,
  paymentIntentId,
  clientKey,
  onSuccess,
  onError,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'gcash' | 'grabpay'>('card');
  const [processing, setProcessing] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expMonth: '',
    expYear: '',
    cvc: '',
    name: '',
  });

  useEffect(() => {
    // Load PayMongo script
    const script = document.createElement('script');
    script.src = 'https://js.paymongo.com/v1/paymongo.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleCardPayment = async () => {
    setProcessing(true);
    try {
      // First, create a payment method
      const paymentMethodResponse = await fetch('https://api.paymongo.com/v1/payment_methods', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(clientKey + ':')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            attributes: {
              type: 'card',
              details: {
                card_number: cardDetails.number.replace(/\s/g, ''),
                exp_month: parseInt(cardDetails.expMonth),
                exp_year: parseInt(cardDetails.expYear),
                cvc: cardDetails.cvc,
              },
              billing: {
                name: cardDetails.name,
              },
            },
          },
        }),
      });

      const paymentMethodResult = await paymentMethodResponse.json();

      if (!paymentMethodResult.data?.id) {
        throw new Error(paymentMethodResult.errors?.[0]?.detail || 'Failed to create payment method');
      }

      // Then attach the payment method to the payment intent
      const attachResponse = await fetch(`https://api.paymongo.com/v1/payment_intents/${paymentIntentId}/attach`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(clientKey + ':')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            attributes: {
              payment_method: paymentMethodResult.data.id,
            },
          },
        }),
      });

      const attachResult = await attachResponse.json();

      if (attachResult.data?.attributes?.status === 'succeeded') {
        onSuccess();
      } else if (attachResult.data?.attributes?.status === 'awaiting_payment_method') {
        onError('Payment method attachment failed. Please try again.');
      } else {
        onError(attachResult.errors?.[0]?.detail || 'Payment failed');
      }
    } catch (error: any) {
      onError(error.message || 'Payment processing failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleGcashPayment = async () => {
    setProcessing(true);
    try {
      // Create GCash payment method
      const paymentMethodResponse = await fetch('https://api.paymongo.com/v1/payment_methods', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(clientKey + ':')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            attributes: {
              type: 'gcash',
            },
          },
        }),
      });

      const paymentMethodResult = await paymentMethodResponse.json();

      if (!paymentMethodResult.data?.id) {
        throw new Error(paymentMethodResult.errors?.[0]?.detail || 'Failed to create payment method');
      }

      // Attach payment method to payment intent
      const attachResponse = await fetch(`https://api.paymongo.com/v1/payment_intents/${paymentIntentId}/attach`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(clientKey + ':')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            attributes: {
              payment_method: paymentMethodResult.data.id,
              return_url: window.location.origin + '/cart?payment=success',
            },
          },
        }),
      });

      const attachResult = await attachResponse.json();

      if (attachResult.data?.attributes?.next_action?.redirect?.url) {
        window.location.href = attachResult.data.attributes.next_action.redirect.url;
      } else {
        onError('Failed to initiate GCash payment');
      }
    } catch (error: any) {
      onError(error.message || 'Payment processing failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleGrabPayPayment = async () => {
    setProcessing(true);
    try {
      // Create GrabPay payment method
      const paymentMethodResponse = await fetch('https://api.paymongo.com/v1/payment_methods', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(clientKey + ':')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            attributes: {
              type: 'grab_pay',
            },
          },
        }),
      });

      const paymentMethodResult = await paymentMethodResponse.json();

      if (!paymentMethodResult.data?.id) {
        throw new Error(paymentMethodResult.errors?.[0]?.detail || 'Failed to create payment method');
      }

      // Attach payment method to payment intent
      const attachResponse = await fetch(`https://api.paymongo.com/v1/payment_intents/${paymentIntentId}/attach`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(clientKey + ':')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            attributes: {
              payment_method: paymentMethodResult.data.id,
              return_url: window.location.origin + '/cart?payment=success',
            },
          },
        }),
      });

      const attachResult = await attachResponse.json();

      if (attachResult.data?.attributes?.next_action?.redirect?.url) {
        window.location.href = attachResult.data.attributes.next_action.redirect.url;
      } else {
        onError('Failed to initiate GrabPay payment');
      }
    } catch (error: any) {
      onError(error.message || 'Payment processing failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentMethod === 'card') {
      handleCardPayment();
    } else if (paymentMethod === 'gcash') {
      handleGcashPayment();
    } else if (paymentMethod === 'grabpay') {
      handleGrabPayPayment();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="payment-modal-backdrop" onClick={onClose}>
      <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="payment-modal-header">
          <h2>Complete Payment</h2>
          <button className="payment-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="payment-modal-body">
          <div className="payment-amount">
            <span className="payment-amount-label">Total Amount</span>
            <span className="payment-amount-value">₱{amount.toFixed(2)}</span>
          </div>

          <div className="payment-methods">
            <label className="payment-method-option">
              <input
                type="radio"
                name="paymentMethod"
                value="card"
                checked={paymentMethod === 'card'}
                onChange={(e) => setPaymentMethod(e.target.value as 'card')}
              />
              <span>Credit/Debit Card</span>
            </label>
            <label className="payment-method-option">
              <input
                type="radio"
                name="paymentMethod"
                value="gcash"
                checked={paymentMethod === 'gcash'}
                onChange={(e) => setPaymentMethod(e.target.value as 'gcash')}
              />
              <span>GCash</span>
            </label>
            <label className="payment-method-option">
              <input
                type="radio"
                name="paymentMethod"
                value="grabpay"
                checked={paymentMethod === 'grabpay'}
                onChange={(e) => setPaymentMethod(e.target.value as 'grabpay')}
              />
              <span>GrabPay</span>
            </label>
          </div>

          {paymentMethod === 'card' && (
            <form onSubmit={handleSubmit} className="payment-form">
              <div className="form-group">
                <label>Cardholder Name</label>
                <input
                  type="text"
                  value={cardDetails.name}
                  onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="form-group">
                <label>Card Number</label>
                <input
                  type="text"
                  value={cardDetails.number}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\s/g, '');
                    const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
                    setCardDetails({ ...cardDetails, number: formatted });
                  }}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Expiry Month</label>
                  <input
                    type="text"
                    value={cardDetails.expMonth}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 2);
                      setCardDetails({ ...cardDetails, expMonth: value });
                    }}
                    placeholder="MM"
                    maxLength={2}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Expiry Year</label>
                  <input
                    type="text"
                    value={cardDetails.expYear}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setCardDetails({ ...cardDetails, expYear: value });
                    }}
                    placeholder="YYYY"
                    maxLength={4}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>CVC</label>
                  <input
                    type="text"
                    value={cardDetails.cvc}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 3);
                      setCardDetails({ ...cardDetails, cvc: value });
                    }}
                    placeholder="123"
                    maxLength={3}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-pay" disabled={processing}>
                {processing ? 'Processing...' : `Pay ₱${amount.toFixed(2)}`}
              </button>
            </form>
          )}

          {(paymentMethod === 'gcash' || paymentMethod === 'grabpay') && (
            <div className="payment-wallet-info">
              <p>You will be redirected to {paymentMethod === 'gcash' ? 'GCash' : 'GrabPay'} to complete your payment.</p>
              <button onClick={handleSubmit} className="btn btn-primary btn-pay" disabled={processing}>
                {processing ? 'Redirecting...' : `Continue with ${paymentMethod === 'gcash' ? 'GCash' : 'GrabPay'}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
