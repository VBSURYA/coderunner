// @ts-nocheck
import React from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { FileItem, EditorSettings } from '../types';
import { 
  Play, 
  Settings, 
  FileText, 
  X, 
  Check, 
  RefreshCw,
  Maximize2,
  Minimize2,
  Terminal,
  Github,
  GitBranch,
  ShieldCheck,
  Smartphone,
  Zap,
  Sparkles,
  Lock,
  Code2
} from 'lucide-react';

interface EditorAreaProps {
  files: FileItem[];
  activeFileId: string | null;
  onSelectFile: (id: string) => void;
  onUpdateFileContent: (id: string, content: string) => void;
  onCloseFile: (id: string) => void;
  openTabs: string[]; // List of file IDs currently in tabs
  settings: EditorSettings;
  onUpdateSettings: (settings: Partial<EditorSettings>) => void;
  onRunCode: () => void;
  isRunning: boolean;
  isTerminalVisible: boolean;
  onToggleTerminal: () => void;
}

export default function EditorArea({
  files,
  activeFileId,
  onSelectFile,
  onUpdateFileContent,
  onCloseFile,
  openTabs,
  settings,
  onUpdateSettings,
  onRunCode,
  isRunning,
  isTerminalVisible,
  onToggleTerminal
}: EditorAreaProps) {
  const [showSettingsDropdown, setShowSettingsDropdown] = React.useState(false);
  const activeFile = files.find(f => f.id === activeFileId);

  const handleEditorChange = (value: string | undefined) => {
    if (activeFileId && value !== undefined) {
      onUpdateFileContent(activeFileId, value);
    }
  };

  // Setup custom completions or code actions on editor mount if desired
  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    // Monaco editor is ready
    // Add custom keyboard shortcut (e.g. Ctrl+Enter or Cmd+Enter to Run Code)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onRunCode();
    });
  };

  const getLanguageAlias = (lang: string) => {
    if (lang === 'js') return 'javascript';
    if (lang === 'ts') return 'typescript';
    if (lang === 'py') return 'python';
    return lang;
  };

  return (
    <div id="editor-area-container" className="flex flex-col h-full bg-[#1e1e1e] relative">
      
      {/* 1. Tabs Bar */}
      <div className="flex items-center justify-between border-b border-[#1e1e1e] bg-[#252526] h-10 overflow-x-auto select-none scrollbar-thin">
        <div id="tabs-list" className="flex items-center h-full">
          {openTabs.map(tabId => {
            const file = files.find(f => f.id === tabId);
            if (!file) return null;
            const isActive = file.id === activeFileId;

            return (
              <div
                key={file.id}
                id={`tab-${file.id}`}
                onClick={() => onSelectFile(file.id)}
                className={`group flex items-center gap-2 px-4 h-full border-r border-[#1e1e1e] text-xs font-mono cursor-pointer transition ${
                  isActive 
                    ? 'bg-[#1e1e1e] text-white border-t border-[#007acc]' 
                    : 'bg-[#2d2d2d]/30 text-gray-400 hover:bg-[#2a2d2e]/50 hover:text-gray-200'
                }`}
              >
                <FileText className={`w-3.5 h-3.5 ${isActive ? 'text-[#007acc]' : 'text-gray-500'}`} />
                <span className="truncate max-w-[120px]">{file.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseFile(file.id);
                  }}
                  className="p-0.5 rounded text-gray-500 hover:text-white hover:bg-[#333333] opacity-0 group-hover:opacity-100 focus:opacity-100 transition"
                  title="Close tab"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Global Toolbar Controls */}
        <div className="flex items-center gap-2 px-3">
          {/* Quick theme toggler */}
          <button
            onClick={() => onUpdateSettings({ theme: settings.theme === 'vs-dark' ? 'light' : 'vs-dark' })}
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#333333] transition"
            title="Toggle Light/Dark Theme"
          >
            <span className="text-[10px] uppercase font-bold tracking-wider">{settings.theme === 'vs-dark' ? 'Dark' : 'Light'}</span>
          </button>

          {/* Quick Word Wrap toggler */}
          <button
            onClick={() => onUpdateSettings({ wordWrap: settings.wordWrap === 'on' ? 'off' : 'on' })}
            className={`p-1 rounded text-xs transition ${settings.wordWrap === 'on' ? 'text-[#007acc] bg-[#007acc]/10' : 'text-gray-400 hover:text-white hover:bg-[#333333]'}`}
            title="Toggle Word Wrap"
          >
            <span className="text-[10px] font-bold">Wrap</span>
          </button>
        </div>
      </div>

      {/* 2. Primary ToolBar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#333333] bg-[#1e1e1e] text-[#cccccc]">
        <div className="flex items-center gap-3">
          {/* RUN CODE BUTTON */}
          <button
            id="btn-run-code"
            onClick={onRunCode}
            disabled={isRunning || !activeFile}
            className={`flex items-center gap-1.5 px-3.5 py-1 text-xs font-semibold rounded shadow-md transition ${
              isRunning 
                ? 'bg-amber-600/30 text-amber-300 cursor-not-allowed' 
                : !activeFile 
                  ? 'bg-[#333333] text-gray-500 cursor-not-allowed'
                  : 'bg-[#007acc] hover:bg-[#0062a3] text-white active:scale-95'
            }`}
            title="Execute Code (Ctrl+Enter)"
          >
            {isRunning ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{isRunning ? 'Running...' : 'Run Code'}</span>
          </button>

          {/* TOGGLE TERMINAL BUTTON */}
          <button
            id="btn-toggle-terminal-editor"
            onClick={onToggleTerminal}
            className={`flex items-center gap-1.5 px-3.5 py-1 text-xs font-semibold rounded border transition active:scale-95 ${
              isTerminalVisible 
                ? 'bg-[#2d2d30] border-[#454545] text-gray-300 hover:bg-[#3e3e40] hover:text-white' 
                : 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent'
            }`}
            title="Toggle Console/Terminal (Ctrl+`)"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>{isTerminalVisible ? 'Hide Terminal' : 'Show Terminal'}</span>
          </button>
        </div>

        {/* Configurations Toggle */}
        <div className="relative">
          <button
            id="btn-settings-dropdown"
            onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
            className="p-1.5 rounded hover:bg-[#333333] text-gray-400 hover:text-white transition"
            title="Editor Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {showSettingsDropdown && (
            <div id="settings-dropdown" className="absolute right-0 top-full mt-2 w-56 bg-[#252526] border border-[#454545] rounded shadow-xl py-3 px-4 z-50 text-xs text-gray-300 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="font-semibold text-gray-400 pb-1.5 border-b border-[#454545] uppercase tracking-wider text-[10px]">
                Editor Settings
              </div>

              {/* FontSize Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-gray-400">
                  <span>Font Size</span>
                  <span className="font-mono">{settings.fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="24"
                  step="1"
                  value={settings.fontSize}
                  onChange={(e) => onUpdateSettings({ fontSize: parseInt(e.target.value) })}
                  className="w-full accent-[#007acc]"
                />
              </div>

              {/* Tab Size Dropdown */}
              <div className="flex items-center justify-between">
                <span>Tab Size</span>
                <select
                  value={settings.tabSize}
                  onChange={(e) => onUpdateSettings({ tabSize: parseInt(e.target.value) as 2 | 4 })}
                  className="px-2 py-1 bg-[#1e1e1e] border border-[#454545] rounded focus:outline-none focus:border-[#007acc] text-white font-mono"
                >
                  <option value={2}>2 Spaces</option>
                  <option value={4}>4 Spaces</option>
                </select>
              </div>

              {/* Minimap Toggle */}
              <label className="flex items-center justify-between cursor-pointer">
                <span>Show Minimap</span>
                <input
                  type="checkbox"
                  checked={settings.minimap}
                  onChange={(e) => onUpdateSettings({ minimap: e.target.checked })}
                  className="rounded bg-[#1e1e1e] border-[#454545] text-[#007acc] focus:ring-0 focus:ring-offset-0 w-4 h-4"
                />
              </label>

              {/* Theme Selector */}
              <div className="flex items-center justify-between pt-1.5 border-t border-[#454545]">
                <span>Theme</span>
                <select
                  value={settings.theme}
                  onChange={(e) => onUpdateSettings({ theme: e.target.value as any })}
                  className="px-2 py-1 bg-[#1e1e1e] border border-[#454545] rounded focus:outline-none focus:border-[#007acc] text-white"
                >
                  <option value="vs-dark">VS Dark</option>
                  <option value="light">VS Light</option>
                  <option value="hc-black">High Contrast</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Editor Core */}
      <div className="flex-1 min-h-0 relative">
        {activeFile ? (
          <div className="w-full h-full bg-[#1e1e1e]">
            <Editor
              id="monaco-editor-instance"
              height="100%"
              language={getLanguageAlias(activeFile.language)}
              value={activeFile.content}
              theme={settings.theme}
              onChange={handleEditorChange}
              onMount={handleEditorDidMount}
              options={{
                fontSize: settings.fontSize,
                tabSize: settings.tabSize,
                wordWrap: settings.wordWrap,
                minimap: { enabled: settings.minimap },
                automaticLayout: true,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                fontFamily: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
                lineNumbers: 'on',
                roundedSelection: true,
                selectOnLineNumbers: true,
                scrollBeyondLastLine: false,
                padding: { top: 12, bottom: 12 },
                quickSuggestions: {
                  other: true,
                  comments: false,
                  strings: false
                }
              }}
              loading={
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1e1e1e] text-[#007acc]">
                  <RefreshCw className="w-8 h-8 animate-spin mb-2" />
                  <span className="text-xs font-medium tracking-wider uppercase">Loading VS Code Engine...</span>
                </div>
              }
            />
          </div>
        ) : (
           <div className="absolute inset-0 flex flex-col items-center justify-center text-[#cccccc] bg-[#1e1e1e] px-6 select-none overflow-y-auto py-8">
            <div className="max-w-2xl w-full space-y-6">
              
              {/* Header Title with animated visual badges */}
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#007acc]/10 border border-[#007acc]/30 text-[#007acc] text-xs font-semibold uppercase tracking-wider mb-2">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  <span>Developer Edition</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
                  <Code2 className="w-7 h-7 text-[#007acc]" />
                  <span>Cloud Commit Web IDE</span>
                </h2>
                <p className="text-gray-400 text-xs sm:text-sm max-w-lg mx-auto font-normal leading-relaxed">
                  The ultimate pocket companion for engineers. Paste any GitHub repository, make live hotfixes from any device, and commit instantly with zero setup.
                </p>
              </div>

              {/* Grid of Selling Points (Bento Style Layout) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 1. Fast GitHub Workflow */}
                <div className="p-4 bg-[#252526]/80 border border-[#3c3c3c] rounded-lg space-y-2 transition-all hover:border-[#454545] hover:bg-[#252526]">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <div className="p-1.5 rounded bg-blue-500/10 text-blue-400">
                      <Github className="w-4 h-4" />
                    </div>
                    <span>Instant GitHub Sync</span>
                  </div>
                  <p className="text-gray-400 text-[11px] leading-relaxed">
                    Paste any repository URL, log in securely via GitHub OAuth/PAT, and import code structures instantly. No SSH keys or heavy command configuration required.
                  </p>
                </div>

                {/* 2. Vacation & Pocket Hotfixes */}
                <div className="p-4 bg-[#252526]/80 border border-[#3c3c3c] rounded-lg space-y-2 transition-all hover:border-[#454545] hover:bg-[#252526]">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <div className="p-1.5 rounded bg-amber-500/10 text-amber-400">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <span>Vacation & Mobile Friendly</span>
                  </div>
                  <p className="text-gray-400 text-[11px] leading-relaxed">
                    Leave your heavy laptop at home. Access this IDE on your smartphone, tablet, or public device to resolve sudden urgent incidents from your sun lounger.
                  </p>
                </div>

                {/* 3. Zero-Storage Privacy */}
                <div className="p-4 bg-[#252526]/80 border border-[#3c3c3c] rounded-lg space-y-2 transition-all hover:border-[#454545] hover:bg-[#252526]">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-400">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span>Zero-Storage Privacy</span>
                  </div>
                  <p className="text-gray-400 text-[11px] leading-relaxed">
                    We value your proprietary secrets. Absolutely zero source files, credentials, or code are saved on our backend database. Everything runs inside browser memory and discards on exit.
                  </p>
                </div>

                {/* 4. Real-time Terminals */}
                <div className="p-4 bg-[#252526]/80 border border-[#3c3c3c] rounded-lg space-y-2 transition-all hover:border-[#454545] hover:bg-[#252526]">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <div className="p-1.5 rounded bg-purple-500/10 text-purple-400">
                      <Terminal className="w-4 h-4" />
                    </div>
                    <span>Live Interactive Terminal</span>
                  </div>
                  <p className="text-gray-400 text-[11px] leading-relaxed">
                    Simulate development, view production optimized builds, run custom Node scripts, and review precise source control diff modifications straight in the browser.
                  </p>
                </div>

              </div>

              {/* Call to action & helper steps */}
              <div className="bg-[#1e1e1e] border border-[#333333] p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="text-xs font-semibold text-white flex items-center justify-center sm:justify-start gap-1">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>How to get started:</span>
                  </div>
                  <p className="text-[11px] text-gray-400 max-w-md">
                    Open the <strong className="text-gray-200">Source Control & GitHub</strong> tab in the left sidebar to connect your account and import your repository.
                  </p>
                </div>
                <div className="shrink-0 flex gap-2">
                  <div className="text-[10px] bg-[#333333] text-gray-300 font-mono px-2 py-1 rounded">
                    Ctrl + Shift + G
                  </div>
                </div>
              </div>
          </div>
          </div>
        )}
      </div>
    </div>
  );
}
