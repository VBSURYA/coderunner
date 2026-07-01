import vm from 'node:vm';

interface PistonRuntime {
  language: string;
  version: string;
  aliases: string[];
}

let cachedRuntimes: PistonRuntime[] | null = null;

async function getRuntimes(): Promise<PistonRuntime[]> {
  if (cachedRuntimes) return cachedRuntimes;
  try {
    const res = await fetch('https://emkc.org/api/v2/piston/runtimes');
    if (res.ok) {
      cachedRuntimes = await res.json() as PistonRuntime[];
      return cachedRuntimes;
    }
  } catch (error) {
    console.error('Failed to fetch Piston runtimes:', error);
  }
  return [
    { language: 'python', version: '3.10.0', aliases: ['py', 'python3'] },
    { language: 'javascript', version: '18.15.0', aliases: ['js', 'node'] },
    { language: 'typescript', version: '5.0.0', aliases: ['ts'] },
    { language: 'c++', version: '10.2.0', aliases: ['cpp', 'g++'] },
    { language: 'go', version: '1.16.2', aliases: ['golang'] },
    { language: 'ruby', version: '3.0.1', aliases: ['rb'] },
    { language: 'java', version: '15.0.2', aliases: [] }
  ];
}

function getFileExtension(lang: string): string {
  const mapping: { [key: string]: string } = {
    javascript: 'js',
    typescript: 'ts',
    python: 'py',
    cpp: 'cpp',
    go: 'go',
    ruby: 'rb',
    java: 'java'
  };
  return mapping[lang] || 'txt';
}

export default async function handler(req: any, res: any) {
  // Setup CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { language, code, stdin } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Code content is required' });
  }

  const normalizedLang = (language || '').toLowerCase();

  // Try executing via the robust Piston compilation/execution engine first
  try {
    const runtimes = await getRuntimes();
    const runtime = runtimes.find(r => 
      r.language.toLowerCase() === normalizedLang || 
      r.aliases.some(a => a.toLowerCase() === normalizedLang)
    );

    if (runtime) {
      const filename = `main.${getFileExtension(runtime.language)}`;
      const executeBody = {
        language: runtime.language,
        version: runtime.version,
        files: [
          {
            name: filename,
            content: code
          }
        ],
        stdin: stdin || ''
      };

      const response = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(executeBody)
      });

      if (response.ok) {
        const result = await response.json() as any;
        const stdout = result.run?.stdout !== undefined ? result.run.stdout : (result.run?.output || '');
        let stderr = result.run?.stderr || '';
        if (result.compile?.stderr) {
          stderr = result.compile.stderr + '\n' + stderr;
        }
        const exitCode = result.run?.code !== undefined ? result.run.code : (result.compile?.code || 0);
        return res.status(200).json({
          stdout,
          stderr,
          exitCode,
          executionTimeMs: 150
        });
      }
    }
  } catch (pistonError) {
    console.error('Piston API execution failed, falling back to local JS context:', pistonError);
  }

  // Local fallback for JavaScript in Vercel function
  if (normalizedLang === 'javascript' || normalizedLang === 'js') {
    const logs: string[] = [];
    const errLogs: string[] = [];
    const startTime = Date.now();
    
    const stdinLines = stdin ? stdin.split('\n') : [];
    let stdinIndex = 0;

    const customConsole = {
      log: (...args: any[]) => {
        logs.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' '));
      },
      error: (...args: any[]) => {
        errLogs.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' '));
      },
      warn: (...args: any[]) => {
        logs.push('[WARN] ' + args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' '));
      },
      info: (...args: any[]) => {
        logs.push('[INFO] ' + args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' '));
      }
    };

    const sandbox = {
      console: customConsole,
      prompt: (message?: string) => {
        if (message) logs.push(message);
        if (stdinIndex < stdinLines.length) {
          return stdinLines[stdinIndex++];
        }
        return '';
      },
      setTimeout,
      clearTimeout,
      process: {
        env: {}
      }
    };

    try {
      const script = new vm.Script(code, { filename: 'sandbox.js' });
      const context = vm.createContext(sandbox);
      script.runInContext(context, { timeout: 4000 });

      const executionTimeMs = Date.now() - startTime;
      return res.status(200).json({
        stdout: logs.join('\n'),
        stderr: errLogs.join('\n'),
        exitCode: 0,
        executionTimeMs
      });
    } catch (err: any) {
      const executionTimeMs = Date.now() - startTime;
      return res.status(200).json({
        stdout: logs.join('\n'),
        stderr: err.stack || err.message,
        exitCode: 1,
        executionTimeMs,
        error: err.message
      });
    }
  }

  return res.status(400).json({
    stdout: '',
    stderr: `Language "${language}" is not supported. Please select one of the supported languages: javascript, typescript, python, c++, go, ruby, java.`,
    exitCode: 1,
    executionTimeMs: 0
  });
}
