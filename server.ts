import express from "express";
import path from "path";
import vm from "node:vm";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import http from "http";
import fs from "fs";
import fsp from "fs/promises";
import { spawn } from "child_process";


dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API Route: Run Code
interface PistonRuntime {
  language: string;
  version: string;
  aliases: string[];
}

let cachedRuntimes: PistonRuntime[] | null = null;

async function getRuntimes(): Promise<PistonRuntime[]> {
  if (cachedRuntimes) return cachedRuntimes;
  try {
    const res = await fetch("https://emkc.org/api/v2/piston/runtimes");
    if (res.ok) {
      cachedRuntimes = (await res.json()) as PistonRuntime[];
      return cachedRuntimes;
    }
  } catch (error) {
    console.error("Failed to fetch Piston runtimes:", error);
  }
  // Robust standard fallbacks
  return [
    { language: "python", version: "3.10.0", aliases: ["py", "python3"] },
    { language: "javascript", version: "18.15.0", aliases: ["js", "node"] },
    { language: "typescript", version: "5.0.0", aliases: ["ts"] },
    { language: "c++", version: "10.2.0", aliases: ["cpp", "g++"] },
    { language: "go", version: "1.16.2", aliases: ["golang"] },
    { language: "ruby", version: "3.0.1", aliases: ["rb"] },
    { language: "java", version: "15.0.2", aliases: [] },
  ];
}

function getFileExtension(lang: string): string {
  const mapping: { [key: string]: string } = {
    javascript: "js",
    typescript: "ts",
    python: "py",
    cpp: "cpp",
    go: "go",
    ruby: "rb",
    java: "java",
  };
  return mapping[lang] || "txt";
}

app.post("/api/run", async (req, res) => {
  const { language, code, stdin } = req.body;

  if (!code) {
    return res.status(400).json({ error: "Code content is required" });
  }

  const normalizedLang = (language || "").toLowerCase();

  // Try executing via the robust Piston compilation/execution engine first
  try {
    const runtimes = await getRuntimes();
    const runtime = runtimes.find(
      (r) =>
        r.language.toLowerCase() === normalizedLang ||
        r.aliases.some((a) => a.toLowerCase() === normalizedLang),
    );

    if (runtime) {
      const filename = `main.${getFileExtension(runtime.language)}`;
      const executeBody = {
        language: runtime.language,
        version: runtime.version,
        files: [
          {
            name: filename,
            content: code,
          },
        ],
        stdin: stdin || "",
      };

      const response = await fetch("https://emkc.org/api/v2/piston/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(executeBody),
      });

      if (response.ok) {
        const result = (await response.json()) as any;
        const stdout =
          result.run?.stdout !== undefined
            ? result.run.stdout
            : result.run?.output || "";
        let stderr = result.run?.stderr || "";
        if (result.compile?.stderr) {
          stderr = result.compile.stderr + "\n" + stderr;
        }
        const exitCode =
          result.run?.code !== undefined
            ? result.run.code
            : result.compile?.code || 0;
        return res.json({
          stdout,
          stderr,
          exitCode,
          executionTimeMs: 150,
        });
      }
    }
  } catch (pistonError) {
    console.error(
      "Piston API execution failed, falling back to local JS context:",
      pistonError,
    );
  }

  // 1. JavaScript Local Fallback Execution (Server-side VM sandbox)
  if (normalizedLang === "javascript" || normalizedLang === "js") {
    const logs: string[] = [];
    const errLogs: string[] = [];
    const startTime = Date.now();

    // Setup inputs queue for simulated stdin
    const stdinLines = stdin ? stdin.split("\n") : [];
    let stdinIndex = 0;

    const customConsole = {
      log: (...args: any[]) => {
        logs.push(
          args
            .map((arg) =>
              typeof arg === "object"
                ? JSON.stringify(arg, null, 2)
                : String(arg),
            )
            .join(" "),
        );
      },
      error: (...args: any[]) => {
        errLogs.push(
          args
            .map((arg) =>
              typeof arg === "object"
                ? JSON.stringify(arg, null, 2)
                : String(arg),
            )
            .join(" "),
        );
      },
      warn: (...args: any[]) => {
        logs.push(
          "[WARN] " +
            args
              .map((arg) =>
                typeof arg === "object"
                  ? JSON.stringify(arg, null, 2)
                  : String(arg),
              )
              .join(" "),
        );
      },
      info: (...args: any[]) => {
        logs.push(
          "[INFO] " +
            args
              .map((arg) =>
                typeof arg === "object"
                  ? JSON.stringify(arg, null, 2)
                  : String(arg),
              )
              .join(" "),
        );
      },
    };

    const sandbox = {
      console: customConsole,
      prompt: (message?: string) => {
        if (message) logs.push(message);
        if (stdinIndex < stdinLines.length) {
          return stdinLines[stdinIndex++];
        }
        return "";
      },
      setTimeout,
      clearTimeout,
      process: {
        env: {},
      },
    };

    try {
      const script = new vm.Script(code, { filename: "sandbox.js" });
      const context = vm.createContext(sandbox);
      script.runInContext(context, { timeout: 4000 }); // 4 second safety timeout

      const executionTimeMs = Date.now() - startTime;
      return res.json({
        stdout: logs.join("\n"),
        stderr: errLogs.join("\n"),
        exitCode: 0,
        executionTimeMs,
      });
    } catch (err: any) {
      const executionTimeMs = Date.now() - startTime;
      return res.json({
        stdout: logs.join("\n"),
        stderr: err.stack || err.message,
        exitCode: 1,
        executionTimeMs,
        error: err.message,
      });
    }
  }

  return res.status(400).json({
    stdout: "",
    stderr: `Language "${language}" is not supported. Please select one of the supported languages: javascript, typescript, python, c++, go, ruby, java.`,
    exitCode: 1,
    executionTimeMs: 0,
  });
});

