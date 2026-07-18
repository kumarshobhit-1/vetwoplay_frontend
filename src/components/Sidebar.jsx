import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Sidebar = ({ collapsed, toggleSidebar }) => {
  const { user } = useAuth();

  return (
    <aside
      className={`sidebar-container border-end border-secondary p-3 ${collapsed ? "collapsed" : ""}`}
      style={{ minHeight: "calc(100vh - 86px)" }}
    >
      <div className="d-flex flex-column gap-2">
        {/* Sidebar Toggle Button inside Sidebar */}
        <div className={`d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom border-secondary-subtle ${collapsed ? "justify-content-center px-0" : "px-3"}`}>
          {!collapsed && <span className="small text-muted fw-bold text-uppercase" style={{ fontSize: "0.7rem", letterSpacing: "1px" }}>Navigation</span>}
          <button
            onClick={toggleSidebar}
            className="btn btn-link p-1 border-0 text-main hover-zoom-img shadow-none d-none d-lg-block"
            style={{ textDecoration: "none" }}
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <i className={`bi ${collapsed ? "bi-chevron-right" : "bi-chevron-left"} fs-5`}></i>
          </button>
        </div>
        <NavLink
          to="/"
          className={({ isActive }) => `nav-link-custom ${isActive ? "active" : ""}`}
          title="Home Feed"
        >
          <i className="bi bi-house-door fs-5"></i>
          <span className="sidebar-text">Home Feed</span>
        </NavLink>

        <NavLink
          to="/tweets"
          className={({ isActive }) => `nav-link-custom ${isActive ? "active" : ""}`}
          title="Community Tweets"
        >
          <i className="bi bi-chat-left-text fs-5"></i>
          <span className="sidebar-text">Community Tweets</span>
        </NavLink>

        {user && (
          <>
            <div className="text-uppercase small text-muted fw-bold px-3 mt-4 mb-2" style={{ fontSize: "0.75rem", letterSpacing: "1px" }}>
              Library
            </div>

            <NavLink
              to="/playlists"
              className={({ isActive }) => `nav-link-custom ${isActive ? "active" : ""}`}
              title="Playlists"
            >
              <i className="bi bi-collection-play fs-5"></i>
              <span className="sidebar-text">Playlists</span>
            </NavLink>

            <NavLink
              to="/liked-videos"
              className={({ isActive }) => `nav-link-custom ${isActive ? "active" : ""}`}
              title="Liked Videos"
            >
              <i className="bi bi-heart fs-5"></i>
              <span className="sidebar-text">Liked Videos</span>
            </NavLink>

            <NavLink
              to="/watch-history"
              className={({ isActive }) => `nav-link-custom ${isActive ? "active" : ""}`}
              title="Watch History"
            >
              <i className="bi bi-clock-history fs-5"></i>
              <span className="sidebar-text">Watch History</span>
            </NavLink>

            <div className="text-uppercase small text-muted fw-bold px-3 mt-4 mb-2" style={{ fontSize: "0.75rem", letterSpacing: "1px" }}>
              Creator Space
            </div>

            <NavLink
              to="/dashboard"
              className={({ isActive }) => `nav-link-custom ${isActive ? "active" : ""}`}
              title="Creator Dashboard"
            >
              <i className="bi bi-speedometer2 fs-5"></i>
              <span className="sidebar-text">Creator Dashboard</span>
            </NavLink>

            <NavLink
              to="/upload"
              className={({ isActive }) => `nav-link-custom ${isActive ? "active" : ""}`}
              title="Upload Video"
            >
              <i className="bi bi-cloud-arrow-up fs-5"></i>
              <span className="sidebar-text">Upload Video</span>
            </NavLink>
          </>
        )}

        {/* Company & Support Information */}
        <div className="text-uppercase small text-muted fw-bold px-3 mt-4 mb-2" style={{ fontSize: "0.75rem", letterSpacing: "1px" }}>
          Information
        </div>

        <NavLink
          to="/about"
          className={({ isActive }) => `nav-link-custom ${isActive ? "active" : ""}`}
          title="About Us"
        >
          <i className="bi bi-info-circle fs-5"></i>
          <span className="sidebar-text">About Us</span>
        </NavLink>

        <NavLink
          to="/contact"
          className={({ isActive }) => `nav-link-custom ${isActive ? "active" : ""}`}
          title="Contact Us"
        >
          <i className="bi bi-envelope fs-5"></i>
          <span className="sidebar-text">Contact Us</span>
        </NavLink>

        {!user && !collapsed && (
          <div className="glass-panel border-secondary p-3 mt-4 text-center">
            <h6 className="fw-bold mb-2">Join Vetwoplay</h6>
            <p className="small text-muted mb-3">Sign in to subscribe, like videos, and tweet your thoughts!</p>
            <NavLink to="/login" className="btn btn-gradient btn-sm w-100 py-2">Get Started</NavLink>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
