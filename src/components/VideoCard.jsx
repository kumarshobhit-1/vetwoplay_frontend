import React from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/client";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

const VideoCard = ({ video }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Playlist Saving state
  const [showPlaylistModal, setShowPlaylistModal] = React.useState(false);
  const [userPlaylists, setUserPlaylists] = React.useState([]);
  const [playlistsLoading, setPlaylistsLoading] = React.useState(false);
  const [newPlaylistName, setNewPlaylistName] = React.useState("");
  const [newPlaylistDesc, setNewPlaylistDesc] = React.useState("");
  const [creatingPlaylist, setCreatingPlaylist] = React.useState(false);

  // Dropdown state
  const [showDropdown, setShowDropdown] = React.useState(false);

  React.useEffect(() => {
    if (!showDropdown) return;
    const closeMenu = () => setShowDropdown(false);
    document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, [showDropdown]);

  const fetchUserPlaylists = async () => {
    if (!user) return;
    setPlaylistsLoading(true);
    try {
      const response = await apiClient.get(`/playlists/showplaylist/${user._id}`);
      if (response.data?.success) {
        setUserPlaylists(response.data.data.playlists || []);
      }
    } catch (err) {
      console.error("Error fetching user playlists for save:", err);
    } finally {
      setPlaylistsLoading(false);
    }
  };

  const handleSaveToPlaylistClick = (e) => {
    e.stopPropagation();
    if (!user) {
      navigate("/login");
      return;
    }
    setShowPlaylistModal(true);
    fetchUserPlaylists();
  };

  const handleCheckboxChange = async (playlist, isChecked) => {
    try {
      if (isChecked) {
        await apiClient.patch(`/playlists/${playlist._id}/addvideo/${video._id}`);
        toast.success(`Video added to ${playlist.name}`);
      } else {
        await apiClient.delete(`/playlists/${playlist._id}/removevideo/${video._id}`);
        toast.success(`Video removed from ${playlist.name}`);
      }
      fetchUserPlaylists();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update playlist");
    }
  };

  const handleCreatePlaylistInModal = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    setCreatingPlaylist(true);
    try {
      const response = await apiClient.post("/playlists/createplaylist", {
        name: newPlaylistName.trim(),
        description: newPlaylistDesc.trim(),
      });
      if (response.data?.success) {
        setNewPlaylistName("");
        setNewPlaylistDesc("");
        toast.success("Playlist created successfully");
        fetchUserPlaylists();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error creating playlist");
    } finally {
      setCreatingPlaylist(false);
    }
  };

  const handleShare = (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/watch/${video._id}`;
    navigator.clipboard.writeText(url);
    toast.success("Video link copied to clipboard!");
  };

  if (!video) return null;

  // Helper to redirect logged-out users to Login on interaction
  const handleCardInteraction = (e) => {
    if (!user) {
      e.preventDefault();
      navigate("/login", { state: { message: "Please log in to watch videos and explore creator channels!" } });
    }
  };

  // Helper to format video duration
  const formatDuration = (sec) => {
    if (!sec) return "0:00";
    const minutes = Math.floor(sec / 60);
    const seconds = Math.floor(sec % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // Helper to format publish dates
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return "";
    const created = new Date(dateStr);
    const now = new Date();
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="glass-panel glass-panel-hover h-100 d-flex flex-column">
      {/* Thumbnail */}
      <Link 
        to={`/watch/${video._id}`} 
        onClick={handleCardInteraction} 
        className="position-relative hover-zoom-img d-block"
      >
        <img
          src={video.thumbnail}
          alt={video.title}
          className="img-fluid w-100 rounded-top"
          style={{ aspectRatio: "16/9", objectFit: "cover" }}
        />
        <span 
          className="position-absolute bottom-0 end-0 m-2 px-2 py-1 small rounded text-white fw-bold"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.75)", fontSize: "0.75rem" }}
        >
          {formatDuration(video.duration)}
        </span>
      </Link>

      {/* Video Info */}
      <div className="p-3 d-flex gap-3 flex-grow-1 align-items-start position-relative">
        {/* Creator Avatar */}
        {video.owner && (
          <Link 
            to={`/c/${video.owner.username}`} 
            onClick={handleCardInteraction}
          >
            <img
              src={video.owner.avatar}
              alt={video.owner.username}
              className="rounded-circle border border-secondary"
              style={{ width: "36px", height: "36px", objectFit: "cover" }}
            />
          </Link>
        )}

        {/* Text Fields */}
        <div className="d-flex flex-column flex-grow-1 text-start overflow-hidden pe-3">
          <div className="d-flex align-items-start justify-content-between gap-1 mb-1" style={{ minWidth: 0 }}>
            <Link 
              to={`/watch/${video._id}`} 
              onClick={handleCardInteraction} 
              className="text-main text-decoration-none fw-bold text-truncate flex-grow-1 h6 mb-0" 
              title={video.title}
              style={{ minWidth: 0 }}
            >
              {video.title}
            </Link>
          </div>

          {video.owner && (
            <Link 
              to={`/c/${video.owner.username}`} 
              onClick={handleCardInteraction}
              className="text-muted small text-decoration-none fw-semibold mb-1"
            >
              {video.owner.fullName || `@${video.owner.username}`}
            </Link>
          )}

          <div className="d-flex align-items-center gap-2 text-muted small mt-auto">
            <span>{video.views ?? 0} views</span>
            <span>•</span>
            <span>{formatTimeAgo(video.createdAt)}</span>
          </div>
        </div>

        {/* Absolute positioned 3-dot dropdown (outside overflow-hidden text-fields) */}
        <div className="position-absolute flex-shrink-0" style={{ top: "12px", right: "12px", zIndex: 100 }}>
          <button
            className="btn btn-link text-muted p-1 border-0"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setShowDropdown(!showDropdown);
            }}
          >
            <i className="bi bi-three-dots-vertical fs-5"></i>
          </button>
          {showDropdown && (
            <div 
              className="glass-panel border-secondary p-1 shadow-lg position-absolute"
              style={{ 
                zIndex: 1050, 
                minWidth: "150px", 
                top: "100%",
                right: "0px",
                marginTop: "4px"
              }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              <button 
                className="btn w-100 text-start text-main py-2 px-3 border-0 bg-transparent rounded d-flex align-items-center gap-2 btn-dropdown-hover" 
                style={{ fontSize: "0.85rem" }}
                onClick={(e) => {
                  setShowDropdown(false);
                  handleShare(e);
                }}
              >
                <i className="bi bi-share text-pink"></i> 
                <span>Share</span>
              </button>
              <button 
                className="btn w-100 text-start text-main py-2 px-3 border-0 bg-transparent rounded d-flex align-items-center gap-2 btn-dropdown-hover" 
                style={{ fontSize: "0.85rem" }}
                onClick={(e) => {
                  setShowDropdown(false);
                  handleSaveToPlaylistClick(e);
                }}
              >
                <i className="bi bi-plus-square text-pink"></i> 
                <span>Save to playlist</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Save to Playlist Modal Overlay */}
      {showPlaylistModal && createPortal(
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            zIndex: 2000,
            backdropFilter: "blur(4px)"
          }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setShowPlaylistModal(false);
          }}
        >
          <div
            className="glass-panel border-secondary p-4 w-100 text-main text-start shadow-lg"
            style={{ maxWidth: "400px", borderRadius: "20px", background: "var(--bg-secondary)" }}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom border-secondary pb-2">
              <h5 className="fw-bold mb-0 text-gradient">Save to...</h5>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPlaylistModal(false);
                }}
                className="btn-close"
                style={{ filter: "var(--text-main) === '#f3f4f6' ? 'invert(1)' : 'none'" }}
                aria-label="Close"
              ></button>
            </div>

            {playlistsLoading ? (
              <div className="py-4 text-center">
                <div className="spinner-border spinner-border-sm text-pink" role="status"></div>
                <span className="ms-2 small text-muted">Loading playlists...</span>
              </div>
            ) : userPlaylists.length === 0 ? (
              <div className="text-center py-4 text-muted small">
                <i className="bi bi-folder-plus fs-2 mb-2 d-block text-secondary"></i>
                <span>No playlists created yet.</span>
              </div>
            ) : (
              <div className="d-flex flex-column gap-1 my-3 overflow-y-auto pr-1" style={{ maxHeight: "180px" }}>
                {userPlaylists.map((pl) => {
                  const hasVideo = pl.videos?.some((v) => v._id === video._id);
                  return (
                    <label 
                      key={pl._id} 
                      className="d-flex align-items-center justify-content-between py-2 px-3 mb-2 cursor-pointer btn-dropdown-hover" 
                      style={{ 
                        cursor: "pointer",
                        background: "var(--bg-primary)",
                        border: "1px solid var(--glass-border-hover)",
                        borderRadius: "10px"
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="fw-semibold text-main small">{pl.name}</span>
                      <input
                        className="form-check-input border-secondary accent-pink"
                        type="checkbox"
                        checked={!!hasVideo}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleCheckboxChange(pl, e.target.checked);
                        }}
                        style={{ cursor: "pointer", width: "18px", height: "18px" }}
                      />
                    </label>
                  );
                })}
              </div>
            )}

            {/* Quick Playlist Creation form */}
            <form 
              onSubmit={handleCreatePlaylistInModal} 
              className="border-top border-secondary pt-3 mt-3"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-muted small fw-semibold d-block mb-3">Create new playlist:</span>
              <div className="mb-3">
                <input
                  type="text"
                  required
                  placeholder="Playlist name"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="form-control form-control-glass py-2 px-3"
                  style={{ fontSize: "0.85rem", borderRadius: "10px" }}
                />
              </div>
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={newPlaylistDesc}
                  onChange={(e) => setNewPlaylistDesc(e.target.value)}
                  className="form-control form-control-glass py-2 px-3"
                  style={{ fontSize: "0.85rem", borderRadius: "10px" }}
                />
              </div>
              <button
                type="submit"
                disabled={creatingPlaylist}
                className="btn btn-gradient w-100 py-2.5 fw-bold rounded-pill text-white small shadow-sm d-flex align-items-center justify-content-center gap-2"
                style={{ fontSize: "0.85rem" }}
              >
                {creatingPlaylist ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-plus-circle"></i>
                    <span>Create Playlist</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default VideoCard;
