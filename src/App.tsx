import React, { useState, useEffect } from "react";
import {
  FileItem,
  TerminalOutput,
  EditorSettings,
  DEFAULT_FILES,
  RunResult,
  LANGUAGE_METADATA,
} from "./types";
import Sidebar, { SidebarTab } from "./components/Sidebar";
import FileTree from "./components/FileTree";
import EditorArea from "./components/EditorArea";
import TerminalArea from "./components/TerminalArea";
import AdBanner from "./components/AdBanner";
import {
  Terminal as TerminalIcon,
  Settings as SettingsIcon,
  Layers,
  HelpCircle,
  BookOpen,
  Code,
  Github,
  Moon,
  Sun,
} from "lucide-react";

import { inject } from "@vercel/analytics";

import GitPanel from "./components/GitPanel";
import Banner300x250 from "./components/ads/Banner300x250";
import NativeBanner from "./components/ads/NativeBanner";
import Popunder from "./components/ads/Popunder";
// import AnalyticsPanel from './components/AnalyticsPanel';

const LOCAL_STORAGE_FILES_KEY = "coderunner_workspace_files";
const LOCAL_STORAGE_SETTINGS_KEY = "coderunner_workspace_settings";

export default function App() {
  inject(); // Initialize Vercel Analytics
  // 1. Files & Workspace State
  const [files, setFiles] = useState<FileItem[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_FILES_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Failed to restore files from localStorage", e);
      }
    }
    return DEFAULT_FILES;
  });

  const [activeFileId, setActiveFileId] = useState<string | null>(() => {
    return files.length > 0 ? files[0].id : null;
  });

  const [openTabs, setOpenTabs] = useState<string[]>(() => {
    return files.slice(0, 3).map((f) => f.id);
  });

  // 2. Sidebar Navigation Layout State
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("explorer");

  // 3. Settings Configuration State
  const [settings, setSettings] = useState<EditorSettings>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to restore settings from localStorage", e);
      }
    }
    return {
      theme: "vs-dark",
      fontSize: 14,
      tabSize: 4,
      wordWrap: "on",
      minimap: false,
      autoFormatOnSave: false,
      autoSave: true,
    };
  });

  // 4. Console Terminal & Stdin Output State
  const [terminalLogs, setTerminalLogs] = useState<TerminalOutput[]>([
    {
      type: "system",
      text: "Coderunner workspace environment online. Port 3000 mapping secure.",
      timestamp: new Date().toLocaleTimeString(),
    },
    {
      type: "stdout",
      text: 'Click "Run Code" at the top of the editor to run the selected file. Supports JS execution on local Node engine and real-time interactive HTML/CSS previews.',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [stdin, setStdin] = useState("");
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isTerminalVisible, setIsTerminalVisible] = useState(true);

  // Listen for global keyboard shortcut to toggle terminal visibility (Ctrl+` or Cmd+`)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "`") {
        e.preventDefault();
        setIsTerminalVisible((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // HTML Web Sandbox Iframe Rendering Code State
  const [activeHtmlCode, setActiveHtmlCode] = useState<string | null>(null);
  const [isWebPreviewOpen, setIsWebPreviewOpen] = useState(false);

  // Persist files on modification
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_FILES_KEY, JSON.stringify(files));
  }, [files]);

  // Persist settings on modification
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  // Sync entire workspace on initial load and whenever files list structure changes (e.g. imports)
  useEffect(() => {
    const syncAll = async () => {
      try {
        await fetch("/api/workspace/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ files }),
        });
        console.log("Synchronized entire workspace to server successfully");
      } catch (err) {
        console.error("Failed to sync workspace to server:", err);
      }
    };
    syncAll();
  }, [files.length]);

  // 5. File Operations Handlers
  const handleSelectFile = (id: string) => {
    setActiveFileId(id);
    if (!openTabs.includes(id)) {
      setOpenTabs((prev) => [...prev, id]);
    }
  };

  const handleUpdateFileContent = (id: string, content: string) => {
    // setFiles(prev => prev.map(f => f.id === id ? { ...f, content } : f));
    let fileName = "";
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id === id) {
          fileName = f.name;
          return { ...f, content };
        }
        return f;
      }),
    );

    // Perform incremental background save to backend container
    if (fileName) {
      fetch("/api/workspace/write-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fileName, content }),
      }).catch((err) => console.error("Failed incremental file write:", err));
    }
  };

  const handleCreateFile = (name: string, language: string) => {
    const defaultTemplate =
      LANGUAGE_METADATA[language]?.defaultTemplate || "// Write your code here";
    const newFile: FileItem = {
      id: Date.now().toString(),
      name,
      language,
      content: defaultTemplate,
    };

    setFiles((prev) => [...prev, newFile]);
    setActiveFileId(newFile.id);
    setOpenTabs((prev) => [...prev, newFile.id]);
    // Async sync the created file to disk
    fetch("/api/workspace/write-file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, content: defaultTemplate }),
    }).catch((err) => console.error("Failed to sync created file:", err));
  };

  const handleRenameFile = (id: string, newName: string) => {
    let oldName = "";
    let fileContent = "";
    // Detect new language by extension
    let language = "javascript";
    const ext = newName.substring(newName.lastIndexOf(".")).toLowerCase();
    for (const [lang, meta] of Object.entries(LANGUAGE_METADATA)) {
      if (ext === meta.defaultExtension) {
        language = lang;
        break;
      }
    }

    // setFiles(prev => prev.map(f => f.id === id ? { ...f, name: newName, language } : f));
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id === id) {
          oldName = f.name;
          fileContent = f.content;
          return { ...f, name: newName, language };
        }
        return f;
      }),
    );

    if (oldName && oldName !== newName) {
      // Sync rename (delete old and write new)
      fetch("/api/workspace/delete-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: oldName }),
      })
        .then(() => {
          fetch("/api/workspace/write-file", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newName, content: fileContent }),
          });
        })
        .catch((err) => console.error("Failed rename sync:", err));
    }
  };

  const handleDeleteFile = (id: string) => {
    // setFiles(prev => prev.filter(f => f.id !== id));
    let fileName = "";
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target) fileName = target.name;
      return prev.filter((f) => f.id !== id);
    });

    setOpenTabs((prev) => prev.filter((t) => t !== id));

    if (activeFileId === id) {
      const remaining = files.filter((f) => f.id !== id);
      setActiveFileId(remaining.length > 0 ? remaining[0].id : null);
    }

    // Sync delete on disk
    if (fileName) {
      fetch("/api/workspace/delete-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fileName }),
      }).catch((err) => console.error("Failed delete sync:", err));
    }
  };

  const handleCloseTab = (id: string) => {
    const updatedTabs = openTabs.filter((t) => t !== id);
    setOpenTabs(updatedTabs);

    if (activeFileId === id) {
      setActiveFileId(
        updatedTabs.length > 0 ? updatedTabs[updatedTabs.length - 1] : null,
      );
    }
  };

  const handleClearLogs = () => {
    setTerminalLogs([]);
    setRunResult(null);
    setActiveHtmlCode(null);
  };

  // 6. Assembly Workspace Compiler (bundles HTML, CSS, JS)
  const assembleWebWorkspace = (activeFile: FileItem) => {
    let htmlContent = activeFile.content;

    // Grab linked CSS files or CSS stylesheet in explorer
    const cssFile = files.find((f) => f.language === "css");
    if (cssFile && !htmlContent.includes(`<style>`)) {
      const styleTag = `<style>\n${cssFile.content}\n</style>`;
      if (htmlContent.includes("</head>")) {
        htmlContent = htmlContent.replace("</head>", `${styleTag}\n</head>`);
      } else {
        htmlContent = htmlContent.replace(
          "<body>",
          `<head>\n${styleTag}\n</head>\n<body>`,
        );
      }
    }

    // Grab linked JS script workspace tabs or files
    const jsFile = files.find(
      (f) => f.language === "javascript" && f.id !== activeFile.id,
    );
    if (jsFile && !htmlContent.includes(`<script>`)) {
      // Direct console interception script for iframe logs capture
      const interceptor = `
      <script>
        const _log = console.log;
        const _err = console.error;
        console.log = function(...args) {
          window.parent.postMessage({ type: 'IFRAME_LOG', text: args.join(' ') }, '*');
          _log.apply(console, args);
        };
        console.error = function(...args) {
          window.parent.postMessage({ type: 'IFRAME_ERR', text: args.join(' ') }, '*');
          _err.apply(console, args);
        };
      </script>
      `;

      const scriptTag = `<script>\n${jsFile.content}\n</script>`;

      if (htmlContent.includes("</head>")) {
        htmlContent = htmlContent.replace("</head>", `${interceptor}\n</head>`);
      }

      if (htmlContent.includes("</body>")) {
        htmlContent = htmlContent.replace("</body>", `${scriptTag}\n</body>`);
      } else {
        htmlContent = htmlContent + "\n" + scriptTag;
      }
    }

    return htmlContent;
  };

  // Listen for iframe log captures
  useEffect(() => {
    const handleIframeLog = (event: MessageEvent) => {
      if (event.data && event.data.type === "IFRAME_LOG") {
        setTerminalLogs((prev) => [
          ...prev,
          {
            type: "stdout",
            text: `[Preview Log] ${event.data.text}`,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      } else if (event.data && event.data.type === "IFRAME_ERR") {
        setTerminalLogs((prev) => [
          ...prev,
          {
            type: "stderr",
            text: `[Preview Error] ${event.data.text}`,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      }
    };

    window.addEventListener("message", handleIframeLog);
    return () => window.removeEventListener("message", handleIframeLog);
  }, []);

  // 7. Execution Core Handler
  const handleRunCode = async () => {
    const activeFile = files.find((f) => f.id === activeFileId);
    if (!activeFile || isRunning) return;

    setIsTerminalVisible(true);
    setIsRunning(true);
    setRunResult(null);
    setActiveHtmlCode(null);

    // Dynamic Execution for Static Web Page Design
    if (activeFile.language === "html") {
      setTerminalLogs((prev) => [
        ...prev,
        {
          type: "system",
          text: `Executing build cycle for ${activeFile.name}...`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);

      const compiledHtml = assembleWebWorkspace(activeFile);

      setTerminalLogs((prev) => [
        ...prev,
        {
          type: "system",
          text: "Web Preview Sandbox initialized! Opening preview frame.",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);

      setActiveHtmlCode(compiledHtml);
      setIsRunning(false);
      return;
    }

    // Call Backend proxy runner for standard languages
    const commandToLog =
      activeFile.language === "javascript" ? "node" : activeFile.language;
    setTerminalLogs((prev) => [
      ...prev,
      {
        type: "system",
        text: `[Executing] ${commandToLog} ${activeFile.name}`,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);

    try {
      const response = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: activeFile.language,
          code: activeFile.content,
          stdin: stdin,
        }),
      });

      if (!response.ok) {
        throw new Error("Run API failed with status " + response.status);
      }

      const result: RunResult = await response.json();
      setRunResult(result);

      // Print output results to Terminal console
      const logsToAppend: TerminalOutput[] = [];

      if (result.compileError) {
        logsToAppend.push({
          type: "error",
          text: result.compileError,
          timestamp: new Date().toLocaleTimeString(),
        });
      }

      if (result.stdout) {
        logsToAppend.push({
          type: "stdout",
          text: result.stdout,
          timestamp: new Date().toLocaleTimeString(),
        });
      }

      if (result.stderr) {
        logsToAppend.push({
          type: "stderr",
          text: result.stderr,
          timestamp: new Date().toLocaleTimeString(),
        });
      }

      logsToAppend.push({
        type: "system",
        text: `Process finished with Exit Code ${result.exitCode} inside ${result.executionTimeMs}ms.`,
        timestamp: new Date().toLocaleTimeString(),
      });

      setTerminalLogs((prev) => [...prev, ...logsToAppend]);
    } catch (error: any) {
      setTerminalLogs((prev) => [
        ...prev,
        {
          type: "error",
          text: `Runtime simulation collapsed: ${error.message}. Is backend server online?`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  // 8. Sliding Collapsible Drawer Panel (Explorer viewport)
  return (
    <div
      id="workspace-layout-root"
      className="flex flex-col h-screen w-screen bg-[#1e1e1e] text-[#cccccc] overflow-hidden font-sans antialiased"
    >
      <Popunder />
      {/* 1. Sophisticated Dark: Visual Studio Code Header Bar */}
      <header className="flex items-center justify-between px-4 h-9 bg-[#323233] border-b border-[#1e1e1e] shrink-0 select-none text-[#cccccc]">
        <div className="flex items-center gap-4 text-xs font-normal">
          {/* Logo Icon */}
          <div className="flex items-center gap-1.5 font-semibold text-white">
            <Code className="w-3.5 h-3.5 text-[#007acc]" />
            <span className="hidden sm:inline text-[11px] uppercase tracking-wider text-gray-300">
              File
            </span>
          </div>
          <span className="cursor-pointer hover:bg-[#474749] px-1.5 py-0.5 rounded transition">
            Edit
          </span>
          <span className="hidden md:inline cursor-pointer hover:bg-[#474749] px-1.5 py-0.5 rounded transition">
            Selection
          </span>
          <span className="cursor-pointer hover:bg-[#474749] px-1.5 py-0.5 rounded transition">
            View
          </span>
          <span className="hidden md:inline cursor-pointer hover:bg-[#474749] px-1.5 py-0.5 rounded transition">
            Go
          </span>
          <span className="cursor-pointer hover:bg-[#474749] px-1.5 py-0.5 rounded transition">
            Run
          </span>
          <span className="hidden sm:inline cursor-pointer hover:bg-[#474749] px-1.5 py-0.5 rounded transition">
            Terminal
          </span>
          <span className="cursor-pointer hover:bg-[#474749] px-1.5 py-0.5 rounded transition">
            Help
          </span>
        </div>

        {/* Workspace App Title */}
        <div className="flex-1 text-center text-[11px] text-[#858585] truncate font-mono px-4">
          {files.find((f) => f.id === activeFileId)?.name || "index.js"} —
          CodeRunner Workspace (Vite + NodeVM)
        </div>

        {/* Window controls mimicking desktop app */}
        <div className="flex items-center gap-1.5">
          <div
            className="w-2.5 h-2.5 bg-[#4f4f4f] hover:bg-[#ff5f56] rounded-full transition cursor-pointer"
            title="Close"
          />
          <div
            className="w-2.5 h-2.5 bg-[#4f4f4f] hover:bg-[#ffbd2e] rounded-full transition cursor-pointer"
            title="Minimize"
          />
          <div
            className="w-2.5 h-2.5 bg-[#4f4f4f] hover:bg-[#27c93f] rounded-full transition cursor-pointer"
            title="Maximize"
          />
        </div>
      </header>

<NativeBanner />
      {/* 2. Primary Workspace Body */}
      <div className="flex-1 flex min-h-0">
        {/* VS Code utility Activity Rail (Vertical Sidebar icons) */}
        <Sidebar activeTab={sidebarTab} onSelectTab={setSidebarTab} />

        {/* Sliding Collapsible Drawer Panel (Explorer viewport) */}
        {sidebarTab && (
          <div className="w-80 border-r border-[#1e1e1e] shrink-0 h-full bg-[#252526]">
            {sidebarTab === "explorer" ? (
              <FileTree
                files={files}
                activeFileId={activeFileId}
                onSelectFile={handleSelectFile}
                onCreateFile={handleCreateFile}
                onRenameFile={handleRenameFile}
                onDeleteFile={handleDeleteFile}
              />
            ) : sidebarTab === "git" ? (
              <GitPanel
                files={files}
                setFiles={setFiles}
                activeFileId={activeFileId}
                setActiveFileId={handleSelectFile}
                setOpenTabs={setOpenTabs}
              />
            ) : null}
          </div>
        )}

        {/* Code Editor and Terminal split screen space */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
          {/* Main Monaco code editor */}
          <div className="flex-1 min-h-0">
            <EditorArea
              files={files}
              activeFileId={activeFileId}
              onSelectFile={handleSelectFile}
              onUpdateFileContent={handleUpdateFileContent}
              onCloseFile={handleCloseTab}
              openTabs={openTabs}
              settings={settings}
              onUpdateSettings={(newSettings) =>
                setSettings((prev) => ({ ...prev, ...newSettings }))
              }
              onRunCode={handleRunCode}
              isRunning={isRunning}
              isTerminalVisible={isTerminalVisible}
              onToggleTerminal={() => setIsTerminalVisible((prev) => !prev)}
            />
          </div>

          {/* Console standard log outputs terminal */}
          {isTerminalVisible && (
            <TerminalArea
              terminalLogs={terminalLogs}
              onClearLogs={handleClearLogs}
              stdin={stdin}
              onUpdateStdin={setStdin}
              runResult={runResult}
              isRunning={isRunning}
              activeHtmlCode={activeHtmlCode}
              isWebPreviewOpen={isWebPreviewOpen}
              onToggleWebPreview={setIsWebPreviewOpen}
              onCloseTerminal={() => setIsTerminalVisible(false)}
            />
          )}
        </div>
      </div>

      {/* <AdBanner /> */}

      {/* 3. Sophisticated Dark: Visual Studio Code Blue Status Bar */}
      <footer className="h-6 bg-[#007acc] text-white flex items-center justify-between px-3 text-[11px] shrink-0 select-none">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 cursor-pointer hover:bg-[#0062a3] px-1.5 py-0.5 rounded">
            <span className="font-semibold">main*</span>
          </div>
          <div className="flex items-center gap-1.5 cursor-pointer hover:bg-[#0062a3] px-1.5 py-0.5 rounded">
            <span>⟳</span>
            <span>0 ↓ 0 ↑</span>
          </div>
          {/* Toggle Terminal Button in Status Bar */}
          <button
            id="btn-status-toggle-terminal"
            onClick={() => setIsTerminalVisible((prev) => !prev)}
            className="flex items-center gap-1 bg-[#005a96] hover:bg-[#0062a3] active:bg-[#004e82] px-2 py-0.5 rounded cursor-pointer font-semibold transition"
            title="Toggle Console/Terminal (Ctrl+`)"
          >
            <span>Terminal: {isTerminalVisible ? "Visible" : "Hidden"}</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-0.5">
              <span className="text-white">⊗</span> 0
            </span>
            <span className="flex items-center gap-0.5">
              <span className="text-white">⚠</span>{" "}
              {runResult?.compileError ? "1" : "0"}
            </span>
          </div>
        </div>

        <Banner300x250 />

        <div className="flex items-center gap-4">
          <span className="hidden sm:inline hover:bg-[#0062a3] px-1.5 py-0.5 rounded cursor-pointer">
            Tab Size: {settings.tabSize}
          </span>
          <span className="hidden sm:inline hover:bg-[#0062a3] px-1.5 py-0.5 rounded cursor-pointer">
            UTF-8
          </span>
          <span className="hover:bg-[#0062a3] px-1.5 py-0.5 rounded cursor-pointer uppercase font-mono">
            {files.find((f) => f.id === activeFileId)?.language || "plain text"}
          </span>
          <span className="hidden md:inline hover:bg-[#0062a3] px-1.5 py-0.5 rounded cursor-pointer">
            ✓ Prettier
          </span>
        </div>
      </footer>
    </div>
  );
}
