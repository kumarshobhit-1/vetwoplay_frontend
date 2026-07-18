import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit Video Modal state
  const [editingVideo, setEditingVideo] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editThumbnail, setEditThumbnail] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  const fetchDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const [statsRes, videosRes] = await Promise.all([
        apiClient.get("/dashboard/channelstats"),
        apiClient.get("/dashboard/channelvideos"),
      ]);

      if (statsRes.data?.success) {
        setStats(statsRes.data.data);
      }
      if (videosRes.data?.success) {
        setVideos(videosRes.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to retrieve creator studio statistics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchDashboardData();
  }, [user]);

  const handleTogglePublish = async (videoId, index) => {
    try {
      const response = await apiClient.patch(`/videos/toggle-update/${videoId}`);
      if (response.data?.success) {
        const updatedVideos = [...videos];
        updatedVideos[index].isPublished = response.data.data.isPublished;
        setVideos(updatedVideos);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to toggle video publish state.");
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm("Are you sure you want to permanently delete this video? This action is irreversible.")) return;

    try {
      const response = await apiClient.delete(`/videos/delete/${videoId}`);
      if (response.data?.success) {
        setVideos((prev) => prev.filter((v) => v._id !== videoId));
        // Refresh channel stats
        const statsRes = await apiClient.get("/dashboard/channelstats");
        if (statsRes.data?.success) {
          setStats(statsRes.data.data);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete video.");
    }
  };

  // Editing handlers
  const openEditModal = (video) => {
    setEditingVideo(video);
    setEditTitle(video.title);
    setEditDescription(video.description || "");
    setEditThumbnail(null);
  };

  const closeEditModal = () => {
    setEditingVideo(null);
    setEditTitle("");
    setEditDescription("");
    setEditThumbnail(null);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editTitle.trim()) return;

    setEditLoading(true);
    const formData = new FormData();
    formData.append("title", editTitle.trim());
    formData.append("description", editDescription.trim());
    if (editThumbnail) {
      formData.append("thumbnail", editThumbnail);
    }

    try {
      const response = await apiClient.patch(
        `/videos/update-details/${editingVideo._id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (response.data?.success) {
        // Update state local list
        setVideos((prev) =>
          prev.map((v) => (v._id === editingVideo._id ? response.data.data : v))
        );
        closeEditModal();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update video details.");
    } finally {
      setEditLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="container-fluid p-4">
      {/* Welcome Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 text-start">
        <div>
          <h3 className="fw-bold text-gradient mb-1">Creator Studio Dashboard</h3>
          <p className="text-muted small mb-0">Manage your published videos and review channel analytics.</p>
        </div>
        <Link to="/upload" className="btn btn-gradient d-flex align-items-center gap-2 py-2">
          <i className="bi bi-upload"></i> Publish New Video
        </Link>
      </div>

      {loading ? (
        <LoadingSpinner message="Calculating channel stats..." />
      ) : error ? (
        <div className="alert alert-glass text-danger">{error}</div>
      ) : (
        <>
          {/* Stats Grid */}
          {stats && (
            <div className="row g-4 mb-5">
              <div className="col-6 col-lg-3">
                <div className="glass-panel border-secondary p-4 text-start">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="small text-muted fw-bold text-uppercase">Total Videos</span>
                    <i className="bi bi-play-btn-fill fs-4 text-cyan"></i>
                  </div>
                  <h2 className="fw-bold mb-0 text-main">{stats.totalVideos ?? 0}</h2>
                </div>
              </div>
              <div className="col-6 col-lg-3">
                <div className="glass-panel border-secondary p-4 text-start">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="small text-muted fw-bold text-uppercase">Total Views</span>
                    <i className="bi bi-eye-fill fs-4" style={{ color: "var(--accent-purple-light)" }}></i>
                  </div>
                  <h2 className="fw-bold mb-0 text-main">{stats.totalViews ?? 0}</h2>
                </div>
              </div>
              <div className="col-6 col-lg-3">
                <div className="glass-panel border-secondary p-4 text-start">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="small text-muted fw-bold text-uppercase">Subscribers</span>
                    <i className="bi bi-people-fill fs-4 text-cyan"></i>
                  </div>
                  <h2 className="fw-bold mb-0 text-main">{stats.totalSubscribers ?? 0}</h2>
                </div>
              </div>
              <div className="col-6 col-lg-3">
                <div className="glass-panel border-secondary p-4 text-start">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="small text-muted fw-bold text-uppercase">Total Likes</span>
                    <i className="bi bi-heart-fill fs-4 text-danger"></i>
                  </div>
                  <h2 className="fw-bold mb-0 text-main">{stats.totalLikes ?? 0}</h2>
                </div>
              </div>
            </div>
          )}

          {/* Videos Management Table */}
          <h4 className="fw-bold text-start mb-3">Uploaded Videos</h4>
          {videos.length === 0 ? (
            <div className="glass-panel border-secondary text-center p-5 text-muted">
              <i className="bi bi-camera-video-off fs-1 d-block mb-2 text-secondary"></i>
              <p className="mb-0">You haven't uploaded any videos yet. Get started today!</p>
            </div>
          ) : (
            <div className="glass-panel border-secondary overflow-hidden mb-4">
              <div className="table-responsive">
                <table className="table table-dark table-hover mb-0 align-middle text-start">
                  <thead style={{ backgroundColor: "var(--bg-secondary)" }}>
                    <tr>
                      <th className="py-3 px-4 border-secondary">Status</th>
                      <th className="py-3 border-secondary">Video Details</th>
                      <th className="py-3 border-secondary">Views</th>
                      <th className="py-3 border-secondary">Likes</th>
                      <th className="py-3 border-secondary">Date Uploaded</th>
                      <th className="py-3 px-4 border-secondary text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {videos.map((vid, idx) => (
                      <tr key={vid._id}>
                        {/* Publish Status Toggle */}
                        <td className="px-4 py-3 border-secondary">
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              role="switch"
                              checked={vid.isPublished}
                              onChange={() => handleTogglePublish(vid._id, idx)}
                            />
                            <span className={`badge small ms-2 ${vid.isPublished ? "bg-success" : "bg-secondary"}`}>
                              {vid.isPublished ? "Public" : "Private"}
                            </span>
                          </div>
                        </td>

                        {/* Title and Thumbnail */}
                        <td className="py-3 border-secondary" style={{ minWidth: "280px" }}>
                          <div className="d-flex align-items-center gap-3">
                            <img
                              src={vid.thumbnail}
                              alt={vid.title}
                              className="rounded"
                              style={{ width: "90px", aspectRatio: "16/9", objectFit: "cover" }}
                            />
                            <div className="overflow-hidden" style={{ maxWidth: "200px" }}>
                              <Link to={`/watch/${vid._id}`} className="text-main fw-bold text-decoration-none text-truncate d-block mb-1">
                                {vid.title}
                              </Link>
                              <span className="small text-muted text-truncate d-block">
                                {vid.description || "No description"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Views */}
                        <td className="py-3 border-secondary text-muted">
                          {vid.views ?? 0}
                        </td>

                        {/* Likes */}
                        <td className="py-3 border-secondary text-muted">
                          {vid.likesCount ?? 0}
                        </td>

                        {/* Date */}
                        <td className="py-3 border-secondary text-muted small">
                          {new Date(vid.createdAt).toLocaleDateString()}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 border-secondary text-center">
                          <div className="d-flex justify-content-center gap-2">
                            <button
                              onClick={() => openEditModal(vid)}
                              className="btn btn-sm btn-glass border-secondary text-muted"
                              title="Edit Details"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              onClick={() => handleDeleteVideo(vid._id)}
                              className="btn btn-sm btn-glass border-danger text-danger"
                              title="Delete Video"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit Details Modal */}
      {editingVideo && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.8)", zIndex: 1100 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content glass-panel border-secondary p-4 text-start" style={{ background: "var(--bg-secondary)" }}>
              <div className="modal-header border-0 p-0 mb-3">
                <h5 className="modal-title fw-bold text-gradient">Edit Video Details</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={closeEditModal}
                ></button>
              </div>

              <form onSubmit={handleEditSubmit}>
                <div className="modal-body p-0 mb-4">
                  <div className="mb-3">
                    <label className="form-label small text-muted fw-semibold">Title</label>
                    <input
                      type="text"
                      className="form-control form-control-glass"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small text-muted fw-semibold">Description</label>
                    <textarea
                      className="form-control form-control-glass"
                      rows="3"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small text-muted fw-semibold">Update Thumbnail File (Optional)</label>
                    <input
                      type="file"
                      className="form-control form-control-glass"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setEditThumbnail(e.target.files[0]);
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="modal-footer border-0 p-0 d-flex gap-2 justify-content-end">
                  <button
                    type="button"
                    className="btn btn-glass px-4"
                    onClick={closeEditModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-gradient px-4"
                    disabled={editLoading}
                  >
                    {editLoading ? "Saving..." : "Save Details"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
