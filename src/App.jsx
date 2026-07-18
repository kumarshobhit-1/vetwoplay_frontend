import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

// Components
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Watch from "./pages/Watch";
import Tweets from "./pages/Tweets";
import Playlists from "./pages/Playlists";
import Channel from "./pages/Channel";
import WatchHistory from "./pages/WatchHistory";
import LikedVideos from "./pages/LikedVideos";
import Dashboard from "./pages/Dashboard";
import UploadVideo from "./pages/UploadVideo";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Settings from "./pages/Settings";

// Layout Wrapper to manage sidebar collapse toggling
const MainLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const hideSidebarPaths = ["/login", "/register"];
  const shouldHideSidebar = hideSidebarPaths.includes(location.pathname);
  const isHomePath = location.pathname === "/";

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  return (
    <div className="d-flex flex-column" style={{ minHeight: "100vh" }}>
      <Navbar toggleSidebar={toggleSidebar} />
      <div className="d-flex flex-grow-1">
        {!shouldHideSidebar && (
          <Sidebar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
        )}
        <main className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0 }}>
          <div className="flex-grow-1">
            {!isHomePath && (
              <div className="container pt-4 pb-0 d-flex align-items-center mb-3">
                <button
                  onClick={() => navigate(-1)}
                  className="btn btn-glass d-flex align-items-center gap-2 px-3 py-2 fw-semibold text-main rounded-pill shadow-sm"
                  title="Go Back"
                >
                  <i className="bi bi-arrow-left fs-5 text-gradient"></i>
                  <span>Back</span>
                </button>
              </div>
            )}
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/watch/:videoId" element={<Watch />} />
              <Route path="/tweets" element={<Tweets />} />
              <Route path="/playlists" element={<Playlists />} />
              <Route path="/c/:username" element={<Channel />} />
              <Route path="/watch-history" element={<WatchHistory />} />
              <Route path="/liked-videos" element={<LikedVideos />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/upload" element={<UploadVideo />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <MainLayout />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
