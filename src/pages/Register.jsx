import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../api/client";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usernameSuggestions, setUsernameSuggestions] = useState([]);
  const navigate = useNavigate();

  const handleFileChange = (e, setFile) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !email.trim() || !fullName.trim() || !password.trim()) {
      setError("Please fill out all required text fields.");
      return;
    }

    if (!avatar) {
      setError("Avatar image is required.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("username", username.trim());
    formData.append("email", email.trim());
    formData.append("fullName", fullName.trim());
    formData.append("password", password.trim());
    formData.append("avatar", avatar);
    if (coverImage) {
      formData.append("coverImage", coverImage);
    }

    try {
      const response = await apiClient.post("/users/register", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data?.success) {
        // Registered successfully -> redirect to login page
        navigate("/login", { state: { message: "Account created successfully! Please log in." } });
      } else {
        setError(response.data?.message || "Registration failed.");
      }
    } catch (err) {
      const responseData = err.response?.data;
      setError(responseData?.message || "An error occurred during registration.");
      if (responseData?.errors && responseData.errors.length > 0) {
        setUsernameSuggestions(responseData.errors);
      } else {
        setUsernameSuggestions([]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5 d-flex align-items-center justify-content-center">
      <div className="glass-panel p-5 border-secondary text-center" style={{ maxWidth: "550px", width: "100%" }}>
        <h2 className="fw-bold mb-1 text-gradient">Create Account</h2>
        <p className="text-muted small mb-4">Register to post videos, write tweets, and create playlists.</p>

        {error && (
          <div className="alert alert-glass border-danger text-danger mb-4 py-2 px-3 small d-flex align-items-center gap-2">
            <i className="bi bi-exclamation-triangle-fill"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="row">
            <div className="col-md-6 mb-3 text-start">
              <label className="form-label small text-muted fw-semibold">Username *</label>
              <input
                type="text"
                className="form-control form-control-glass"
                placeholder="e.g. shobhit"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setUsernameSuggestions([]);
                }}
                required
              />
              {usernameSuggestions.length > 0 && (
                <div className="mt-2 text-start">
                  <span className="small text-muted d-block mb-1" style={{ fontSize: "0.75rem" }}>Available Suggestions:</span>
                  <div className="d-flex flex-wrap gap-2">
                    {usernameSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => {
                          setUsername(suggestion);
                          setUsernameSuggestions([]);
                          setError("");
                        }}
                        className="btn btn-sm btn-glass px-2 py-1 small rounded text-main border-secondary fw-semibold"
                        style={{ fontSize: "0.75rem" }}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="col-md-6 mb-3 text-start">
              <label className="form-label small text-muted fw-semibold">Full Name *</label>
              <input
                type="text"
                className="form-control form-control-glass"
                placeholder="e.g. Shobhit Kumar"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
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
              <label className="form-label small text-muted fw-semibold">Avatar Image *</label>
              <input
                type="file"
                className="form-control form-control-glass"
                accept="image/*"
                onChange={(e) => handleFileChange(e, setAvatar)}
                required
              />
            </div>
            <div className="col-md-6 text-start">
              <label className="form-label small text-muted fw-semibold">Cover Image (Optional)</label>
              <input
                type="file"
                className="form-control form-control-glass"
                accept="image/*"
                onChange={(e) => handleFileChange(e, setCoverImage)}
              />
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
                Creating account...
              </>
            ) : (
              <>
                Sign Up <i className="bi bi-person-plus-fill"></i>
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
      </div>
    </div>
  );
};

export default Register;
