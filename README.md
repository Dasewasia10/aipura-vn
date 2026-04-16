# Polaris VN Engine 🌌

Polaris VN Engine is a modern, interactive, web-based Visual Novel (VN) player built for the **Polaris Idoly** ecosystem. Designed to parse and render dynamic JSON script files, it provides a highly immersive storytelling experience right in the browser.

## ✨ Features

- **Dynamic Script Parsing:** Reads and executes complex JSON story scripts containing dialogues, background changes, background music (BGM), sound effects (SFX), and branching choices.
- **Advanced Audio Management:** Powered by `Howler.js`, ensuring smooth BGM loops, seamless fade-ins/fade-outs, and precise voice line playback. Includes a workaround for modern browser autoplay policies.
- **Execution Stack Architecture:** Built with `Zustand`, the engine uses a stack-based memory system to flawlessly handle branching story paths (Choices) and nested dialogues.
- **Immersive Visuals & Transitions:** Utilizes `Framer Motion` for buttery-smooth scene transitions, character sprite slide-ins, and elegant UI interactions.
- **Modern VN Controls:** - 📖 **Dialogue Log:** Review past conversations.
  - ⏩ **Skip Mode:** Fast-forward through read content (stops at choices).
  - ▶️ **Auto-Play:** Automatically advances text after voice lines finish or based on text length.
  - 👁️ **Hide UI:** Temporarily hide text boxes to view the full character sprites and backgrounds.
- **Deep Linking Strategy:** Easily share specific story episodes via URL parameters (`?type=main&file=ep1.json`).

## 🛠️ Tech Stack

- **Framework:** React 18 + Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS (v4)
- **State Management:** Zustand
- **Animations:** Framer Motion
- **Audio:** Howler.js
- **Data Fetching:** Axios
- **Icons:** Lucide React

## 📂 Story Directory Structure

The engine categorizes stories into distinct albums/directories, dynamically fetching index data from the backend API:
- **Main Story** (`mainstory`)
- **Event Story** (`eventstory`)
- **Love Story** (`lovestory`)
- **Bond Story** (`bondstory`) - *Features character-specific folder icons.*
- **Extra Story** (`extrastory`)
- **Card Story** (`cardstory`) - *Automatically filters out short variations.*

## 🚀 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/polaris-vn-engine.git
   cd polaris-vn-engine
   ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Run the development server:**

    ```bash
    npm run dev
    ```

4.  **Build for production:**

    ```bash
    npm run build
    ```

## 📜 Script Format (JSON)

The engine reads an array of `ScriptLine` objects. Here is an example of how the JSON script is structured:

```json
[
  {
    "type": "background",
    "src": "https://apiip.dasewasia.my.id/storyBackground/env_room.webp"
  },
  {
    "type": "bgm",
    "action": "play",
    "src": "https://apiip.dasewasia.my.id/bgm/bgm_01.mp3"
  },
  {
    "type": "dialogue",
    "speakerName": "Mana",
    "speakerCode": "mna",
    "text": "Welcome to Polaris VN Engine! Let's make the best story together."
  },
  {
    "type": "choice_selection",
    "text": "What should we do next?",
    "choices": [
      {
        "text": "Start singing",
        "route": [
          {
            "type": "dialogue",
            "speakerName": "Mana",
            "text": "Alright, let's sing!"
          }
        ]
      }
    ]
  }
]
```

## 🤝 Contributing

At this time, I am not accepting direct pull requests or open contributions for this repository, as this is a personal passion project tightly integrated with my own backend systems.

However, if you find any critical bugs or have feedback regarding the engine's performance, feel free to reach out via email at: [dasesplace@gmail.com](dasesplace@gmail.com).

## ⚖️ Disclaimer & Legal Notice

**This is a non-commercial, fan-made project.** The Polaris VN Engine is built solely for educational and entertainment purposes. All in-game assets, including character illustrations, background images, background music (BGM), voice acting (CV), and story scripts, are the copyrighted property of their respective owners **(QualiArts, Music Ray'n, Straight Edge, and the Idoly Pride Project).**

This project does not claim any ownership over the Idoly Pride Intellectual Property and is not affiliated with, endorsed, or sponsored by the official creators. If you are the copyright holder and wish for your assets to be removed, please contact me via email.

## 📝 License

The source code of the Polaris VN Engine (excluding all game assets and story data) is licensed under the MIT License.