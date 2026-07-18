import React from "react";

const LoadingSpinner = ({ message = "Loading..." }) => {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5 w-100">
      <div 
        className="spinner-border mb-3" 
        style={{ 
          width: "3rem", 
          height: "3rem", 
          color: "var(--accent-cyan)",
          borderWidth: "4px" 
        }} 
        role="status"
      >
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="text-muted fw-semibold">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
