import React from "react";
import "./css/Spinner.css";

/**
 * Full-screen overlay spinner with certificate generation animation.
 * Usage: <Spinner message="Loading..." />
 */
export const Spinner = ({ message = "Loading..." }) => (
  <div className="spinner-overlay">
    <div className="certi-loader">
      {/* Document shape */}
      <div className="certi-doc">
        <div className="certi-doc-line"></div>
        <div className="certi-doc-line short"></div>
        <div className="certi-doc-line"></div>
        <div className="certi-doc-line short"></div>
        <div className="certi-doc-line"></div>
      </div>
      {/* Seal stamp */}
      <div className="certi-seal">
        <svg viewBox="0 0 40 40" className="certi-seal-svg">
          <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="100" className="seal-ring" />
          <path d="M14 20l4 4 8-8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="seal-check" />
        </svg>
      </div>
    </div>
    {message && <span className="spinner-text">{message}</span>}
  </div>
);

/**
 * Inline spinner for buttons.
 * Usage: <ButtonSpinner text="Submitting..." />
 */
export const ButtonSpinner = ({ text = "Please wait..." }) => (
  <span className="spinner-inline">
    <span className="spinner-ring-small" />
    {text}
  </span>
);

export default Spinner;
