import React, { createContext, useContext, useState } from 'react';

const CurrencyContext = createContext();

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState('INR');
  const rate = 0.012;

  const toggleCurrency = () => {
    setCurrency(prev => (prev === 'INR' ? 'USD' : 'INR'));
  };

  const formatPrice = (amount, period = '') => {
    if (amount === undefined || amount === null) return 'Free';
    const periodSuffix = period ? `/${period}` : '';
    if (currency === 'USD') {
      const usdVal = (amount * rate).toFixed(2);
      return `$${usdVal}${periodSuffix}`;
    }
    return `₹${amount.toLocaleString('en-IN')}${periodSuffix}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, toggleCurrency, formatPrice, rate }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
