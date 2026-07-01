export interface FileItem {
  id: string;
  name: string;
  content: string;
  language: string;
}

export interface TerminalOutput {
  type: 'stdout' | 'stderr' | 'system' | 'error';
  text: string;
  timestamp: string;
}

export interface EditorSettings {
  theme: 'vs-dark' | 'light' | 'hc-black';
  fontSize: number;
  tabSize: 2 | 4;
  wordWrap: 'on' | 'off';
  minimap: boolean;
  autoFormatOnSave: boolean;
  autoSave: boolean;
}

export interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
  error?: string;
  compileError?: string;
}

export const DEFAULT_FILES: FileItem[] = [
  {
    id: '1',
    name: 'index.js',
    language: 'javascript',
    content: `// Dynamic JavaScript Coderunner Demo
// Let's calculate prime numbers using the Sieve of Eratosthenes!

function sieveOfEratosthenes(max) {
  const flags = new Array(max + 1).fill(true);
  flags[0] = flags[1] = false;
  
  for (let i = 2; i <= Math.sqrt(max); i++) {
    if (flags[i]) {
      for (let j = i * i; j <= max; j += i) {
        flags[j] = false;
      }
    }
  }
  
  const primes = [];
  for (let i = 2; i <= max; i++) {
    if (flags[i]) primes.push(i);
  }
  return primes;
}

const limit = 100;
console.log(\`Calculating prime numbers up to \${limit}...\\n\`);
const start = Date.now();
const primes = sieveOfEratosthenes(limit);
const duration = Date.now() - start;

console.log(\`Found \${primes.length} primes: \${primes.join(', ')}\`);
console.log(\`Execution finished in \${duration}ms!\`);
`
  },
  {
    id: '2',
    name: 'index.html',
    language: 'html',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Interactive Web Sandbox</title>
  <style>
    body {
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
      color: #f8fafc;
      font-family: 'Segoe UI', system-ui, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      overflow: hidden;
    }
    
    .card {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 32px;
      text-align: center;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      transform: translateY(0);
      transition: all 0.3s ease;
    }
    
    .card:hover {
      transform: translateY(-5px);
      border-color: rgba(99, 102, 241, 0.4);
      box-shadow: 0 15px 35px rgba(99, 102, 241, 0.15);
    }
    
    h1 {
      font-size: 2.5rem;
      margin: 0 0 12px 0;
      background: linear-gradient(to right, #6366f1, #a855f7);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    p {
      color: #94a3b8;
      font-size: 1.1rem;
      margin: 0 0 24px 0;
    }
    
    .btn {
      background: linear-gradient(to right, #4f46e5, #7c3aed);
      color: white;
      border: none;
      padding: 12px 28px;
      font-size: 1rem;
      font-weight: 600;
      border-radius: 9999px;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
      transition: all 0.2s ease;
    }
    
    .btn:hover {
      opacity: 0.95;
      box-shadow: 0 6px 20px rgba(99, 102, 241, 0.6);
    }
    
    /* Interactive visual */
    .particle {
      position: absolute;
      width: 8px;
      height: 8px;
      background: #818cf8;
      border-radius: 50%;
      pointer-events: none;
      animation: float 4s infinite linear;
    }
    
    @keyframes float {
      0% { transform: translateY(100vh) scale(0); opacity: 0; }
      50% { opacity: 0.8; }
      100% { transform: translateY(-20vh) scale(1.5); opacity: 0; }
    }
  </style>
</head>
<body>
  <div class="card" id="card">
    <h1>VS Code Web Preview</h1>
    <p>This is a real-time responsive web preview sandbox!</p>
    <button class="btn" onclick="spawnParticles()">Click to Spark Particles</button>
  </div>

  <script>
    console.log("Web sandbox initialized!");
    
    function spawnParticles() {
      console.log("Spawning interactive particles...");
      for(let i=0; i<15; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + 'vw';
        particle.style.animationDelay = Math.random() * 2 + 's';
        particle.style.background = \`hsl(\${Math.random() * 360}, 80%, 65%)\`;
        document.body.appendChild(particle);
        
        setTimeout(() => {
          particle.remove();
        }, 4000);
      }
    }
  </script>
</body>
</html>
`
  },
  {
    id: '3',
    name: 'style.css',
    language: 'css',
    content: `/* Custom stylesheets for preview design */
body {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  background-color: #1e1e1e;
}
`
  },
  {
    id: '4',
    name: 'data.json',
    language: 'json',
    content: `{
  "name": "coderunner-workspace",
  "version": "1.0.0",
  "description": "Clean, local developer terminal with zero AI distractions",
  "author": "CodeRunner"
}`
  }
];

export const LANGUAGE_METADATA: {
  [key: string]: {
    label: string;
    icon: string;
    defaultExtension: string;
    defaultTemplate: string;
  }
} = {
  javascript: {
    label: 'JavaScript',
    icon: 'JS',
    defaultExtension: '.js',
    defaultTemplate: `console.log("Hello, JavaScript!");`
  },
  typescript: {
    label: 'TypeScript',
    icon: 'TS',
    defaultExtension: '.ts',
    defaultTemplate: `const greet = (name: string): string => {
  return \`Hello, \${name}!\`;
};

console.log(greet("TypeScript"));`
  },
  python: {
    label: 'Python',
    icon: 'PY',
    defaultExtension: '.py',
    defaultTemplate: `def greet(name):
    print(f"Hello, {name} from Python!")

greet("Developer")`
  },
  cpp: {
    label: 'C++',
    icon: 'CPP',
    defaultExtension: '.cpp',
    defaultTemplate: `#include <iostream>
#include <string>

int main() {
    std::string name = "C++";
    std::cout << "Hello, " << name << "!" << std::endl;
    return 0;
}`
  },
  go: {
    label: 'Go',
    icon: 'GO',
    defaultExtension: '.go',
    defaultTemplate: `package main

import "fmt"

func main() {
    fmt.Println("Hello, Go!")
}`
  },
  ruby: {
    label: 'Ruby',
    icon: 'RB',
    defaultExtension: '.rb',
    defaultTemplate: `def greet(name)
  puts "Hello, #{name} from Ruby!"
end

greet("Developer")`
  },
  java: {
    label: 'Java',
    icon: 'JAVA',
    defaultExtension: '.java',
    defaultTemplate: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, Java!");
    }
}`
  },
  html: {
    label: 'HTML5',
    icon: 'HTML',
    defaultExtension: '.html',
    defaultTemplate: `<!DOCTYPE html>
<html>
<head>
  <style>body { font-family: sans-serif; text-align: center; padding: 50px; background-color: #121212; color: #ffffff; }</style>
</head>
<body>
  <h1>Hello HTML</h1>
</body>
</html>`
  },
  css: {
    label: 'CSS',
    icon: 'CSS',
    defaultExtension: '.css',
    defaultTemplate: `body {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}`
  },
  json: {
    label: 'JSON',
    icon: 'JSON',
    defaultExtension: '.json',
    defaultTemplate: `{
  "name": "coderunner",
  "version": "1.0.0"
}`
  }
};
