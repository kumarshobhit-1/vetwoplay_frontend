import React, { useState } from "react";
import apiClient from "../api/client";

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitted(false);

    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setError("Please fill out all fields.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Save contact request in the database
      await apiClient.post("/contact/submit", {
        name,
        email,
        subject,
        message
      });

      // 2. Send email notification via EmailJS REST API if configurations are defined
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

      if (serviceId && templateId && publicKey) {
        await fetch("https://api.emailjs.com/api/v1.0/email/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            service_id: serviceId,
            template_id: templateId,
            user_id: publicKey,
            template_params: {
              from_name: name,
              from_email: email,
              name: name,
              email: email,
              subject: subject,
              message: message
            }
          })
        });
      } else {
        console.warn("EmailJS credentials not set. Saved to MongoDB database only.");
      }

      setSubmitted(true);
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (err) {
      console.error("Failed to submit contact details:", err);
      setError(err.response?.data?.message || "Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-5 text-start">
      <div className="glass-panel p-5 border-secondary mb-5 text-center">
        <h1 className="fw-extrabold mb-2 text-gradient">Contact Us</h1>
        <p className="text-muted small mx-auto" style={{ maxWidth: "550px" }}>
          Have any feedback, feature requests, or queries regarding Vetwoplay? Send us a message and our support team will get back to you!
        </p>
      </div>

      <div className="row g-4">
        {/* Contact Form Column */}
        <div className="col-lg-7">
          <div className="glass-panel p-4 border-secondary">
            <h4 className="fw-bold mb-4">Send a Message</h4>

            {error && (
              <div className="alert alert-glass border-danger text-danger mb-4 py-2 px-3 small d-flex align-items-center gap-2">
                <i className="bi bi-exclamation-triangle-fill"></i>
                <span>{error}</span>
              </div>
            )}

            {submitted && (
              <div className="alert alert-glass border-success text-success mb-4 py-2 px-3 small d-flex align-items-center gap-2">
                <i className="bi bi-check-circle-fill"></i>
                <span>Thank you! Your message has been sent successfully. We'll reply shortly.</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label small text-muted fw-semibold">Your Name *</label>
                  <input
                    type="text"
                    className="form-control form-control-glass"
                    placeholder="e.g. Shobhit"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label small text-muted fw-semibold">Email Address *</label>
                  <input
                    type="email"
                    className="form-control form-control-glass"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label small text-muted fw-semibold">Subject *</label>
                <input
                  type="text"
                  className="form-control form-control-glass"
                  placeholder="e.g. Creator Account Query"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label small text-muted fw-semibold">Message *</label>
                <textarea
                  className="form-control form-control-glass"
                  rows="5"
                  placeholder="Type your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-gradient px-4 py-3 d-flex align-items-center gap-2"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Sending...
                  </>
                ) : (
                  <>
                    Send Message <i className="bi bi-envelope-check"></i>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Contact Info Details Column */}
        <div className="col-lg-5">
          <div className="glass-panel p-4 border-secondary d-flex flex-column h-100 justify-content-between">
            <div>
              <h4 className="fw-bold mb-4">Contact Details</h4>
              <p className="text-muted small mb-4">
                You can also connect with us directly via the contact options listed below. We endeavor to reply to all queries within 24–48 hours.
              </p>

              <div className="d-flex flex-column gap-4">
                {/* Email Address */}
                <div className="d-flex align-items-center gap-3">
                  <div className="badge-neon p-2 d-flex align-items-center justify-content-center rounded-circle" style={{ width: "45px", height: "45px" }}>
                    <i className="bi bi-envelope-fill fs-5"></i>
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1">Email Us</h6>
                    <a href="mailto:support@vetwoplay.com" className="text-muted small text-decoration-none hover-zoom-img">
                      support@vetwoplay.com
                    </a>
                  </div>
                </div>

                {/* Office Location */}
                <div className="d-flex align-items-center gap-3">
                  <div className="badge-neon p-2 d-flex align-items-center justify-content-center rounded-circle" style={{ width: "45px", height: "45px" }}>
                    <i className="bi bi-geo-alt-fill fs-5"></i>
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1">Our Location</h6>
                    <span className="text-muted small">New Delhi, India</span>
                  </div>
                </div>

                {/* Technical Support */}
                <div className="d-flex align-items-center gap-3">
                  <div className="badge-neon p-2 d-flex align-items-center justify-content-center rounded-circle" style={{ width: "45px", height: "45px" }}>
                    <i className="bi bi-tools fs-5"></i>
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1">Developer Portal</h6>
                    <a href="https://github.com" target="_blank" rel="noreferrer" className="text-muted small text-decoration-none">
                      github.com/vetwoplay
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-top border-secondary pt-4 mt-5 text-center">
              <h6 className="fw-bold text-muted mb-2">Connect on Socials</h6>
              <div className="d-flex justify-content-center gap-3">
                <a href="https://twitter.com" target="_blank" rel="noreferrer" className="btn btn-glass btn-sm rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px" }}>
                  <i className="bi bi-twitter-x"></i>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="btn btn-glass btn-sm rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px" }}>
                  <i className="bi bi-linkedin"></i>
                </a>
                <a href="https://github.com" target="_blank" rel="noreferrer" className="btn btn-glass btn-sm rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: "40px", height: "40px" }}>
                  <i className="bi bi-github"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
