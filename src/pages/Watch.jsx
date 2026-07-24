import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/client";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import LoadingSpinner from "../components/LoadingSpinner";

const Watch = () => {
  const { videoId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Comments State
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [commentsPage, setCommentsPage] = useState(1);
  const [commentsTotalPages, setCommentsTotalPages] = useState(1);

  // Video Action states
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState(0);

  // Playlist Saving state
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDesc, setNewPlaylistDesc] = useState("");
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);

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

  const handleSaveToPlaylistClick = () => {
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
        await apiClient.patch(`/playlists/${playlist._id}/addvideo/${videoId}`);
        toast.success(`Video added to ${playlist.name}`);
      } else {
        await apiClient.delete(`/playlists/${playlist._id}/removevideo/${videoId}`);
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

  const fetchVideoDetails = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get(`/videos/${videoId}`);
      if (response.data?.success) {
        const data = response.data.data;
        setVideo(data);
        setIsLiked(data.isLiked);
        setLikesCount(data.likesCount || 0);
        setIsSubscribed(data.owner?.isSubscribed);
        setSubscribersCount(data.owner?.subscribersCount || 0);
      } else {
        setError("Unable to find the requested video.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load video details.");
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (pageToFetch = 1) => {
    setCommentsLoading(true);
    try {
      const response = await apiClient.get(`/comment/videocomments/${videoId}`, {
        params: { page: pageToFetch, limit: 10 },
      });
      if (response.data?.success) {
        setComments(response.data.data.comments || []);
        setCommentsTotalPages(response.data.data.totalPages || 1);
        setCommentsPage(pageToFetch);
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
      setCommentsLoading(false);
    }
  };

  useEffect(() => {
    fetchVideoDetails();
    fetchComments(1);
  }, [videoId]);

  const handleLikeToggle = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    // Optimistic Update
    setIsLiked(!isLiked);
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));

    try {
      const response = await apiClient.patch(`/likes/videolike/${videoId}`);
      if (response.data?.success) {
        setIsLiked(response.data.data.isLiked);
      }
    } catch (err) {
      console.error("Like toggle failed:", err);
      // Revert on failure
      setIsLiked(isLiked);
      setLikesCount((prev) => (isLiked ? prev + 1 : prev - 1));
    }
  };

  const handleSubscriptionToggle = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (user._id === video?.owner?._id) return; // Can't sub to own channel

    // Optimistic Update
    setIsSubscribed(!isSubscribed);
    setSubscribersCount((prev) => (isSubscribed ? prev - 1 : prev + 1));

    try {
      const response = await apiClient.patch(`/subscription/subscriptions/${video.owner._id}`);
      if (response.data?.success) {
        setIsSubscribed(response.data.data.isSubscribed);
      }
    } catch (err) {
      console.error("Subscription toggle failed:", err);
      // Revert on failure
      setIsSubscribed(isSubscribed);
      setSubscribersCount((prev) => (isSubscribed ? prev + 1 : prev - 1));
    }
  };

  // Comments Handlers
  const handleAddCommentSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }
    if (!newCommentText.trim()) return;

    try {
      const response = await apiClient.post(`/comment/addcomment/${videoId}`, {
        content: newCommentText.trim(),
      });
      if (response.data?.success) {
        setNewCommentText("");
        // Reload comments feed
        fetchComments(1);
      }
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  const handleCommentDelete = (commentId) => {
    Swal.fire({
      title: "Delete Comment?",
      text: "Are you sure you want to delete this comment?",
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
          const response = await apiClient.delete(`/comment/deletecomment/${commentId}`);
          if (response.data?.success) {
            setComments((prev) => prev.filter((c) => c._id !== commentId));
            toast.success("Comment deleted successfully");
          }
        } catch (err) {
          toast.error(err.response?.data?.message || "Failed to delete comment.");
        }
      }
    });
  };

  const handleCommentLikeToggle = async (commentId, index) => {
    if (!user) {
      navigate("/login");
      return;
    }
    const comment = comments[index];
    const currentIsLiked = comment.isLiked;
    
    // Optimistic state edit
    const updatedComments = [...comments];
    updatedComments[index] = {
      ...comment,
      isLiked: !currentIsLiked,
      likesCount: currentIsLiked ? comment.likesCount - 1 : comment.likesCount + 1
    };
    setComments(updatedComments);

    try {
      await apiClient.patch(`/likes/commentlike/${commentId}`);
    } catch (err) {
      console.error("Comment like failed:", err);
      // Revert state
      const revertedComments = [...comments];
      revertedComments[index] = comment;
      setComments(revertedComments);
    }
  };

  if (loading) return <LoadingSpinner message="Buffering video player..." />;

  if (error || !video) {
    return (
      <div className="container py-5 d-flex align-items-center justify-content-center" style={{ minHeight: "70vh" }}>
        <div 
          className="glass-panel border-secondary p-5 mx-auto text-center shadow-lg position-relative" 
          style={{ maxWidth: "480px", borderRadius: "20px", background: "var(--bg-secondary)" }}
        >
          <i className="bi bi-camera-video-off text-pink fs-1 mb-3 d-block"></i>
          <h4 className="fw-bold text-main mb-2">Video Unavailable</h4>
          <p className="text-muted small mb-4">This video is no longer available. It may have been deleted or removed by the creator.</p>
          <Link to="/" className="btn btn-gradient px-4 py-2.5 rounded-pill text-white fw-bold shadow-sm d-inline-flex align-items-center gap-2">
            <i className="bi bi-house"></i>
            <span>Back to Home Feed</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      <div className="row g-4">
        {/* Left Column: Player & Meta */}
        <div className="col-lg-8">
          {/* HTML5 Video Player */}
          <div className="glass-panel overflow-hidden border-secondary mb-4 position-relative shadow" style={{ backgroundColor: "#000" }}>
            <video
              src={video.videoFile}
              poster={video.thumbnail}
              controls
              className="w-100"
              style={{ maxHeight: "500px", objectFit: "contain" }}
              autoPlay
            />
          </div>

          {/* Title */}
          <h3 className="fw-bold mb-2 text-start">{video.title}</h3>

          {/* Stats & Actions Row */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 border-bottom border-secondary pb-3 mb-4">
            <div className="text-muted small text-start">
              <span>{video.views || 0} views</span>
              <span className="mx-2">•</span>
              <span>Published on {new Date(video.createdAt).toLocaleDateString()}</span>
            </div>

            {/* Actions: Likes */}
            <div className="d-flex align-items-center gap-2">
              <button
                onClick={handleLikeToggle}
                className={`btn d-flex align-items-center gap-2 px-4 py-2 rounded-pill fw-semibold border transition-all ${
                  isLiked
                    ? "btn-gradient text-white border-transparent"
                    : "btn-glass border-secondary text-muted"
                }`}
              >
                <i className={`bi ${isLiked ? "bi-heart-fill text-danger" : "bi-heart"}`}></i>
                <span>{likesCount}</span>
              </button>

              <button
                onClick={handleSaveToPlaylistClick}
                className="btn btn-glass border-secondary text-muted d-flex align-items-center gap-2 px-4 py-2 rounded-pill fw-semibold transition-all"
                title="Save to Playlist"
              >
                <i className="bi bi-plus-square"></i>
                <span>Save</span>
              </button>

              {user && user._id === video?.owner?._id && (
                <Link to={`/dashboard`} className="btn btn-glass border-secondary text-muted rounded-pill px-3 py-2 fw-semibold d-flex align-items-center gap-2">
                  <i className="bi bi-pencil-square"></i>
                  <span>Edit Video</span>
                </Link>
              )}
            </div>
          </div>

          {/* Creator Profile Card */}
          <div className="glass-panel border-secondary p-3 mb-4 d-flex flex-wrap align-items-center justify-content-between gap-3 text-start">
            <div className="d-flex align-items-center gap-3">
              <Link to={`/c/${video.owner?.username}`}>
                <img
                  src={video.owner?.avatar}
                  alt={video.owner?.username}
                  className="rounded-circle border border-2 border-secondary"
                  style={{ width: "50px", height: "50px", objectFit: "cover" }}
                />
              </Link>
              <div>
                <Link to={`/c/${video.owner?.username}`} className="text-main text-decoration-none fw-bold h6 mb-1 d-block">
                  {video.owner?.fullName}
                </Link>
                <span className="small text-muted">@{video.owner?.username} • {subscribersCount} subscribers</span>
              </div>
            </div>

            {/* Subscribe Button */}
            {user?._id !== video.owner?._id && (
              <button
                onClick={handleSubscriptionToggle}
                className={`btn px-4 py-2 rounded-pill fw-bold transition-all ${
                  isSubscribed 
                    ? "btn-glass text-muted border-secondary" 
                    : "btn-gradient text-white"
                }`}
              >
                {isSubscribed ? "Subscribed" : "Subscribe"}
              </button>
            )}
          </div>

          {/* Description Box */}
          <div className="glass-panel border-secondary p-4 text-start" style={{ backgroundColor: "var(--bg-secondary)" }}>
            <h6 className="fw-bold mb-2">Description</h6>
            <p style={{ whiteSpace: "pre-line", color: "var(--text-muted)", fontSize: "0.95rem" }}>
              {video.description || "No description provided for this video."}
            </p>
          </div>
        </div>

        {/* Right Column: Comments Drawer */}
        <div className="col-lg-4">
          <div className="glass-panel border-secondary p-4 h-100 d-flex flex-column" style={{ minHeight: "500px" }}>
            <h5 className="fw-bold mb-3 text-start d-flex align-items-center gap-2">
              <i className="bi bi-chat-dots-fill text-gradient"></i>
              Comments ({comments.length})
            </h5>

            {/* Add Comment Input */}
            {user ? (
              <form onSubmit={handleAddCommentSubmit} className="mb-4">
                <div className="d-flex gap-2">
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="rounded-circle border"
                    style={{ width: "36px", height: "36px", objectFit: "cover" }}
                  />
                  <div className="flex-grow-1">
                    <textarea
                      rows="2"
                      className="form-control form-control-glass w-100 mb-2"
                      placeholder="Add a public comment..."
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      required
                    />
                    <div className="text-end">
                      <button type="submit" className="btn btn-gradient btn-sm px-3 py-1">
                        Comment
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <div className="glass-panel border-secondary p-3 text-center mb-4 small text-muted">
                Please <Link to="/login" className="fw-bold text-decoration-none text-gradient">log in</Link> to share comments.
              </div>
            )}

            {/* Comments List */}
            {commentsLoading && comments.length === 0 ? (
              <LoadingSpinner message="Loading comments..." />
            ) : comments.length === 0 ? (
              <div className="my-auto text-center text-muted py-5">
                <i className="bi bi-chat-left-dots fs-1 mb-2 d-block text-secondary"></i>
                <span className="small">No comments yet. Be the first to start the conversation!</span>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3 overflow-y-auto pr-1 flex-grow-1" style={{ maxHeight: "600px" }}>
                {comments.map((comment, index) => (
                  <div key={comment._id} className="d-flex gap-2 pb-3 border-bottom border-secondary text-start align-items-start">
                    {comment.owner?.hasChannel ? (
                      <Link to={`/c/${comment.owner?.username}`}>
                        <img
                          src={comment.owner?.avatar}
                          alt={comment.owner?.username}
                          className="rounded-circle border"
                          style={{ width: "32px", height: "32px", objectFit: "cover" }}
                        />
                      </Link>
                    ) : (
                      <img
                        src={comment.owner?.avatar}
                        alt={comment.owner?.username}
                        className="rounded-circle border"
                        style={{ width: "32px", height: "32px", objectFit: "cover", filter: "grayscale(100%)" }}
                      />
                    )}

                    <div className="flex-grow-1 overflow-hidden">
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        {comment.owner?.hasChannel ? (
                          <Link to={`/c/${comment.owner?.username}`} className="text-main small text-decoration-none fw-bold">
                            @{comment.owner?.username}
                          </Link>
                        ) : (
                          <span className="text-muted small fw-bold">
                            @{comment.owner?.username}
                          </span>
                        )}
                        <span className="small text-muted" style={{ fontSize: "0.75rem" }}>
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-muted small mb-2" style={{ wordBreak: "break-word" }}>
                        {comment.content}
                      </p>

                      {/* Comment Actions: Likes & Delete */}
                      <div className="d-flex align-items-center gap-3">
                        <button
                          onClick={() => handleCommentLikeToggle(comment._id, index)}
                          className="btn btn-link p-0 border-0 text-decoration-none d-flex align-items-center gap-1 text-muted"
                          style={{ fontSize: "0.8rem" }}
                        >
                          <i className={`bi ${comment.isLiked ? "bi-hand-thumbs-up-fill text-cyan" : "bi-hand-thumbs-up"}`}></i>
                          <span>{comment.likesCount || 0}</span>
                        </button>

                        {user && user._id === comment.owner?._id && (
                          <button
                            onClick={() => handleCommentDelete(comment._id)}
                            className="btn btn-link p-0 border-0 text-danger text-decoration-none ms-auto"
                            style={{ fontSize: "0.8rem" }}
                          >
                            <i className="bi bi-trash"></i> Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Comments Pagination */}
                {commentsTotalPages > 1 && (
                  <div className="d-flex align-items-center justify-content-center gap-2 mt-3 pt-2">
                    <button
                      className="btn btn-glass btn-sm px-3 py-1"
                      onClick={() => fetchComments(commentsPage - 1)}
                      disabled={commentsPage === 1}
                    >
                      Prev
                    </button>
                    <span className="small text-muted">
                      {commentsPage} / {commentsTotalPages}
                    </span>
                    <button
                      className="btn btn-glass btn-sm px-3 py-1"
                      onClick={() => fetchComments(commentsPage + 1)}
                      disabled={commentsPage === commentsTotalPages}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
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
          >
            <div
              className="glass-panel border-secondary p-4 w-100 text-main text-start shadow-lg"
              style={{ maxWidth: "400px", borderRadius: "20px", background: "var(--bg-secondary)" }}
            >
              <div className="d-flex align-items-center justify-content-between mb-3 border-bottom border-secondary pb-2">
                <h5 className="fw-bold mb-0 text-gradient">Save to...</h5>
                <button
                  type="button"
                  onClick={() => setShowPlaylistModal(false)}
                  className="btn-close"
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
                    const hasVideo = pl.videos?.some((v) => v._id === videoId);
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
                      >
                        <span className="fw-semibold text-main small">{pl.name}</span>
                        <input
                          className="form-check-input border-secondary accent-pink"
                          type="checkbox"
                          checked={hasVideo}
                          onChange={(e) => handleCheckboxChange(pl, e.target.checked)}
                          style={{ cursor: "pointer", width: "18px", height: "18px" }}
                        />
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Quick Playlist Creation form */}
              <form onSubmit={handleCreatePlaylistInModal} className="border-top border-secondary pt-3 mt-3">
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

export default Watch;
