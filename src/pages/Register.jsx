import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import emailjs from "@emailjs/browser";
import apiClient from "../api/client";

const EMAILJS_SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID || "service_ahc2qqs";
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "template_qmpq9xk";
const EMAILJS_WELCOME_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_WELCOME_TEMPLATE_ID || "template_ov6qj1x";
const EMAILJS_PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "vMYmibaV_J1q6Z1s_";
const OTP_EXPIRY_SECONDS  = 10 * 60; // 10 minutes

// Generate a cryptographically random 6-digit OTP
const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const Register = () => {
  const navigate = useNavigate();

  // ── Step 1: Form state ───────────────────────────────────────────────────
  const [step, setStep]               = useState("form"); // "form" | "otp"
  const [fullName, setFullName]       = useState("");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [avatar, setAvatar]           = useState(null);
  const [coverImage, setCoverImage]   = useState(null);

  // ── Step 2: OTP state ────────────────────────────────────────────────────
  const [otpDigits, setOtpDigits]     = useState(["", "", "", "", "", ""]);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpExpiry, setOtpExpiry]     = useState(null);
  const [timeLeft, setTimeLeft]       = useState(OTP_EXPIRY_SECONDS);
  const [otpError, setOtpError]       = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // ── Shared state ─────────────────────────────────────────────────────────
  const [loading, setLoading]         = useState(false);
  const [sendingOtp, setSendingOtp]   = useState(false);
  const [error, setError]             = useState("");

  const otpInputRefs = useRef([]);
  const timerRef     = useRef(null);
  const cooldownRef  = useRef(null);

  // ── Countdown timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (step !== "otp") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [step, otpExpiry]);

  // ── Resend cooldown ───────────────────────────────────────────────────────
  useEffect(() => {
    if (resendCooldown <= 0) return;
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(cooldownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(cooldownRef.current);
  }, [resendCooldown]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ── Send OTP via EmailJS ──────────────────────────────────────────────────
  const sendOtpEmail = async (otpCode) => {
    const templateParams = {
      to_email: email.trim(),
      email: email.trim(),
      user_email: email.trim(),
      recipient: email.trim(),
      user_name: fullName.trim(),
      to_name: fullName.trim(),
      name: fullName.trim(),
      otp_code: otpCode,
      otp: otpCode,
      code: otpCode,
    };

    // console.log("Sending EmailJS with Params:", {
    //   serviceId: EMAILJS_SERVICE_ID,
    //   templateId: EMAILJS_TEMPLATE_ID,
    //   publicKey: EMAILJS_PUBLIC_KEY,
    //   templateParams,
    // });

    const res = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      { publicKey: EMAILJS_PUBLIC_KEY }
    );

    // console.log("EmailJS Result:", res);
    return res;
  };

  // ── Send Welcome Email via EmailJS upon successful registration ──────────
  const sendWelcomeEmail = async (userEmail, userName) => {
    try {
      const templateParams = {
        to_email: userEmail.trim(),
        email: userEmail.trim(),
        user_email: userEmail.trim(),
        recipient: userEmail.trim(),
        user_name: userName.trim(),
        to_name: userName.trim(),
        name: userName.trim(),
      };

      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_WELCOME_TEMPLATE_ID,
        templateParams,
        { publicKey: EMAILJS_PUBLIC_KEY }
      );
      console.log("Welcome email sent successfully to", userEmail);
    } catch (err) {
      console.error("Welcome email failed to send:", err);
    }
  };

  // ── Step 1 Submit: validate → generate OTP → send email → go to step 2 ──
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError("Please fill out all required fields.");
      return;
    }
    if (password.trim().length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSendingOtp(true);
    try {
      // 1. Pre-check if email is already registered
      const checkRes = await apiClient.get(`/users/check-email?email=${encodeURIComponent(email.trim())}`);
      if (checkRes.data?.data?.exists) {
        setError("This email address is already registered! Please log in.");
        setSendingOtp(false);
        return;
      }

      // 2. Generate and send OTP via EmailJS
      const otp = generateOtp();
      await sendOtpEmail(otp);
      setGeneratedOtp(otp);
      setOtpExpiry(new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000));
      setTimeLeft(OTP_EXPIRY_SECONDS);
      setOtpDigits(["", "", "", "", "", ""]);
      setOtpError("");
      setResendCooldown(60);
      setStep("otp");
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    } catch (err) {
      console.error("EmailJS full error:", err);
      const errMsg = err?.response?.data?.message || err?.text || err?.message || (typeof err === "string" ? err : "Failed to send OTP.");
      setError(errMsg);
    } finally {
      setSendingOtp(false);
    }
  };

  // ── OTP digit input handler ───────────────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otpDigits];
    next[index] = value.slice(-1);
    setOtpDigits(next);
    setOtpError("");
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...otpDigits];
    pasted.split("").forEach((ch, i) => { if (i < 6) next[i] = ch; });
    setOtpDigits(next);
    otpInputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  // ── Resend OTP ────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setSendingOtp(true);
    setOtpError("");
    try {
      const otp = generateOtp();
      await sendOtpEmail(otp);
      setGeneratedOtp(otp);
      setOtpExpiry(new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000));
      setTimeLeft(OTP_EXPIRY_SECONDS);
      setOtpDigits(["", "", "", "", "", ""]);
      setResendCooldown(60);
      clearInterval(timerRef.current);
      otpInputRefs.current[0]?.focus();
    } catch (err) {
      const errMsg = err?.text || err?.message || "Failed to resend OTP";
      setOtpError(`Resend failed: ${errMsg}`);
    } finally {
      setSendingOtp(false);
    }
  };

  // ── Step 2 Submit: verify OTP → register account ─────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setOtpError("");

    const enteredOtp = otpDigits.join("");
    if (enteredOtp.length < 6) {
      setOtpError("Please enter the complete 6-digit code.");
      return;
    }
    if (timeLeft <= 0) {
      setOtpError("This OTP has expired. Please request a new one.");
      return;
    }
    if (enteredOtp !== generatedOtp) {
      setOtpError("Incorrect OTP. Please check and try again.");
      setOtpDigits(["", "", "", "", "", ""]);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 50);
      return;
    }

    // OTP correct — register account
    setLoading(true);
    const emailPrefix = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
    const tempUsername = `${emailPrefix}_${Math.random().toString(36).substring(2, 7)}`;

    const formData = new FormData();
    formData.append("username",  tempUsername);
    formData.append("email",     email.trim());
    formData.append("fullName",  fullName.trim());
    formData.append("password",  password.trim());
    if (avatar) formData.append("avatar", avatar);
    if (coverImage) formData.append("coverImage", coverImage);

    try {
      const response = await apiClient.post("/users/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data?.success) {
        // Send Welcome Email asynchronously
        sendWelcomeEmail(email.trim(), fullName.trim());

        navigate("/login", {
          state: { message: "Account created successfully! Welcome to VetwoPlay. Please log in." },
        });
      } else {
        setOtpError(response.data?.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      setOtpError(err.response?.data?.message || "An error occurred during registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5 d-flex align-items-center justify-content-center">
      <div
        className="glass-panel p-5 border-secondary text-center"
        style={{ maxWidth: "550px", width: "100%" }}
      >
        {/* ── STEP 1: Registration Form ── */}
        {step === "form" && (
          <>
            <h2 className="fw-bold mb-1 text-gradient">Create Account</h2>
            <p className="text-muted small mb-4">
              Register to post videos, write tweets, and create playlists.
            </p>

            {error && (
              <div className="alert alert-glass border-danger text-danger mb-4 py-2 px-3 small d-flex align-items-center gap-2 text-start">
                <i className="bi bi-exclamation-triangle-fill fs-5 flex-shrink-0"></i>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} encType="multipart/form-data">
              <div className="mb-3 text-start">
                <label className="form-label small text-muted fw-semibold">Full Name *</label>
                <input
                  type="text"
                  className="form-control form-control-glass"
                  placeholder="e.g. Vetwo User"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3 text-start">
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

              <div className="mb-3 text-start">
                <label className="form-label small text-muted fw-semibold">Password *</label>
                <div className="position-relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-control form-control-glass pe-5"
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-link text-muted position-absolute end-0 top-50 translate-middle-y me-2 p-1 border-0 shadow-none d-flex align-items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ zIndex: 10 }}
                  >
                    {showPassword ? (
                      <i className="bi bi-eye-slash-fill fs-5"></i>
                    ) : (
                      <i className="bi bi-eye-fill fs-5"></i>
                    )}
                  </button>
                </div>
              </div>

              <div className="row mb-4">
                <div className="col-md-6 mb-3 mb-md-0 text-start">
                  <label className="form-label small text-muted fw-semibold">Avatar Image (Optional)</label>
                  <input
                    type="file"
                    className="form-control form-control-glass"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && setAvatar(e.target.files[0])}
                  />
                </div>
                <div className="col-md-6 text-start">
                  <label className="form-label small text-muted fw-semibold">Cover Image (Optional)</label>
                  <input
                    type="file"
                    className="form-control form-control-glass"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && setCoverImage(e.target.files[0])}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-gradient w-100 py-3 d-flex align-items-center justify-content-center gap-2"
                disabled={sendingOtp}
              >
                {sendingOtp ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Sending OTP...
                  </>
                ) : (
                  <>
                    Continue <i className="bi bi-arrow-right-circle-fill"></i>
                  </>
                )}
              </button>
            </form>

            <p className="mt-4 small text-muted">
              Already have an account?{" "}
              <Link to="/login" className="fw-bold text-decoration-none text-gradient">
                Log In
              </Link>
            </p>
          </>
        )}

        {/* ── STEP 2: OTP Verification ── */}
        {step === "otp" && (
          <>
            <button
              className="btn btn-link text-muted p-0 mb-3 d-flex align-items-center gap-1 small"
              onClick={() => { setStep("form"); setOtpError(""); clearInterval(timerRef.current); }}
            >
              <i className="bi bi-arrow-left"></i> Back to form
            </button>

            <div
              className="d-flex align-items-center justify-content-center mx-auto mb-3"
              style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(123,44,191,0.2), rgba(0,180,216,0.2))",
                border: "2px solid rgba(123,44,191,0.4)",
              }}
            >
              <i className="bi bi-shield-lock-fill text-gradient" style={{ fontSize: "1.8rem" }}></i>
            </div>

            <h2 className="fw-bold mb-1 text-gradient">Verify Your Email</h2>
            <p className="text-muted small mb-1">
              We've sent a 6-digit code to
            </p>
            <p className="fw-semibold mb-4" style={{ color: "var(--accent-purple)" }}>
              {email}
            </p>

            <div
              className="d-inline-flex align-items-center gap-2 mb-3 px-3 py-2 rounded-pill"
              style={{
                background: timeLeft < 60 ? "rgba(239,68,68,0.1)" : "rgba(123,44,191,0.1)",
                border: `1px solid ${timeLeft < 60 ? "rgba(239,68,68,0.3)" : "rgba(123,44,191,0.3)"}`,
              }}
            >
              <i className={`bi bi-clock${timeLeft < 60 ? " text-danger" : ""}`}></i>
              <span
                className="fw-bold small"
                style={{ color: timeLeft < 60 ? "#ef4444" : "var(--accent-purple)" }}
              >
                {timeLeft > 0 ? `Expires in ${formatTime(timeLeft)}` : "OTP Expired"}
              </span>
            </div>

            {/* Spam folder hint notice */}
            <div className="alert alert-glass border-secondary text-muted mb-4 py-2 px-3 small d-flex align-items-center gap-2 text-start" style={{ background: "rgba(123,44,191,0.06)" }}>
              <i className="bi bi-info-circle-fill text-gradient fs-5 flex-shrink-0"></i>
              <span>
                Didn't see the email? Please check your <strong className="text-main">Spam / Junk folder</strong>.
              </span>
            </div>

            {otpError && (
              <div className="alert alert-glass border-danger text-danger mb-4 py-2 px-3 small d-flex align-items-center gap-2 text-start">
                <i className="bi bi-x-circle-fill fs-5 flex-shrink-0"></i>
                <span>{otpError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp}>
              <div className="d-flex justify-content-center gap-2 mb-4" onPaste={handleOtpPaste}>
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (otpInputRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="form-control text-center fw-bold"
                    style={{
                      width: 52,
                      height: 60,
                      fontSize: "1.6rem",
                      borderRadius: 12,
                      background: "rgba(123,44,191,0.06)",
                      border: digit
                        ? "2px solid var(--accent-purple)"
                        : "1px solid var(--glass-border)",
                      color: "var(--text-main)",
                      transition: "border-color 0.2s, box-shadow 0.2s",
                      boxShadow: digit ? "0 0 0 3px rgba(123,44,191,0.15)" : "none",
                      caretColor: "var(--accent-purple)",
                    }}
                  />
                ))}
              </div>

              <button
                type="submit"
                className="btn btn-gradient w-100 py-3 d-flex align-items-center justify-content-center gap-2 mb-3"
                disabled={loading || timeLeft <= 0}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Creating account...
                  </>
                ) : (
                  <>
                    Verify & Sign Up <i className="bi bi-check-circle-fill"></i>
                  </>
                )}
              </button>
            </form>

            <div className="small text-muted">
              Didn't receive the code?{" "}
              {resendCooldown > 0 ? (
                <span className="text-muted">
                  Resend in <strong>{resendCooldown}s</strong>
                </span>
              ) : (
                <button
                  className="btn btn-link p-0 small fw-bold text-decoration-none text-gradient"
                  onClick={handleResend}
                  disabled={sendingOtp}
                >
                  {sendingOtp ? "Sending..." : "Resend OTP"}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Register;
