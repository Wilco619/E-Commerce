// src/components/CookieConsent.js

import React, { useState } from 'react';
import { useCookies } from '../authentication/CookieContext';

const CookieConsent = () => {
  const { cookieConsent, handleCookieConsent } = useCookies();
  const [showDetails, setShowDetails] = useState(false);
  
  // If consent is already given, don't show the banner
  if (cookieConsent) {
    return null;
  }
  
  return (
    <div className="cookie-consent-banner">
      <div className="cookie-content">
        <h3>We use cookies</h3>
        <p>
          This website uses cookies to improve your experience, personalize content, 
          and analyze our traffic. By using our site, you consent to our use of cookies.
        </p>
        
        {showDetails && (
          <div className="cookie-details">
            <h4>Cookie Details:</h4>
            <ul>
              <li>
                <strong>Essential Cookies:</strong> These cookies are necessary for the website to function
                and cannot be switched off in our systems.
              </li>
              <li>
                <strong>Analytics Cookies:</strong> These cookies allow us to count visits and traffic sources
                so we can measure and improve the performance of our site.
              </li>
              <li>
                <strong>Functional Cookies:</strong> These cookies enable the website to provide enhanced
                functionality and personalization.
              </li>
              <li>
                <strong>Targeting Cookies:</strong> These cookies may be set through our site by our advertising
                partners to build a profile of your interests.
              </li>
            </ul>
          </div>
        )}
      </div>
      
      <div className="cookie-actions">
        <button 
          className="btn-details" 
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
        
        <div className="consent-buttons">
          <button 
            className="btn-accept" 
            onClick={() => handleCookieConsent(true)}
          >
            Accept All
          </button>
          <button 
            className="btn-essential" 
            onClick={() => handleCookieConsent(false)}
          >
            Essential Only
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .cookie-consent-banner {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background-color: #f8f9fa;
          box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
          padding: 1rem;
          z-index: 1000;
          border-top: 1px solid #dee2e6;
        }
        
        .cookie-content {
          max-width: 800px;
          margin: 0 auto;
        }
        
        .cookie-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1rem;
        }
        
        .consent-buttons {
          display: flex;
          gap: 0.5rem;
        }
        
        button {
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          border: 1px solid #ced4da;
        }
        
        .btn-accept {
          background-color: #28a745;
          color: white;
          border-color: #28a745;
        }
        
        .btn-essential {
          background-color: #6c757d;
          color: white;
          border-color: #6c757d;
        }
        
        .btn-details {
          background-color: transparent;
          border: none;
          text-decoration: underline;
          padding: 0.25rem;
        }
        
        .cookie-details {
          margin-top: 1rem;
          padding: 1rem;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          background-color: #fff;
        }
      `}</style>
    </div>
  );
};

export default CookieConsent;