// // Configure Vite middleware / asset serving
// const startServer = async () => {
//   if (process.env.NODE_ENV !== 'production') {
//     const vite = await createViteServer({
//       server: { middlewareMode: true },
//       appType: 'spa',
//     });
//     app.use(vite.middlewares);
//   } else {
//     const distPath = path.join(process.cwd(), 'dist');
//     app.use(express.static(distPath));
//     app.get('*', (req, res) => {
//       res.sendFile(path.join(distPath, 'index.html'));
//     });
//   }

//   app.listen(PORT, '0.0.0.0', () => {
//     console.log(`Server running on http://localhost:${PORT}`);
//   });
// };

// startServer();

// GitHub OAuth authorization URL endpoint
app.get("/api/github/auth", (req, res) => {
  const clientId =
    process.env.GITHUB_CLIENT_ID || process.env.VITE_GITHUB_CLIENT_ID;
  if (!clientId) {
    return res.status(400).json({
      error:
        "GitHub Client ID not configured. Please set GITHUB_CLIENT_ID in your environment variables, or log in with a Personal Access Token.",
    });
  }
  const host = req.headers.host || "localhost:3000";
  const protocol = req.headers["x-forwarded-proto"] || "http";
  const redirectUri = `${protocol}://${host}/api/github/callback`;
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo,user`;
  return res.json({ url: githubAuthUrl });
});

// GitHub OAuth callback handler
app.get("/api/github/callback", async (req: any, res: any) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Authentication code is missing.");

  const clientId =
    process.env.GITHUB_CLIENT_ID || process.env.VITE_GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res
      .status(500)
      .send("GitHub Client ID or Client Secret not configured on backend.");
  }

  try {
    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      },
    );

    if (!tokenResponse.ok)
      throw new Error(
        `GitHub token exchange failed: ${tokenResponse.statusText}`,
      );
    const tokenData = (await tokenResponse.json()) as any;
    const accessToken = tokenData.access_token;
    if (!accessToken) throw new Error("No access token returned from GitHub");

    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "User-Agent": "CodeRunner-IDE",
      },
    });

    let githubUser = null;
    if (userResponse.ok) githubUser = await userResponse.json();

    res.setHeader("Content-Type", "text/html");
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authenticating with GitHub...</title>
          <style>
            body { background-color: #1e1e1e; color: #cccccc; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .spinner { border: 3px solid rgba(255,255,255,0.1); width: 36px; height: 36px; border-radius: 50%; border-left-color: #007acc; animation: spin 1s linear infinite; margin-bottom: 20px; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="spinner"></div>
          <h3>GitHub Authentication Successful!</h3>
          <p>Syncing credentials with your IDE... This window should close automatically.</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'GITHUB_OAUTH_SUCCESS', 
                data: { token: ${JSON.stringify(accessToken)}, user: ${JSON.stringify(githubUser)} }
              }, '*');
              window.close();
            } else {
              localStorage.setItem('coderunner_github_token', ${JSON.stringify(accessToken)});
              localStorage.setItem('coderunner_github_user', JSON.stringify(${JSON.stringify(githubUser)}));
              window.location.href = '/';
            }
          </script>
        </body>
      </html>
    `);
  } catch (error: any) {
    return res
      .status(500)
      .send(`<h2>GitHub Authentication Failed</h2><p>${error.message}</p>`);
  }
});

