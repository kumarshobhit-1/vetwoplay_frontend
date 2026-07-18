import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="glass-panel border-top border-secondary p-5 mt-auto rounded-0" style={{ backgroundColor: "var(--bg-secondary)" }}>
      <div className="container-fluid">
        <div className="row g-4 text-start">
          {/* Brand Info */}
          <div className="col-lg-4 col-md-6 mb-4 mb-lg-0">
            <Link to="/" className="d-flex align-items-center gap-2 text-decoration-none mb-3">
              <div 
                className="d-flex align-items-center justify-content-center rounded-circle" 
                style={{ 
                  width: "36px", 
                  height: "36px", 
                  background: "linear-gradient(135deg, var(--accent-purple), var(--accent-cyan))" 
                }}
              >
                <i className="bi bi-play-circle-fill text-white fs-5"></i>
              </div>
              <span className="fs-4 fw-extrabold text-gradient tracking-tight">Vetwoplay</span>
            </Link>
            <p className="small text-muted mb-4" style={{ maxWidth: "320px", lineHeight: "1.6" }}>
              Publish high-quality course clips, stream gameplay moments, tweet micro-thoughts, and structure interactive course playlists.
            </p>
            <span className="small text-muted-custom">
              © {new Date().getFullYear()} Vetwoplay. All rights reserved.
            </span>
          </div>

          {/* Quick Links */}
          <div className="col-lg-2 col-md-6 col-6">
            <h6 className="fw-bold mb-3 small text-uppercase tracking-wider text-muted">Platform</h6>
            <ul className="list-unstyled d-flex flex-column gap-2 small">
              <li>
                <Link to="/" className="text-muted text-decoration-none hover-zoom-img">Home Feed</Link>
              </li>
              <li>
                <Link to="/tweets" className="text-muted text-decoration-none">Community Tweets</Link>
              </li>
              <li>
                <Link to="/playlists" className="text-muted text-decoration-none">Playlists</Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-muted text-decoration-none">Creator Dashboard</Link>
              </li>
            </ul>
          </div>

          {/* Company links */}
          <div className="col-lg-2 col-md-6 col-6">
            <h6 className="fw-bold mb-3 small text-uppercase tracking-wider text-muted">Company</h6>
            <ul className="list-unstyled d-flex flex-column gap-2 small">
              <li>
                <Link to="/about" className="text-muted text-decoration-none">About Us</Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted text-decoration-none">Contact Us</Link>
              </li>
              <li>
                <span className="text-muted cursor-not-allowed text-opacity-50">Terms of Service</span>
              </li>
              <li>
                <span className="text-muted cursor-not-allowed text-opacity-50">Privacy Policy</span>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="col-lg-4 col-md-6">
            <h6 className="fw-bold mb-3 small text-uppercase tracking-wider text-muted">Technical Support</h6>
            <p className="small text-muted mb-2">Have a question or encounter a technical bug?</p>
            <p className="small text-muted mb-4">
              Send details to: <a href="mailto:support@vetwoplay.com" className="text-white text-decoration-none fw-semibold" style={{ color: "var(--accent-purple-light) !important" }}>support@vetwoplay.com</a>
            </p>
            <div className="d-flex gap-2">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="btn btn-glass btn-sm px-3 shadow-sm text-main">
                <i className="bi bi-github"></i> GitHub
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="btn btn-glass btn-sm px-3 shadow-sm text-main">
                <i className="bi bi-twitter-x"></i> Twitter
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
