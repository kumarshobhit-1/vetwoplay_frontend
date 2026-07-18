import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const VideoCard = ({ video }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

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
    <div className="glass-panel glass-panel-hover h-100 d-flex flex-column overflow-hidden">
      {/* Thumbnail */}
      <Link 
        to={`/watch/${video._id}`} 
        onClick={handleCardInteraction} 
        className="position-relative hover-zoom-img d-block"
      >
        <img
          src={video.thumbnail}
          alt={video.title}
          className="img-fluid w-100"
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
      <div className="p-3 d-flex gap-3 flex-grow-1 align-items-start">
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
        <div className="d-flex flex-column flex-grow-1 text-start overflow-hidden">
          <Link 
            to={`/watch/${video._id}`} 
            onClick={handleCardInteraction} 
            className="text-main text-decoration-none fw-bold text-truncate mb-1 h6" 
            title={video.title}
          >
            {video.title}
          </Link>

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
      </div>
    </div>
  );
};

export default VideoCard;
