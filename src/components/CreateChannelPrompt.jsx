import React, { useState } from "react";
import apiClient from "../api/client";
import { useAuth } from "../context/AuthContext";

const CreateChannelPrompt = ({ onChannelCreated }) => {
  const { user, updateUser } = useAuth();
  
  // Clean temp random suffix from username if present (e.g. "kumar_f82j1" -> "kumar")
  const cleanUsername = user?.username && user.username.includes("_")
    ? user.username.substring(0, user.username.lastIndexOf("_"))
    : (user?.username || "");

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [username, setUsername] = useState(cleanUsername);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuggestions([]);

    try {
      const response = await apiClient.patch("/users/create-channel", {
        fullName,
        username,
      });

      if (response.data?.success) {
        // Update user context state
        updateUser(response.data.data);
        if (onChannelCreated) {
          onChannelCreated(response.data.data);
        }
      }
    } catch (err) {
      console.error("Channel creation error:", err);
      const apiErrorMsg = err.response?.data?.message || "Failed to create channel";
      setError(apiErrorMsg);

      // Extract username suggestions if available from backend collision handler
      const responseErrors = err.response?.data?.errors || err.response?.data?.suggestions;
      if (responseErrors && Array.isArray(responseErrors)) {
        setSuggestions(responseErrors);
      } else {
        setSuggestions([]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5 d-flex justify-content-center align-items-center">
      <div
        className="glass-panel border-secondary p-5 w-100 text-center text-main"
        style={{ maxWidth: "520px", borderRadius: "20px" }}
      >
        <div className="mb-4 position-relative d-inline-block">
          <img
            src={user?.avatar}
            alt="Avatar"
            className="rounded-circle border border-3 border-pink shadow-lg"
            style={{ width: "96px", height: "96px", objectFit: "cover" }}
          />
          <span
            className="position-absolute bottom-0 end-0 bg-pink p-2 rounded-circle d-flex align-items-center justify-content-center shadow"
            style={{ width: "32px", height: "32px" }}
          >
            <i className="bi bi-person-badge text-white fs-6"></i>
          </span>
        </div>

        <h3 className="fw-bold mb-2 text-gradient">Create Your Channel</h3>
        <p className="text-muted small mb-4">
          To start uploading videos, writing tweets, and creating playlists, create a creator channel.
        </p>

        {error && (
          <div className="alert alert-danger-custom border-danger text-danger text-start p-3 mb-4 rounded-3 small">
            <i className="bi bi-exclamation-circle-fill me-2"></i>
            {error}
          </div>
        )}

        {/* Username Suggestions Pill Badges */}
        {suggestions.length > 0 && (
          <div className="text-start mb-4">
            <span className="text-muted small d-block mb-2">Suggested Username variations:</span>
            <div className="d-flex flex-wrap gap-2">
              {suggestions.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setUsername(sug)}
                  className="btn btn-sm btn-glass text-main border-secondary rounded-pill px-3 py-1 font-semibold"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="text-start">
          <div className="mb-4">
            <label className="form-label text-muted small fw-semibold">Channel Name</label>
            <div className="input-group">
              <span className="input-group-text bg-dark bg-opacity-25 border-secondary text-muted">
                <i className="bi bi-person-square"></i>
              </span>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. My Awesome Channel"
                className="form-control form-control-glass border-start-0"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label text-muted small fw-semibold">Handle / Username</label>
            <div className="input-group">
              <span className="input-group-text bg-dark bg-opacity-25 border-secondary text-muted">@</span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="mychannelhandle"
                className="form-control form-control-glass border-start-0"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-gradient w-100 py-3 fw-bold rounded-pill text-white shadow-lg d-flex align-items-center justify-content-center gap-2"
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                <span>Creating...</span>
              </>
            ) : (
              <>
                <i className="bi bi-plus-circle"></i>
                <span>Create Channel</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateChannelPrompt;
