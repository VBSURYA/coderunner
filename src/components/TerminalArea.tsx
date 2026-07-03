//@ts-nocheck
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
  X,

  RefreshCw,
  ExternalLink,
  Square,
  Play,
  Globe
} from 'lucide-react';
import Banner300x250 from './ads/Banner300x250';

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
  const [activeTab, setActiveTab] = useState<'output' | 'preview' | 'stdin' |  'terminal' | 'problems'>('output');
  const [isMaximized, setIsMaximized] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);


  // Interactive Terminal State
  const [interactiveLogs, setInteractiveLogs] = useState<string[]>([
    'Welcome to CodeRunner Developer Command Terminal v1.0.0',
    'Run any shell commands live: npm run build, ls, node index.js, mkdir, git etc.',
    'Type "help" for special IDE tools.',
    ''
  ]);
  const [terminalInput, setTerminalInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentCwd, setCurrentCwd] = useState('~');
  const terminalEndRef = useRef<HTMLDivElement>(null);
const [isTerminalRunning, setIsTerminalRunning] = useState(false);


 // Advanced Web Preview state
  const [previewMode, setPreviewMode] = useState<'static' | 'server'>('server');
  const [previewPort, setPreviewPort] = useState('3001');
  const [previewKey, setPreviewKey] = useState(0);

  // Auto scroll to latest logs
  useEffect(() => {
    if (logEndRef.current && activeTab === 'output') {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs, isRunning,activeTab]);

  // Auto scroll to bottom of interactive terminal
  useEffect(() => {
    if (terminalEndRef.current && activeTab === 'terminal') {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [interactiveLogs, activeTab]);

  // If we run an HTML page, automatically switch to the interactive Web Preview!
  useEffect(() => {
    if (activeHtmlCode) {
      setPreviewMode('static');
      setActiveTab('preview');
      onToggleWebPreview(true);
    }
  }, [activeHtmlCode]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied output to clipboard!');
  };


  // Continuous background terminal logs polling
  useEffect(() => {
    let intervalId: any = null;

    const pollTerminal = async () => {
      try {
        const res = await fetch('/api/terminal/poll');
        if (res.ok) {
          const data = await res.json();
          if (data.logs && data.logs.length > 0) {
            const cleanLogs = data.logs.filter((l: string) => l !== '');
            if (cleanLogs.length > 0) {
              setInteractiveLogs(prev => [...prev, ...cleanLogs]);
            }
          }
          setIsTerminalRunning(data.isRunning);
          if (data.cwd) {
            setCurrentCwd(data.cwd);
          }
        }
      } catch (err) {
        console.error('Error polling terminal output:', err);
      }
    };

    // Run immediately and start interval
    pollTerminal();
    intervalId = setInterval(pollTerminal, 1200);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

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



  const handleKillProcess = async () => {
    try {
      const res = await fetch('/api/terminal/kill', { method: 'POST' });
      if (res.ok) {
        setInteractiveLogs(prev => [...prev, '[Process terminate command dispatched]']);
        setIsTerminalRunning(false);
      }
    } catch (err) {
      console.error('Error dispatching kill command:', err);
    }
  };


  // Command Execution Handler for Interactive Terminal
  const handleTerminalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = terminalInput.trim();
    if (!cmd) return;

    const inputToLog = `coderunner@ide:${currentCwd}$ ${terminalInput}`;
    setInteractiveLogs(prev => [...prev, inputToLog]);
    setCommandHistory(prev => [...prev, terminalInput]);
    setHistoryIndex(-1);
    setTerminalInput('');

    // Handle standard client operations
    if (cmd === 'clear' || cmd === 'cls') {
      setInteractiveLogs([]);
      return;
    }

    if (cmd === 'help') {
      setInteractiveLogs(prev => [
        ...prev,
        'CodeRunner IDE Terminal Commands:',
        '  clear            Clear the screen logs',
        '  help             Display helper command list',
        '  ls               List files and directories in current path',
        '  pwd              Print working directory path',
        '  npm run dev      Start development server on port 3001',
        '  npm install      Install packages from package.json',
        '  npm run build    Bundle project and run production optimization builds',
        '  git status       Check active repository modifications',
        '  node <file>      Execute a local javascript file using Node server runtime',
        ''
      ]);
      return;
    }

    // // Special Simulated npm operations to make it feel exactly like VS Code
    // if (cmd === 'npm run dev' || cmd === 'npm start') {
    //   setInteractiveLogs(prev => [
    //     ...prev,
    //     '[npm] > dev-server@1.0.0 dev',
    //     '[npm] > vite',
    //     '',
    //     '  VITE v6.2.3  ready in 242 ms',
    //     '  ➜  Local:   http://localhost:3000/',
    //     '  ➜  Network: use --host to expose',
    //     '  ➜  press h + enter to show help',
    //     ''
    //   ]);
    //   return;
    // }

    // if (cmd === 'npm run build' || cmd === 'npm run compile') {
    //   setInteractiveLogs(prev => [
    //     ...prev,
    //     '[npm] > production-builder@1.0.0 build',
    //     '[npm] > vite build',
    //     '',
    //     'vite v6.2.3 compiling assets...',
    //     '✓ 42 modules transformed.',
    //     'dist/index.html                     0.84 kB │ gzip:  0.42 kB',
    //     'dist/assets/index-D783bC11.css      4.12 kB │ gzip:  1.22 kB',
    //     'dist/assets/index-G98H3C44.js     182.15 kB │ gzip: 54.12 kB',
    //     '✓ built in 921ms',
    //     'Build sequence completed successfully! Output stored inside dist/ directory.',
    //     ''
    //   ]);
    //   return;
    // }

    // Call API Route Executor for real server commands
    try {
      setIsTerminalRunning(true);
      const response = await fetch('/api/terminal/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd, cwd: currentCwd === '~' ? '.' : currentCwd })
      });


      const responseText = await response.text();
      let data: any = null;
      try {
        data = JSON.parse(responseText);
      } catch (parseErr) {
        // Fallback if response is HTML or plain text error
        if (!response.ok) {
          setInteractiveLogs(prev => [
            ...prev,
            `exec-error (HTTP ${response.status}): ${responseText.substring(0, 300)}`
          ]);
        } else {
          setInteractiveLogs(prev => [
            ...prev,
            `exec-error (Invalid JSON): ${responseText.substring(0, 300)}`
          ]);
        }
        setIsTerminalRunning(false);
        return;
      }



      if (response.ok && data) {
        // const data = await response.json();
        // const results: string[] = [];
        // if (data.stdout) results.push(data.stdout);
        // if (data.stderr) results.push(data.stderr);
        
        // if (data.cwd) {
        //   const relative = data.cwd.substring(data.cwd.lastIndexOf('/') + 1);
        //   setCurrentCwd(relative || '~');
        // }

        // setInteractiveLogs(prev => [...prev, ...results.join('\n').split('\n')]);

          if (data.stdout) {
          setInteractiveLogs(prev => [...prev, data.stdout]);
        }
        if (data.stderr) {
          setInteractiveLogs(prev => [...prev, data.stderr]);
        }
        if (data.cwd) {
          setCurrentCwd(data.cwd);
        }
        if (data.isBackground) {
          setIsTerminalRunning(true);
        } else {
          setIsTerminalRunning(false);
        }
      } else {
        // const data = await response.json();
        setInteractiveLogs(prev => [...prev, `exec-error: ${data?.stderr || 'Command execution failed.'}`]);
      setIsTerminalRunning(false);
      }
    } catch (err: any) {
      setInteractiveLogs(prev => [...prev, `terminal-error: Failed to contact backend container. (${err.message})`]);
      setIsTerminalRunning(false);
    }
  };

  // Command History Navigation Handler (Arrow up/down keys)
  const handleTerminalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setTerminalInput(commandHistory[nextIndex]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      if (historyIndex === commandHistory.length - 1) {
        setHistoryIndex(-1);
        setTerminalInput('');
      } else {
        const nextIndex = historyIndex + 1;
        setHistoryIndex(nextIndex);
        setTerminalInput(commandHistory[nextIndex]);
      }
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

           {/* Interactive Terminal Tab */}
          <button
            id="tab-interactive-terminal"
            onClick={() => { setActiveTab('terminal'); onToggleWebPreview(false); }}
            className={`flex items-center gap-1.5 px-3 h-full text-xs font-semibold border-b-2 transition ${
              activeTab === 'terminal'
                ? 'border-[#007acc] text-white bg-[#1e1e1e]/50' 
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            <span>Interactive Terminal</span>
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

                    <Banner300x250 />
              </>
            )}
          </div>
        )}

         {/* TAB 2: INTERACTIVE DEV TERMINAL */}
        {activeTab === 'terminal' && (
          <div 
            id="interactive-terminal-viewport"
            className="p-4 flex flex-col h-full bg-[#1e1e1e] text-[#cccccc] font-mono leading-normal"
            onClick={() => document.getElementById('interactive-terminal-cmd-input')?.focus()}
          >
            <div className="flex-1 overflow-y-auto space-y-1 select-text scrollbar-thin max-h-[calc(100%-40px)]">
              {interactiveLogs.map((log, index) => (
                <div key={index} className="whitespace-pre-wrap">{log}</div>
              ))}
              <div ref={terminalEndRef} />
            </div>

            {/* Prompt input field */}

             <div className="flex items-center justify-between bg-[#1e1e1e] pt-2 border-t border-[#333333] shrink-0">
            <form onSubmit={handleTerminalSubmit} className="flex items-center gap-1 bg-[#1e1e1e] pt-2 border-t border-[#333333] shrink-0">
              <span className="text-emerald-400 select-none">coderunner@ide</span>
              <span className="text-[#cccccc] select-none">:</span>
              <span className="text-blue-400 font-bold select-none">{currentCwd}</span>
              <span className="text-[#cccccc] select-none">$</span>
              
              <input
                id="interactive-terminal-cmd-input"
                type="text"
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                onKeyDown={handleTerminalKeyDown}
                className="flex-grow bg-transparent text-white border-none outline-none font-mono text-xs p-0 focus:ring-0 focus:ring-offset-0"
                placeholder={isTerminalRunning ? "Process is running in background..." : "Type a command (ls, npm run dev, help...)"}
                autoComplete="off"
                disabled={isTerminalRunning}
                autoFocus
              />
            </form>
            {isTerminalRunning && (
                <div className="flex items-center gap-2 pl-3">
                  <span className="flex items-center gap-1 text-amber-400 text-[10px] uppercase font-bold tracking-wider select-none animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Running
                  </span>
                  <button
                    type="button"
                    onClick={handleKillProcess}
                    className="flex items-center gap-1 bg-red-950/40 border border-red-500/30 text-red-400 hover:bg-red-900/40 hover:text-red-200 px-2 py-0.5 rounded transition text-[10px] font-sans font-bold"
                    title="Stop background process"
                  >
                    <Square className="w-2.5 h-2.5 fill-red-400" />
                    <span>Stop</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: STANDARD INPUT (STDIN) */}
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
          <div className="w-full h-full flex flex-col bg-[#1e1e1e]">
            {/* Elegant Preview Toolbar */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#252526] border-b border-[#1e1e1e] shrink-0 text-[11px] text-[#cccccc]">
              <div className="flex items-center gap-3">
                {/* Mode Selector Toggle */}
                <div className="flex bg-[#1e1e1e] p-0.5 rounded border border-[#333333]">
                  <button
                    onClick={() => setPreviewMode('static')}
                    className={`px-2.5 py-0.5 rounded transition ${
                      previewMode === 'static' 
                        ? 'bg-[#007acc] text-white font-semibold' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Static HTML File
                  </button>
                  <button
                    onClick={() => setPreviewMode('server')}
                    className={`px-2.5 py-0.5 rounded transition ${
                      previewMode === 'server' 
                        ? 'bg-[#007acc] text-white font-semibold' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Container Dev Server
                  </button>
                </div>

                {previewMode === 'server' && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400">Port:</span>
                    <input
                      type="text"
                      value={previewPort}
                      onChange={(e) => setPreviewPort(e.target.value)}
                      className="w-12 bg-[#1e1e1e] text-amber-400 border border-[#444444] rounded px-1 py-0.5 text-center font-bold font-mono outline-none focus:border-[#007acc]"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewKey(prev => prev + 1)}
                  className="flex items-center gap-1 bg-[#333333] hover:bg-[#444444] text-white px-2.5 py-1 rounded transition cursor-pointer"
                  title="Force Reload Preview"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reload</span>
                </button>
                {previewMode === 'server' && (
                  <a
                    href={`/proxy/${previewPort}/`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 bg-[#007acc] hover:bg-[#0062a3] text-white px-2.5 py-1 rounded transition font-semibold"
                    title="Open in New Browser Tab (Recommended)"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Open Tab</span>
                  </a>
                )}
              </div>
            </div>

            {/* Preview Viewport */}
            <div className="flex-1 w-full bg-white relative">
              {previewMode === 'static' ? (
                activeHtmlCode ? (
                  <iframe
                    key={`static-${previewKey}`}
                    id="web-preview-iframe"
                    srcDoc={activeHtmlCode}
                    title="Web Sandbox Static Preview"
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
                )
              ) : (
                <iframe
                  key={`server-${previewPort}-${previewKey}`}
                  id="web-server-preview-iframe"
                  src={`/proxy/${previewPort}/`}
                  title="Web Container Server Dev Preview"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  className="w-full h-full border-none bg-white"
                />
              )}
            </div>
              
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
