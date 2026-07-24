import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { login } = useAuth();
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!identity.trim() || !password.trim()) {
      setError("Please fill out all fields.");
      return;
    }

    setLoading(true);
    const result = await login(identity, password);
    setLoading(false);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="container py-5 d-flex align-items-center justify-content-center" style={{ minHeight: "80vh" }}>
      <div className="glass-panel p-5 border-secondary text-center" style={{ maxWidth: "480px", width: "100%" }}>
        <h2 className="fw-bold mb-1 text-gradient">Welcome Back</h2>
        <p className="text-muted small mb-4">Log in to keep creating, sharing, and connecting.</p>

        {location.state?.message && !error && (
          <div className="alert alert-glass border-primary text-main mb-4 py-2 px-3 small d-flex align-items-center gap-2">
            <i className="bi bi-info-circle-fill text-gradient"></i>
            <span>{location.state.message}</span>
          </div>
        )}

        {error && (
          <div className="alert alert-glass border-danger text-danger mb-4 py-2 px-3 small d-flex align-items-center gap-2">
            <i className="bi bi-exclamation-triangle-fill"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3 text-start">
            <label className="form-label small text-muted fw-semibold">Username or Email</label>
            <input
              type="text"
              className="form-control form-control-glass"
              placeholder="username or user@example.com"
              value={identity}
              onChange={(e) => setIdentity(e.target.value)}
              required
            />
          </div>

          <div className="mb-4 text-start">
            <label className="form-label small text-muted fw-semibold">Password</label>
            <div className="position-relative">
              <input
                type={showPassword ? "text" : "password"}
                className="form-control form-control-glass pe-5"
                placeholder="••••••••"
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

          <button
            type="submit"
            className="btn btn-gradient w-100 py-3 d-flex align-items-center justify-content-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Logging in...
              </>
            ) : (
              <>
                Log In <i className="bi bi-arrow-right-short fs-5"></i>
              </>
            )}
          </button>
        </form>

        <p className="mt-4 small text-muted">
          Don't have an account?{" "}
          <Link to="/register" className="fw-bold text-decoration-none text-gradient">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
