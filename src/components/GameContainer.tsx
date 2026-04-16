import React from "react";

interface GameContainerProps {
  children: React.ReactNode;
}

const GameContainer: React.FC<GameContainerProps> = ({ children }) => {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#0a0a0a]">
      {/* Container Utama: 
        - aspect-video memaksa rasio 16:9
        - max-w-screen-2xl membatasi ukuran maksimal di layar besar
        - overflow-hidden memastikan sprite tidak "bocor" ke luar layar
      */}
      <div className="relative flex aspect-video w-full max-w-screen-2xl flex-col overflow-hidden bg-black shadow-2xl">
        {children}
      </div>
    </div>
  );
};

export default GameContainer;