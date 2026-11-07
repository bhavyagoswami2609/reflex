# REFLEX 🥊
**AI Kinematics Boxing & Reflex Battle Arena**

REFLEX is an interactive first-person AI boxing game and kinematics trainer that runs entirely in the browser using your webcam. Built with **MediaPipe Pose & 21-Joint Hand Tracking**, **Three.js 3D Graphics**, and an adaptive **Combat AI Engine**.

---

## ⚡ Key Features

- **🥊 Translucent 3D Boxing Gloves**: Floating first-person boxing gloves inspired by *Kinect Sports Boxing*. Built with an exact two-anchor kinematic lock: the glove cuff locks directly to your wrist, the front aligns to your knuckles, and the transverse knuckle spread accurately drives 3D pronation and supination.
- **🥽 3D Head-Tracking Virtual Reality**: Uses real-time facial landmark tracking so the camera perspective, boxing ring ropes, and arena shift naturally as you slip, bob, and duck.
- **🤖 Adaptive Combat AI**: Fight against the **Dummy (training dummy)** or **Zeus (Heavy weight robot)**. Features 3 difficulty tiers (*Rookie*, *Pro*, *Champion*), reactive high guards, slip-and-rip counter-punching, and anti-flurry parries.
- **🥋 Form Coach Mode**: Telemetry analyzing chin guard protection, punch extension, strike velocities, and center-of-mass balance.
- **📺 Picture-in-Picture (PIP) Webcam Feed**: Bottom-left tactical window displaying your mirrored live video with full 21-joint hand skeleton tracking.
- **🏆 Championship Arena & HUD**: 3D boxing ring with stadium bleachers, spotlights, camera flashes, and an authentic arcade health bar scoreboard.

---

## 🕹️ Controls & Hotkeys

| Input | Action |
|---|---|
| **Webcam Punches** | Throw Jabs, Crosses, Hooks, and Uppercuts |
| **Head Movement** | Slip Left/Right or Duck to evade attacks |
| **`C`** | Re-center 3D camera and body baseline |
| **`Space`** | Retry match after knockout |
| **Difficulty Toggle** | Switch bot between Rookie, Pro, and Champion |
| **Fighter Toggle** | Switch between Dummy & Zeus (Heavyweight Robot) |
| **3D Gloves Toggle** | Cycle glove styles: Crimson Red, Neon Cyan, Champion Gold |

---

## 🛠️ Tech Stack

- **Computer Vision**: [@mediapipe/pose](https://github.com/google-ai-edge/mediapipe) & [@mediapipe/hands](https://github.com/google-ai-edge/mediapipe) (21-Joint Tracking)
- **3D Graphics**: [Three.js](https://threejs.org/)
- **Audio**: Web Audio API Procedural Synthesizer & Speech Synthesis
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Hosting**: Cloudflare Pages

---

## 🚀 Development & Setup

```bash
# Clone the repository
git clone https://github.com/bhavyagoswami2609/reflex.git
cd reflex

# Install dependencies
npm install

# Start local dev server
npm run dev

# Build for production
npm run build
```

---

## 🌐 Live Deployment
Hosted on Cloudflare Pages: [https://reflex-ao7.pages.dev](https://reflex-ao7.pages.dev)
