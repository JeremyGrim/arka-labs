import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Layers,
  Activity, 
  MessageSquare, 
  Users, 
  FolderKanban,
  Database,
  Settings
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/flows', icon: Layers, label: 'Flows' },
    { path: '/sessions', icon: Activity, label: 'Sessions' },
    { path: '/messages', icon: MessageSquare, label: 'Messages' },
    { path: '/agents', icon: Users, label: 'Agents' },
    { path: '/projects', icon: FolderKanban, label: 'Projets' },
    { path: '/meta', icon: Database, label: 'META' }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="w-64 bg-[#0f1117] border-r border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#cb0f44] to-pink-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="text-lg font-semibold text-white">ARKA</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-[#1a1f2e] text-white'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-[#1a1f2e]/50'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="p-3 border-t border-gray-800">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-300 hover:bg-[#1a1f2e]/50 transition-all">
          <Settings size={18} />
          Paramètres
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
