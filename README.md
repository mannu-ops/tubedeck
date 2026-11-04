# TubeDeck MK-IV // YouTube Media & Playlist ZIP Downloader

Ultra-lightweight, zero-Docker, high-performance YouTube media extraction engine and tactile frontend.

## 🚀 How to Run (2 Simple Steps)

### 1. Start Backend (Node.js API Server)
```bash
cd backend
npm start
```
> Runs at `http://localhost:5000`  
> Uses standalone `yt-dlp.exe` and `ffmpeg.exe` (no global installation or Python required).  
> Consumes only ~35 MB RAM.

### 2. Start Frontend (Vite App)
```bash
cd frontend
npm run dev
```
> Runs at `http://localhost:5173`

---

## 🌟 Key Features
- **Video Extraction**: 4K UHD 60FPS, 2K QHD, 1080p, 720p with MP4/MKV/WebM containers.
- **Audio Stems**: Studio Master MP3 (320kbps), Audiophile FLAC (24-bit Lossless), PCM WAV (1411kbps), Apple AAC.
- **Playlist Manager**: Multi-select tracks, duration summary, search filter.
- **Playlist ZIP Archiver**: In-browser & streaming ZIP generation with auto-generated M3U playlist and JSON metadata manifest.
- **Zero Docker**: Runs natively with Node.js on low-end laptops with 0% idle CPU and minimal RAM.
- **Notifications**: Tactile status toasts in the bottom-right corner.
