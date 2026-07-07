import React, { useContext } from 'react';
import { ConsentContext } from '../context/ConsentContext';

export const ConsentBanner: React.FC = () => {
  const { consentGiven, setConsentGiven } = useContext(ConsentContext);

  if (consentGiven) return null;

  const handleAccept = () => {
    setConsentGiven(true);
  };

  return (
    <div className="fixed bottom-4 inset-x-4 md:inset-x-auto md:left-4 max-w-sm bg-gray-900/90 backdrop-blur-lg rounded-xl p-4 text-sm text-gray-100 shadow-xl animate-fade-in">
      <p className="mb-2">
        We use cookies and other tracking technologies to provide a better experience and to show relevant ads. By clicking "Accept", you consent to the use of these technologies.
      </p>
      <button
        onClick={handleAccept}
        className="mt-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition"
      >
        Accept
      </button>
    </div>
  );
};
