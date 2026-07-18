import React from "react";
import { Link } from "react-router-dom";

const About = () => {
  return (
    <div className="container py-5 text-start">
      {/* Hero Section */}
      <div className="glass-panel p-5 border-secondary mb-5 text-center position-relative overflow-hidden">
        
        <h1 className="fw-extrabold mb-3 text-gradient display-4">About Vetwoplay</h1>
        <p className="lead text-muted mx-auto" style={{ maxWidth: "700px" }}>
          A premium creator-first platform to publish high-quality videos, write community tweets, and organize custom playlists.
        </p>
        <div className="d-flex justify-content-center gap-3 mt-4">
          <Link to="/" className="btn btn-gradient px-4 py-2">Explore Videos</Link>
          <Link to="/contact" className="btn btn-glass px-4 py-2">Get in Touch</Link>
        </div>
      </div>

      <div className="row g-4">
        {/* Core Values */}
        <div className="col-12">
          <div className="glass-panel p-4 border-secondary h-100">
            <h4 className="fw-bold mb-4 d-flex align-items-center gap-2">
              <i className="bi bi-rocket-takeoff-fill text-cyan"></i> Our Mission
            </h4>
            <p className="text-muted mb-4" style={{ fontSize: "1.05rem", lineHeight: "1.6" }}>
              Vetwoplay was built with a clear purpose: to bridge the gap between video creators, micro-bloggers, and playlisters. By providing robust tools under a unified, lightweight dashboard, we empower individuals to express their thoughts, educate others, and organize content.
            </p>

            <h5 className="fw-bold mb-3">Key Platform Pillars</h5>
            <div className="row g-3">
              <div className="col-sm-6">
                <div className="d-flex align-items-start gap-3">
                  <div className="badge-neon p-2 d-flex align-items-center justify-content-center rounded-circle" style={{ width: "40px", height: "40px" }}>
                    <i className="bi bi-play-circle-fill fs-5"></i>
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1">Smooth Video Streaming</h6>
                    <p className="small text-muted mb-0">High-performance video hosting powered by Cloudinary CDN integration.</p>
                  </div>
                </div>
              </div>

              <div className="col-sm-6">
                <div className="d-flex align-items-start gap-3">
                  <div className="badge-neon p-2 d-flex align-items-center justify-content-center rounded-circle" style={{ width: "40px", height: "40px" }}>
                    <i className="bi bi-chat-quote-fill fs-5"></i>
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1">Interactive Tweets</h6>
                    <p className="small text-muted mb-0">Express thoughts, share coding snippets, and engage with followers instantly.</p>
                  </div>
                </div>
              </div>

              <div className="col-sm-6">
                <div className="d-flex align-items-start gap-3">
                  <div className="badge-neon p-2 d-flex align-items-center justify-content-center rounded-circle" style={{ width: "40px", height: "40px" }}>
                    <i className="bi bi-folder-fill fs-5"></i>
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1">Create Playlists</h6>
                    <p className="small text-muted mb-0">Bundle tutorial courses, musical favorites, or gaming clips in a single link.</p>
                  </div>
                </div>
              </div>

              <div className="col-sm-6">
                <div className="d-flex align-items-start gap-3">
                  <div className="badge-neon p-2 d-flex align-items-center justify-content-center rounded-circle" style={{ width: "40px", height: "40px" }}>
                    <i className="bi bi-shield-fill-check fs-5"></i>
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1">Creator Studio Control</h6>
                    <p className="small text-muted mb-0">Robust statistics, granular publish-status toggles, and metadata editing tools.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
