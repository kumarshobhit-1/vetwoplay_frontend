import React, { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import apiClient from "../api/client";
import CreateChannelPrompt from "../components/CreateChannelPrompt";

const UploadVideo = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("All");
  const [videoFile, setVideoFile] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadPhase, setUploadPhase] = useState("upload"); // "upload" | "processing"
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const processingIntervalRef = useRef(null);

  const handleVideoFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setVideoFile(e.target.files[0]);
      const fileName = e.target.files[0].name;
      const baseName = fileName.substring(0, fileName.lastIndexOf(".")) || fileName;
      setTitle(baseName);
    }
  };

  // Phase 2: slowly tick progress from 80 → 98 while server processes on Cloudinary
  const startProcessingTick = () => {
    setUploadPhase("processing");
    processingIntervalRef.current = setInterval(() => {
      setUploadPercent((prev) => {
        if (prev >= 98) {
          clearInterval(processingIntervalRef.current);
          return 98;
        }
        // Slows down as it approaches 98 for a natural feel
        const step = prev < 90 ? 1 : 0.3;
        return Math.min(parseFloat((prev + step).toFixed(1)), 98);
      });
    }, 600);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!videoFile) {
      setError("Please select a video file to upload.");
      return;
    }
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    setUploading(true);
    setUploadPercent(0);
    setUploadPhase("upload");

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("category", category);
    formData.append("videoFile", videoFile);

    try {
      const response = await apiClient.post("/videos/upload-videos", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        // Phase 1: real browser → server transfer, mapped to 0–80%
        onUploadProgress: (progressEvent) => {
          const realPercent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          // Scale real 0–100% to displayed 0–80%
          const displayPercent = Math.round(realPercent * 0.8);
          setUploadPercent(displayPercent);

          // Once browser finishes sending, kick off Phase 2 simulated tick
          if (realPercent === 100 && !processingIntervalRef.current) {
            startProcessingTick();
          }
        },
      });

      // Server responded — clear tick, jump to 100%
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
        processingIntervalRef.current = null;
      }
      setUploadPercent(100);

      if (response.data?.success) {
        setSuccess(true);
        setTitle("");
        setDescription("");
        setVideoFile(null);
        setTimeout(() => navigate("/dashboard"), 1500);
      } else {
        setError(response.data?.message || "Upload failed.");
      }
    } catch (err) {
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
        processingIntervalRef.current = null;
      }
      setError(
        err.response?.data?.message ||
          "An error occurred while uploading. Ensure it's under file size limitations."
      );
    } finally {
      setUploading(false);
    }
  };

  if (!user) return null;

  if (!user.hasChannel) {
    return <CreateChannelPrompt onChannelCreated={() => window.location.reload()} />;
  }

  return (
    <div className="container py-5 d-flex align-items-center justify-content-center">
      <div className="glass-panel p-5 border-secondary text-center" style={{ maxWidth: "600px", width: "100%" }}>
        <h2 className="fw-bold mb-1 text-gradient">Publish Video</h2>
        <p className="text-muted small mb-4">Upload and publish MP4 video content to your subscribers.</p>

        {error && (
          <div className="alert alert-glass border-danger text-danger mb-4 py-2 px-3 small d-flex align-items-center gap-2 text-start">
            <i className="bi bi-exclamation-octagon-fill"></i>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-glass border-success text-success mb-4 py-2 px-3 small d-flex align-items-center gap-2 text-start">
            <i className="bi bi-check-circle-fill"></i>
            <span>Video published successfully! Redirecting to creator dashboard...</span>
          </div>
        )}

        <form onSubmit={handleUploadSubmit}>
          {/* File input */}
          <div className="mb-4 text-start">
            <label className="form-label small text-muted fw-semibold">Select Video File *</label>
            <input
              type="file"
              className="form-control form-control-glass"
              accept="video/mp4,video/x-m4v,video/*"
              onChange={handleVideoFileChange}
              disabled={uploading}
              required
            />
            <div className="form-text small text-muted mt-1">
              Supports MP4, M4V, and other standard video formats up to 50MB.
            </div>
          </div>

          {/* Title */}
          <div className="mb-3 text-start">
            <label className="form-label small text-muted fw-semibold">Video Title *</label>
            <input
              type="text"
              className="form-control form-control-glass"
              placeholder="e.g. Building an API from Scratch"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={uploading}
              required
            />
          </div>

          {/* Description */}
          <div className="mb-3 text-start">
            <label className="form-label small text-muted fw-semibold">Description</label>
            <textarea
              className="form-control form-control-glass"
              rows="4"
              placeholder="Write a detailed description explaining what your video is about..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={uploading}
            />
          </div>

          {/* Category */}
          <div className="mb-4 text-start">
            <label className="form-label small text-muted fw-semibold">Category</label>
            <select
              className="form-select form-control-glass border-secondary"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={uploading}
            >
              {["All", "Coding", "Gaming", "Music", "React", "Tech", "Vlogs"].map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "All" ? "General / Uncategorized" : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Two-Phase Upload Progress Bar */}
          {uploading && (
            <div className="mb-4 text-start">
              <div className="d-flex justify-content-between mb-1 small fw-bold">
                <span className={uploadPhase === "processing" ? "text-warning" : "text-muted"}>
                  {uploadPhase === "processing" ? (
                    <><i className="bi bi-gear-fill me-1"></i>Processing on server...</>
                  ) : (
                    <><i className="bi bi-cloud-arrow-up me-1"></i>Uploading file...</>
                  )}
                </span>
                <span className="text-muted">{Math.round(uploadPercent)}%</span>
              </div>
              <div className="progress" style={{ height: "8px", backgroundColor: "rgba(255,255,255,0.05)" }}>
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{
                    width: `${uploadPercent}%`,
                    background:
                      uploadPhase === "processing"
                        ? "linear-gradient(90deg, var(--accent-purple), #f59e0b)"
                        : "linear-gradient(90deg, var(--accent-purple), var(--accent-cyan))",
                    transition: "width 0.5s ease",
                  }}
                  aria-valuenow={uploadPercent}
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
              <div className="small text-muted mt-2 text-center">
                {uploadPhase === "processing"
                  ? "Video is being processed & uploaded to Cloudinary. This may take a moment..."
                  : "Sending file to server. Please do not close the browser window."}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="d-flex gap-2 justify-content-end">
            <Link to="/dashboard" className="btn btn-glass px-4" disabled={uploading}>
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-gradient px-4 d-flex align-items-center gap-2"
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  {uploadPhase === "processing" ? "Processing..." : "Uploading..."}
                </>
              ) : (
                <>
                  Publish Video <i className="bi bi-cloud-arrow-up-fill"></i>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadVideo;
