import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";
import VideoCard from "../components/VideoCard";

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
        
        // Fetch sub-items
        fetchTabContent(activeTab, profile._id);
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

  

  return (
    <div className="container-fluid p-0 pb-4">
      {/* Banner / Cover */}
      <div style={coverStyle}>
        <div className="position-absolute bottom-0 start-0 w-100 h-50" style={{ background: "linear-gradient(0deg, rgba(10,9,14,0.9), transparent)" }}></div>
      </div>

      {/* Profile Info Container */}
      <div className="container px-4" style={{ position: "relative", zIndex: 10 }}>
        <div className="d-flex flex-wrap align-items-end justify-content-between gap-3 text-start">
          <div className="d-flex flex-wrap gap-4 align-items-center">
            {/* Avatar */}
            <img
              src={channel.avatar}
              alt={channel.username}
              className="rounded-circle border border-4 shadow"
              style={{ 
                width: "130px", 
                height: "130px", 
                objectFit: "cover", 
                backgroundColor: "var(--bg-primary)",
                borderColor: "var(--bg-primary)",
                marginTop: "-65px",
                position: "relative",
                zIndex: 12
              }}
            />

            {/* Title / Description */}
            <div className="pt-3">
              <h2 className="fw-bold mb-1">{channel.fullName}</h2>
              <p className="text-muted fw-semibold mb-2">@{channel.username}</p>
              
              <div className="d-flex align-items-center gap-3 text-muted small">
                <span>{subscribersCount} subscribers</span>
                <span>•</span>
                <span>{channel.channelsSubscribedToCount || 0} subscribed</span>
              </div>
            </div>
          </div>

          {/* Subscribe Button */}
          {user?._id !== channel._id ? (
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
          ) : (
            <Link to="/dashboard" className="btn btn-glass border-secondary text-muted rounded-pill px-4 py-2 fw-semibold">
              <i className="bi bi-gear-fill me-2"></i> Creator Studio
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="container mt-5 px-4">
        <div className="d-flex border-bottom border-secondary mb-4">
          <div
            className={`tab-custom ${activeTab === "videos" ? "active" : ""}`}
            onClick={() => setActiveTab("videos")}
          >
            <i className="bi bi-play-btn me-2"></i> Videos
          </div>
          <div
            className={`tab-custom ${activeTab === "playlists" ? "active" : ""}`}
            onClick={() => setActiveTab("playlists")}
          >
            <i className="bi bi-collection-play me-2"></i> Playlists
          </div>
          <div
            className={`tab-custom ${activeTab === "tweets" ? "active" : ""}`}
            onClick={() => setActiveTab("tweets")}
          >
            <i className="bi bi-chat-left-text me-2"></i> Tweets
          </div>
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
                      <Link to="/playlists" className="text-decoration-none">
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

            {/* Tweets Tab */}
            {activeTab === "tweets" && (
              tweets.length === 0 ? (
                <div className="glass-panel border-secondary p-5 text-muted text-center">
                  <i className="bi bi-chat-quote fs-1 mb-2 d-block text-secondary"></i>
                  <span className="small">This user hasn't posted any tweets yet.</span>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3 mx-auto" style={{ maxWidth: "650px" }}>
                  {tweets.map((tweet, idx) => (
                    <div key={tweet._id} className="glass-panel border-secondary p-4 text-start">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <img
                            src={channel.avatar}
                            alt="Avatar"
                            className="rounded-circle border"
                            style={{ width: "36px", height: "36px", objectFit: "cover" }}
                          />
                          <div>
                            <span className="text-main fw-bold d-block" style={{ fontSize: "0.95rem" }}>
                              {channel.fullName}
                            </span>
                            <span className="small text-muted">@{channel.username}</span>
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
                        <div className="mb-3 rounded border border-secondary overflow-hidden bg-dark bg-opacity-25" style={{ maxWidth: "100%", maxHeight: "350px" }}>
                          <img 
                            src={tweet.image} 
                            alt="Tweet Media" 
                            className="img-fluid w-100" 
                            style={{ maxHeight: "350px", objectFit: "contain" }} 
                          />
                        </div>
                      )}

                      <div className="d-flex pt-2 border-top border-secondary">
                        <button
                          onClick={() => handleTweetLikeToggle(tweet._id, idx)}
                          className={`btn btn-link p-0 border-0 text-decoration-none d-flex align-items-center gap-2 ${
                            tweet.isLiked ? "text-danger" : "text-muted"
                          }`}
                        >
                          <i className={`bi ${tweet.isLiked ? "bi-heart-fill text-danger" : "bi-heart"}`}></i>
                          <span className="small fw-semibold">{tweet.likesCount || 0}</span>
                        </button>
                      </div>
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
