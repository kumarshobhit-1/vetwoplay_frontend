import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import apiClient from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";
import VideoCard from "../components/VideoCard";

const WatchHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchHistory = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get("/users/history");
      if (response.data?.success) {
        setHistory(response.data.data || []);
      } else {
        setError("Failed to fetch watch history.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Could not retrieve watch history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchHistory();
  }, [user]);

  if (!user) return null;

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h3 className="fw-bold text-gradient mb-0">Watch History</h3>
        {history.length > 0 && (
          <span className="small text-muted">{history.length} videos viewed</span>
        )}
      </div>

      {loading ? (
        <LoadingSpinner message="Retrieving your watch history..." />
      ) : error ? (
        <div className="alert alert-glass text-danger">{error}</div>
      ) : history.length === 0 ? (
        <div className="glass-panel border-secondary text-center p-5 text-muted">
          <i className="bi bi-clock-history fs-1 mb-2 d-block text-secondary"></i>
          <p className="mb-3">Your watch history is empty.</p>
          <Link to="/" className="btn btn-gradient px-4 py-2">
            Browse Videos
          </Link>
        </div>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-4">
          {history.map((vid) => (
            <div className="col" key={vid._id}>
              <VideoCard video={vid} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WatchHistory;
