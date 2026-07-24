import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";
import VideoCard from "../components/VideoCard";
import CreateChannelPrompt from "../components/CreateChannelPrompt";

const Channel = () => {
  const { username } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("videos");

  // Sub-items states
  const [videos, setVideos] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [tweets, setTweets] = useState([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [copiedTweetId, setCopiedTweetId] = useState(null);

  // Sub count & Sub button
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState(0);

  const fetchChannelProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get(`/users/c/${username}`);
      if (response.data?.success) {
        const profile = response.data.data;
        setChannel(profile);
        setIsSubscribed(profile.isSubscribed);
        setSubscribersCount(profile.subscribersCount || 0);
        
        const defaultTab = profile.hasChannel ? "videos" : "playlists";
        setActiveTab(defaultTab);
        fetchTabContent(defaultTab, profile._id);
      } else {
        setError("Channel not found.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load channel profile.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTabContent = async (tab, profileId) => {
    if (!profileId) return;
    setContentLoading(true);
    try {
      if (tab === "videos") {
        const response = await apiClient.get("/videos/allvideos", {
          params: { userId: profileId },
        });
        if (response.data?.success) {
          setVideos(response.data.data.videos || []);
        }
      } else if (tab === "playlists") {
        const response = await apiClient.get(`/playlists/showplaylist/${profileId}`);
        if (response.data?.success) {
          setPlaylists(response.data.data.playlists || []);
        }
      } else if (tab === "tweets") {
        const response = await apiClient.get(`/tweet/getusertweet/${profileId}`);
        if (response.data?.success) {
          setTweets(response.data.data || []);
        }
      } else if (tab === "bookmarks") {
        const response = await apiClient.get("/bookmarks/tweets");
        if (response.data?.success) {
          setTweets(response.data.data || []);
        }
      } else if (tab === "liked-videos") {
        const response = await apiClient.get("/likes/likedvideos");
        if (response.data?.success) {
          setVideos(response.data.data || []);
        }
      } else if (tab === "watch-history") {
        const response = await apiClient.get("/users/history");
        if (response.data?.success) {
          setVideos(response.data.data || []);
        }
      }
    } catch (err) {
      console.error(`Error loading ${tab}:`, err);
    } finally {
      setContentLoading(false);
    }
  };

  useEffect(() => {
    fetchChannelProfile();
  }, [username]);

  useEffect(() => {
    if (channel?._id) {
      fetchTabContent(activeTab, channel._id);
    }
  }, [activeTab]);

  const handleSubscriptionToggle = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (user._id === channel?._id) return;

    // Optimistic Update
    setIsSubscribed(!isSubscribed);
    setSubscribersCount((prev) => (isSubscribed ? prev - 1 : prev + 1));

    try {
      const response = await apiClient.patch(`/subscription/subscriptions/${channel._id}`);
      if (response.data?.success) {
        setIsSubscribed(response.data.data.isSubscribed);
      }
    } catch (err) {
      console.error("Sub toggle fail:", err);
      // Revert
      setIsSubscribed(isSubscribed);
      setSubscribersCount((prev) => (isSubscribed ? prev + 1 : prev - 1));
    }
  };

  const handleTweetLikeToggle = async (tweetId, idx) => {
    if (!user) {
      navigate("/login");
      return;
    }
    const tweet = tweets[idx];
    const currentIsLiked = tweet.isLiked;

    const updatedTweets = [...tweets];
    updatedTweets[idx] = {
      ...tweet,
      isLiked: !currentIsLiked,
      likesCount: currentIsLiked ? tweet.likesCount - 1 : tweet.likesCount + 1,
    };
    setTweets(updatedTweets);

    try {
      await apiClient.patch(`/likes/tweetlike/${tweetId}`);
    } catch (err) {
      console.error("Tweet like failed:", err);
      const revertedTweets = [...tweets];
      revertedTweets[idx] = tweet;
      setTweets(revertedTweets);
    }
  };

  const handleBookmarkToggle = async (tweetId, idx) => {
    if (!user) {
      navigate("/login");
      return;
    }
    const tweet = tweets[idx];
    const previousStatus = tweet.isBookmarked;

    const updatedTweets = [...tweets];
    updatedTweets[idx] = {
      ...tweet,
      isBookmarked: !previousStatus
    };
    setTweets(updatedTweets);

    try {
      const response = await apiClient.post(`/bookmarks/toggle/${tweetId}`);
      if (response.data?.success) {
        if (activeTab === "bookmarks" && !response.data.data.bookmarked) {
          setTweets((prev) => prev.filter((t) => t._id !== tweetId));
        } else {
          const syncedTweets = [...tweets];
          syncedTweets[idx] = {
            ...tweet,
            isBookmarked: response.data.data.bookmarked
          };
          setTweets(syncedTweets);
        }
      }
    } catch (err) {
      console.error("Bookmark toggle fail:", err);
      const revertedTweets = [...tweets];
      revertedTweets[idx] = tweet;
      setTweets(revertedTweets);
    }
  };

  const handleCopyLink = (tweetId) => {
    const url = `${window.location.origin}/tweets#tweet-${tweetId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedTweetId(tweetId);
      setTimeout(() => setCopiedTweetId(null), 2000);
    });
  };

  if (loading) return <LoadingSpinner message="Visiting channel..." />;

  if (error || !channel) {
    return (
      <div className="container py-5 text-center">
        <div className="glass-panel border-danger p-5 mx-auto" style={{ maxWidth: "500px" }}>
          <i className="bi bi-exclamation-triangle text-danger fs-1 mb-3"></i>
          <h5 className="fw-bold">Channel Unavailable</h5>
          <p className="text-muted small mb-4">{error || "Could not find profile details."}</p>
          <button onClick={() => navigate("/")} className="btn btn-gradient px-4 py-2">
            Back to Home
          </button>
        </div>
      </div>
    );
  }



  // Cover image style
  const coverStyle = {
    height: "240px",
    background: channel.coverImage
      ? `url(${channel.coverImage}) center/cover no-repeat`
      : "linear-gradient(135deg, var(--accent-purple) 0%, var(--accent-cyan-dark) 100%)",
    position: "relative",
  };

  const isOwnChannel = user && channel && user._id === channel._id;

  return (
    <div className="container py-4">
      {/* Banner / Cover Card */}
      <div 
        className="position-relative overflow-hidden shadow-lg border border-secondary mb-4" 
        style={{ 
          height: "220px", 
          borderRadius: "20px",
          background: channel.coverImage
            ? `url(${channel.coverImage}) center/cover no-repeat`
            : "linear-gradient(135deg, var(--accent-purple) 0%, var(--accent-cyan-dark) 100%)",
        }}
      >
        <div className="position-absolute bottom-0 start-0 w-100 h-50" style={{ background: "linear-gradient(0deg, rgba(10,9,14,0.9), transparent)" }}></div>
      </div>

      {/* Profile Info Container Card */}
      <div className="glass-panel border-secondary p-4 mb-4 shadow" style={{ borderRadius: "20px", marginTop: "-40px", position: "relative", zIndex: 10 }}>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-4 text-start">
          <div className="d-flex flex-wrap gap-4 align-items-center">
            {/* Avatar */}
            <div className="position-relative" style={{ marginTop: "-60px" }}>
              <img
                src={channel.avatar}
                alt={channel.username}
                className="rounded-circle border border-4 shadow-lg"
                style={{ 
                  width: "120px", 
                  height: "120px", 
                  objectFit: "cover", 
                  backgroundColor: "var(--bg-primary)",
                  borderColor: "var(--bg-secondary)",
                }}
              />
            </div>

            {/* Title / Description */}
            <div>
              <h2 className="fw-extrabold text-main mb-1 d-flex align-items-center gap-2">
                {channel.fullName}
                {!channel.hasChannel && <span className="badge bg-secondary small" style={{ fontSize: "0.65rem", padding: "4px 8px" }}>Viewer</span>}
              </h2>
              <p className="text-muted fw-semibold mb-2">@{channel.username}</p>
              
              <div className="d-flex align-items-center gap-3 text-muted small">
                {channel.hasChannel && (
                  <>
                    <span><i className="bi bi-people me-1"></i>{subscribersCount} subscribers</span>
                    <span>&bull;</span>
                  </>
                )}
                <span><i className="bi bi-check2-circle me-1"></i>Subscribed to {channel.channelsSubscribedToCount || 0} channels</span>
              </div>
            </div>
          </div>

          {/* Subscribe/Creator Button */}
          <div>
            {user?._id !== channel._id ? (
              channel.hasChannel && (
                <button
                  onClick={handleSubscriptionToggle}
                  className={`btn px-4 py-2 rounded-pill fw-bold fs-6 shadow transition-all ${
                    isSubscribed
                      ? "btn-glass border-secondary text-muted"
                      : "btn-gradient text-white"
                  }`}
                >
                  {isSubscribed ? "Subscribed" : "Subscribe"}
                </button>
              )
            ) : (
              channel.hasChannel ? (
                <Link to="/dashboard" className="btn btn-glass border-secondary text-muted rounded-pill px-4 py-2 fw-semibold shadow-sm">
                  <i className="bi bi-gear-fill me-2 text-pink"></i> Creator Studio
                </Link>
              ) : (
                <button
                  onClick={() => navigate("/dashboard")}
                  className="btn btn-gradient text-white rounded-pill px-4 py-2 fw-semibold shadow"
                >
                  <i className="bi bi-plus-circle me-2"></i> Create Channel
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-5">
        <div className="d-flex border-bottom border-secondary mb-4 overflow-x-auto pb-2" style={{ gap: "10px" }}>
          {channel.hasChannel && (
            <div
              className={`tab-custom ${activeTab === "videos" ? "active" : ""}`}
              onClick={() => setActiveTab("videos")}
            >
              <i className="bi bi-play-btn me-2"></i> Videos
            </div>
          )}
          <div
            className={`tab-custom ${activeTab === "playlists" ? "active" : ""}`}
            onClick={() => setActiveTab("playlists")}
          >
            <i className="bi bi-collection-play me-2"></i> Playlists
          </div>
          {(channel.hasChannel || isOwnChannel) && (
            <div
              className={`tab-custom ${activeTab === "tweets" ? "active" : ""}`}
              onClick={() => setActiveTab("tweets")}
            >
              <i className="bi bi-chat-left-text me-2"></i> Tweets
            </div>
          )}
          {isOwnChannel && (
            <>
              <div
                className={`tab-custom ${activeTab === "liked-videos" ? "active" : ""}`}
                onClick={() => setActiveTab("liked-videos")}
              >
                <i className="bi bi-heart me-2"></i> Liked Videos
              </div>
              <div
                className={`tab-custom ${activeTab === "bookmarks" ? "active" : ""}`}
                onClick={() => setActiveTab("bookmarks")}
              >
                <i className="bi bi-bookmark me-2"></i> Saved Tweets
              </div>
              <div
                className={`tab-custom ${activeTab === "watch-history" ? "active" : ""}`}
                onClick={() => setActiveTab("watch-history")}
              >
                <i className="bi bi-clock-history me-2"></i> Watch History
              </div>
            </>
          )}
        </div>

        {/* Tab content panel */}
        {contentLoading ? (
          <LoadingSpinner message="Fetching items..." />
        ) : (
          <div className="mt-2">
            {/* Videos Tab */}
            {activeTab === "videos" && (
              videos.length === 0 ? (
                <div className="glass-panel border-secondary p-5 text-muted text-center">
                  <i className="bi bi-camera-video fs-1 mb-2 d-block text-secondary"></i>
                  <span className="small">This creator hasn't published any videos yet.</span>
                </div>
              ) : (
                <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-4">
                  {videos.map((vid) => (
                    <div className="col" key={vid._id}>
                      <VideoCard video={vid} />
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Playlists Tab */}
            {activeTab === "playlists" && (
              playlists.length === 0 ? (
                <div className="glass-panel border-secondary p-5 text-muted text-center">
                  <i className="bi bi-journal-album fs-1 mb-2 d-block text-secondary"></i>
                  <span className="small">No playlists configured yet.</span>
                </div>
              ) : (
                <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                  {playlists.map((pl) => (
                    <div className="col" key={pl._id}>
                      <Link to={`/playlists?id=${pl._id}`} className="text-decoration-none">
                        <div className="glass-panel glass-panel-hover p-3 text-start h-100 d-flex flex-column">
                          <div className="hover-zoom-img mb-3 rounded overflow-hidden" style={{ aspectRatio: "16/9", backgroundColor: "var(--bg-tertiary)" }}>
                            {pl.coverThumbnail ? (
                              <img
                                src={pl.coverThumbnail}
                                alt={pl.name}
                                className="w-100 h-100"
                                style={{ objectFit: "cover" }}
                              />
                            ) : (
                              <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted">
                                <i className="bi bi-music-note-list fs-2"></i>
                              </div>
                            )}
                          </div>
                          <h6 className="text-main fw-bold mb-1 text-truncate">{pl.name}</h6>
                          <p className="small text-muted mb-0 text-truncate">{pl.description}</p>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Tweets & Bookmarks Tab */}
            {(activeTab === "tweets" || activeTab === "bookmarks") && (
              tweets.length === 0 ? (
                <div className="glass-panel border-secondary p-5 text-muted text-center">
                  <i className="bi bi-chat-quote fs-1 mb-2 d-block text-secondary"></i>
                  <span className="small">
                    {activeTab === "bookmarks" 
                      ? "You haven't bookmarked any tweets yet." 
                      : "This user hasn't posted any tweets yet."}
                  </span>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3 mx-auto" style={{ maxWidth: "650px" }}>
                  {tweets.map((tweet, idx) => {
                    const isOwnTweet = user && tweet.owner && user._id === tweet.owner._id;
                    return (
                      <div key={tweet._id} className="glass-panel border-secondary p-4 text-start">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <div className="d-flex align-items-center gap-2">
                            <img
                              src={tweet.owner?.avatar || channel.avatar}
                              alt="Avatar"
                              className="rounded-circle border"
                              style={{ width: "36px", height: "36px", objectFit: "cover" }}
                            />
                            <div>
                              <span className="text-main fw-bold d-block" style={{ fontSize: "0.95rem" }}>
                                {tweet.owner?.fullName || channel.fullName}
                              </span>
                              <span className="small text-muted">@{tweet.owner?.username || channel.username}</span>
                            </div>
                          </div>
                          <span className="small text-muted" style={{ fontSize: "0.75rem" }}>
                            {new Date(tweet.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <p className="text-main mb-3" style={{ fontSize: "1.05rem", whiteSpace: "pre-line", wordBreak: "break-word" }}>
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

                        <div className="d-flex pt-2 border-top border-secondary align-items-center justify-content-between text-muted">
                          {/* Likes Action */}
                          <button
                            onClick={() => handleTweetLikeToggle(tweet._id, idx)}
                            className={`btn btn-link p-0 border-0 text-decoration-none d-flex align-items-center gap-2 ${
                              tweet.isLiked ? "text-danger" : "text-muted"
                            }`}
                          >
                            <i className={`bi ${tweet.isLiked ? "bi-heart-fill text-danger" : "bi-heart"}`}></i>
                            <span className="small fw-semibold">{tweet.likesCount || 0}</span>
                          </button>

                          {/* Bookmark Action */}
                          {!isOwnTweet ? (
                            <button
                              onClick={() => handleBookmarkToggle(tweet._id, idx)}
                              className={`btn btn-link p-0 border-0 text-decoration-none d-flex align-items-center transition-all ${
                                tweet.isBookmarked ? "text-warning" : "text-muted"
                              }`}
                              title={tweet.isBookmarked ? "Bookmarked" : "Bookmark"}
                            >
                              <i className={`bi fs-5 ${tweet.isBookmarked ? "bi-bookmark-fill" : "bi-bookmark"}`}></i>
                            </button>
                          ) : (
                            <button
                              className="btn btn-link p-0 border-0 text-muted-custom opacity-50 text-decoration-none d-flex align-items-center cursor-not-allowed"
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
                            className="btn btn-link p-0 border-0 text-muted text-decoration-none d-flex align-items-center gap-1 transition-all"
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
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* Liked Videos Tab */}
            {activeTab === "liked-videos" && (
              videos.length === 0 ? (
                <div className="glass-panel border-secondary p-5 text-muted text-center">
                  <i className="bi bi-heartbreak fs-1 mb-2 d-block text-secondary"></i>
                  <p className="mb-0">You haven't liked any videos yet.</p>
                </div>
              ) : (
                <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-4">
                  {videos.map((vid) => (
                    <div className="col" key={vid._id}>
                      <VideoCard video={{ ...vid, owner: vid.ownerDetails || vid.owner }} />
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Watch History Tab */}
            {activeTab === "watch-history" && (
              videos.length === 0 ? (
                <div className="glass-panel border-secondary p-5 text-muted text-center">
                  <i className="bi bi-clock-history fs-1 mb-2 d-block text-secondary"></i>
                  <p className="mb-0">Your watch history is empty.</p>
                </div>
              ) : (
                <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-4">
                  {videos.map((vid) => (
                    <div className="col" key={vid._id}>
                      <VideoCard video={vid} />
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Channel;
