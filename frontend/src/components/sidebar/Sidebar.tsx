import React, { useState } from "react";
import {
  PanelRight,
  Plus,
  Search,
  Upload,
  Settings,
  Folder,
  RefreshCcw,
} from "lucide-react";

function Sidebar() {
  const [open, setOpen] = useState(true);
  const [fileHovering, setFileHovering] = useState(false);
  return (
    <div className="flex">
      <div
        className={`${
          open ? "w-64" : "w-16"
        } bg-secondary h-screen flex flex-col transition-all duration-300 ease-in-out`}
      >
        {/* Header with toggle button */}
        <div
          className={`flex items-center justify-between p-4 ${
            !open && "justify-center"
          }`}
        >
          <div
            className={`${!open && "hidden"} text-white font-semibold text-lg`}
          >
            Menu
          </div>

          <div
            onClick={() => setOpen(!open)}
            className="flex justify-center items-center p-3 rounded-lg cursor-pointer hover:bg-hover 0 transition-colors duration-200 outline-none focus:outline-none focus:ring-0"
          >
            <PanelRight
              size={24}
              className={`${
                open ? "rotate-180" : ""
              } text-gray-300 transition-transform duration-300`}
            />
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex-1 p-2">
          <div className="flex items-center p-3 mb-1 gap-3 rounded-lg text-gray-300 cursor-pointer hover:bg-hover hover:text-white transition-all duration-200">
            <Plus size={24} className="flex-shrink-0" />
            <span
              className={`${
                !open && "hidden"
              } whitespace-nowrap transition-opacity duration-200`}
            >
              New Chat
            </span>
          </div>
          <div className="flex items-center p-3 mb-1 gap-3 rounded-lg text-gray-300 cursor-pointer hover:bg-hover hover:text-white transition-all duration-200">
            <Search size={24} className="flex-shrink-0" />
            <span
              className={`${
                !open && "hidden"
              } whitespace-nowrap transition-opacity duration-200`}
            >
              Search
            </span>
          </div>
          <div className="flex items-center p-3 mb-1 gap-3 rounded-lg text-gray-300 cursor-pointer hover:bg-hover hover:text-white transition-all duration-200">
            <input type="file" className="hidden" accept=".pdf,.txt,.csv,.md" />
            <Upload size={24} className="flex-shrink-0" />
            <span
              className={`${
                !open && "hidden"
              } whitespace-nowrap transition-opacity duration-200`}
            >
              Upload
            </span>
          </div>
          <div className="flex items-center p-3 gap-3 rounded-lg text-gray-300 cursor-pointer hover:bg-hover hover:text-white transition-all duration-200">
            <Settings size={24} className="flex-shrink-0" />
            <span
              className={`${
                !open && "hidden"
              } whitespace-nowrap transition-opacity duration-200`}
            >
              Settings
            </span>
          </div>
        </div>

        {/* Chats */}
        <div className={`flex-1 p-4 ${!open && "hidden"}`}>
          <div className="text-gray-300 font-semibold text-xl">Chats</div>
        </div>

        {/* Files */}
        <div
          onMouseEnter={() => setFileHovering(true)}
          onMouseLeave={() => setFileHovering(false)}
          className={`flex-1 p-4 ${!open && "hidden"}`}
        >
          {/* File Header and Actions */}
          <div className="flex justify-between">
            <div className="flex text-gray-300 font-semibold text-xl">
              Files
            </div>
            <div
              className={`flex text-gray-300 gap-2 ${
                !fileHovering && "hidden"
              }`}
            >
              <Plus
                size={24}
                className="cursor-pointer hover:bg-hover rounded-lg p-1 flex-shrink-0"
              />
              <Folder
                size={24}
                className="cursor-pointer hover:bg-hover rounded-lg p-1 flex-shrink-0"
              />
              <RefreshCcw
                size={24}
                className="cursor-pointer hover:bg-hover rounded-lg p-1 flex-shrink-0"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
