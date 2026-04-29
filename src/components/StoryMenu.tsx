import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useVnStore } from "../store/useVnStore";
import SearchBar from "./SearchBar"; // <-- Sesuaikan path import ini jika berbeda
import {
  BookOpen,
  Calendar,
  Heart,
  Users,
  Sparkles,
  Star,
  Loader2,
  PlayCircle,
  FolderOpen,
} from "lucide-react";

const API_BASE = "https://beip.dasewasia.my.id/api";

// --- KATEGORI MENU ---
const CATEGORIES = [
  {
    id: "main",
    label: "Main Story",
    path: "mainstory",
    index: "index_main.json",
    icon: BookOpen,
  },
  {
    id: "event",
    label: "Event Story",
    path: "eventstory",
    index: "index.json",
    icon: Calendar,
  },
  {
    id: "love",
    label: "Love Story",
    path: "lovestory",
    index: "index.json",
    icon: Heart,
  },
  {
    id: "bond",
    label: "Bond Story",
    path: "bondstory",
    index: "index_bond.json",
    icon: Users,
  },
  {
    id: "extra",
    label: "Extra Story",
    path: "extrastory",
    index: "index_extra.json",
    icon: Sparkles,
  },
  {
    id: "card",
    label: "Card Story",
    path: "cardstory",
    index: "index.json",
    icon: Star,
  },
];

const CHARA_CODE_MAP: Record<string, string> = {
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
  shj: "saegusa",
  kyi: "asakura",
  koh: "kohei",
  kohei: "kohei",
  stm: "satomi",
};

interface NormalizedGroup {
  id: string;
  title: string;
  icon?: string | null;
  items: any[];
}

const getCharacterIconUrl = (code: string) => {
  if (!code) return null;
  const lower = code.toLowerCase();

  let assetName = CHARA_CODE_MAP[lower] || lower;
  if (assetName === "snow") {
    assetName = "smiku";
  }

  return `https://apiip.dasewasia.my.id/iconCharacter/chara-${assetName}.png`;
};

