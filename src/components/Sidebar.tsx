import React from 'react';
import { 
  Files, 
  MessageSquare, 
  Settings, 
  Sparkles,
  HelpCircle,
  Terminal,
  Code,
  GitBranch,
  Github
} from 'lucide-react';

export type SidebarTab = 'explorer' | 'git' | null;

interface SidebarProps {
  activeTab: SidebarTab;
  onSelectTab: (tab: SidebarTab) => void;
  workspaceName?: string;
}

export default function Sidebar({
  activeTab,
  onSelectTab,
  workspaceName = 'Workspace'
}: SidebarProps) {
  const tabs = [
    {
      id: 'explorer' as const,
      icon: Files,
      label: 'File Explorer',
      hotkey: 'Ctrl+Shift+E'
    },
     {
      id: 'git' as const,
      icon: GitBranch,
      label: 'Source Control & GitHub',
      hotkey: 'Ctrl+Shift+G'
    }
  ];

  return (
    <div id="sidebar-activity-bar" className="w-12 h-full bg-[#333333] border-r border-[#1e1e1e] flex flex-col items-center justify-between py-4 select-none">
      
      {/* Top action groups */}
      <div className="flex flex-col items-center gap-4 w-full">
        {/* Workspace Brand Indicator */}
        <div className="w-8 h-8 rounded-lg bg-[#007acc] flex items-center justify-center text-white font-black text-sm shadow-md mb-3" title="Code Runner Workspace">
          <Code className="w-4 h-4 text-white" />
        </div>

        {/* Dynamic Navigation Rails */}
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const IconComponent = tab.icon;

          return (
            <div key={tab.id} className="relative group w-full flex justify-center">
              {/* VS Code active bar (left edge highlight) */}
              {isActive && (
                <div className="absolute left-0 top-1 bottom-1 w-[2px] bg-white rounded-r" />
              )}

              <button
                id={`sidebar-tab-btn-${tab.id}`}
                onClick={() => onSelectTab(isActive ? null : tab.id)}
                className={`p-2.5 rounded-lg transition-all duration-150 relative ${
                  isActive 
                    ? 'text-white bg-[#1e1e1e]' 
                    : 'text-[#cccccc]/60 hover:text-white hover:bg-white/5'
                }`}
                title={`${tab.label} (${tab.hotkey})`}
              >
                <IconComponent className="w-5 h-5" />
              </button>

              {/* Tooltip on hover */}
              <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-[#252526] text-[#cccccc] text-[10px] font-semibold tracking-wide py-1 px-2.5 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 border border-[#454545]">
                {tab.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom system actions */}
      <div className="flex flex-col items-center gap-4 w-full">
        {/* Quick Help Indicator */}
        <div className="relative group w-full flex justify-center">
          
          <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-[#252526] text-[#cccccc] text-[10px] font-semibold tracking-wide py-1 px-2.5 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 border border-[#454545]">
            AI Studio Documentation
          </div>
        </div>
      </div>
    </div>
  );
}
