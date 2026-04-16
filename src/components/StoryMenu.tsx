import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useVnStore } from "../store/useVnStore";
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

interface NormalizedGroup {
  id: string;
  title: string;
  icon?: string | null;
  items: any[];
}

const getCharacterIconUrl = (characterName: string) => {
  if (!characterName) return null;
  let assetName = characterName.toLowerCase().replace(/\s+/g, "");

  if (characterName.toLowerCase() === "snow") {
    assetName = "smiku";
  }
  return `https://apiip.dasewasia.my.id/iconCharacter/chara-${assetName}.png`;
};

const StoryMenu: React.FC = () => {
  const { activeCategory, setActiveCategory, initStory } = useVnStore();
  const [groups, setGroups] = useState<NormalizedGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStoryId, setLoadingStoryId] = useState<string | null>(null);

  useEffect(() => {
    const fetchIndex = async () => {
      setIsLoading(true);
      const cat = CATEGORIES.find((c) => c.id === activeCategory);
      if (!cat) return;

      try {
        const res = await axios.get(`${API_BASE}/${cat.path}/${cat.index}`);

        const normalizedData: NormalizedGroup[] = res.data.map((group: any) => {
          const groupTitle = group.title || group.name || "Unknown Group";

          // Ambil item cerita
          let rawItems =
            group.episodes || group.stories || group.messages || [];

          // FILTER: Hilangkan versi (Short) untuk Card Story
          if (activeCategory === "card") {
            rawItems = rawItems.filter((item: any) => {
              const itemTitle = (item.title || item.name || "").toLowerCase();
              return !itemTitle.includes("(short)");
            });
          }

          // ICON: Gunakan fungsi ikon karakter untuk Bond Story
          let groupIcon = group.groupIcon || null;
          if (activeCategory === "bond") {
            groupIcon = getCharacterIconUrl(groupTitle);
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

  // 2. Mainkan Story & Update URL
  const handlePlayStory = async (story: any) => {
    setLoadingStoryId(story.id);
    const cat = CATEGORIES.find((c) => c.id === activeCategory);
    if (!cat) return;

    try {
      // Penyesuaian: Card Story pakai id.json, yang lain pakai fileName
      const targetFileName =
        activeCategory === "card" ? `${story.id}.json` : story.fileName;
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

  return (
    <div className="flex h-full w-full bg-[#0a0a0f] text-white">
      {/* --- SIDEBAR --- */}
      <div className="w-64 border-r border-white/10 bg-[#0d1117]/95 backdrop-blur-xl z-10 flex flex-col shadow-2xl">
        <div className="p-8 pb-6 border-b border-white/5">
          <h1 className="text-2xl font-black italic tracking-widest text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-blue-500 drop-shadow-sm">
            POLARIS VN
          </h1>
          <p className="text-[10px] tracking-[0.2em] font-bold text-gray-500 mt-2 uppercase">
            Story Archive
          </p>
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

        <div className="px-10 py-8 border-b border-white/5 bg-black/20 backdrop-blur-sm z-10 flex justify-between items-end">
          <div>
            <span className="text-[10px] text-cyan-400 font-bold tracking-[0.2em] uppercase block mb-1">
              Select Directory
            </span>
            <h2 className="text-3xl font-extrabold text-white drop-shadow-md">
              {CATEGORIES.find((c) => c.id === activeCategory)?.label}
            </h2>
          </div>
          <div className="text-cyan-400 font-mono text-sm tracking-widest opacity-50">
            {groups.length} DIRECTORIES
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 scrollbar-thin scrollbar-thumb-cyan-700/50 scrollbar-track-transparent">
          {isLoading ? (
            <div className="flex flex-col h-full items-center justify-center gap-4 text-cyan-400">
              <Loader2 className="animate-spin" size={48} />
              <span className="text-xs font-bold tracking-widest uppercase">
                Fetching Data...
              </span>
            </div>
          ) : groups.length === 0 ? (
            <div className="flex h-full items-center justify-center text-gray-500 font-bold tracking-widest uppercase">
              NO DATA FOUND
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {groups.map((group, idx) => (
                <motion.div
                  key={group.id + idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
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
