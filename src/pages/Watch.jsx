import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/client";
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

  const handleCommentDelete = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      const response = await apiClient.delete(`/comment/deletecomment/${commentId}`);
      if (response.data?.success) {
        setComments((prev) => prev.filter((c) => c._id !== commentId));
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
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
      <div className="container py-5 text-center">
        <div className="glass-panel border-danger p-5 mx-auto" style={{ maxWidth: "500px" }}>
          <i className="bi bi-exclamation-octagon text-danger fs-1 mb-3"></i>
          <h4 className="fw-bold">Video Unavailable</h4>
          <p className="text-muted small mb-4">{error || "This video could not be loaded."}</p>
          <Link to="/" className="btn btn-gradient px-4 py-2">
            Back to Home Feed
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
                    <Link to={`/c/${comment.owner?.username}`}>
                      <img
                        src={comment.owner?.avatar}
                        alt={comment.owner?.username}
                        className="rounded-circle border"
                        style={{ width: "32px", height: "32px", objectFit: "cover" }}
                      />
                    </Link>

                    <div className="flex-grow-1 overflow-hidden">
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <Link to={`/c/${comment.owner?.username}`} className="text-main small text-decoration-none fw-bold">
                          @{comment.owner?.username}
                        </Link>
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
    </div>
  );
};

export default Watch;
