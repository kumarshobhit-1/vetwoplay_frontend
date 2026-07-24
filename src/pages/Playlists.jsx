import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate, useLocation } from "react-router-dom";
import apiClient from "../api/client";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import LoadingSpinner from "../components/LoadingSpinner";

const Playlists = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Creation State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Selected Playlist details
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [selectedPlaylistLoading, setSelectedPlaylistLoading] = useState(false);

  // Add Video selector modal state
  const [showAddVideoModal, setShowAddVideoModal] = useState(false);
  const [searchVideoQuery, setSearchVideoQuery] = useState("");
  const [searchVideoResults, setSearchVideoResults] = useState([]);
  const [searchVideoLoading, setSearchVideoLoading] = useState(false);

  const fetchPlaylists = async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get(`/playlists/showplaylist/${user._id}`);
      if (response.data?.success) {
        setPlaylists(response.data.data.playlists || []);
      } else {
        setError("Failed to fetch playlists.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error fetching playlists.");
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
    fetchPlaylists();
  }, [user, authLoading]);

  // Handle auto-selection when navigating from autocomplete search selection
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get("id");
    if (id) {
      handlePlaylistSelect(id);
    } else {
      setSelectedPlaylist(null);
    }
  }, [location.search]);

  const handleCreatePlaylistSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setCreateLoading(true);
    try {
      const response = await apiClient.post("/playlists/createplaylist", {
        name: name.trim(),
        description: description.trim(),
      });
      if (response.data?.success) {
        setName("");
        setDescription("");
        setShowCreateModal(false);
        toast.success("Playlist created successfully");
        // Reload playlists
        fetchPlaylists();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error creating playlist");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeletePlaylist = (playlistId, e) => {
    e.stopPropagation(); // Avoid triggering details modal
    Swal.fire({
      title: "Delete Playlist?",
      text: "Are you sure you want to permanently delete this playlist?",
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
          const response = await apiClient.delete(`/playlists/removeplaylist/${playlistId}`);
          if (response.data?.success) {
            setPlaylists((prev) => prev.filter((p) => p._id !== playlistId));
            if (selectedPlaylist?._id === playlistId) {
              setSelectedPlaylist(null);
            }
            toast.success("Playlist deleted successfully");
          }
        } catch (err) {
          toast.error(err.response?.data?.message || "Error deleting playlist");
        }
      }
    });
  };

  const handlePlaylistSelect = async (playlistId) => {
    setSelectedPlaylistLoading(true);
    try {
      const response = await apiClient.get(`/playlists/showplaylistbyid/${playlistId}`);
      if (response.data?.success) {
        setSelectedPlaylist(response.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error fetching playlist details");
    } finally {
      setSelectedPlaylistLoading(false);
    }
  };

  const handleRemoveVideoFromPlaylist = (videoId) => {
    if (!selectedPlaylist) return;
    Swal.fire({
      title: "Remove Video?",
      text: "Are you sure you want to remove this video from the playlist?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "var(--accent-cyan)",
      cancelButtonColor: "var(--text-muted)",
      confirmButtonText: "Yes, remove it!",
      background: "var(--bg-secondary)",
      color: "var(--text-main)",
      customClass: {
        popup: "glass-panel shadow-lg border-secondary"
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await apiClient.delete(
            `/playlists/${selectedPlaylist._id}/removevideo/${videoId}`
          );
          if (response.data?.success) {
            setSelectedPlaylist(response.data.data);
            toast.success("Video removed from playlist");
            // Refresh full playlist list to update cover thumbnails and counts
            fetchPlaylists();
          }
        } catch (err) {
          toast.error(err.response?.data?.message || "Error removing video from playlist");
        }
      }
    });
  };

  const handleSharePlaylist = () => {
    if (!selectedPlaylist) return;
    const url = `${window.location.origin}/playlists?id=${selectedPlaylist._id}`;
    navigator.clipboard.writeText(url);
    toast.success("Playlist link copied to clipboard!");
  };

  const fetchVideosForModal = async (searchVal) => {
    setSearchVideoLoading(true);
    try {
      const response = await apiClient.get("/videos/allvideos", {
        params: {
          page: 1,
          limit: 10,
          query: searchVal,
          sortBy: "createdAt",
          sortType: "desc"
        }
      });
      if (response.data?.success) {
        setSearchVideoResults(response.data.data.videos || []);
      }
    } catch (err) {
      console.error("Error searching videos:", err);
    } finally {
      setSearchVideoLoading(false);
    }
  };

  const handleOpenAddVideoModal = () => {
    setShowAddVideoModal(true);
    setSearchVideoQuery("");
    fetchVideosForModal("");
  };

  const handleAddVideoToPlaylist = async (videoId) => {
    if (!selectedPlaylist) return;
    try {
      const response = await apiClient.patch(
        `/playlists/${selectedPlaylist._id}/addvideo/${videoId}`
      );
      if (response.data?.success) {
        setSelectedPlaylist(response.data.data);
        toast.success("Video added to playlist");
        // Refresh index
        fetchPlaylists();
        setShowAddVideoModal(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error adding video to playlist");
    }
  };

  // Debounce video search inside the modal
  useEffect(() => {
    if (!showAddVideoModal) return;
    const timer = setTimeout(() => {
      fetchVideosForModal(searchVideoQuery);
    }, 450);
    return () => clearTimeout(timer);
  }, [searchVideoQuery, showAddVideoModal]);

  const isPlaylistOwner = selectedPlaylist && user && (
    selectedPlaylist.owner === user._id || 
    selectedPlaylist.owner?._id === user._id
  );

  if (authLoading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  if (!user) return null;

  return (
    <div className="container-fluid p-4">
      {/* Header (Hidden when viewing a specific playlist details page) */}
      {!selectedPlaylist && (
        <div className="d-flex align-items-center justify-content-between mb-4">
          <h3 className="fw-bold text-gradient mb-0">My Playlists</h3>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-gradient d-flex align-items-center gap-2"
          >
            <i className="bi bi-folder-plus"></i> Create Playlist
          </button>
        </div>
      )}

      {selectedPlaylist ? (
        /* ========================================================================= */
        /* YOUTUBE-STYLE PLAYLIST DETAILS VIEW                                       */
        /* ========================================================================= */
        <div className="row g-4">
          {/* Back button Row */}
          <div className="col-12 text-start">
            <button
              onClick={() => setSelectedPlaylist(null)}
              className="btn btn-glass d-inline-flex align-items-center gap-2"
            >
              <i className="bi bi-arrow-left"></i> Back to Playlists
            </button>
          </div>

          {/* Left Column: Playlist Card Panel (col-lg-4) */}
          <div className="col-lg-4 text-start">
            <div className="glass-panel border-secondary p-4 sticky-playlist-sidebar">
              {/* Large Cover Image */}
              <div
                className="hover-zoom-img mb-3 rounded overflow-hidden shadow-sm position-relative"
                style={{ aspectRatio: "16/9", backgroundColor: "var(--bg-tertiary)" }}
              >
                {selectedPlaylist.coverThumbnail ? (
                  <img
                    src={selectedPlaylist.coverThumbnail}
                    alt={selectedPlaylist.name}
                    className="w-100 h-100"
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center text-muted">
                    <i className="bi bi-music-note-list fs-1 mb-2"></i>
                    <span className="small">Empty Playlist</span>
                  </div>
                )}
                
                {/* Play All overlay on hover */}
                {selectedPlaylist.videos && selectedPlaylist.videos.length > 0 && (
                  <Link
                    to={`/watch/${selectedPlaylist.videos[0]._id}`}
                    className="position-absolute top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center opacity-0 hover-opacity-100 transition-all text-white text-decoration-none"
                    style={{ transition: "opacity 0.2s" }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <i className="bi bi-play-fill fs-3"></i>
                      <span className="fw-bold text-uppercase tracking-wider">Play All</span>
                    </div>
                  </Link>
                )}
              </div>

              {/* Playlist Title & Description */}
              <h3 className="text-main fw-bold mb-2">{selectedPlaylist.name}</h3>
              
              {/* Creator details */}
              {selectedPlaylist.owner?.hasChannel ? (
                <Link
                  to={`/c/${selectedPlaylist.owner?.username}`}
                  className="d-inline-flex align-items-center gap-2 mb-3 text-decoration-none hover-opacity"
                >
                  <img
                    src={selectedPlaylist.owner?.avatar}
                    alt={selectedPlaylist.owner?.username}
                    className="rounded-circle border border-secondary"
                    style={{ width: "24px", height: "24px", objectFit: "cover" }}
                  />
                  <span className="small text-main fw-semibold">@{selectedPlaylist.owner?.username}</span>
                </Link>
              ) : (
                <div className="d-inline-flex align-items-center gap-2 mb-3 text-muted">
                  <img
                    src={selectedPlaylist.owner?.avatar}
                    alt={selectedPlaylist.owner?.username}
                    className="rounded-circle border border-secondary"
                    style={{ width: "24px", height: "24px", objectFit: "cover", filter: "grayscale(100%)" }}
                  />
                  <span className="small fw-semibold">@{selectedPlaylist.owner?.username}</span>
                </div>
              )}

              {/* Playlist Stats */}
              <div className="d-flex gap-3 text-muted small mb-3">
                <span><i className="bi bi-list-play"></i> {selectedPlaylist.totalVideos} videos</span>
                <span><i className="bi bi-eye"></i> {selectedPlaylist.totalViews || 0} views</span>
              </div>

              <p className="text-muted small mb-4" style={{ whiteSpace: "pre-wrap" }}>
                {selectedPlaylist.description || "No description provided."}
              </p>

              {/* Play All Trigger Button */}
              {selectedPlaylist.videos && selectedPlaylist.videos.length > 0 ? (
                <Link
                  to={`/watch/${selectedPlaylist.videos[0]._id}`}
                  className="btn btn-gradient w-100 py-3 fw-bold d-flex align-items-center justify-content-center gap-2 shadow"
                  style={{ borderRadius: "10px" }}
                >
                  <i className="bi bi-play-fill fs-5"></i> Play All
                </Link>
              ) : (
                <button
                  className="btn btn-secondary w-100 py-3 fw-bold border-0"
                  disabled
                  style={{ borderRadius: "10px" }}
                >
                  No Videos
                </button>
              )}

              <button
                onClick={handleSharePlaylist}
                className="btn btn-glass w-100 py-2.5 fw-bold d-flex align-items-center justify-content-center gap-2 mt-2 shadow-sm"
                style={{ borderRadius: "10px" }}
              >
                <i className="bi bi-share fs-6"></i> Share Playlist
              </button>

              {isPlaylistOwner && (
                <button
                  onClick={handleOpenAddVideoModal}
                  className="btn btn-gradient w-100 py-2.5 fw-bold d-flex align-items-center justify-content-center gap-2 mt-2 shadow"
                  style={{ borderRadius: "10px" }}
                >
                  <i className="bi bi-plus-circle fs-5"></i> Add Videos
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Playlist Video Items List (col-lg-8) */}
          <div className="col-lg-8 text-start">
            <div className="glass-panel border-secondary p-4">
              <h5 className="text-main fw-bold mb-4 d-flex align-items-center gap-2">
                <i className="bi bi-collection-play text-gradient"></i> Playlist Videos
              </h5>

              {selectedPlaylistLoading ? (
                <LoadingSpinner message="Fetching items..." />
              ) : !selectedPlaylist.videos || selectedPlaylist.videos.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-file-earmark-music fs-1 d-block mb-2 text-secondary"></i>
                  <p className="small mb-3">No videos in this playlist yet.</p>
                  {isPlaylistOwner && (
                    <button
                      onClick={handleOpenAddVideoModal}
                      className="btn btn-glass border-secondary text-main rounded-pill px-4 py-2 shadow-sm"
                    >
                      <i className="bi bi-plus-circle me-2 text-pink"></i> Add Videos
                    </button>
                  )}
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {selectedPlaylist.videos.map((vid, idx) => (
                    <div
                      key={vid._id}
                      className="d-flex gap-2 gap-md-3 p-2 p-md-3 border border-secondary rounded align-items-center bg-dark bg-opacity-25 hover-zoom-img"
                      style={{ transition: "background-color 0.2s" }}
                    >
                      {/* Index Number */}
                      <span className="text-muted fw-bold px-2 d-none d-md-inline" style={{ minWidth: "30px" }}>
                        {idx + 1}
                      </span>
                      
                      {/* Video Thumbnail */}
                      <Link to={`/watch/${vid._id}`} className="flex-shrink-0 playlist-video-thumb">
                        <div className="position-relative rounded overflow-hidden" style={{ aspectRatio: "16/9" }}>
                          <img
                            src={vid.thumbnail}
                            alt={vid.title}
                            className="w-100 h-100"
                            style={{ objectFit: "cover" }}
                          />
                        </div>
                      </Link>

                      {/* Video Title & Details */}
                      <div className="flex-grow-1 overflow-hidden text-start">
                        <Link to={`/watch/${vid._id}`} className="text-main text-decoration-none fw-bold text-truncate d-block mb-1 fs-6 fs-md-5">
                          {vid.title}
                        </Link>
                        <p className="text-muted small mb-2 text-truncate d-none d-md-block" style={{ fontSize: "0.85rem" }}>
                          {vid.description}
                        </p>
                        <div className="d-flex align-items-center gap-2 gap-md-3 text-muted small" style={{ fontSize: "0.75rem" }}>
                          <span>{vid.views || 0} views</span>
                          <span>&bull;</span>
                          <span>{vid.duration ? `${Math.floor(vid.duration / 60)}:${String(Math.floor(vid.duration % 60)).padStart(2, "0")}` : "0:00"}</span>
                        </div>
                      </div>

                      {/* Remove Button */}
                      {isPlaylistOwner && (
                        <button
                          onClick={() => handleRemoveVideoFromPlaylist(vid._id)}
                          className="btn btn-link text-danger border-0 p-1 p-md-2 shadow-none"
                          title="Remove from playlist"
                        >
                          <i className="bi bi-trash fs-5"></i>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* GENERAL GRID PLAYLISTS LISTING                                            */
        /* ========================================================================= */
        <div className="row g-4">
          <div className="col-12">
            {loading ? (
              <LoadingSpinner message="Fetching playlists..." />
            ) : error ? (
              <div className="alert alert-glass text-danger">{error}</div>
            ) : playlists.length === 0 ? (
              <div className="glass-panel border-secondary text-center p-5 text-muted">
                <i className="bi bi-collection-play fs-1 mb-2 d-block text-secondary"></i>
                <p className="mb-0">You don't have any playlists yet. Click the button to create one!</p>
              </div>
            ) : (
              <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                {playlists.map((pl) => (
                  <div className="col" key={pl._id}>
                    <div
                      onClick={() => handlePlaylistSelect(pl._id)}
                      className="glass-panel glass-panel-hover p-3 text-start position-relative d-flex flex-column h-100 cursor-pointer overflow-hidden border-secondary"
                      style={{ cursor: "pointer" }}
                    >
                      {/* Cover Image or Placeholder */}
                      <div className="hover-zoom-img mb-3 position-relative rounded overflow-hidden" style={{ aspectRatio: "16/9", backgroundColor: "var(--bg-tertiary)" }}>
                        {pl.coverThumbnail ? (
                          <img
                            src={pl.coverThumbnail}
                            alt={pl.name}
                            className="w-100 h-100"
                            style={{ objectFit: "cover" }}
                          />
                        ) : (
                          <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center text-muted">
                            <i className="bi bi-music-note-list fs-1 mb-2"></i>
                            <span className="small">Empty Playlist</span>
                          </div>
                        )}
                        <span
                          className="position-absolute bottom-0 end-0 m-2 px-2 py-1 small rounded text-white fw-bold d-flex align-items-center gap-1"
                          style={{ backgroundColor: "rgba(0, 0, 0, 0.75)" }}
                        >
                          <i className="bi bi-list-play"></i> {pl.totalVideos} videos
                        </span>
                      </div>

                      <h5 className="text-main fw-bold text-truncate mb-1">{pl.name}</h5>
                      <p className="text-muted small text-truncate mb-3">{pl.description}</p>

                      <div className="d-flex align-items-center justify-content-between mt-auto pt-2 border-top border-secondary">
                        <span className="small text-muted">{pl.totalViews || 0} views</span>
                        <div className="d-flex gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const url = `${window.location.origin}/playlists?id=${pl._id}`;
                              navigator.clipboard.writeText(url);
                              toast.success("Playlist link copied to clipboard!");
                            }}
                            className="btn btn-link p-0 text-gradient border-0 text-decoration-none small"
                            title="Share playlist"
                          >
                            <i className="bi bi-share"></i> Share
                          </button>
                          <button
                            onClick={(e) => handleDeletePlaylist(pl._id, e)}
                            className="btn btn-link p-0 text-danger border-0 text-decoration-none small"
                          >
                            <i className="bi bi-trash"></i> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Creation Modal (Bootstrap Backdrop styled custom model) */}
      {showCreateModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.8)", zIndex: 1100 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content glass-panel border-secondary p-4 text-start" style={{ background: "var(--bg-secondary)" }}>
              <div className="modal-header border-0 p-0 mb-3">
                <h5 className="modal-title fw-bold text-gradient">Create Playlist</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowCreateModal(false)}
                ></button>
              </div>

              <form onSubmit={handleCreatePlaylistSubmit}>
                <div className="modal-body p-0 mb-4">
                  <div className="mb-3">
                    <label className="form-label small text-muted fw-semibold">Playlist Name</label>
                    <input
                      type="text"
                      className="form-control form-control-glass"
                      placeholder="e.g. My Coding Tutorials"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small text-muted fw-semibold">Description (optional)</label>
                    <textarea
                      className="form-control form-control-glass"
                      rows="3"
                      placeholder="Give it a brief description..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>

                <div className="modal-footer border-0 p-0 d-flex gap-2 justify-content-end">
                  <button
                    type="button"
                    className="btn btn-glass px-4"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-gradient px-4"
                    disabled={createLoading}
                  >
                    {createLoading ? "Creating..." : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Video to Playlist Modal */}
      {showAddVideoModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.8)", zIndex: 1100 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content glass-panel border-secondary p-4 text-start" style={{ background: "var(--bg-secondary)", maxHeight: "90vh" }}>
              <div className="modal-header border-0 p-0 mb-3 d-flex align-items-center justify-content-between">
                <h5 className="modal-title fw-bold text-gradient d-flex align-items-center gap-2">
                  <i className="bi bi-plus-circle-fill text-pink"></i> Add Video to Playlist
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowAddVideoModal(false)}
                ></button>
              </div>

              {/* Search bar inside modal */}
              <div className="mb-3 position-relative">
                <div className="input-group">
                  <span className="input-group-text bg-dark bg-opacity-25 border-secondary text-muted">
                    {searchVideoLoading ? (
                      <span className="spinner-border spinner-border-sm text-pink" role="status" aria-hidden="true"></span>
                    ) : (
                      <i className="bi bi-search"></i>
                    )}
                  </span>
                  <input
                    type="text"
                    className="form-control form-control-glass border-start-0"
                    placeholder="Search videos by title..."
                    value={searchVideoQuery}
                    onChange={(e) => setSearchVideoQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Videos list */}
              <div className="modal-body p-0 overflow-y-auto" style={{ maxHeight: "400px" }}>
                {searchVideoLoading && searchVideoResults.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <div className="spinner-border text-pink mb-2" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="small mb-0">Searching platform videos...</p>
                  </div>
                ) : searchVideoResults.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <i className="bi bi-info-circle fs-2 d-block mb-2 text-secondary"></i>
                    <p className="small mb-0">No matching public videos found.</p>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {searchVideoResults.map((vid) => {
                      const isAlreadyAdded = selectedPlaylist.videos?.some(v => v._id === vid._id);
                      return (
                        <div
                          key={vid._id}
                          className="d-flex align-items-center gap-3 p-2 border border-secondary rounded bg-dark bg-opacity-10"
                        >
                          {/* Thumbnail */}
                          <div className="flex-shrink-0" style={{ width: "90px", aspectRatio: "16/9" }}>
                            <img
                              src={vid.thumbnail}
                              alt={vid.title}
                              className="w-100 h-100 rounded"
                              style={{ objectFit: "cover" }}
                            />
                          </div>

                          {/* Details */}
                          <div className="flex-grow-1 overflow-hidden">
                            <h6 className="text-main fw-semibold text-truncate mb-0" style={{ fontSize: "0.9rem" }} title={vid.title}>
                              {vid.title}
                            </h6>
                            <span className="text-muted small" style={{ fontSize: "0.75rem" }}>
                              by @{vid.owner?.username || "creator"} &bull; {vid.views || 0} views
                            </span>
                          </div>

                          {/* Action Button */}
                          <div className="flex-shrink-0">
                            {isAlreadyAdded ? (
                              <button className="btn btn-sm btn-glass text-muted border-secondary py-1.5 px-3 rounded-pill" disabled>
                                <i className="bi bi-check-circle-fill text-success me-1"></i> Added
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAddVideoToPlaylist(vid._id)}
                                className="btn btn-sm btn-gradient text-white py-1.5 px-3 rounded-pill"
                              >
                                <i className="bi bi-plus-lg me-1"></i> Add
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="modal-footer border-0 p-0 mt-3 d-flex justify-content-end">
                <button
                  type="button"
                  className="btn btn-glass px-4"
                  onClick={() => setShowAddVideoModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Playlists;