const StoryMenu: React.FC = () => {
  const { activeCategory, setActiveCategory, initStory } = useVnStore();
  const [groups, setGroups] = useState<NormalizedGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStoryId, setLoadingStoryId] = useState<string | null>(null);

  // --- STATE SEARCH ---
  const [searchQuery, setSearchQuery] = useState("");

  // Bersihkan search bar ketika user ganti kategori (misal dari Card ke Event)
  useEffect(() => {
    setSearchQuery("");
  }, [activeCategory]);

  useEffect(() => {
    const fetchIndex = async () => {
      setIsLoading(true);
      const cat = CATEGORIES.find((c) => c.id === activeCategory);
      if (!cat) return;

      try {
        const res = await axios.get(`${API_BASE}/${cat.path}/${cat.index}`);

        const normalizedData: NormalizedGroup[] = res.data.map((group: any) => {
          const groupTitle = group.title || group.name || "Unknown Group";
          let rawItems =
            group.episodes || group.stories || group.messages || [];

          if (activeCategory === "card") {
            rawItems = rawItems.filter((item: any) => {
              const itemTitle = (
                item.title ||
                item.name ||
                CHARA_CODE_MAP[item.uniqueId] ||
                ""
              ).toLowerCase();
              return !itemTitle.includes("(short)");
            });
          }

          let groupIcon = group.groupIcon || null;
          if (activeCategory === "bond") {
            groupIcon = getCharacterIconUrl(group.id);
          }

          return {
            id: group.id,
            title: groupTitle,
            icon: groupIcon,
            items: rawItems,
          };
        });

        setGroups(normalizedData);
      } catch (err) {
        console.error(`Failed to load index for ${cat.label}:`, err);
        setGroups([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchIndex();
  }, [activeCategory]);

  const handlePlayStory = async (story: any) => {
    setLoadingStoryId(story.id);
    const cat = CATEGORIES.find((c) => c.id === activeCategory);
    if (!cat) return;

    try {
      const targetFileName = story.fileName;
      const res = await axios.get(
        `${API_BASE}/${cat.path}/stories/${targetFileName}`,
      );

      const newUrl = `${window.location.pathname}?type=${activeCategory}&file=${targetFileName}`;
      window.history.pushState({ path: newUrl }, "", newUrl);

      initStory(res.data.script || res.data.details || res.data);
    } catch (err) {
      console.error(err);
      alert(
        "Failed to load story file. Please ensure the data exists on the server.",
      );
    } finally {
      setLoadingStoryId(null);
    }
  };

  // --- LOGIKA FILTER SEARCH ---
  const filteredGroups = groups
    .map((group) => {
      if (!searchQuery) return group; // Jika kosong, tampilkan semua

      const query = searchQuery.toLowerCase();

      // FUNGSI PINTAR: Mengekstrak ID ("card_kkr_01") menjadi array ["card", "kkr", "01"]
      // lalu mengubah "kkr" menjadi "kokoro" berdasarkan CHARA_CODE_MAP
      const extractCharaNames = (idString: string) => {
        const parts = idString.toLowerCase().split(/[_|-]/);
        return parts.map((p) => CHARA_CODE_MAP[p] || "").join(" ");
      };

      // Ekstrak nama karakter dari ID grup dan ID item
      const groupExpandedName = extractCharaNames(group.id);

      // Gabungkan Judul + ID + Nama Karakter (Mapping) menjadi satu string pencarian
      const groupSearchText =
        `${group.title} ${group.id} ${groupExpandedName}`.toLowerCase();
      const groupMatches = groupSearchText.includes(query);

      // Lakukan hal yang sama untuk episode-episode di dalamnya
      const matchingItems = group.items.filter((item) => {
        const itemExpandedName = extractCharaNames(item.id || "");
        const itemSearchText =
          `${item.title || item.name || ""} ${item.id || ""} ${itemExpandedName}`.toLowerCase();

        return itemSearchText.includes(query);
      });

      // Tampilkan grup JIKA grupnya cocok ATAU ada episodenya yang cocok
      if (groupMatches || matchingItems.length > 0) {
        return {
          ...group,
          // Jika yang dicari adalah nama Grupnya, tampilkan semua episodenya.
          // Tapi jika yang dicari judul Episodenya, tampilkan episode yang cocok saja.
          items: groupMatches ? group.items : matchingItems,
        };
      }

      return null; // Sembunyikan grup yang sama sekali tidak cocok
    })
    .filter(Boolean) as NormalizedGroup[];

  return (
    <div className="flex h-full w-full bg-[#0a0a0f] text-white">
      {/* --- SIDEBAR --- */}
      <div className="w-64 border-r border-white/10 bg-[#0d1117]/95 backdrop-blur-xl z-10 flex flex-col shadow-2xl shrink-0">
        <div className="p-8 pb-6 border-b border-white/5">
          <h1 className="text-2xl font-black italic tracking-widest text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-blue-500 drop-shadow-sm">
            POLARIS VN
          </h1>
          <p className="text-[10px] tracking-[0.2em] font-bold text-gray-500 mt-2 uppercase">
            Story Archive
          </p>

          <div className="mt-6">
            <label className="text-[10px] font-bold text-cyan-500/60 uppercase tracking-widest block mb-2">
              Manager Name
            </label>
            <input
              type="text"
              value={useVnStore((s) => s.playerName)}
              onChange={(e) =>
                useVnStore.getState().setPlayerName(e.target.value)
              }
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-cyan-100 focus:outline-none focus:border-cyan-500/50 transition-colors"
              placeholder="Enter Name..."
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-2">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`relative flex items-center gap-4 rounded-xl px-5 py-4 text-left transition-all duration-300 overflow-hidden cursor-pointer ${
                  isActive
                    ? "text-cyan-300 font-bold bg-cyan-950/40 shadow-[inset_0_0_20px_rgba(34,211,238,0.1)] border border-cyan-500/30"
                    : "text-gray-400 hover:bg-white/5 hover:text-white border border-transparent"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-0 h-full w-1 bg-cyan-400 shadow-[0_0_10px_#22d3ee]"
                  />
                )}
                <Icon
                  size={20}
                  className={isActive ? "text-cyan-400" : "text-gray-600"}
                />
                <span className="tracking-wider text-sm uppercase">
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* --- MAIN CONTENT (GROUP GRID) --- */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

        <div className="px-6 md:px-10 py-6 md:py-8 border-b border-white/5 bg-black/20 backdrop-blur-sm z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 shrink-0">
          <div>
            <span className="text-[10px] text-cyan-400 font-bold tracking-[0.2em] uppercase block mb-1">
              Select Directory
            </span>
            <h2 className="text-3xl font-extrabold text-white drop-shadow-md">
              {CATEGORIES.find((c) => c.id === activeCategory)?.label}
            </h2>
          </div>

          {/* SEARCH BAR CONTAINER */}
          <div className="flex flex-col items-end gap-2 w-full md:w-md">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
            <div className="text-cyan-400 font-mono text-xs tracking-widest opacity-50 mt-1">
              {filteredGroups.length} DIRECTORIES MATCHED
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 scrollbar-thin scrollbar-thumb-cyan-700/50 scrollbar-track-transparent">
          {isLoading ? (
            <div className="flex flex-col h-full items-center justify-center gap-4 text-cyan-400">
              <Loader2 className="animate-spin" size={48} />
              <span className="text-xs font-bold tracking-widest uppercase">
                Fetching Data...
              </span>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="flex h-full items-center justify-center text-gray-500 font-bold tracking-widest uppercase">
              NO DIRECTORY FOUND
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-10">
              {filteredGroups.map((group, idx) => (
                <motion.div
                  key={group.id + idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (idx % 10) * 0.05 }}
                  className="flex flex-col h-95 bg-[#161b22] border border-white/10 rounded-xl overflow-hidden shadow-lg transition-colors hover:border-cyan-500/50"
                >
                  {/* GROUP HEADER */}
                  <div className="flex items-center gap-4 p-5 bg-[#0d1117] border-b border-white/5">
                    {group.icon ? (
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-cyan-500/30 shrink-0">
                        <img
                          src={group.icon}
                          alt={group.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-cyan-950/50 flex items-center justify-center border border-cyan-500/30 shrink-0">
                        <FolderOpen size={24} className="text-cyan-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-white line-clamp-2 leading-tight">
                        {group.title}
                      </h3>
                      <p className="text-xs text-gray-500 font-mono mt-1">
                        {group.items.length} EPISODES
                      </p>
                    </div>
                  </div>

                  {/* EPISODE LIST (SCROLLABLE) */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-white/10">
                    {group.items.map((item, epIdx) => (
                      <button
                        key={item.id || epIdx}
                        onClick={() => !loadingStoryId && handlePlayStory(item)}
                        disabled={!!loadingStoryId}
                        className="w-full flex items-center justify-between p-3 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-cyan-900/40 border border-transparent hover:border-cyan-500/30 transition-all group/btn text-left"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <span className="text-[10px] font-mono text-cyan-600 group-hover/btn:text-cyan-400 shrink-0">
                            {(epIdx + 1).toString().padStart(2, "0")}
                          </span>
                          <span className="truncate tracking-wide">
                            {item.title || item.name || `Episode ${epIdx + 1}`}
                          </span>
                        </div>

                        {loadingStoryId === item.id ? (
                          <Loader2
                            size={16}
                            className="text-cyan-400 animate-spin shrink-0"
                          />
                        ) : (
                          <PlayCircle
                            size={16}
                            className="text-cyan-500 opacity-0 -translate-x-2 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all shrink-0"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoryMenu;
