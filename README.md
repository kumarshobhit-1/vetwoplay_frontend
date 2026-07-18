# Vetwoplay Frontend

A premium, creator-first media sharing and microblogging frontend client. Built using **React**, **Vite**, **Bootstrap**, and **Bootstrap Icons**, it delivers a YouTube-meets-Twitter dashboard experience designed with glassmorphic aesthetics and smooth rose pink accents.

---

## 🚀 Key Features

* **YouTube-Style Watch Page**: Embedded responsive video player, like counters, subscription toggles, view tracking, and user comments.
* **Microblogging Community Feed**: X/Twitter-style thread layout including image attachments, an emoji picker panel, circular text counters, and simulated repost/bookmark actions.
* **YouTube-Style Playlists**: Dedicated page displaying video lists alongside a sticky details card showing view counters, total video counts, and publisher credentials.
* **Creator Studio Dashboard**: Central hub to manage uploads, monitor account stats (total views, likes, subscribers), toggle publish status, and edit video details.
* **Debounced Live Autocomplete Search**: Interactive search bar returning categorized real-time suggestion lists for matching creators, videos, and playlists.
* **Responsive Collapsible Navigation**: Floating glassmorphic collapsed menu drawer for mobile viewports, responsive action bottom bar, and collapsible desktop sidebar.
* **Global Back Navigation**: Intelligent back button integrated across all sub-pages for seamless user navigation.
* **Premium Color Themes**: Modern purple-to-rose pink accents with fully automated light and dark mode toggles.
* **Contact & EmailJS Integration**: Functional Contact page saving messages to database and triggering real-time HTML alerts through the EmailJS REST API.

---

## 🛠️ Technology Stack

* **Core**: React 18, Vite (Development Server & Bundler)
* **Routing**: React Router DOM v6
* **Styling**: Bootstrap 5, Bootstrap Icons, Custom Vanilla CSS (Outfit/Inter fonts, Glassmorphism, linear gradients)
* **API Client**: Axios

---

## 📂 Folder Structure

```text
frontend/
├── public/                 # Static assets (logo, favicon.svg)
├── src/
│   ├── api/
│   │   └── client.js       # Axios instance with credentials config
│   ├── assets/             # SVG, images and local icon assets
│   ├── components/
│   │   ├── Footer.jsx      # Sticky responsive Footer
│   │   ├── LoadingSpinner.jsx # Premium category loader spinner
│   │   ├── Navbar.jsx      # Adaptive navbar with search autocomplete and mobile menu drawer
│   │   ├── Sidebar.jsx     # Collapsible sidebar panel
│   │   └── VideoCard.jsx   # Grid item video wrapper
│   ├── context/
│   │   ├── AuthContext.jsx # Global user session management
│   │   └── ThemeContext.jsx# Light/dark mode context provider
│   ├── pages/
│   │   ├── About.jsx       # Platform mission & pillars
│   │   ├── Channel.jsx     # Creator channel (videos, playlists, tweets tabs)
│   │   ├── Contact.jsx     # Form with DB saving and EmailJS integration
│   │   ├── Dashboard.jsx   # Creator Studio panel
│   │   ├── Home.jsx        # Landing video feed with category filters
│   │   ├── LikedVideos.jsx # Liked videos history feed
│   │   ├── Login.jsx       # Login form with show/hide password toggle
│   │   ├── Playlists.jsx   # YouTube-style playlists detail layout
│   │   ├── Register.jsx    # SignUp form with password toggling and username suggestions
│   │   ├── Settings.jsx    # Profile metadata update form
│   │   ├── Tweets.jsx      # Threads-style composer and community feed
│   │   ├── UploadVideo.jsx # Media publishing screen
│   │   ├── Watch.jsx       # Player page with comments section
│   │   └── WatchHistory.jsx# Interactive history feed
│   ├── App.jsx             # Routes declaration & Main Layout structure
│   ├── index.css           # Design system variables & custom styles
│   └── main.jsx            # Entry point mount
├── index.html              # HTML shell template
├── package.json            # Scripts & dependencies configuration
└── vite.config.js          # Vite config
```

---

## 🏁 Getting Started

### 1. Prerequisites
Ensure you have Node.js (v18+) and npm installed on your machine.

### 2. Installation
Navigate into the frontend directory and install dependencies:
```bash
cd frontend
npm install
```

### 3. Environment Setup
Create a `.env` file or configure your environment to point to your local backend API. By default, API requests are directed to `http://localhost:8000/api/v1`.

### 4. Running Local Development Server
Launch the development server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Build for Production
To bundle the frontend assets for production deployment:
```bash
npm run build
```
The optimized bundle will be created inside the `dist/` directory.
