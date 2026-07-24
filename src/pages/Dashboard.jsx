import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../api/client";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import LoadingSpinner from "../components/LoadingSpinner";
import CreateChannelPrompt from "../components/CreateChannelPrompt";

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
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
    if (authLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    if (user.hasChannel) {
      fetchDashboardData();
    }
  }, [user, authLoading]);

  const handleTogglePublish = async (videoId, index) => {
    try {
      const response = await apiClient.patch(`/videos/toggle-update/${videoId}`);
      if (response.data?.success) {
        const updatedVideos = [...videos];
        updatedVideos[index].isPublished = response.data.data.isPublished;
        setVideos(updatedVideos);
        toast.success(`Video visibility set to ${response.data.data.isPublished ? "Public" : "Private"}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to toggle video publish state.");
    }
  };

  const handleDeleteVideo = (videoId) => {
    Swal.fire({
      title: "Delete Video?",
      text: "Are you sure you want to permanently delete this video? This action is irreversible.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "var(--accent-cyan)",
      cancelButtonColor: "var(--text-muted)",
      confirmButtonText: "Yes, delete it!",
      background: "var(--bg-secondary)",
      color: "var(--text-main)",
      customClass: {
        popup: "glass-panel shadow-lg border-secondary"
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await apiClient.delete(`/videos/delete/${videoId}`);
          if (response.data?.success) {
            setVideos((prev) => prev.filter((v) => v._id !== videoId));
            toast.success("Video deleted successfully");
            // Refresh channel stats
            const statsRes = await apiClient.get("/dashboard/channelstats");
            if (statsRes.data?.success) {
              setStats(statsRes.data.data);
            }
          }
        } catch (err) {
          toast.error(err.response?.data?.message || "Failed to delete video.");
        }
      }
    });
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
        toast.success("Video details updated successfully");
        closeEditModal();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update video details.");
    } finally {
      setEditLoading(false);
    }
  };

  if (authLoading) {
    return <LoadingSpinner message="Checking creator dashboard access..." />;
  }

  if (!user) return null;

  if (!user.hasChannel) {
    return <CreateChannelPrompt onChannelCreated={() => fetchDashboardData()} />;
  }

  return (
    <div className="container-fluid px-3 px-md-4 py-4 d-flex justify-content-center">
      <div 
        className="glass-panel border-secondary p-4 p-md-5 shadow-lg position-relative w-100" 
        style={{ maxWidth: "1280px", borderRadius: "24px", background: "var(--bg-secondary)", overflow: "hidden" }}
      >
        {/* Glow Spheres */}
        <div 
          className="position-absolute rounded-circle" 
          style={{ 
            width: "200px", 
            height: "200px", 
            background: "radial-gradient(circle, rgba(123, 44, 191, 0.04) 0%, transparent 70%)",
            top: "-80px",
            left: "-80px",
            pointerEvents: "none"
          }}
        ></div>
        <div 
          className="position-absolute rounded-circle" 
          style={{ 
            width: "200px", 
            height: "200px", 
            background: "radial-gradient(circle, rgba(255, 71, 126, 0.04) 0%, transparent 70%)",
            bottom: "-80px",
            right: "-80px",
            pointerEvents: "none"
          }}
        ></div>

        {/* Welcome Header */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 text-start">
          <div>
            <h3 className="fw-bold text-gradient mb-1">Creator Studio Dashboard</h3>
            <p className="text-muted small mb-0">Manage your published videos and review channel analytics.</p>
          </div>
          <Link to="/upload" className="btn btn-gradient d-flex align-items-center gap-2 py-2 rounded-pill">
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
                <div 
                  className="glass-panel glass-panel-hover p-4 text-start shadow-sm border-secondary position-relative overflow-hidden"
                  style={{ minHeight: "130px", borderRadius: "18px" }}
                >
                  <div className="position-absolute rounded-circle" style={{ width: "80px", height: "80px", background: "radial-gradient(circle, rgba(255, 71, 126, 0.08) 0%, transparent 70%)", top: "-10px", right: "-10px", pointerEvents: "none" }}></div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <span className="small text-muted fw-bold text-uppercase" style={{ fontSize: "0.75rem", letterSpacing: "1px" }}>Total Videos</span>
                    <div className="d-flex align-items-center justify-content-center rounded-3" style={{ width: "40px", height: "40px", backgroundColor: "rgba(255, 71, 126, 0.1)", color: "var(--accent-cyan)" }}>
                      <i className="bi bi-play-btn-fill fs-5"></i>
                    </div>
                  </div>
                  <div className="fw-extrabold mb-0 mt-1 text-gradient" style={{ fontSize: "2.4rem", letterSpacing: "-1px", lineHeight: 1 }}>
                    {stats.totalVideos ?? 0}
                  </div>
                </div>
              </div>
              
              <div className="col-6 col-lg-3">
                <div 
                  className="glass-panel glass-panel-hover p-4 text-start shadow-sm border-secondary position-relative overflow-hidden"
                  style={{ minHeight: "130px", borderRadius: "18px" }}
                >
                  <div className="position-absolute rounded-circle" style={{ width: "80px", height: "80px", background: "radial-gradient(circle, rgba(123, 44, 191, 0.08) 0%, transparent 70%)", top: "-10px", right: "-10px", pointerEvents: "none" }}></div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <span className="small text-muted fw-bold text-uppercase" style={{ fontSize: "0.75rem", letterSpacing: "1px" }}>Total Views</span>
                    <div className="d-flex align-items-center justify-content-center rounded-3" style={{ width: "40px", height: "40px", backgroundColor: "rgba(123, 44, 191, 0.1)", color: "var(--accent-purple-light)" }}>
                      <i className="bi bi-eye-fill fs-5"></i>
                    </div>
                  </div>
                  <div className="fw-extrabold mb-0 mt-1 text-gradient" style={{ fontSize: "2.4rem", letterSpacing: "-1px", lineHeight: 1 }}>
                    {stats.totalViews ?? 0}
                  </div>
                </div>
              </div>

              <div className="col-6 col-lg-3">
                <div 
                  className="glass-panel glass-panel-hover p-4 text-start shadow-sm border-secondary position-relative overflow-hidden"
                  style={{ minHeight: "130px", borderRadius: "18px" }}
                >
                  <div className="position-absolute rounded-circle" style={{ width: "80px", height: "80px", background: "radial-gradient(circle, rgba(255, 71, 126, 0.08) 0%, transparent 70%)", top: "-10px", right: "-10px", pointerEvents: "none" }}></div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <span className="small text-muted fw-bold text-uppercase" style={{ fontSize: "0.75rem", letterSpacing: "1px" }}>Subscribers</span>
                    <div className="d-flex align-items-center justify-content-center rounded-3" style={{ width: "40px", height: "40px", backgroundColor: "rgba(255, 71, 126, 0.1)", color: "var(--accent-cyan)" }}>
                      <i className="bi bi-people-fill fs-5"></i>
                    </div>
                  </div>
                  <div className="fw-extrabold mb-0 mt-1 text-gradient" style={{ fontSize: "2.4rem", letterSpacing: "-1px", lineHeight: 1 }}>
                    {stats.totalSubscribers ?? 0}
                  </div>
                </div>
              </div>

              <div className="col-6 col-lg-3">
                <div 
                  className="glass-panel glass-panel-hover p-4 text-start shadow-sm border-secondary position-relative overflow-hidden"
                  style={{ minHeight: "130px", borderRadius: "18px" }}
                >
                  <div className="position-absolute rounded-circle" style={{ width: "80px", height: "80px", background: "radial-gradient(circle, rgba(123, 44, 191, 0.08) 0%, transparent 70%)", top: "-10px", right: "-10px", pointerEvents: "none" }}></div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <span className="small text-muted fw-bold text-uppercase" style={{ fontSize: "0.75rem", letterSpacing: "1px" }}>Total Likes</span>
                    <div className="d-flex align-items-center justify-content-center rounded-3" style={{ width: "40px", height: "40px", backgroundColor: "rgba(123, 44, 191, 0.1)", color: "var(--accent-purple-light)" }}>
                      <i className="bi bi-heart-fill fs-5"></i>
                    </div>
                  </div>
                  <div className="fw-extrabold mb-0 mt-1 text-gradient" style={{ fontSize: "2.4rem", letterSpacing: "-1px", lineHeight: 1 }}>
                    {stats.totalLikes ?? 0}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Videos Management Table Section */}
          <div className="mt-5 border-top border-secondary pt-4">
            <div className="d-flex align-items-center justify-content-between mb-4 pb-1">
              <h4 className="fw-bold text-main mb-0">Uploaded Videos</h4>
              {videos.length > 0 && (
                <span 
                  className="badge px-3 py-1.5 rounded-pill fw-bold text-uppercase tracking-wider small" 
                  style={{ backgroundColor: "rgba(255, 71, 126, 0.15)", color: "var(--accent-cyan)" }}
                >
                  {videos.length} videos total
                </span>
              )}
            </div>

            {videos.length === 0 ? (
              <div className="text-center p-5 text-muted">
                <i className="bi bi-cloud-arrow-up text-pink fs-1 mb-3 d-block"></i>
                <h5 className="fw-bold text-main mb-2">No Videos Uploaded Yet</h5>
                <p className="small text-muted mb-4 mx-auto" style={{ maxWidth: "320px" }}>Share your first video with the community to start tracking your channel statistics.</p>
                <Link to="/upload" className="btn btn-gradient px-4 py-2.5 rounded-pill text-white fw-bold shadow-sm d-inline-flex align-items-center gap-2">
                  <i className="bi bi-upload"></i>
                  <span>Publish Your First Video</span>
                </Link>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0 align-middle text-start text-main">
                  <thead style={{ backgroundColor: "var(--bg-tertiary)" }}>
                    <tr>
                      <th className="py-3 px-4 border-secondary text-muted small fw-bold text-uppercase" style={{ fontSize: "0.72rem", letterSpacing: "0.5px" }}>Status</th>
                      <th className="py-3 border-secondary text-muted small fw-bold text-uppercase" style={{ fontSize: "0.72rem", letterSpacing: "0.5px" }}>Video Details</th>
                      <th className="py-3 border-secondary text-muted small fw-bold text-uppercase" style={{ fontSize: "0.72rem", letterSpacing: "0.5px" }}>Views</th>
                      <th className="py-3 border-secondary text-muted small fw-bold text-uppercase" style={{ fontSize: "0.72rem", letterSpacing: "0.5px" }}>Likes</th>
                      <th className="py-3 border-secondary text-muted small fw-bold text-uppercase" style={{ fontSize: "0.72rem", letterSpacing: "0.5px" }}>Date Uploaded</th>
                      <th className="py-3 px-4 border-secondary text-center text-muted small fw-bold text-uppercase" style={{ fontSize: "0.72rem", letterSpacing: "0.5px" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {videos.map((vid, idx) => (
                      <tr key={vid._id}>
                        {/* Publish Status Toggle */}
                        <td className="px-4 py-3 border-secondary">
                          <div className="form-check form-switch d-inline-flex align-items-center gap-2">
                            <input
                              className="form-check-input cursor-pointer"
                              type="checkbox"
                              role="switch"
                              checked={vid.isPublished}
                              onChange={() => handleTogglePublish(vid._id, idx)}
                            />
                            <span 
                              className={`badge px-2.5 py-1 rounded-pill small fw-bold text-uppercase`}
                              style={{ 
                                fontSize: "0.7rem", 
                                backgroundColor: vid.isPublished ? "rgba(40, 167, 69, 0.1)" : "rgba(108, 117, 125, 0.1)",
                                color: vid.isPublished ? "#28a745" : "var(--text-muted)",
                                border: vid.isPublished ? "1px solid rgba(40, 167, 69, 0.2)" : "1px solid rgba(108, 117, 125, 0.2)"
                              }}
                            >
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
                              className="rounded shadow-sm"
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
                        <td className="py-3 border-secondary text-muted fw-semibold">
                          {vid.views ?? 0}
                        </td>

                        {/* Likes */}
                        <td className="py-3 border-secondary text-muted fw-semibold">
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
                              className="btn btn-sm btn-glass border-secondary text-pink rounded-circle d-inline-flex align-items-center justify-content-center"
                              style={{ width: "32px", height: "32px" }}
                              title="Edit Details"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              onClick={() => handleDeleteVideo(vid._id)}
                              className="btn btn-sm btn-glass border-danger text-danger rounded-circle d-inline-flex align-items-center justify-content-center"
                              style={{ width: "32px", height: "32px" }}
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
            )}
          </div>
        </>
      )}

      {/* Edit Details Modal */}
      {editingVideo && createPortal(
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
          style={{ backgroundColor: "rgba(0,0,0,0.75)", zIndex: 2000, backdropFilter: "blur(4px)" }}
        >
          <div className="w-100 px-3" style={{ maxWidth: "500px" }}>
            <div className="glass-panel border-secondary p-4 text-start shadow-lg" style={{ background: "var(--bg-secondary)", borderRadius: "20px" }}>
              <div className="d-flex align-items-center justify-content-between mb-3 border-bottom border-secondary pb-2">
                <h5 className="fw-bold mb-0 text-gradient">Edit Video Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeEditModal}
                ></button>
              </div>

              <form onSubmit={handleEditSubmit}>
                <div className="modal-body p-0 mb-4">
                  <div className="mb-3">
                    <label className="form-label small text-muted fw-semibold">Title</label>
                    <input
                      type="text"
                      className="form-control form-control-glass py-2 px-3"
                      style={{ borderRadius: "10px" }}
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small text-muted fw-semibold">Description</label>
                    <textarea
                      className="form-control form-control-glass py-2 px-3"
                      style={{ borderRadius: "10px" }}
                      rows="3"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small text-muted fw-semibold">Update Thumbnail File (Optional)</label>
                    <input
                      type="file"
                      className="form-control form-control-glass py-2 px-3"
                      style={{ borderRadius: "10px" }}
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
                    className="btn btn-glass px-4 rounded-pill"
                    onClick={closeEditModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-gradient px-4 rounded-pill text-white shadow-sm"
                    disabled={editLoading}
                  >
                    {editLoading ? "Saving..." : "Save Details"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
      </div>
    </div>
  );
};

export default Dashboard;
