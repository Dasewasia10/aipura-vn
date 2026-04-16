import { useEffect, useState } from "react";
import axios from "axios";
import { useVnStore } from "./store/useVnStore";
import GameContainer from "./components/GameContainer";
import VnScreen from "./components/VnScreen";
import StoryMenu from "./components/StoryMenu";
import { Loader2 } from "lucide-react";

const API_BASE = "https://beip.dasewasia.my.id/api";

function App() {
  const { executionStack, isStoryFinished, initStory } = useVnStore();
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get("type");
    const file = params.get("file");

    if (type && file) {
      const loadFromUrl = async () => {
        try {
          const res = await axios.get(`${API_BASE}/${type}story/${file}`);
          initStory(res.data.script || res.data.details || res.data);
        } catch (e) {
          console.error("Failed to load story from URL:", e);
          window.history.pushState({}, "", window.location.pathname);
        } finally {
          setIsRestoring(false);
        }
      };
      loadFromUrl();
    } else {
      setIsRestoring(false);
    }
  }, [initStory]);

  if (isRestoring) {
    return (
      <GameContainer>
        <div className="flex h-full w-full items-center justify-center bg-[#0a0a0f]">
          <div className="flex flex-col items-center gap-4 text-cyan-400">
            <Loader2 className="animate-spin" size={48} />
            <span className="tracking-widest font-bold">RESTORING STORY...</span>
          </div>
        </div>
      </GameContainer>
    );
  }

  const isViewingStory = executionStack.length > 0 || isStoryFinished;

  return (
    <GameContainer>
      <div className="relative h-full w-full">
        {isViewingStory ? <VnScreen /> : <StoryMenu />}
      </div>
    </GameContainer>
  );
}

export default App;