import React, { createContext, useEffect, useState, ReactNode } from 'react';

interface ConsentContextProps {
  consentGiven: boolean;
  setConsentGiven: (value: boolean) => void;
}

export const ConsentContext = createContext<ConsentContextProps>({
  consentGiven: false,
  setConsentGiven: () => {}
});

interface ProviderProps {
  children: ReactNode;
}

export const ConsentProvider: React.FC<ProviderProps> = ({ children }) => {
  const [consentGiven, setConsentGiven] = useState<boolean>(false);

  useEffect(() => {
    const stored = localStorage.getItem('userConsent');
    if (stored === 'true') {
      setConsentGiven(true);
    }
  }, []);

  const handleSetConsent = (value: boolean) => {
    localStorage.setItem('userConsent', value.toString());
    setConsentGiven(value);
  };

  return (
    <ConsentContext.Provider value={{ consentGiven, setConsentGiven: handleSetConsent }}>
      {children}
    </ConsentContext.Provider>
  );
};
