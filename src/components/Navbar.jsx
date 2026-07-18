import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import apiClient from "../api/client";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const isInitialMount = useRef(true);

  // Suggestions state
  const [suggestions, setSuggestions] = useState({ users: [], videos: [], playlists: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close mobile collapse navbar automatically on page change
  useEffect(() => {
    const navContent = document.getElementById("navbarContent");
    if (navContent && navContent.classList.contains("show")) {
      navContent.classList.remove("show");
    }
  }, [location.pathname]);

  // Sync search input with URL query params (only on home page search results)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlQuery = params.get("query") || "";
    // If we route away from search results page, clear the input
    if (location.pathname !== "/") {
      setSearchQuery("");
    } else {
      setSearchQuery(urlQuery);
    }
  }, [location.pathname, location.search]);

  // Keystroke-based Live Search (Debounced 350ms)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Only auto-navigate if we are on the home/feed page or already searching
    if (location.pathname !== "/") return;

    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams(location.search);
      const urlQuery = params.get("query") || "";

      if (searchQuery.trim() !== urlQuery.trim()) {
        if (searchQuery.trim() !== "") {
          navigate(`/?query=${encodeURIComponent(searchQuery.trim())}`, { replace: true });
        } else {
          const category = params.get("category");
          if (category) {
            navigate(`/?category=${encodeURIComponent(category)}`, { replace: true });
          } else {
            navigate("/", { replace: true });
          }
        }
      }
    }, 350);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, navigate, location.pathname]);

  // Fetch search autocomplete suggestions
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions({ users: [], videos: [] });
      return;
    }

    const delaySuggestionsFn = setTimeout(async () => {
      try {
        const res = await apiClient.get(`/users/search-suggestions?query=${encodeURIComponent(searchQuery.trim())}`);
        if (res.data?.success) {
          setSuggestions(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch suggestions:", err);
      }
    }, 200);

    return () => clearTimeout(delaySuggestionsFn);
  }, [searchQuery]);

  // Handle clicking outside the suggestion dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (searchQuery.trim() !== "") {
      navigate(`/?query=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSuggestions({ users: [], videos: [] });
    setShowSuggestions(false);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  return (
    <nav className="navbar navbar-expand-lg border-bottom border-secondary py-3 px-4 sticky-top" style={{ zIndex: 1080 }}>
      <div className="container-fluid gap-3">
        <div className="d-flex align-items-center">
          {/* Logo */}
          <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
            <div
              className="d-flex align-items-center justify-content-center rounded-circle shadow-sm"
              style={{
                width: "40px",
                height: "40px",
                background: "linear-gradient(135deg, var(--accent-purple), var(--accent-cyan))"
              }}
            >
              <i className="bi bi-play-circle-fill text-white fs-4"></i>
            </div>
            <span className="fs-3 fw-extrabold text-gradient tracking-tight">Vetwoplay</span>
          </Link>
        </div>

        {/* Hamburger Menu Mobile */}
        <button
          className="navbar-toggler border-secondary text-main"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
        >
          <span className="navbar-toggler-icon" style={{ filter: theme === "light" ? "none" : "invert(1)" }}></span>
        </button>

        <div className="collapse navbar-collapse gap-3 justify-content-between" id="navbarContent">

          {/* Autocomplete Suggestion Search bar */}
          <div
            className="position-relative flex-grow-1 mx-lg-5"
            style={{ maxWidth: "580px", margin: "0 auto", width: "100%", zIndex: 1050 }}
            ref={suggestionsRef}
          >
            <form className="d-flex text-start w-100" onSubmit={handleSearchSubmit}>
              <div className="input-group w-100">
                <div className="position-relative flex-grow-1">
                  <input
                    type="text"
                    ref={searchInputRef}
                    className="form-control form-control-glass border-end-0 w-100"
                    placeholder="Search videos, creators (live)..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    style={{ paddingRight: "40px", borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="btn p-0 position-absolute end-0 top-50 translate-middle-y me-3 border-0 text-muted shadow-none"
                      onClick={handleClearSearch}
                      style={{ zIndex: 10 }}
                      title="Clear search text"
                    >
                      <i className="bi bi-x-lg fs-5"></i>
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="input-group-text btn-glass border-start-0 d-flex align-items-center px-3"
                  style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                >
                  <i className="bi bi-search"></i>
                </button>
              </div>
            </form>

            {/* Suggestions Dropdown Panel */}
            {showSuggestions && (suggestions.users.length > 0 || suggestions.videos.length > 0 || (suggestions.playlists && suggestions.playlists.length > 0)) && (
              <div
                className="position-absolute w-100 glass-panel border-secondary p-2 mt-1 shadow-lg text-start"
                style={{ 
                  top: "100%", 
                  left: 0, 
                  backgroundColor: "var(--bg-secondary)", 
                  borderRadius: "10px",
                  maxHeight: "380px",
                  overflowY: "auto"
                }}
              >
                {/* Creator Suggestions Section */}
                {suggestions.users.length > 0 && (
                  <div className="mb-2">
                    <div className="px-3 py-1 small text-muted fw-bold text-uppercase" style={{ fontSize: "0.7rem", letterSpacing: "0.5px" }}>
                      Creators / Channels
                    </div>
                    <div className="d-flex flex-column mt-1">
                      {suggestions.users.map((creator) => (
                        <div
                          key={creator.username}
                          onClick={() => {
                            setShowSuggestions(false);
                            setSearchQuery(""); // Clear immediately on navigation click
                            navigate(`/c/${creator.username}`);
                          }}
                          className="d-flex align-items-center gap-3 px-3 py-2 rounded hover-zoom-img cursor-pointer"
                          style={{ transition: "background 0.2s" }}
                        >
                          <img
                            src={creator.avatar}
                            alt={creator.username}
                            className="rounded-circle border"
                            style={{ width: "32px", height: "32px", objectFit: "cover" }}
                          />
                          <div className="text-start">
                            <span className="fw-bold text-main d-block mb-0" style={{ fontSize: "0.9rem" }}>
                              {creator.fullName}
                            </span>
                            <span className="small text-muted" style={{ fontSize: "0.75rem" }}>
                              @{creator.username}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Divider */}
                {suggestions.users.length > 0 && (suggestions.videos.length > 0 || (suggestions.playlists && suggestions.playlists.length > 0)) && (
                  <hr className="border-secondary my-1" />
                )}

                {/* Video Suggestions Section */}
                {suggestions.videos.length > 0 && (
                  <div className="mb-2">
                    <div className="px-3 py-1 small text-muted fw-bold text-uppercase" style={{ fontSize: "0.7rem", letterSpacing: "0.5px" }}>
                      Videos
                    </div>
                    <div className="d-flex flex-column mt-1">
                      {suggestions.videos.map((vid) => (
                        <div
                          key={vid.title}
                          onClick={() => {
                            setShowSuggestions(false);
                            setSearchQuery(""); // Clear immediately on navigation click
                            navigate(`/?query=${encodeURIComponent(vid.title)}`);
                          }}
                          className="d-flex align-items-center gap-3 px-3 py-2 rounded hover-zoom-img cursor-pointer"
                          style={{ transition: "background 0.2s" }}
                        >
                          <i className="bi bi-play-circle text-gradient fs-5"></i>
                          <span className="text-main fw-semibold text-truncate" style={{ fontSize: "0.9rem" }}>
                            {vid.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Divider between Videos and Playlists */}
                {suggestions.videos.length > 0 && suggestions.playlists && suggestions.playlists.length > 0 && (
                  <hr className="border-secondary my-1" />
                )}

                {/* Playlist Suggestions Section */}
                {suggestions.playlists && suggestions.playlists.length > 0 && (
                  <div>
                    <div className="px-3 py-1 small text-muted fw-bold text-uppercase" style={{ fontSize: "0.7rem", letterSpacing: "0.5px" }}>
                      Playlists
                    </div>
                    <div className="d-flex flex-column mt-1">
                      {suggestions.playlists.map((pl) => (
                        <div
                          key={pl._id}
                          onClick={() => {
                            setShowSuggestions(false);
                            setSearchQuery(""); // Clear immediately on navigation click
                            navigate(`/playlists?id=${pl._id}`);
                          }}
                          className="d-flex align-items-center gap-3 px-3 py-2 rounded hover-zoom-img cursor-pointer"
                          style={{ transition: "background 0.2s" }}
                        >
                          {pl.coverThumbnail ? (
                            <img
                              src={pl.coverThumbnail}
                              alt={pl.name}
                              className="rounded border"
                              style={{ width: "40px", height: "25px", objectFit: "cover" }}
                            />
                          ) : (
                            <div className="rounded border bg-dark bg-opacity-25 d-flex align-items-center justify-content-center" style={{ width: "40px", height: "25px" }}>
                              <i className="bi bi-list-play text-muted" style={{ fontSize: "0.85rem" }}></i>
                            </div>
                          )}
                          <div className="text-start">
                            <span className="fw-bold text-main d-block mb-0 text-truncate" style={{ fontSize: "0.9rem", maxWidth: "240px" }}>
                              {pl.name}
                            </span>
                            <span className="small text-muted" style={{ fontSize: "0.75rem" }}>
                              Playlist &bull; {pl.totalVideos} videos {pl.owner ? `by @${pl.owner.username}` : ""}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Area */}
          <div className="d-flex align-items-center gap-3 justify-content-start">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="btn btn-glass rounded-circle p-2 d-flex align-items-center justify-content-center shadow-sm"
              style={{ width: "40px", height: "40px" }}
              title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
            >
              {theme === "light" ? (
                <i className="bi bi-moon-fill text-primary fs-5"></i>
              ) : (
                <i className="bi bi-sun-fill text-warning fs-5"></i>
              )}
            </button>

            {user ? (
              <>
                <Link to="/upload" className="btn btn-gradient d-flex align-items-center gap-2 py-2">
                  <i className="bi bi-upload"></i>
                  <span className="d-none d-md-inline">Upload</span>
                </Link>

                <Link to="/tweets" className="btn btn-glass d-flex align-items-center gap-2 py-2 shadow-sm">
                  <i className="bi bi-chat-left-text text-main"></i>
                  <span className="d-none d-md-inline text-main">Tweets</span>
                </Link>

                {/* Profile Dropdown */}
                <div className="dropdown">
                  <button
                    className="btn btn-link p-0 border-0 dropdown-toggle d-flex align-items-center gap-2 text-decoration-none"
                    type="button"
                    id="profileMenu"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="rounded-circle border border-2 border-secondary"
                      style={{ width: "40px", height: "40px", objectFit: "cover" }}
                    />
                    <span className="text-main d-none d-lg-inline fw-semibold">@{user.username}</span>
                  </button>
                  <ul
                    className="dropdown-menu dropdown-menu-end glass-panel p-2 mt-2 border-secondary"
                    aria-labelledby="profileMenu"
                    style={{ minWidth: "220px" }}
                  >
                    <li>
                      <div className="px-3 py-2 border-bottom border-secondary mb-2">
                        <p className="fw-bold text-main mb-0">{user.fullName}</p>
                        <p className="small text-muted mb-0">{user.email}</p>
                      </div>
                    </li>
                    <li>
                      <Link className="dropdown-item rounded py-2 d-flex align-items-center gap-2" to={`/c/${user.username}`}>
                        <i className="bi bi-person-circle"></i> My Channel
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item rounded py-2 d-flex align-items-center gap-2" to="/dashboard">
                        <i className="bi bi-speedometer2"></i> Creator Dashboard
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item rounded py-2 d-flex align-items-center gap-2" to="/playlists">
                        <i className="bi bi-collection-play"></i> My Playlists
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item rounded py-2 d-flex align-items-center gap-2" to="/liked-videos">
                        <i className="bi bi-heart"></i> Liked Videos
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item rounded py-2 d-flex align-items-center gap-2" to="/watch-history">
                        <i className="bi bi-clock-history"></i> Watch History
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item rounded py-2 d-flex align-items-center gap-2" to="/settings">
                        <i className="bi bi-gear"></i> Settings
                      </Link>
                    </li>
                    <li><hr className="dropdown-divider border-secondary" /></li>
                    <li>
                      <button
                        className="dropdown-item rounded py-2 text-danger d-flex align-items-center gap-2"
                        onClick={logout}
                      >
                        <i className="bi bi-box-arrow-right"></i> Log Out
                      </button>
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="d-flex align-items-center gap-2">
                <Link to="/login" className="btn btn-glass py-2 px-4 shadow-sm text-main">Log In</Link>
                <Link to="/register" className="btn btn-gradient py-2 px-4 shadow">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
