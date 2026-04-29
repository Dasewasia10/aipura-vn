import { create } from "zustand";

// --- TYPES ---
export interface ChoiceOption {
  text: string;
  route: ScriptLine[];
}

export interface ScriptLine {
  type:
    | "dialogue"
    | "background"
    | "bgm"
    | "sfx"
    | "choice_selection"
    | "jump"
    | "anchor";
  speakerCode?: string | null;
  speakerName?: string;
  speakerNameEn?: string; // TAMBAHAN: Nama bahasa Inggris
  iconUrl?: string | null;
  text?: string;
  translations?: {
    // TAMBAHAN: Objek terjemahan
    en?: string;
    id?: string;
  };
  voiceUrl?: string | null;
  src?: string;
  action?: "play" | "stop";
  choices?: ChoiceOption[];
  nextLabel?: string;
  labelName?: string;
  startTime?: number;
  endTime?: number;
  sfxList?: { src: string; delay: number; startTime?: number }[];
}

export interface StackFrame {
  script: ScriptLine[];
  currentIndex: number;
}

export interface LogEntry {
  speakerName?: string;
  speakerNameEn?: string; // TAMBAHAN
  text?: string;
  translations?: {
    // TAMBAHAN
    en?: string;
    id?: string;
  };
  voiceUrl?: string | null;
}

interface VnState {
  // Data State
  executionStack: StackFrame[];
  isStoryFinished: boolean;
  logHistory: LogEntry[]; // <-- Baru: Menyimpan riwayat obrolan

  // Visual & Audio State
  currentBackground: string | null;

  // Player Settings (Panel Kontrol)
  isAutoPlay: boolean;
  isSkip: boolean;
  uiHidden: boolean;
  showLog: boolean;
  textSpeed: number;
  activeCategory: string;
  playerName: string;
  language: "jp" | "en" | "id";

  // Actions
  currentLine: () => ScriptLine | null;
  initStory: (initialScript: ScriptLine[]) => void;
  nextDialog: () => void;
  makeChoice: (route: ScriptLine[]) => void;

  // Actions Panel Kontrol
  toggleAutoPlay: () => void;
  toggleSkip: () => void;
  setUiHidden: (hidden: boolean) => void;
  setShowLog: (show: boolean) => void;
  cancelAutoAndSkip: () => void;
  setTextSpeed: (speed: number) => void;
  exitStory: () => void;
  setActiveCategory: (cat: string) => void;
  setPlayerName: (name: string) => void;
  setLanguage: (lang: "jp" | "en" | "id") => void;
}

export const useVnStore = create<VnState>((set, get) => ({
  executionStack: [],
  isStoryFinished: false,
  logHistory: [],
  currentBackground: null,

  isAutoPlay: false,
  isSkip: false,
  uiHidden: false,
  showLog: false,
  textSpeed: 50,
  activeCategory: "main",

  playerName: localStorage.getItem("vn_player_name") || "Manager",
  language: (localStorage.getItem("vn_language") as "jp" | "en" | "id") || "jp",

  currentLine: () => {
    const stack = get().executionStack;
    if (stack.length === 0) return null;
    const topFrame = stack[stack.length - 1];
    return topFrame.script[topFrame.currentIndex] || null;
  },

  initStory: (initialScript) => {
    set({
      executionStack: [{ script: initialScript, currentIndex: 0 }],
      isStoryFinished: false,
      currentBackground: null,
      logHistory: [],
      isAutoPlay: false,
      isSkip: false,
      uiHidden: false,
      showLog: false,
    });
  },

  nextDialog: () => {
    set((state) => {
      const { executionStack, logHistory, isStoryFinished } = state;

      if (executionStack.length === 0 || isStoryFinished) return state;

      const topFrame = executionStack[executionStack.length - 1];
      const currentLine = topFrame.script[topFrame.currentIndex];

      // 1. Simpan Log dengan Data Lokalisasi Penuh
      let newLogHistory = [...logHistory];
      if (currentLine?.type === "dialogue" && currentLine.text) {
        newLogHistory.push({
          speakerName: currentLine.speakerName,
          speakerNameEn: currentLine.speakerNameEn,
          text: currentLine.text,
          translations: currentLine.translations,
          voiceUrl: currentLine.voiceUrl,
        });
      }

      // 2. Tentukan Index Berikutnya
      if (topFrame.currentIndex < topFrame.script.length - 1) {
        // MASIH ADA BARIS: Buat tumpukan baru (Immutable)
        const newStack = executionStack.map((frame, i) =>
          i === executionStack.length - 1
            ? { ...frame, currentIndex: frame.currentIndex + 1 }
            : frame,
        );
        return {
          ...state,
          executionStack: newStack,
          logHistory: newLogHistory,
        };
      } else {
        // BARIS HABIS: Coba keluarkan dari tumpukan (Pop)
        const newStack = executionStack.slice(0, -1);

        if (newStack.length === 0) {
          // Benar-benar tamat
          return { ...state, isStoryFinished: true, logHistory: newLogHistory };
        } else {
          // Kembali ke cerita utama dan majukan index-nya (Immutable)
          const updatedStack = newStack.map((frame, i) =>
            i === newStack.length - 1
              ? { ...frame, currentIndex: frame.currentIndex + 1 }
              : frame,
          );
          return {
            ...state,
            executionStack: updatedStack,
            logHistory: newLogHistory,
          };
        }
      }
    });
  },

  makeChoice: (route) => {
    // Matikan mode skip saat memilih pilihan
    set({ isSkip: false, isAutoPlay: false });
    if (route && route.length > 0) {
      const stack = get().executionStack;
      set({ executionStack: [...stack, { script: route, currentIndex: 0 }] });
    } else {
      get().nextDialog();
    }
  },

  toggleAutoPlay: () =>
    set((state) => ({ isAutoPlay: !state.isAutoPlay, isSkip: false })),
  toggleSkip: () =>
    set((state) => ({ isSkip: !state.isSkip, isAutoPlay: false })),
  setUiHidden: (hidden) => set({ uiHidden: hidden }),
  setShowLog: (show) => set({ showLog: show }),
  cancelAutoAndSkip: () => set({ isAutoPlay: false, isSkip: false }),
  setTextSpeed: (speed) => set({ textSpeed: speed }),
  setActiveCategory: (cat) => set({ activeCategory: cat }),
  setPlayerName: (name) => {
    localStorage.setItem("vn_player_name", name);
    set({ playerName: name });
  },
  setLanguage: (lang) => {
    localStorage.setItem("vn_language", lang);
    set({ language: lang });
  },

  exitStory: () => {
    // Saat keluar, kita bersihkan stack tapi biarkan activeCategory tetap ada
    set({
      executionStack: [],
      isStoryFinished: false,
      currentBackground: null,
      logHistory: [],
      isAutoPlay: false,
      isSkip: false,
      uiHidden: false,
    });
    // Hapus parameter story dari URL saat kembali ke menu
    window.history.pushState({}, "", window.location.pathname);
  },
}));
