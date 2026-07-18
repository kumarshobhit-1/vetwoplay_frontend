import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import apiClient from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";
import VideoCard from "../components/VideoCard";

const LikedVideos = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [likedList, setLikedList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLikedVideos = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get("/likes/likedvideos");
      if (response.data?.success) {
        setLikedList(response.data.data || []);
      } else {
        setError("Failed to retrieve liked videos.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Could not retrieve liked videos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchLikedVideos();
  }, [user]);

  if (!user) return null;

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h3 className="fw-bold text-gradient mb-0">Liked Videos</h3>
        {likedList.length > 0 && (
          <span className="small text-muted">{likedList.length} items liked</span>
        )}
      </div>

      {loading ? (
        <LoadingSpinner message="Retrieving your liked list..." />
      ) : error ? (
        <div className="alert alert-glass text-danger">{error}</div>
      ) : likedList.length === 0 ? (
        <div className="glass-panel border-secondary text-center p-5 text-muted">
          <i className="bi bi-heartbreak fs-1 mb-2 d-block text-secondary"></i>
          <p className="mb-3">You haven't liked any videos yet.</p>
          <Link to="/" className="btn btn-gradient px-4 py-2">
            Browse Feed
          </Link>
        </div>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-4">
          {likedList.map((vid) => (
            // The API returns liked videos where ownerDetails contains owner details.
            // Let's normalize ownerDetails to owner so VideoCard displays it correctly.
            <div className="col" key={vid._id}>
              <VideoCard video={{ ...vid, owner: vid.ownerDetails || vid.owner }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LikedVideos;
