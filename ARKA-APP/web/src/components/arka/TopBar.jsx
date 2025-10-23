import React from 'react';
import { Search, Bell, Settings, HelpCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const TopBar = () => {
  const { theme } = useTheme();

  return (
    <div className="h-16 bg-[#0f1117] border-b border-gray-800 px-6 flex items-center justify-between">
      {/* Search */}
      <div className="flex-1 max-w-2xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Rechercher sessions, flows, agents..."
            className="w-full pl-10 pr-4 py-2 bg-[#1a1f2e] border border-gray-800 rounded-lg text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-gray-700 focus:bg-[#1e2330]"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3 ml-6">
        <button className="p-2 hover:bg-[#1a1f2e] rounded-lg transition-colors">
          <HelpCircle className="text-gray-400" size={20} />
        </button>
        <button className="p-2 hover:bg-[#1a1f2e] rounded-lg transition-colors relative">
          <Bell className="text-gray-400" size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#cb0f44] rounded-full" />
        </button>
        <button className="p-2 hover:bg-[#1a1f2e] rounded-lg transition-colors">
          <Settings className="text-gray-400" size={20} />
        </button>
        <div className="ml-2 flex items-center gap-3 pl-3 border-l border-gray-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold">
            U
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
