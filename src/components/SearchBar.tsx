import React from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "Search stories, characters, or IDs...",
}) => {
  return (
    <div className="relative w-full group">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search
          size={16}
          className="text-cyan-500/50 group-focus-within:text-cyan-400 transition-colors"
        />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-10 py-2.5 text-sm text-cyan-100 focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-gray-600 shadow-inner"
        placeholder={placeholder}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-cyan-400 transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
