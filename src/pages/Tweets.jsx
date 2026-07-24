import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import apiClient from "../api/client";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import LoadingSpinner from "../components/LoadingSpinner";

const Tweets = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Feed & Pagination State
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Composer Input State
  const [newTweetText, setNewTweetText] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Inline editing state
  const [editingTweetId, setEditingTweetId] = useState(null);
  const [editingText, setEditingText] = useState("");

  // Composer Card focus border state
  const [isComposerFocused, setIsComposerFocused] = useState(false);

  // Share clipboard success tracking
  const [copiedTweetId, setCopiedTweetId] = useState(null);
  const [tweetAlert, setTweetAlert] = useState("");

  // Bookmark & Repost tracking simulation
  const [bookmarkedTweets, setBookmarkedTweets] = useState(new Set());
  const [repostedTweets, setRepostedTweets] = useState(new Set());

  // Emojis list
  const emojis = ["😀", "😂", "😍", "👍", "🔥", "🚀", "🎉", "💻", "⚡️", "❤️", "🤔", "👏"];

  const fetchTweets = async (pageNum = 1) => {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get(`/tweet/alltweets?page=${pageNum}&limit=6`);
      if (response.data?.success) {
        setTweets(response.data.data.tweets || []);
        setTotalPages(response.data.data.pagination.totalPages || 1);
      } else {
        setError("Failed to retrieve tweets.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Could not connect to the database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTweets(page);
  }, [page]);

  useEffect(() => {
    if (!loading && tweets.length > 0 && window.location.hash) {
      const tweetId = window.location.hash.replace("#tweet-", "");
      if (tweetId) {
        const hasTweet = tweets.some((t) => t._id === tweetId);
        if (hasTweet) {
          const timer = setTimeout(() => {
            const element = document.getElementById(`tweet-${tweetId}`);
            if (element) {
              element.scrollIntoView({ behavior: "smooth", block: "center" });
              element.style.transition = "all 0.6s ease";
              element.style.borderColor = "var(--accent-pink)";
              element.style.boxShadow = "0 0 20px rgba(236, 72, 153, 0.5)";
              setTimeout(() => {
                element.style.borderColor = "var(--border-secondary)";
                element.style.boxShadow = "none";
              }, 3000);
            }
          }, 300);
          return () => clearTimeout(timer);
        } else {
          setTweetAlert("This tweet is no longer available. It may have been deleted by the creator.");
          // Clear hash to prevent infinite check triggers
          window.history.replaceState(null, null, " ");
        }
      }
    }
  }, [loading, tweets]);

  const handlePostTweetSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate("/login", { state: { message: "Please log in to post tweets!" } });
      return;
    }
    if (!newTweetText.trim()) return;
    if (newTweetText.trim().length > 280) {
      toast.error("Tweet text must be less than 280 characters.");
      return;
    }

    setSubmitLoading(true);
    try {
      let response;
      if (imageFile) {
        const formData = new FormData();
        formData.append("content", newTweetText.trim());
        formData.append("image", imageFile);

        response = await apiClient.post("/tweet/create-tweet", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        response = await apiClient.post("/tweet/create-tweet", {
          content: newTweetText.trim(),
        });
      }

      if (response.data?.success) {
        setNewTweetText("");
        setAttachedImage(null);
        setImageFile(null);
        setShowEmojiPicker(false);
        toast.success("Tweet posted successfully");
        // Prepend new tweet
        const newTweet = {
          ...response.data.data,
          owner: {
            _id: user._id,
            username: user.username,
            avatar: user.avatar,
            fullName: user.fullName
          }
        };
        setTweets((prev) => [newTweet, ...prev]);
        setPage(1); // Go to first page to see the new tweet
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error posting tweet");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleTweetDelete = (tweetId) => {
    if (!user) return;
    Swal.fire({
      title: "Delete Tweet?",
      text: "Are you sure you want to permanently delete this tweet?",
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
          const response = await apiClient.delete(`/tweet/delete-tweet/${tweetId}`);
          if (response.data?.success) {
            setTweets((prev) => prev.filter((t) => t._id !== tweetId));
            toast.success("Tweet deleted successfully");
            // Refetch to fill page if empty
            if (tweets.length <= 1 && page > 1) {
              setPage((p) => p - 1);
            } else {
              fetchTweets(page);
            }
          }
        } catch (err) {
          toast.error(err.response?.data?.message || "Error deleting tweet");
        }
      }
    });
  };

  const handleTweetLikeToggle = async (tweetId, index) => {
    if (!user) {
      navigate("/login", { state: { message: "Please log in to like tweets!" } });
      return;
    }
    const tweet = tweets[index];
    const currentIsLiked = tweet.isLiked;

    const updatedTweets = [...tweets];
    updatedTweets[index] = {
      ...tweet,
      isLiked: !currentIsLiked,
      likesCount: currentIsLiked ? tweet.likesCount - 1 : tweet.likesCount + 1,
    };
    setTweets(updatedTweets);

    try {
      await apiClient.patch(`/likes/tweetlike/${tweetId}`);
    } catch (err) {
      console.error("Tweet like toggle failed:", err);
      const revertedTweets = [...tweets];
      revertedTweets[index] = tweet;
      setTweets(revertedTweets);
    }
  };

  const handleBookmarkToggle = async (tweetId, index) => {
    if (!user) {
      navigate("/login", { state: { message: "Please log in to bookmark tweets!" } });
      return;
    }

    const tweet = tweets[index];
    const previousStatus = tweet.isBookmarked;

    // Optimistic UI update
    const updatedTweets = [...tweets];
    updatedTweets[index] = {
      ...tweet,
      isBookmarked: !previousStatus
    };
    setTweets(updatedTweets);

    try {
      const response = await apiClient.post(`/bookmarks/toggle/${tweetId}`);
      if (response.data?.success) {
        const syncedTweets = [...tweets];
        syncedTweets[index] = {
          ...tweet,
          isBookmarked: response.data.data.bookmarked
        };
        setTweets(syncedTweets);
      }
    } catch (err) {
      console.error("Bookmark toggle failed:", err);
      // Revert on failure
      const revertedTweets = [...tweets];
      revertedTweets[index] = tweet;
      setTweets(revertedTweets);
    }
  };

  const handleRepostToggle = (tweetId) => {
    if (!user) {
      navigate("/login", { state: { message: "Please log in to repost!" } });
      return;
    }
    setRepostedTweets((prev) => {
      const next = new Set(prev);
      if (next.has(tweetId)) {
        next.delete(tweetId);
      } else {
        next.add(tweetId);
      }
      return next;
    });
  };

  const startEditing = (tweet) => {
    setEditingTweetId(tweet._id);
    setEditingText(tweet.content);
  };

  const cancelEditing = () => {
    setEditingTweetId(null);
    setEditingText("");
  };

  const handleUpdateTweetSubmit = async (e, tweetId) => {
    e.preventDefault();
    if (!editingText.trim()) return;
    if (editingText.trim().length > 280) {
      toast.error("Tweet text must be less than 280 characters.");
      return;
    }

    try {
      const response = await apiClient.patch(`/tweet/update-tweet/${tweetId}`, {
        content: editingText.trim(),
      });
      if (response.data?.success) {
        setTweets((prev) =>
          prev.map((t) =>
            t._id === tweetId 
              ? { 
                  ...t, 
                  content: response.data.data.content,
                  updatedAt: new Date().toISOString()
                } 
              : t
          )
        );
        toast.success("Tweet updated successfully");
        cancelEditing();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error updating tweet");
    }
  };

  const handleCopyLink = (tweetId) => {
    const url = `${window.location.origin}/tweets#tweet-${tweetId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedTweetId(tweetId);
      setTimeout(() => setCopiedTweetId(null), 2000);
    });
  };

  const handleProfileClick = (e, username) => {
    e.preventDefault();
    if (!user) {
      navigate("/login", { state: { message: "Please log in to view creator channels!" } });
    } else if (username) {
      navigate(`/c/${username}`);
    }
  };

  // Image Selection Handlers
  const handleImageIconClick = () => {
    if (!user) {
      navigate("/login", { state: { message: "Please log in to draft tweets!" } });
      return;
    }
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setAttachedImage(URL.createObjectURL(file));
    }
  };

  const handleRemoveAttachedImage = () => {
    setAttachedImage(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Emoji selection handler
  const handleEmojiSelect = (emoji) => {
    setNewTweetText((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Circular progress variables
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (newTweetText.length / 280) * circumference;

  return (
    <div className="container py-4">
      <div className="row g-4 justify-content-center">
        {/* Main Feed Column */}
        <div className="col-lg-8" style={{ maxWidth: "660px" }}>
          
          {/* Header */}
          <div className="d-flex align-items-center justify-content-between mb-4 border-bottom border-secondary pb-3 text-start">
            <div>
              <h3 className="fw-extrabold text-gradient mb-1">Community Feed</h3>
              <p className="small text-muted mb-0">Join the discussion with creators and playlisters around the globe.</p>
            </div>
            <i className="bi bi-patch-check-fill fs-3 text-gradient"></i>
          </div>

          {tweetAlert && (
            <div 
              className="glass-panel border-secondary py-3 px-4 rounded-3 shadow d-flex align-items-center justify-content-between mb-4 text-start animate-fade-in"
              style={{ background: "var(--bg-secondary)", borderLeft: "4px solid var(--accent-cyan) !important" }}
            >
              <div className="d-flex align-items-center gap-3">
                <i className="bi bi-exclamation-triangle-fill text-pink fs-5"></i>
                <div>
                  <h6 className="fw-bold text-main mb-0.5" style={{ fontSize: "0.9rem" }}>Tweet Unavailable</h6>
                  <p className="text-muted small mb-0">{tweetAlert}</p>
                </div>
              </div>
              <button 
                onClick={() => setTweetAlert("")} 
                className="btn-close ms-3 small"
                aria-label="Close"
              ></button>
            </div>
          )}

          {/* Composer Box (Logged In) / Invitation (Logged Out) */}
          {!user ? (
            <div className="glass-panel border-secondary p-4 mb-4 text-center text-muted position-relative overflow-hidden">
              <div 
                className="position-absolute rounded-circle opacity-10"
                style={{ width: "120px", height: "120px", background: "var(--accent-purple)", top: "-40px", right: "-40px", filter: "blur(30px)" }}
              ></div>
              <i className="bi bi-chat-heart-fill fs-2 mb-2 d-block text-gradient"></i>
              <p className="mb-2 fw-bold text-main" style={{ fontSize: "1.1rem" }}>Join the Conversation</p>
              <p className="small mb-3 text-muted" style={{ maxWidth: "400px", margin: "0 auto" }}>
                Post updates, share code snippets, ask questions, or link your favorite videos.
              </p>
              <Link to="/login" className="btn btn-gradient btn-sm px-4 py-2 mt-1">Log In to Post</Link>
            </div>
          ) : (
            <div 
              className={`glass-panel p-4 mb-4 text-start transition-all ${
                isComposerFocused ? "border-primary shadow" : "border-secondary"
              }`}
              style={{ border: "1px solid var(--glass-border)" }}
            >
              <form onSubmit={handlePostTweetSubmit}>
                <div className="d-flex gap-3">
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="rounded-circle border"
                    style={{ width: "48px", height: "48px", objectFit: "cover" }}
                  />
                  <div className="flex-grow-1 position-relative">
                    {/* Borderless Textarea */}
                    <textarea
                      className="form-control border-0 bg-transparent p-0 mb-2 fs-5 text-main"
                      rows="3"
                      placeholder="What is on your mind today?"
                      maxLength="280"
                      value={newTweetText}
                      onChange={(e) => setNewTweetText(e.target.value)}
                      onFocus={() => setIsComposerFocused(true)}
                      onBlur={() => setIsComposerFocused(false)}
                      style={{ resize: "none", boxShadow: "none", outline: "none" }}
                      required
                    />

                    {/* Image Attachment Preview */}
                    {attachedImage && (
                      <div className="position-relative mb-3 d-inline-block rounded border overflow-hidden" style={{ maxWidth: "200px" }}>
                        <img src={attachedImage} alt="Attached" className="img-fluid" style={{ maxHeight: "150px" }} />
                        <button
                          type="button"
                          onClick={handleRemoveAttachedImage}
                          className="btn btn-dark btn-sm rounded-circle p-1 d-flex align-items-center justify-content-center position-absolute m-2"
                          style={{ top: 0, right: 0, width: "24px", height: "24px", opacity: 0.8 }}
                          title="Remove image"
                        >
                          <i className="bi bi-x fs-5"></i>
                        </button>
                      </div>
                    )}
                    
                    <div className="d-flex align-items-center justify-content-between mt-2 border-top border-secondary pt-3">
                      {/* Interactive Composer Tools */}
                      <div className="d-flex gap-3 align-items-center position-relative">
                        {/* Hidden file input */}
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageFileChange}
                          accept="image/*"
                          style={{ display: "none" }}
                        />
                        <i 
                          className="bi bi-image cursor-pointer fs-5 text-gradient" 
                          onClick={handleImageIconClick}
                          title="Attach image (preview)"
                        ></i>
                        
                        <div className="position-relative">
                          <i 
                            className="bi bi-emoji-smile cursor-pointer fs-5 text-gradient" 
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            title="Add emoji"
                          ></i>
                          
                          {/* Floating Emoji Selector */}
                          {showEmojiPicker && (
                            <div 
                              className="glass-panel border-secondary p-2 position-absolute d-flex flex-wrap gap-2 shadow mt-2"
                              style={{ width: "190px", zIndex: 100, backgroundColor: "var(--bg-secondary)" }}
                            >
                              {emojis.map((emoji) => (
                                <span 
                                  key={emoji}
                                  onClick={() => handleEmojiSelect(emoji)}
                                  className="fs-5 cursor-pointer p-1 rounded hover-zoom-img"
                                  style={{ userSelect: "none" }}
                                >
                                  {emoji}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="d-flex align-items-center gap-3">
                        {/* Circular Character Counter Progress */}
                        {newTweetText.length > 0 && (
                          <svg width="24" height="24" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r={radius} fill="none" stroke="var(--bg-tertiary)" strokeWidth="2.5" />
                            <circle
                              cx="12"
                              cy="12"
                              r={radius}
                              fill="none"
                              stroke={newTweetText.length >= 260 ? "var(--bs-danger)" : "var(--accent-purple)"}
                              strokeWidth="2.5"
                              strokeDasharray={circumference}
                              strokeDashoffset={progressOffset}
                              transform="rotate(-90 12 12)"
                              style={{ transition: "stroke-dashoffset 0.1s linear" }}
                            />
                          </svg>
                        )}
                        
                        <button
                          type="submit"
                          className="btn btn-gradient px-4 py-2 shadow-sm rounded-pill btn-sm"
                          disabled={submitLoading || !newTweetText.trim()}
                        >
                          {submitLoading ? (
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          ) : (
                            <>Post <i className="bi bi-send ms-1"></i></>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Tweets Feed */}
          {loading ? (
            <LoadingSpinner message="Loading community posts..." />
          ) : error ? (
            <div className="alert alert-glass border-danger text-danger text-center p-4">
              {error}
            </div>
          ) : tweets.length === 0 ? (
            <div className="glass-panel border-secondary text-center p-5 text-muted">
              <i className="bi bi-chat-left-quote fs-1 mb-2 d-block text-secondary"></i>
              <p className="mb-0">No community updates have been posted yet on this page.</p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {tweets.map((tweet, index) => {
                const isOwnTweet = user && tweet.owner?._id === user._id;
                return (
                  <div key={tweet._id} className="glass-panel border-secondary p-4 text-start shadow-sm animate-fade-in" id={`tweet-${tweet._id}`}>
                    {editingTweetId === tweet._id ? (
                      // Edit Tweet Mode
                      <form onSubmit={(e) => handleUpdateTweetSubmit(e, tweet._id)}>
                        <textarea
                          className="form-control form-control-glass mb-3 text-main"
                          rows="3"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          maxLength="280"
                          required
                        />
                        <div className="d-flex align-items-center justify-content-between">
                          <span className="small text-muted">{editingText.length} / 280</span>
                          <div className="d-flex gap-2">
                            <button type="button" className="btn btn-glass btn-sm px-3" onClick={cancelEditing}>
                              Cancel
                            </button>
                            <button type="submit" className="btn btn-gradient btn-sm px-3">
                              Save Changes
                            </button>
                          </div>
                        </div>
                      </form>
                    ) : (
                      // Render Tweet Mode
                      <>
                        {/* Tweet Header */}
                        <div className="d-flex align-items-start justify-content-between mb-3">
                          <div 
                            onClick={(e) => handleProfileClick(e, tweet.owner?.username)}
                            className="d-flex align-items-center gap-3 cursor-pointer"
                            style={{ cursor: "pointer" }}
                          >
                            <img
                              src={tweet.owner?.avatar || "https://res.cloudinary.com/dqmufo7lj/image/upload/v1721021469/avatar_placeholder.png"}
                              alt="Avatar"
                              className="rounded-circle border"
                              style={{ width: "42px", height: "42px", objectFit: "cover" }}
                            />
                            <div>
                              <div className="d-flex align-items-center gap-1">
                                <span className="text-main fw-bold d-block mb-0" style={{ fontSize: "1rem" }}>
                                  {tweet.owner?.fullName || "Community Member"}
                                </span>
                                <i className="bi bi-patch-check-fill text-gradient small"></i>
                              </div>
                              <span className="small text-muted" style={{ fontSize: "0.85rem" }}>
                                @{tweet.owner?.username || "user"}
                              </span>
                            </div>
                          </div>

                          <div className="d-flex align-items-center gap-2">
                            <span className="small text-muted" style={{ fontSize: "0.75rem" }}>
                              {new Date(tweet.createdAt).toLocaleDateString()}
                              {tweet.updatedAt !== tweet.createdAt && (
                                <span className="text-muted ms-2 small fw-semibold font-italic">(Edited)</span>
                              )}
                            </span>

                            {/* Options Dropdown menu */}
                            {isOwnTweet && (
                              <div className="dropdown">
                                <button
                                  className="btn btn-link text-muted p-1 border-0"
                                  type="button"
                                  data-bs-toggle="dropdown"
                                  aria-expanded="false"
                                  title="Tweet Options"
                                >
                                  <i className="bi bi-three-dots-vertical fs-5"></i>
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end glass-panel border-secondary p-1 shadow-sm mt-1">
                                  <li>
                                    <button 
                                      className="dropdown-item rounded py-2 d-flex align-items-center gap-2"
                                      onClick={() => startEditing(tweet)}
                                    >
                                      <i className="bi bi-pencil small text-muted"></i> Edit Post
                                    </button>
                                  </li>
                                  <li>
                                    <button 
                                      className="dropdown-item rounded py-2 text-danger d-flex align-items-center gap-2"
                                      onClick={() => handleTweetDelete(tweet._id)}
                                    >
                                      <i className="bi bi-trash small text-danger"></i> Delete Post
                                    </button>
                                  </li>
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Tweet Content */}
                        <p className="text-main mb-3 fs-5" style={{ whiteSpace: "pre-line", wordBreak: "break-word", lineHeight: "1.5" }}>
                          {tweet.content}
                        </p>

                        {/* Tweet Image if present */}
                        {tweet.image && (
                          <div 
                            className="mb-3 rounded border border-secondary overflow-hidden bg-dark bg-opacity-25 shadow-sm d-inline-block" 
                            style={{ maxWidth: "100%" }}
                          >
                            <img 
                              src={tweet.image} 
                              alt="Tweet Media" 
                              style={{ 
                                display: "block",
                                maxWidth: "100%", 
                                maxHeight: "420px", 
                                objectFit: "contain" 
                              }} 
                            />
                          </div>
                        )}

                        {/* Tweet Action Icons */}
                        <div className="d-flex align-items-center justify-content-between pt-3 border-top border-secondary text-muted">
                          {/* Likes Action */}
                          <button
                            onClick={() => handleTweetLikeToggle(tweet._id, index)}
                            className={`btn btn-link p-1 border-0 text-decoration-none d-flex align-items-center gap-2 transition-all ${
                              tweet.isLiked ? "text-danger" : "text-muted"
                            }`}
                            style={{ fontSize: "0.95rem" }}
                            title={tweet.isLiked ? "Unlike Post" : "Like Post"}
                          >
                            <i className={`bi fs-5 ${tweet.isLiked ? "bi-heart-fill text-danger" : "bi-heart"}`}></i>
                            <span className="small fw-bold">{tweet.likesCount || 0}</span>
                          </button>

                          {/* Repost Simulator (Disabled/Hidden for Own Tweets) */}
                          {!isOwnTweet ? (
                            <button
                              onClick={() => handleRepostToggle(tweet._id)}
                              className={`btn btn-link p-1 border-0 text-decoration-none d-flex align-items-center gap-2 transition-all ${
                                repostedTweets.has(tweet._id) ? "text-success" : "text-muted"
                              }`}
                              style={{ fontSize: "0.95rem" }}
                              title="Repost"
                            >
                              <i className="bi bi-repeat fs-5"></i>
                              <span className="small fw-bold">{repostedTweets.has(tweet._id) ? 1 : 0}</span>
                            </button>
                          ) : (
                            <button
                              className="btn btn-link p-1 border-0 text-muted-custom opacity-50 text-decoration-none d-flex align-items-center gap-2 cursor-not-allowed"
                              style={{ fontSize: "0.95rem", cursor: "not-allowed" }}
                              disabled
                              title="You cannot reshare your own tweet"
                            >
                              <i className="bi bi-repeat fs-5"></i>
                              <span className="small fw-bold">0</span>
                            </button>
                          )}

                          {/* Bookmark Action */}
                          {!isOwnTweet ? (
                            <button
                              onClick={() => handleBookmarkToggle(tweet._id, index)}
                              className={`btn btn-link p-1 border-0 text-decoration-none d-flex align-items-center transition-all ${
                                tweet.isBookmarked ? "text-warning" : "text-muted"
                              }`}
                              title={tweet.isBookmarked ? "Bookmarked" : "Bookmark"}
                            >
                              <i className={`bi fs-5 ${tweet.isBookmarked ? "bi-bookmark-fill" : "bi-bookmark"}`}></i>
                            </button>
                          ) : (
                            <button
                              className="btn btn-link p-1 border-0 text-muted-custom opacity-50 text-decoration-none d-flex align-items-center cursor-not-allowed"
                              disabled
                              style={{ cursor: "not-allowed" }}
                              title="You cannot save your own tweet"
                            >
                              <i className="bi bi-bookmark fs-5"></i>
                            </button>
                          )}

                          {/* Copy Link / Share Action */}
                          <button
                            onClick={() => handleCopyLink(tweet._id)}
                            className="btn btn-link p-1 border-0 text-muted text-decoration-none d-flex align-items-center gap-1 transition-all"
                            title="Copy Link to Post"
                          >
                            {copiedTweetId === tweet._id ? (
                              <>
                                <i className="bi bi-check2 text-success fs-5"></i>
                                <span className="small text-success fw-bold" style={{ fontSize: "0.75rem" }}>Copied!</span>
                              </>
                            ) : (
                              <i className="bi bi-share fs-5"></i>
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {!loading && totalPages > 1 && (
            <div className="d-flex align-items-center justify-content-center gap-3 mt-4">
              <button
                className="btn btn-glass px-3 py-1 btn-sm"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
              >
                <i className="bi bi-chevron-left"></i> Prev
              </button>
              <span className="small text-muted fw-bold">
                Page {page} of {totalPages}
              </span>
              <button
                className="btn btn-glass px-3 py-1 btn-sm"
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
              >
                Next <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          )}

        </div>

        {/* Right Sidebar Column */}
        <div className="col-lg-4 d-none d-lg-block text-start" style={{ maxWidth: "340px" }}>
          
          {/* Trendings Sidebar */}
          <div className="glass-panel border-secondary p-4 mb-4 sticky-top" style={{ top: "100px" }}>
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-fire text-gradient"></i> Trending Topics
            </h5>
            <div className="d-flex flex-column gap-3">
              <div>
                <span className="small text-muted d-block">Trending in Technology</span>
                <span className="fw-bold text-main hover-zoom-img cursor-pointer">#vetwoplay</span>
                <span className="small text-muted d-block" style={{ fontSize: "0.75rem" }}>12.4K posts</span>
              </div>
              <div>
                <span className="small text-muted d-block">Trending in Development</span>
                <span className="fw-bold text-main cursor-pointer">#reactjs</span>
                <span className="small text-muted d-block" style={{ fontSize: "0.75rem" }}>8.1K posts</span>
              </div>
              <div>
                <span className="small text-muted d-block">Trending in India</span>
                <span className="fw-bold text-main cursor-pointer">#creatorstudio</span>
                <span className="small text-muted d-block" style={{ fontSize: "0.75rem" }}>4.3K posts</span>
              </div>
              <div>
                <span className="small text-muted d-block">Trending in Database</span>
                <span className="fw-bold text-main cursor-pointer">#mongodb</span>
                <span className="small text-muted d-block" style={{ fontSize: "0.75rem" }}>2.9K posts</span>
              </div>
            </div>
            
            <hr className="border-secondary my-4" />

            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-shield-lock-fill text-gradient"></i> Community Guidelines
            </h5>
            <ul className="small text-muted ps-3 mb-0" style={{ lineHeight: "1.6" }}>
              <li className="mb-2">Be kind and respect fellow creator channels.</li>
              <li className="mb-2">Share coding snippets, vlogs, and playlist recommendations.</li>
              <li>Report spam, copyright violations, or abusive posts.</li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Tweets;
