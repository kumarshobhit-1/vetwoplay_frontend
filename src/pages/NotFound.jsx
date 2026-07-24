import React from "react";
import { Link, useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="container py-5 d-flex align-items-center justify-content-center" style={{ minHeight: "75vh" }}>
      <div 
        className="glass-panel border-secondary p-5 text-center shadow-lg position-relative overflow-hidden" 
        style={{ maxWidth: "600px", width: "100%", borderRadius: "24px" }}
      >
        {/* Glow Spheres */}
        <div 
          className="position-absolute rounded-circle" 
          style={{ 
            width: "150px", 
            height: "150px", 
            background: "radial-gradient(circle, var(--accent-purple) 0%, transparent 70%)",
            top: "-50px",
            right: "-50px",
            opacity: 0.35,
            pointerEvents: "none"
          }}
        ></div>
        <div 
          className="position-absolute rounded-circle" 
          style={{ 
            width: "150px", 
            height: "150px", 
            background: "radial-gradient(circle, var(--accent-cyan) 0%, transparent 70%)",
            bottom: "-50px",
            left: "-50px",
            opacity: 0.35,
            pointerEvents: "none"
          }}
        ></div>

        {/* 404 Illustration */}
        <div className="mb-4 d-inline-block">
          <h1 
            className="fw-extrabold mb-0" 
            style={{ 
              fontSize: "7.5rem", 
              fontWeight: 900,
              letterSpacing: "-2px",
              lineHeight: 1,
              background: "linear-gradient(135deg, var(--accent-purple), var(--accent-cyan))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 0 30px rgba(236, 72, 153, 0.25))"
            }}
          >
            404
          </h1>
          <div className="mt-3" style={{ opacity: 0.9 }}>
            <span 
              className="badge px-3 py-2 rounded-pill fw-bold text-uppercase tracking-wider small animate-pulse" 
              style={{ backgroundColor: "rgba(255, 71, 126, 0.15)", color: "var(--accent-cyan)" }}
            >
              Page Not Found
            </span>
          </div>
        </div>

        {/* Text */}
        <h3 className="fw-bold mb-3 mt-4 text-main">Lost in VetoPlay Space?</h3>
        <p className="text-muted mb-5 mx-auto" style={{ maxWidth: "420px", fontSize: "0.95rem", lineHeight: "1.6" }}>
          The page you are looking for might have been moved, deleted, or doesn't exist anymore. Let's get you back on track!
        </p>

        {/* CTAs */}
        <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="btn btn-glass px-4 py-2.5 rounded-pill text-main fw-bold d-inline-flex align-items-center justify-content-center gap-2"
          >
            <i className="bi bi-arrow-left fs-5"></i>
            <span>Go Back</span>
          </button>
          <Link 
            to="/" 
            className="btn btn-gradient px-4 py-2.5 rounded-pill text-white fw-bold d-inline-flex align-items-center justify-content-center gap-2 shadow"
          >
            <i className="bi bi-house fs-5"></i>
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
