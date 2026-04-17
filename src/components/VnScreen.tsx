import React, { useState, useEffect, useRef } from "react";
import { useVnStore } from "../store/useVnStore";
import { Howl } from "howler";
import {
  History,
  Play,
  FastForward,
  EyeOff,
  X,
  Home,
  PlayCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const R2_DOMAIN = "https://apiip.dasewasia.my.id";

const SPRITE_MAP: Record<string, string> = {
  rio: "rio",
  aoi: "aoi",
  ai: "ai",
  kkr: "kokoro",
  rui: "rui",
  yu: "yu",
  smr: "sumire",
  mna: "mana",
  ktn: "kotono",
  skr: "sakura",
  rei: "rei",
  ngs: "nagisa",
  hrk: "haruko",
  ski: "saki",
  suz: "suzu",
  mei: "mei",
  szk: "shizuku",
  chs: "chisa",
  chk: "chika",
  cca: "cocoa",
  chn: "chino",
  mhk: "miho",
  kan: "kana",
  kor: "fran",
  mana: "mana",
  saegusa: "saegusa",
  asakura: "asakura",
  koh: "kohei",
  kohei: "kohei",
  stm: "satomi",
};

const VnScreen: React.FC = () => {
  const store = useVnStore();
  const line = store.currentLine();

  const isStoryFinished = useVnStore((s) => s.isStoryFinished);
  const isSkip = useVnStore((s) => s.isSkip);
  const isAutoPlay = useVnStore((s) => s.isAutoPlay);

  const parseText = (text?: string) => {
    if (!text) return "";
    return text.replace(/{user}/g, store.playerName);
  };

  // --- AUDIO REFERENCES ---
  // Menyimpan instance pemutar audio agar bisa dimatikan/di-fade nanti
  const bgmRef = useRef<Howl | null>(null);
  const voiceRef = useRef<Howl | null>(null);
  const autoPlayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentBgmSrc = useRef<string | null>(null);

  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const [hasInteracted, setHasInteracted] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Membersihkan audio jika komponen dihancurkan (misal kembali ke menu)
  useEffect(() => {
    return () => {
      bgmRef.current?.unload();
      voiceRef.current?.unload();
      if (autoPlayTimer.current) clearTimeout(autoPlayTimer.current);
    };
  }, []);

  // --- LOGIKA UTAMA (RENDER & EKSEKUSI BARIS) ---
  useEffect(() => {
    if (!hasInteracted || !line) return;
    if (autoPlayTimer.current) clearTimeout(autoPlayTimer.current);

    if (line.type === "background" && line.src) {
      useVnStore.setState({ currentBackground: line.src });
    }

    if (line.type === "bgm") {
      if (line.action === "play" && line.src) {
        // PENCEGAHAN BGM BERTUMPUK: Jika lagu yang sama sudah dimainkan, abaikan!
        if (currentBgmSrc.current === line.src) return;

        if (bgmRef.current) {
          const oldBgm = bgmRef.current;
          oldBgm.fade(oldBgm.volume(), 0, 1000);
          setTimeout(() => oldBgm.unload(), 1000);
        }

        const newBgm = new Howl({
          src: [line.src],
          loop: true,
          volume: 0,
          html5: true,
        });
        newBgm.play();
        newBgm.fade(0, 0.4, 1500);

        bgmRef.current = newBgm;
        currentBgmSrc.current = line.src; // Catat lagu yang sedang jalan
      } else if (line.action === "stop") {
        if (bgmRef.current) {
          const oldBgm = bgmRef.current;
          oldBgm.fade(oldBgm.volume(), 0, 1000);
          setTimeout(() => oldBgm.unload(), 1000);
          bgmRef.current = null;
          currentBgmSrc.current = null;
        }
      }
    }

    // Tangkap Voice
    if (line.type === "dialogue") {
      if (voiceRef.current) voiceRef.current.stop();
      if (line.voiceUrl) {
        voiceRef.current = new Howl({ src: [line.voiceUrl], volume: 1 });
        voiceRef.current.play();

        // Logika Auto-Play jika ada suara: tunggu suara selesai + 1 detik
        if (store.isAutoPlay && !store.isSkip) {
          voiceRef.current.on("end", () => {
            autoPlayTimer.current = setTimeout(() => store.nextDialog(), 1000);
          });
        }
      } else {
        // Logika Auto-Play tanpa suara: durasi berdasarkan panjang teks
        if (store.isAutoPlay && !store.isSkip && line.text) {
          const delay = Math.max(2000, line.text.length * 50); // Minimal 2 detik
          autoPlayTimer.current = setTimeout(() => store.nextDialog(), delay);
        }
      }
    }

    // --- AUTO-ADVANCE UNTUK BARIS TEKNIS ---
    if (
      !store.isStoryFinished &&
      line.type !== "dialogue" &&
      line.type !== "choice_selection"
    ) {
      // Cek apakah ini baris terakhir di tumpukan paling bawah
      const stack = store.executionStack;
      const topFrame = stack[stack.length - 1];
      const isAbsoluteLastLine =
        stack.length === 1 &&
        topFrame.currentIndex === topFrame.script.length - 1;

      // JANGAN auto-advance jika ini adalah baris terakhir dari seluruh cerita
      // Agar pemain bisa melihat background terakhir sebelum benar-benar selesai
      if (!isAbsoluteLastLine) {
        const timer = setTimeout(() => {
          store.nextDialog();
        }, 100); // Beri jeda sedikit lebih lama (100ms) agar transisi terlihat
        return () => clearTimeout(timer);
      }
    }

    // Logika Mode Skip (Gasspoll!)
    if (store.isSkip) {
      if (line.type === "choice_selection") {
        store.cancelAutoAndSkip(); // Stop skip jika ketemu pilihan
      } else if (line.type === "dialogue") {
        autoPlayTimer.current = setTimeout(() => store.nextDialog(), 100); // Kecepatan skip 100ms
      }
    }
  }, [line, store.isAutoPlay, store.isSkip, hasInteracted]);

  // --- LOGIKA TYPEWRITER ---
  useEffect(() => {
    if (!hasInteracted) return;
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }

    if (line?.type === "dialogue" && line.text) {
      const processedText = parseText(line.text);
      if (store.isSkip) {
        setDisplayedText(processedText);
        setIsTyping(false);
        return;
      }

      setDisplayedText("");
      setIsTyping(true);
      let i = 0;

      typingIntervalRef.current = setInterval(() => {
        i++;
        setDisplayedText(processedText.substring(0, i));
        if (i >= processedText.length) {
          if (typingIntervalRef.current)
            clearInterval(typingIntervalRef.current);
          setIsTyping(false);
        }
      }, store.textSpeed || 30);

      // 3. Cleanup saat komponen atau baris berganti
      return () => {
        if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
      };
    } else {
      setDisplayedText(parseText(line?.text));
      setIsTyping(false);
    }
  }, [line, store.isSkip, store.textSpeed, hasInteracted]);

  // --- HANDLE KLIK ---
  const handleScreenClick = () => {
    if (Howler.ctx && Howler.ctx.state === "suspended") {
      Howler.ctx.resume();
    }

    if (store.showLog) return;

    if (store.uiHidden) {
      store.setUiHidden(false);
      return;
    }

    if (isAutoPlay || isSkip) {
      store.cancelAutoAndSkip();
      return;
    }

    if (isTyping) {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
      setDisplayedText(parseText(line?.text));
      setIsTyping(false);
      return;
    }

    // Panggil nextDialog
    if (line?.type !== "choice_selection") {
      console.log("Advancing to next line..."); // Untuk memantau di console
      store.nextDialog();
    }
  };

  // OVERLAY 1: Click to Start
  if (!hasInteracted) {
    return (
      <div
        className="absolute inset-0 z-200 flex items-center justify-center bg-black/80 backdrop-blur-md cursor-pointer select-none"
        onClick={() => {
          setHasInteracted(true);
          if (Howler.ctx && Howler.ctx.state === "suspended") {
            Howler.ctx.resume();
          }
        }}
      >
        <div className="flex flex-col items-center animate-pulse text-cyan-400">
          <PlayCircle
            size={80}
            className="mb-6 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]"
          />
          <h2 className="text-3xl font-extrabold tracking-widest text-white drop-shadow-lg">
            CLICK TO START
          </h2>
        </div>
      </div>
    );
  }

  if (isStoryFinished) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-black text-white select-none">
        <h1 className="mb-8 text-4xl font-bold tracking-widest text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
          EPISODE CLEARED
        </h1>
        <button
          onClick={(e) => {
            e.stopPropagation();
            bgmRef.current?.unload();
            voiceRef.current?.unload();
            store.exitStory();
          }}
          className="rounded-full border border-white/20 bg-white/10 px-10 py-4 text-xl font-bold transition-all hover:bg-white hover:text-black hover:scale-105 cursor-pointer"
        >
          BACK TO MENU
        </button>
      </div>
    );
  }

  if (!line) return null;

  const getSpriteUrl = (code?: string | null) => {
    if (!code) return null;
    const lower = code.toLowerCase();
    if (
      ["unknown", "narration", "manager", "mob", "koh", "kohei"].includes(lower)
    )
      return null;
    const filename = SPRITE_MAP[lower] || lower;
    return `${R2_DOMAIN}/spriteCharacter/sprite-${filename}-01.webp`;
  };

  const getSpriteStyle = (code?: string | null) => {
    if (!code) return "";
    const lower = code.toLowerCase();
    if (["kor"].includes(lower)) {
      let style = "lg:translate-y-80 ";
      if (lower === "mhk") {
        style += "lg:translate-y-96";
      }
      return style;
    }
    return "";
  };

  // Panggil fungsi untuk mengecek apakah karakter ini punya sprite
  const spriteUrl =
    line.type === "dialogue" ? getSpriteUrl(line.speakerCode) : null;
  const isChoiceMode = line.type === "choice_selection";

  return (
    <div
      className={`relative h-full w-full bg-zinc-900 overflow-hidden select-none ${isChoiceMode ? "cursor-default" : "cursor-pointer"}`}
      onClick={isChoiceMode ? undefined : handleScreenClick}
    >
      {/* 1. LAYER BACKGROUND DENGAN ANIMASI FADE */}
      <AnimatePresence mode="wait">
        {store.currentBackground && (
          <motion.img
            key={store.currentBackground} // Key penting agar React tahu gambarnya beda dan memicu animasi
            src={store.currentBackground}
            alt="bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
      </AnimatePresence>

      {/* 2. LAYER KARAKTER DENGAN ANIMASI SLIDE UP */}
      <AnimatePresence mode="wait">
        {spriteUrl && !isChoiceMode && (
          <motion.div
            key={spriteUrl + line.speakerCode} // Animasi diulang jika sprite atau karakter berubah
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4 }}
            className="absolute top-[3%] left-0 w-full h-full overflow-hidden pointer-events-none"
          >
            <div
              className={`relative flex h-full w-full justify-center ${getSpriteStyle(line.speakerCode)}`}
            >
              <img
                src={spriteUrl}
                alt="character"
                className="h-[200%] object-contain object-top -translate-y-[2%] drop-shadow-[0_0_15px_rgba(0,0,0,0.8)]"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. LAYER UI & DIALOG */}
      <AnimatePresence>
        {!store.uiHidden && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none"
          >
            {/* PANEL KONTROL */}
            {!isChoiceMode && (
              <div
                className="absolute top-4 right-4 flex gap-3 z-40 bg-black/40 p-2 rounded-full backdrop-blur-sm border border-white/10 pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => store.setShowLog(true)}
                  className="cursor-pointer p-2 rounded-full text-white/70 hover:text-white hover:bg-white/20 transition"
                >
                  <History size={20} />
                </button>
                <button
                  onClick={store.toggleAutoPlay}
                  className={`cursor-pointer p-2 rounded-full transition ${store.isAutoPlay ? "text-cyan-400 bg-cyan-400/20" : "text-white/70 hover:text-white hover:bg-white/20"}`}
                >
                  <Play size={20} />
                </button>
                <button
                  onClick={store.toggleSkip}
                  className={`cursor-pointer p-2 rounded-full transition ${store.isSkip ? "text-cyan-400 bg-cyan-400/20" : "text-white/70 hover:text-white hover:bg-white/20"}`}
                >
                  <FastForward size={20} />
                </button>
                <button
                  onClick={() => store.setUiHidden(true)}
                  className="cursor-pointer p-2 rounded-full text-white/70 hover:text-white hover:bg-white/20 transition"
                >
                  <EyeOff size={20} />
                </button>
                <div className="w-px h-8 bg-white/20 my-auto"></div>{" "}
                {/* Garis pemisah */}
                <button
                  onClick={() => setShowExitConfirm(true)}
                  className="cursor-pointer p-2 rounded-full text-red-400 hover:text-white hover:bg-red-500/50 transition mr-1"
                  title="Return to Menu"
                >
                  <Home size={20} />
                </button>
              </div>
            )}

            {/* KOTAK DIALOG */}
            {line.type === "dialogue" && (
              <div className="absolute bottom-8 left-1/2 w-[90%] max-w-5xl -translate-x-1/2 z-30 pointer-events-auto">
                {line.speakerName && (
                  <div className="absolute -top-10 left-4 inline-block bg-slate-800 px-6 py-1.5 text-lg font-bold text-white shadow-md border-b-2 border-cyan-500 rounded-t-lg">
                    {parseText(line.speakerName)}
                  </div>
                )}
                <div className="min-h-35 w-full rounded-lg rounded-tl-none border border-white/20 bg-black/75 p-6 text-white backdrop-blur-md shadow-2xl relative">
                  <p className="text-xl leading-relaxed whitespace-pre-wrap">
                    {displayedText}
                  </p>
                  <div className="absolute bottom-4 right-4 text-cyan-400">
                    {store.isAutoPlay
                      ? "►"
                      : store.isSkip
                        ? "▶▶"
                        : !isTyping
                          ? "▼"
                          : ""}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. LAYER PILIHAN (CHOICES) - Tetap sama */}
      {isChoiceMode && line.choices && !store.uiHidden && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto"
        >
          {line.text && (
            <div className="mb-8 max-w-3xl text-center text-2xl font-semibold text-white drop-shadow-md">
              {line.text}
            </div>
          )}
          <div className="flex w-full max-w-2xl flex-col gap-4 px-4">
            {line.choices.map((choice, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  store.makeChoice(choice.route);
                }}
                className="w-full rounded-xl border border-cyan-500/30 bg-slate-900/90 py-5 px-6 text-center text-xl text-white transition-all hover:scale-[1.02] hover:bg-cyan-900/80 hover:border-cyan-400 cursor-pointer"
              >
                {parseText(choice.text)}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* 5. LOG MODAL OVERLAY */}
      <AnimatePresence>
        {store.showLog &&
          (() => {
            const activeLog =
              line?.type === "dialogue" && line.text
                ? { speakerName: line.speakerName, text: line.text }
                : null;
            const displayLogs = activeLog
              ? [...store.logHistory, activeLog]
              : store.logHistory;

            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-100 bg-black/80 flex justify-center p-8 backdrop-blur-sm pointer-events-auto"
                onClick={() => store.setShowLog(false)}
              >
                <motion.div
                  initial={{ y: 50 }}
                  animate={{ y: 0 }}
                  exit={{ y: 50 }}
                  className="w-full max-w-4xl bg-slate-900 border border-cyan-500/30 rounded-xl flex flex-col shadow-2xl overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center p-4 border-b border-white/10 bg-black/50">
                    <h2 className="text-xl font-bold text-cyan-400">
                      Dialogue Log
                    </h2>
                    <button
                      onClick={() => store.setShowLog(false)}
                      className="text-gray-400 hover:text-white transition"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-cyan-700">
                    {displayLogs.length === 0 ? (
                      <p className="text-center text-gray-500 italic mt-10">
                        No dialogue history.
                      </p>
                    ) : (
                      displayLogs.map((log, i) => (
                        <div
                          key={i}
                          className="border-b border-white/5 pb-4 last:border-0"
                        >
                          {log.speakerName && (
                            <p className="text-cyan-300 font-bold mb-1 text-sm">
                              {log.speakerName}
                            </p>
                          )}
                          <p className="text-gray-200 leading-relaxed">
                            {parseText(log.text)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              </motion.div>
            );
          })()}
      </AnimatePresence>

      {/* OVERLAY 3: Modal Konfirmasi Keluar */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-200 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-slate-900 border border-cyan-500/30 p-8 rounded-2xl shadow-2xl max-w-md text-center"
            >
              <h3 className="text-2xl font-bold text-white mb-4">
                Return to Menu?
              </h3>
              <p className="text-gray-400 mb-8 leading-relaxed">
                Are you sure you want to exit? Your current progress in this
                episode will be lost.
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="px-6 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    bgmRef.current?.unload();
                    voiceRef.current?.unload();
                    store.exitStory();
                  }}
                  className="px-6 py-3 rounded-lg bg-red-600/80 hover:bg-red-500 text-white font-bold border border-red-500/50 transition-colors shadow-[0_0_15px_rgba(220,38,38,0.3)] cursor-pointer"
                >
                  Confirm Exit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VnScreen;