// Interactive terminal command executor route
app.post("/api/terminal/exec", (req: any, res: any) => {
  const { command, cwd } = req.body;
  if (!command) return res.status(400).json({ error: "Command is required" });

  const forbidden = ["rm -rf /", "mkfs", "dd", "shutdown", "reboot"];
  if (forbidden.some((f) => command.includes(f))) {
    return res
      .status(403)
      .json({
        stdout: "",
        stderr: "Access denied: Dangerous command detected.",
        exitCode: 1,
      });
  }

  const { exec } = require("child_process");
  const executionCwd = cwd ? path.resolve(process.cwd(), cwd) : process.cwd();

  exec(
    command,
    { cwd: executionCwd, timeout: 10000 },
    (error: any, stdout: string, stderr: string) => {
      return res.json({
        stdout: stdout || "",
        stderr: stderr || (error ? error.message : ""),
        exitCode: error ? error.code || 1 : 0,
        cwd: executionCwd,
      });
    },
  );
});

// Directory for storing the active user workspace files
let terminalCwd = path.resolve(process.cwd(), 'user-workspace');

// Ensure user-workspace exists
if (!fs.existsSync(terminalCwd)) {
  fs.mkdirSync(terminalCwd, { recursive: true });
}

// Workspace File Syncing APIs
app.post('/api/workspace/sync', async (req: any, res: any) => {
  const { files } = req.body;
  if (!Array.isArray(files)) {
    return res.status(400).json({ error: 'Files array is required' });
  }

  try {
    // Clear user-workspace folder first to delete removed files
    if (fs.existsSync(terminalCwd)) {
      await fsp.rm(terminalCwd, { recursive: true, force: true });
    }
    await fsp.mkdir(terminalCwd, { recursive: true });

    // Write all files
    for (const file of files) {
      const filePath = path.join(terminalCwd, file.name);
      const dirPath = path.dirname(filePath);
      await fsp.mkdir(dirPath, { recursive: true });
      await fsp.writeFile(filePath, file.content || '', 'utf8');
    }

    console.log(`Synced ${files.length} workspace files to container disk.`);
    return res.json({ success: true, message: `Synced ${files.length} files to container disk.` });
  } catch (error: any) {
    console.error('Failed to sync workspace:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/workspace/write-file', async (req: any, res: any) => {
  const { name, content } = req.body;
  if (!name) return res.status(400).json({ error: 'File name is required' });

  try {
    const filePath = path.join(terminalCwd, name);
    const dirPath = path.dirname(filePath);
    await fsp.mkdir(dirPath, { recursive: true });
    await fsp.writeFile(filePath, content || '', 'utf8');
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/workspace/delete-file', async (req: any, res: any) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'File name is required' });

  try {
    const filePath = path.join(terminalCwd, name);
    if (fs.existsSync(filePath)) {
      await fsp.unlink(filePath);
    }
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Interactive terminal command executor state
let activeProcess: any = null;
let activeProcessOutput: string[] = [];
let outputReadOffset = 0;

// Interactive terminal command executor route
app.post('/api/terminal/exec', (req: any, res: any) => {
  const { command, cwd } = req.body;
  if (!command) return res.status(400).json({ error: 'Command is required' });

  const forbidden = ['rm -rf /', 'mkfs', 'dd', 'shutdown', 'reboot'];
  if (forbidden.some(f => command.includes(f))) {
    return res.status(403).json({ stdout: '', stderr: 'Access denied: Dangerous command detected.', exitCode: 1 });
  }

  const executionCwd = cwd ? path.resolve(terminalCwd, cwd) : terminalCwd;

  // Handle cd command manually in server state!
  if (command.startsWith('cd ')) {
    const targetDir = command.substring(3).trim();
    const newCwd = path.resolve(executionCwd, targetDir);
    if (fs.existsSync(newCwd) && fs.statSync(newCwd).isDirectory()) {
      terminalCwd = newCwd;
      const relative = path.relative(path.resolve(process.cwd(), 'user-workspace'), terminalCwd);
      return res.json({
        stdout: `Directory changed to ${relative || '~'}`,
        stderr: '',
        exitCode: 0,
        cwd: relative || '~',
        isBackground: false
      });
    } else {
      const relative = path.relative(path.resolve(process.cwd(), 'user-workspace'), terminalCwd);
      return res.status(400).json({
        stdout: '',
        stderr: `cd: no such file or directory: ${targetDir}`,
        exitCode: 1,
        cwd: relative || '~',
        isBackground: false
      });
    }
  }

  // Terminate any previous background process to keep system clean and leak-proof
  if (activeProcess) {
    try {
      activeProcess.kill('SIGTERM');
    } catch (e) {}
    activeProcess = null;
  }

  // Clear output buffer for new command execution
  activeProcessOutput = [];
  outputReadOffset = 0;

  // Run the command using shell to support all Node/NPM scripts
  const shellProcess = spawn(command, {
    cwd: terminalCwd,
    shell: true,
    env: { ...process.env, PORT: '3001' } // Force Next.js / dev servers to run on port 3001
  });

  activeProcess = shellProcess;

  // Handle stdout
  shellProcess.stdout.on('data', (data) => {
    const text = data.toString();
    activeProcessOutput.push(...text.split('\n'));
  });

  // Handle stderr
  shellProcess.stderr.on('data', (data) => {
    const text = data.toString();
    activeProcessOutput.push(...text.split('\n'));
  });

  shellProcess.on('close', (code) => {
    activeProcessOutput.push(`\n[Process exited with code ${code}]`);
    if (activeProcess === shellProcess) {
      activeProcess = null;
    }
  });

  shellProcess.on('error', (err) => {
    activeProcessOutput.push(`\n[Process error: ${err.message}]`);
    if (activeProcess === shellProcess) {
      activeProcess = null;
    }
  });

  // Return immediately to make the UI non-blocking and let the user stream the logs
  const relative = path.relative(path.resolve(process.cwd(), 'user-workspace'), terminalCwd);
  return res.json({
    stdout: `[Started: ${command}]`,
    stderr: '',
    exitCode: 0,
    cwd: relative || '~',
    isBackground: true
  });
});

// Endpoint to poll new terminal logs
app.get('/api/terminal/poll', (req: any, res: any) => {
  const relative = path.relative(path.resolve(process.cwd(), 'user-workspace'), terminalCwd);
  
  if (outputReadOffset >= activeProcessOutput.length) {
    return res.json({
      logs: [],
      isRunning: activeProcess !== null,
      cwd: relative || '~'
    });
  }

  const newLogs = activeProcessOutput.slice(outputReadOffset);
  outputReadOffset = activeProcessOutput.length;

  return res.json({
    logs: newLogs,
    isRunning: activeProcess !== null,
    cwd: relative || '~'
  });
});

// Endpoint to kill active terminal process
app.post('/api/terminal/kill', (req: any, res: any) => {
  if (activeProcess) {
    try {
      activeProcess.kill('SIGKILL');
      activeProcess = null;
      activeProcessOutput.push('\n[Process terminated by user]');
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
  return res.json({ success: false, message: 'No active process' });
});

// Sophisticated proxy mapping requests to background dev servers
app.all('/proxy/:port', (req: any, res: any) => {
  res.redirect(`/proxy/${req.params.port}/`);
});

app.all('/proxy/:port/*', (req: any, res: any) => {
  const port = req.params.port;
  const targetPath = req.params[0] || '';
  const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
  
  const options = {
    host: 'localhost',
    port: parseInt(port),
    path: `/${targetPath}${queryString}`,
    method: req.method,
    headers: {
      ...req.headers,
      host: `localhost:${port}` // Override Host header for dev servers
    }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    res.status(502).send(`
      <h2>Proxy Connection Failed</h2>
      <p>Error connecting to port <b>${port}</b>: ${err.message}</p>
      <p>Please make sure your Next.js/Vite server is running in the terminal and listening on port ${port}.</p>
    `);
  });

  req.pipe(proxyReq);
});


// Configure Vite middleware / asset serving
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();
