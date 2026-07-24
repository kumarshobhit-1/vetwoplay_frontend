import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/client";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

const Settings = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  // Tab State
  const [activeSubTab, setActiveSubTab] = useState("details");

  // State: Profile details
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsSuccess, setDetailsSuccess] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  // State: Avatar upload
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarSuccess, setAvatarSuccess] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  // State: Cover Image upload
  const [coverFile, setCoverFile] = useState(null);
  const [coverLoading, setCoverLoading] = useState(false);
  const [coverSuccess, setCoverSuccess] = useState(false);
  const [coverError, setCoverError] = useState("");

  // State: Change password
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // State: Delete Channel
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDeleteChannel = () => {
    Swal.fire({
      title: "Delete Creator Channel?",
      text: "WARNING: Are you sure you want to delete your creator channel? This will deactivate your creator status. Your personal account is preserved, but all your videos, tweets, and playlists will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "var(--accent-cyan)",
      cancelButtonColor: "var(--text-muted)",
      confirmButtonText: "Yes, delete my channel!",
      background: "var(--bg-secondary)",
      color: "var(--text-main)",
      customClass: {
        popup: "glass-panel shadow-lg border-secondary"
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        setDeleteLoading(true);
        setDeleteError("");
        try {
          const response = await apiClient.delete("/users/delete-channel");
          if (response.data?.success) {
            updateUser(response.data.data); // Update global user state (hasChannel becomes false)
            toast.success("Creator channel deactivated successfully");
            navigate("/"); // Redirect to home
          } else {
            setDeleteError(response.data?.message || "Failed to delete channel.");
            toast.error(response.data?.message || "Failed to delete channel.");
          }
        } catch (err) {
          const errMsg = err.response?.data?.message || "Error deleting creator channel.";
          setDeleteError(errMsg);
          toast.error(errMsg);
        } finally {
          setDeleteLoading(false);
        }
      }
    });
  };

  const handleUpdateDetails = async (e) => {
    e.preventDefault();
    setDetailsError("");
    setDetailsSuccess(false);

    if (!fullName.trim() || !email.trim()) {
      setDetailsError("Please fill out all fields.");
      return;
    }

    setDetailsLoading(true);
    try {
      const response = await apiClient.patch("/users/update-account-details", {
        fullName: fullName.trim(),
        email: email.trim(),
      });

      if (response.data?.success) {
        setDetailsSuccess(true);
        updateUser(response.data.data); // Update global auth context
      } else {
        setDetailsError(response.data?.message || "Failed to update profile.");
      }
    } catch (err) {
      setDetailsError(err.response?.data?.message || "Error updating account details.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleUpdateAvatar = async (e) => {
    e.preventDefault();
    setAvatarError("");
    setAvatarSuccess(false);

    if (!avatarFile) {
      setAvatarError("Please select a new avatar file.");
      return;
    }

    setAvatarLoading(true);
    const formData = new FormData();
    formData.append("avatar", avatarFile);

    try {
      const response = await apiClient.patch("/users/update-avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data?.success) {
        setAvatarSuccess(true);
        setAvatarFile(null);
        updateUser(response.data.data); // Update global state
      } else {
        setAvatarError(response.data?.message || "Failed to update avatar.");
      }
    } catch (err) {
      setAvatarError(err.response?.data?.message || "Error uploading avatar file.");
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleUpdateCover = async (e) => {
    e.preventDefault();
    setCoverError("");
    setCoverSuccess(false);

    if (!coverFile) {
      setCoverError("Please select a new cover file.");
      return;
    }

    setCoverLoading(true);
    const formData = new FormData();
    formData.append("coverImage", coverFile);

    try {
      const response = await apiClient.patch("/users/update-coverImage", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data?.success) {
        setCoverSuccess(true);
        setCoverFile(null);
        updateUser(response.data.data); // Update global state
      } else {
        setCoverError(response.data?.message || "Failed to update cover image.");
      }
    } catch (err) {
      setCoverError(err.response?.data?.message || "Error uploading cover image.");
    } finally {
      setCoverLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    if (!oldPassword || !newPassword) {
      setPasswordError("Please enter both passwords.");
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await apiClient.post("/users/change-password", {
        oldPassword,
        newPassword,
      });

      if (response.data?.success) {
        setPasswordSuccess(true);
        setOldPassword("");
        setNewPassword("");
      } else {
        setPasswordError(response.data?.message || "Failed to change password.");
      }
    } catch (err) {
      setPasswordError(err.response?.data?.message || "Error updating password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="container py-5 text-start" style={{ maxWidth: "800px" }}>
      <h3 className="fw-bold text-gradient mb-1">Account Settings</h3>
      <p className="text-muted small mb-4">Manage your public creator identity, avatar files, and security preferences.</p>

      <div className="row g-4">
        {/* Navigation Tabs */}
        <div className="col-md-3">
          <div className="d-flex flex-column gap-2">
            <button
              onClick={() => setActiveSubTab("details")}
              className={`nav-link-custom border-0 text-start w-100 bg-transparent ${
                activeSubTab === "details" ? "active" : ""
              }`}
            >
              <i className="bi bi-person-gear fs-5"></i>
              <span>Profile Info</span>
            </button>
            <button
              onClick={() => setActiveSubTab("branding")}
              className={`nav-link-custom border-0 text-start w-100 bg-transparent ${
                activeSubTab === "branding" ? "active" : ""
              }`}
            >
              <i className="bi bi-image fs-5"></i>
              <span>Avatar & Cover</span>
            </button>
            <button
              onClick={() => setActiveSubTab("security")}
              className={`nav-link-custom border-0 text-start w-100 bg-transparent ${
                activeSubTab === "security" ? "active" : ""
              }`}
            >
              <i className="bi bi-shield-lock fs-5"></i>
              <span>Security</span>
            </button>
            {user.hasChannel && (
              <button
                onClick={() => setActiveSubTab("channel")}
                className={`nav-link-custom border-0 text-start w-100 bg-transparent ${
                  activeSubTab === "channel" ? "active" : ""
                }`}
              >
                <i className="bi bi-play-btn fs-5"></i>
                <span>Channel Controls</span>
              </button>
            )}
          </div>
        </div>

        {/* Action Panel Content */}
        <div className="col-md-9">
          {/* PROFILE INFO TAB */}
          {activeSubTab === "details" && (
            <div className="glass-panel p-4 border-secondary">
              <h5 className="fw-bold mb-3 text-main">Update Profile Details</h5>
              
              {detailsSuccess && (
                <div className="alert alert-glass border-success text-success mb-3 py-2 px-3 small d-flex align-items-center gap-2">
                  <i className="bi bi-check-circle-fill"></i>
                  <span>Profile details updated successfully!</span>
                </div>
              )}

              {detailsError && (
                <div className="alert alert-glass border-danger text-danger mb-3 py-2 px-3 small d-flex align-items-center gap-2">
                  <i className="bi bi-exclamation-octagon-fill"></i>
                  <span>{detailsError}</span>
                </div>
              )}

              <form onSubmit={handleUpdateDetails}>
                <div className="mb-3">
                  <label className="form-label small text-muted fw-semibold">Display Full Name</label>
                  <input
                    type="text"
                    className="form-control form-control-glass"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label small text-muted fw-semibold">Email Address</label>
                  <input
                    type="email"
                    className="form-control form-control-glass"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-gradient px-4" disabled={detailsLoading}>
                  {detailsLoading ? "Saving..." : "Save Changes"}
                </button>
              </form>
            </div>
          )}

          {/* BRANDING TAB */}
          {activeSubTab === "branding" && (
            <div className="d-flex flex-column gap-4">
              {/* Avatar Form */}
              <div className="glass-panel p-4 border-secondary">
                <h5 className="fw-bold mb-3 text-main">Change Avatar Image</h5>
                
                {avatarSuccess && (
                  <div className="alert alert-glass border-success text-success mb-3 py-2 px-3 small d-flex align-items-center gap-2">
                    <i className="bi bi-check-circle-fill"></i>
                    <span>Avatar image updated successfully!</span>
                  </div>
                )}

                {avatarError && (
                  <div className="alert alert-glass border-danger text-danger mb-3 py-2 px-3 small d-flex align-items-center gap-2">
                    <i className="bi bi-exclamation-octagon-fill"></i>
                    <span>{avatarError}</span>
                  </div>
                )}

                <form onSubmit={handleUpdateAvatar}>
                  <div className="d-flex flex-wrap align-items-center gap-4 mb-4">
                    <img
                      src={user.avatar}
                      alt="Current avatar"
                      className="rounded-circle border border-2 border-secondary"
                      style={{ width: "80px", height: "80px", objectFit: "cover" }}
                    />
                    <div className="flex-grow-1" style={{ minWidth: "200px" }}>
                      <input
                        type="file"
                        className="form-control form-control-glass"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            setAvatarFile(e.target.files[0]);
                          }
                        }}
                        required
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-gradient px-4" disabled={avatarLoading}>
                    {avatarLoading ? "Uploading..." : "Update Avatar"}
                  </button>
                </form>
              </div>

              {/* Cover Image Form */}
              <div className="glass-panel p-4 border-secondary">
                <h5 className="fw-bold mb-3 text-main">Change Channel Cover Image</h5>
                
                {coverSuccess && (
                  <div className="alert alert-glass border-success text-success mb-3 py-2 px-3 small d-flex align-items-center gap-2">
                    <i className="bi bi-check-circle-fill"></i>
                    <span>Cover image updated successfully!</span>
                  </div>
                )}

                {coverError && (
                  <div className="alert alert-glass border-danger text-danger mb-3 py-2 px-3 small d-flex align-items-center gap-2">
                    <i className="bi bi-exclamation-octagon-fill"></i>
                    <span>{coverError}</span>
                  </div>
                )}

                <form onSubmit={handleUpdateCover}>
                  <div className="mb-4">
                    {user.coverImage ? (
                      <img
                        src={user.coverImage}
                        alt="Current cover"
                        className="w-100 rounded border border-secondary mb-3"
                        style={{ height: "120px", objectFit: "cover" }}
                      />
                    ) : (
                      <div className="w-100 rounded border border-secondary mb-3 d-flex align-items-center justify-content-center text-muted small bg-dark bg-opacity-25" style={{ height: "120px" }}>
                        No cover image set
                      </div>
                    )}
                    <input
                      type="file"
                      className="form-control form-control-glass"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setCoverFile(e.target.files[0]);
                        }
                      }}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-gradient px-4" disabled={coverLoading}>
                    {coverLoading ? "Uploading..." : "Update Cover"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeSubTab === "security" && (
            <div className="glass-panel p-4 border-secondary">
              <h5 className="fw-bold mb-3 text-main">Change Password</h5>
              
              {passwordSuccess && (
                <div className="alert alert-glass border-success text-success mb-3 py-2 px-3 small d-flex align-items-center gap-2">
                  <i className="bi bi-check-circle-fill"></i>
                  <span>Password changed successfully!</span>
                </div>
              )}

              {passwordError && (
                <div className="alert alert-glass border-danger text-danger mb-3 py-2 px-3 small d-flex align-items-center gap-2">
                  <i className="bi bi-exclamation-octagon-fill"></i>
                  <span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword}>
                <div className="mb-3">
                  <label className="form-label small text-muted fw-semibold">Current Password</label>
                  <input
                    type="password"
                    className="form-control form-control-glass"
                    placeholder="••••••••"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label small text-muted fw-semibold">New Password</label>
                  <input
                    type="password"
                    className="form-control form-control-glass"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-gradient px-4" disabled={passwordLoading}>
                  {passwordLoading ? "Updating..." : "Change Password"}
                </button>
              </form>
            </div>
          )}

          {/* CHANNEL CONTROLS TAB */}
          {activeSubTab === "channel" && user.hasChannel && (
            <div className="glass-panel p-4 border-danger">
              <h5 className="fw-bold mb-3 text-danger">Channel Controls</h5>
              <p className="text-muted small mb-4">
                Deactivate your creator channel status on Vetwoplay. Your personal viewer account (login, preferences, history) will be completely preserved, but all your uploaded videos, tweets, and playlists will be permanently deleted from the database.
              </p>

              {deleteError && (
                <div className="alert alert-glass border-danger text-danger mb-3 py-2 px-3 small">
                  {deleteError}
                </div>
              )}

              <div className="border border-danger border-opacity-25 rounded-3 p-4 bg-danger bg-opacity-10">
                <h6 className="fw-bold text-danger mb-2">Danger Zone</h6>
                <p className="text-muted small mb-3">
                  Once you delete your creator channel, you cannot recover the uploaded videos, tweets, or subscriber relationships.
                </p>
                <button
                  type="button"
                  onClick={handleDeleteChannel}
                  disabled={deleteLoading}
                  className="btn btn-danger rounded-pill px-4 py-2 fw-semibold"
                >
                  {deleteLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Deleting...
                    </>
                  ) : (
                    "Delete Creator Channel"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
