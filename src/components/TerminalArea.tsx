import React, { useState, useEffect, useRef } from 'react';
import { TerminalOutput, RunResult } from '../types';
import { 
  Trash2, 
  Terminal, 
  Eye, 
  Keyboard, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  Copy,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';

interface TerminalAreaProps {
  terminalLogs: TerminalOutput[];
  onClearLogs: () => void;
  stdin: string;
  onUpdateStdin: (val: string) => void;
  runResult: RunResult | null;
  isRunning: boolean;
  activeHtmlCode: string | null; // Content of active HTML file (if running HTML)
  isWebPreviewOpen: boolean;
  onToggleWebPreview: (open: boolean) => void;
  onCloseTerminal: () => void;
}

export default function TerminalArea({
  terminalLogs,
  onClearLogs,
  stdin,
  onUpdateStdin,
  runResult,
  isRunning,
  activeHtmlCode,
  isWebPreviewOpen,
  onToggleWebPreview,
  onCloseTerminal
}: TerminalAreaProps) {
  const [activeTab, setActiveTab] = useState<'output' | 'preview' | 'stdin' | 'problems'>('output');
  const [isMaximized, setIsMaximized] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to latest logs
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs, isRunning]);

  // If we run an HTML page, automatically switch to the interactive Web Preview!
  useEffect(() => {
    if (activeHtmlCode) {
      setActiveTab('preview');
      onToggleWebPreview(true);
    }
  }, [activeHtmlCode]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied output to clipboard!');
  };

  const getLogColorClass = (type: string) => {
    switch (type) {
      case 'stderr':
        return 'text-red-400 font-mono';
      case 'error':
        return 'text-red-500 font-semibold font-mono';
      case 'system':
        return 'text-[#007acc] font-semibold font-mono';
      default:
        return 'text-[#cccccc] font-mono';
    }
  };

  return (
    <div id="terminal-area-container" className={`flex flex-col border-t border-[#333333] bg-[#1e1e1e] text-[#cccccc] transition-all duration-300 ${
      isMaximized ? 'h-[75vh]' : 'h-72'
    }`}>
      
      {/* 1. Terminal Header / Tabs */}
      <div className="flex items-center justify-between px-4 bg-[#252526] border-b border-[#1e1e1e] select-none h-9">
        <div className="flex items-center gap-1 h-full">
          {/* Output Tab */}
          <button
            id="tab-output"
            onClick={() => { setActiveTab('output'); onToggleWebPreview(false); }}
            className={`flex items-center gap-1.5 px-3 h-full text-xs font-semibold border-b-2 transition ${
              activeTab === 'output' && !isWebPreviewOpen
                ? 'border-[#007acc] text-white bg-[#1e1e1e]/50' 
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Terminal Output</span>
            {terminalLogs.length > 0 && (
              <span className="text-[10px] bg-[#333333] text-[#cccccc] px-1.5 py-0.2 rounded-full font-mono">
                {terminalLogs.length}
              </span>
            )}
          </button>

          {/* Stdin Tab */}
          <button
            id="tab-stdin"
            onClick={() => { setActiveTab('stdin'); onToggleWebPreview(false); }}
            className={`flex items-center gap-1.5 px-3 h-full text-xs font-semibold border-b-2 transition ${
              activeTab === 'stdin' 
                ? 'border-[#007acc] text-white bg-[#1e1e1e]/50' 
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Standard Input (stdin)</span>
            {stdin.trim() && (
              <span className="w-2 h-2 rounded-full bg-[#007acc]" />
            )}
          </button>

          {/* Web Preview Tab */}
          <button
            id="tab-preview"
            onClick={() => { setActiveTab('preview'); onToggleWebPreview(true); }}
            className={`flex items-center gap-1.5 px-3 h-full text-xs font-semibold border-b-2 transition ${
              activeTab === 'preview' || isWebPreviewOpen
                ? 'border-[#007acc] text-white bg-[#1e1e1e]/50' 
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Web Preview</span>
            {activeHtmlCode && (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>

          {/* Problems Tab */}
          <button
            id="tab-problems"
            onClick={() => { setActiveTab('problems'); onToggleWebPreview(false); }}
            className={`flex items-center gap-1.5 px-3 h-full text-xs font-semibold border-b-2 transition ${
              activeTab === 'problems'
                ? 'border-[#007acc] text-white bg-[#1e1e1e]/50' 
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Problems</span>
            {runResult?.compileError && (
              <span className="text-[10px] bg-red-500/20 text-red-300 px-1.5 py-0.2 rounded-full font-mono">1</span>
            )}
          </button>
        </div>

        {/* Toolbar controls */}
        <div className="flex items-center gap-2">
          {/* Status Metrics */}
          {runResult && (
            <div className="hidden sm:flex items-center gap-3 mr-2 border-r border-[#333333] pr-3 text-[11px] font-mono">
              <div className="flex items-center gap-1 text-gray-400">
                <span>Time:</span>
                <span className="text-[#007acc] font-semibold">{runResult.executionTimeMs}ms</span>
              </div>
              <div className="flex items-center gap-1">
                <span>Status:</span>
                {runResult.exitCode === 0 ? (
                  <span className="text-emerald-400 flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3" /> success</span>
                ) : (
                  <span className="text-red-400 flex items-center gap-0.5"><XCircle className="w-3 h-3" /> exit {runResult.exitCode}</span>
                )}
              </div>
            </div>
          )}

          {/* Clear Logs Button */}
          <button
            id="btn-clear-logs"
            onClick={onClearLogs}
            className="p-1 rounded text-gray-500 hover:text-white hover:bg-[#333333] transition"
            title="Clear logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Copy Logs Button */}
          {terminalLogs.length > 0 && (
            <button
              id="btn-copy-logs"
              onClick={() => copyToClipboard(terminalLogs.map(l => l.text).join('\n'))}
              className="p-1 rounded text-gray-500 hover:text-white hover:bg-[#333333] transition"
              title="Copy output logs"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Maximize Toggle */}
          <button
            id="btn-toggle-maximize"
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1 rounded text-gray-500 hover:text-white hover:bg-[#333333] transition"
            title={isMaximized ? "Minimize panel" : "Maximize panel"}
          >
            {isMaximized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>

          {/* Close Panel Button */}
          <button
            id="btn-close-terminal"
            onClick={onCloseTerminal}
            className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-[#333333] transition"
            title="Hide Terminal (Ctrl+`)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Drawer Core Content */}
      <div className="flex-1 overflow-auto bg-[#1e1e1e] font-mono text-xs select-text">
        
        {/* TAB 1: OUTPUT LOGS */}
        {activeTab === 'output' && (
          <div id="logs-container" className="p-4 space-y-1.5">
            {terminalLogs.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-gray-500 gap-2">
                <Terminal className="w-5 h-5 opacity-40 animate-pulse text-[#007acc]" />
                <span>Console is empty. Click "Run Code" above to execute your file.</span>
              </div>
            ) : (
              <>
                {terminalLogs.map((log, index) => (
                  <div key={index} className={`whitespace-pre-wrap leading-relaxed ${getLogColorClass(log.type)}`}>
                    {log.type === 'system' && <span className="text-[#007acc] font-bold select-none">&gt;&gt; </span>}
                    {log.type === 'stderr' && <span className="text-red-400 font-bold select-none">[STDERR] </span>}
                    {log.type === 'error' && <span className="text-red-500 font-bold select-none">[EXCEPTION] </span>}
                    {log.text}
                  </div>
                ))}
                {isRunning && (
                  <div className="flex items-center gap-2 text-[#007acc] py-1 font-bold animate-pulse">
                    <span>&gt;&gt; Code runner is executing file...</span>
                  </div>
                )}
                <div ref={logEndRef} />
              </>
            )}
          </div>
        )}

        {/* TAB 2: STANDARD INPUT (STDIN) */}
        {activeTab === 'stdin' && (
          <div className="p-4 h-full flex flex-col gap-3">
            <div className="text-[11px] text-gray-400 leading-normal max-w-xl">
              Configure parameters or multi-line key values here to feed into standard standard-in input systems (like Python's <code className="bg-[#252526] px-1 py-0.5 rounded text-[#007acc] font-mono">input()</code> or C++'s <code className="bg-[#252526] px-1 py-0.5 rounded text-[#007acc] font-mono">std::cin</code>). Write each entry on a separate line.
            </div>
            <textarea
              id="textarea-stdin"
              value={stdin}
              onChange={(e) => onUpdateStdin(e.target.value)}
              className="flex-1 w-full bg-[#252526] text-emerald-400 border border-[#333333] rounded p-3 focus:outline-none focus:border-[#007acc] font-mono text-xs resize-none"
              placeholder="e.g.&#10;12&#10;John Doe&#10;true"
            />
          </div>
        )}

        {/* TAB 3: WEB PREVIEW SANDBOX (IFRAME) */}
        {activeTab === 'preview' && (
          <div className="w-full h-full relative bg-white">
            {activeHtmlCode ? (
              <iframe
                id="web-preview-iframe"
                srcDoc={activeHtmlCode}
                title="Web Sandbox Preview"
                sandbox="allow-scripts allow-modals"
                className="w-full h-full border-none bg-white"
              />
            ) : (
              <div className="absolute inset-0 bg-[#1e1e1e] text-gray-500 flex flex-col items-center justify-center p-6 text-center select-none">
                <Eye className="w-10 h-10 text-gray-700 mb-2 animate-bounce" />
                <h4 className="text-gray-400 font-semibold text-xs">Web Preview is currently sleeping</h4>
                <p className="text-[11px] text-gray-600 mt-1 max-w-[340px]">
                  Open an HTML file (like <code className="bg-[#252526] text-[#007acc] px-1 py-0.5 rounded">index.html</code>) and click **Run Code** to automatically spin up a hot-reload interactive browser iframe!
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PROBLEMS PANEL */}
        {activeTab === 'problems' && (
          <div className="p-4 space-y-3">
            {runResult?.compileError ? (
              <div className="p-3 bg-red-950/20 border border-red-900/30 rounded flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-red-400 font-semibold text-xs">Compilation Error Detected</div>
                  <pre className="text-[11px] text-red-300 bg-red-950/40 p-2 rounded border border-red-950 font-mono whitespace-pre-wrap leading-normal">
                    {runResult.compileError}
                  </pre>
                  <div className="text-[10px] text-gray-500 mt-2">
                    Tip: Use the **AI Debug** button in the editor header to have Gemini automatically diagnose and refactor the code!
                  </div>
                </div>
              </div>
            ) : runResult?.stderr ? (
              <div className="p-3 bg-amber-950/10 border border-amber-900/20 rounded flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-amber-400 font-semibold text-xs">Runtime Error / Exception Stack</div>
                  <pre className="text-[11px] text-amber-300 bg-amber-950/30 p-2 rounded border border-amber-950 font-mono whitespace-pre-wrap leading-normal">
                    {runResult.stderr}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-12 text-gray-500 gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500/60" />
                <span>No diagnostics issues reported. Your compilation workspace looks 100% green!</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
