import React from 'react';
import { Search, Bell, Mail } from 'lucide-react';

export const ClassroomHeader: React.FC = () => {
  return (
    <div className="flex items-center justify-between w-full">
      <h1 className="text-2xl font-bold text-gray-800">Classroom</h1>

      <div className="flex items-center gap-6">
        {/* Search */}
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search"
            className="w-full pl-10 pr-4 py-2 bg-white rounded-lg border-none shadow-sm text-sm focus:ring-2 focus:ring-[#3CB4B4]/20 outline-none transition-all"
          />
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-4 text-gray-500">
          <button className="p-2 hover:bg-white rounded-full transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-400 border-2 border-white rounded-full"></span>
          </button>
          <button className="p-2 hover:bg-white rounded-full transition-colors">
            <Mail size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
