import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import apiClient from "../api/client";
import VideoCard from "../components/VideoCard";
import LoadingSpinner from "../components/LoadingSpinner";

const Home = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filtering & Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortType, setSortType] = useState("desc");

  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get("query") || "";
  const categoryQuery = searchParams.get("category") || "All";

  const categories = ["All", "Coding", "Gaming", "Music", "React", "Tech", "Vlogs"];

  // Fetch videos
  const fetchVideos = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        page,
        limit: 12,
        sortBy,
        sortType,
      };

      if (searchQuery) {
        params.query = searchQuery;
      } else if (categoryQuery !== "All") {
        params.query = categoryQuery;
      }

      const response = await apiClient.get("/videos/allvideos", { params });
      if (response.data?.success) {
        setVideos(response.data.data.videos || []);
        setTotalPages(response.data.data.pagination.totalPages || 1);
      } else {
        setError("Could not retrieve videos.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [searchQuery, categoryQuery]);

  useEffect(() => {
    fetchVideos();
  }, [searchQuery, categoryQuery, sortBy, sortType, page]);

  return (
    <div className="container-fluid p-4">
      {/* Category Pills & Sorting Bar */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        {/* Scrollable Category Pills (Glow, responsive horizontal flow) */}
        <div className="filter-scroll-wrapper mb-0 flex-grow-1" style={{ overflowX: "auto", maxWidth: "100%" }}>
          <div className="d-flex gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  if (cat === "All") {
                    navigate("/");
                  } else {
                    navigate(`/?category=${encodeURIComponent(cat)}`);
                  }
                }}
                className={`btn btn-sm px-4 py-2 rounded-pill fw-semibold transition-all ${
                  categoryQuery === cat
                    ? "btn-gradient text-white shadow-sm"
                    : "btn-glass text-muted"
                }`}
                style={{ whiteSpace: "nowrap" }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Sort Controls */}
        <div className="d-flex align-items-center gap-3">
          <span className="small text-muted fw-bold text-uppercase" style={{ fontSize: "0.75rem", letterSpacing: "0.5px" }}>
            Sort By:
          </span>
          <select
            className="form-select form-select-sm form-control-glass border-secondary bg-transparent text-main rounded-pill px-3 py-2"
            style={{ width: "160px" }}
            value={`${sortBy}-${sortType}`}
            onChange={(e) => {
              const [field, type] = e.target.value.split("-");
              setSortBy(field);
              setSortType(type);
              setPage(1);
            }}
          >
            <option value="createdAt-desc">Latest</option>
            <option value="createdAt-asc">Oldest</option>
            <option value="views-desc">Most Viewed</option>
          </select>
        </div>
      </div>

      {searchQuery && (
        <h4 className="text-start mb-4">
          Search results for: <span className="text-gradient fw-bold">"{searchQuery}"</span>
        </h4>
      )}

      {categoryQuery !== "All" && !searchQuery && (
        <h4 className="text-start mb-4">
          Category: <span className="text-gradient fw-bold">"{categoryQuery}"</span>
        </h4>
      )}

      {/* Main Grid */}
      {loading ? (
        <LoadingSpinner message="Fetching standard video feed..." />
      ) : error ? (
        <div className="glass-panel border-secondary text-center p-5 mx-auto mt-4" style={{ maxWidth: "500px" }}>
          <i className="bi bi-cloud-slash text-danger fs-1 mb-3"></i>
          <h5 className="fw-bold">Failed to load content</h5>
          <p className="text-muted small mb-4">{error}</p>
          <button className="btn btn-gradient py-2 px-4" onClick={fetchVideos}>
            Retry Request
          </button>
        </div>
      ) : videos.length === 0 ? (
        <div className="glass-panel border-secondary text-center p-5 mt-4">
          <i className="bi bi-play-circle text-muted fs-1 mb-3"></i>
          <h5 className="fw-bold">No videos found</h5>
          <p className="text-muted small">No videos match your search or category criteria.</p>
        </div>
      ) : (
        <>
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-4">
            {videos.map((vid) => (
              <div className="col" key={vid._id}>
                <VideoCard video={vid} />
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="d-flex align-items-center justify-content-center gap-3 mt-5">
              <button
                className="btn btn-glass px-4 py-2"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
              >
                <i className="bi bi-chevron-left"></i> Previous
              </button>
              <span className="text-muted fw-bold">
                Page {page} of {totalPages}
              </span>
              <button
                className="btn btn-glass px-4 py-2"
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
              >
                Next <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Home;
