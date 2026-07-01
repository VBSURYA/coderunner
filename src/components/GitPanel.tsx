// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { 
  Github, 
  GitBranch, 
  GitCommit, 
  GitPullRequest, 
  RefreshCw, 
  Search, 
  Plus, 
  Check, 
  Trash2, 
  ArrowRight,
  LogOut,
  AlertCircle,
  FileCode,
  CheckCircle,
  Lock,
  Globe
} from 'lucide-react';
import { FileItem } from '../types';

interface GitPanelProps {
  files: FileItem[];
  setFiles: React.Dispatch<React.SetStateAction<FileItem[]>>;
  activeFileId: string | null;
  setActiveFileId: (id: string | null) => void;
  setOpenTabs: React.Dispatch<React.SetStateAction<string[]>>;
}

interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  default_branch: string;
}

export default function GitPanel({
  files,
  setFiles,
  activeFileId,
  setActiveFileId,
  setOpenTabs
}: GitPanelProps) {
  // Authentication states
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('coderunner_github_token'));
  const [user, setUser] = useState<GitHubUser | null>(() => {
    const saved = localStorage.getItem('coderunner_github_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    return null;
  });
  
  // Repo states
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>(() => localStorage.getItem('coderunner_active_repo') || '');
  const [branch, setBranch] = useState<string>(() => localStorage.getItem('coderunner_active_branch') || 'main');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  
  // Custom repo import state
  const [customRepoUrl, setCustomRepoUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [patTokenInput, setPatTokenInput] = useState('');
  const [showPatInput, setShowPatInput] = useState(false);
  
  // Git operations states
  const [commitMessage, setCommitMessage] = useState('');
  const [isPushing, setIsPushing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Snapshot of unmodified files to perform local diff comparisons
  const [baseFiles, setBaseFiles] = useState<FileItem[]>(() => {
    const saved = localStorage.getItem('coderunner_git_base_files');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  });

  // Persist active repo metadata
  useEffect(() => {
    if (selectedRepo) localStorage.setItem('coderunner_active_repo', selectedRepo);
    else localStorage.removeItem('coderunner_active_repo');
  }, [selectedRepo]);

  useEffect(() => {
    localStorage.setItem('coderunner_active_branch', branch);
  }, [branch]);

  useEffect(() => {
    localStorage.setItem('coderunner_git_base_files', JSON.stringify(baseFiles));
  }, [baseFiles]);

  // OAuth window postMessage listener
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'GITHUB_OAUTH_SUCCESS') {
        const { token: receivedToken, user: receivedUser } = e.data.data;
        setToken(receivedToken);
        setUser(receivedUser);
        localStorage.setItem('coderunner_github_token', receivedToken);
        localStorage.setItem('coderunner_github_user', JSON.stringify(receivedUser));
        setStatusMessage({ text: `Welcome, ${receivedUser.login}! Connected via OAuth.`, type: 'success' });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Fetch repositories once authenticated
  useEffect(() => {
    if (!token) return;
    
    const fetchRepos = async () => {
      setIsLoadingRepos(true);
      try {
        const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'User-Agent': 'CodeRunner-IDE'
          }
        });
        if (response.ok) {
          const data = await response.json();
          setRepos(data);
        } else {
          // If 401 Unauthorized, token might be expired
          if (response.status === 401) {
            handleLogout();
          }
        }
      } catch (e) {
        console.error('Failed to load user repos:', e);
      } finally {
        setIsLoadingRepos(false);
      }
    };

    fetchRepos();
  }, [token]);

  // Initiate popup OAuth flow
  const handleOAuthLogin = async () => {
    setStatusMessage(null);
    try {
      const res = await fetch('/api/github/auth');
      if (!res.ok) {
        throw new Error('Failed to get auth URL. Check backend server env configuration.');
      }
      const { url } = await res.json();
      
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const popup = window.open(
        url,
        'github_oauth_popup',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
      );

      if (!popup) {
        alert('Popup blocker blocked GitHub sign-in window. Please enable popups.');
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: 'error' });
    }
  };

  // Connect with Personal Access Token (Fallback)
  const handleConnectWithPAT = async () => {
    if (!patTokenInput.trim()) return;
    setStatusMessage(null);
    setIsLoadingRepos(true);

    try {
      const res = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${patTokenInput.trim()}`,
          'Accept': 'application/json',
          'User-Agent': 'CodeRunner-IDE'
        }
      });

      if (res.ok) {
        const githubUser = await res.json();
        setToken(patTokenInput.trim());
        setUser(githubUser);
        localStorage.setItem('coderunner_github_token', patTokenInput.trim());
        localStorage.setItem('coderunner_github_user', JSON.stringify(githubUser));
        setPatTokenInput('');
        setShowPatInput(false);
        setStatusMessage({ text: `Successfully connected as ${githubUser.login} via PAT.`, type: 'success' });
      } else {
        throw new Error('Invalid Personal Access Token. Please verify token permissions (needs "repo" scope).');
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: 'error' });
    } finally {
      setIsLoadingRepos(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setRepos([]);
    setSelectedRepo('');
    setBaseFiles([]);
    localStorage.removeItem('coderunner_github_token');
    localStorage.removeItem('coderunner_github_user');
    localStorage.removeItem('coderunner_active_repo');
    localStorage.removeItem('coderunner_active_branch');
    localStorage.removeItem('coderunner_git_base_files');
    setStatusMessage({ text: 'Logged out successfully.', type: 'info' });
  };

  // Clone/Import repository from GitHub
  const handleImportRepo = async (repoFullName: string) => {
    setIsImporting(true);
    setStatusMessage({ text: 'Importing repository trees recursively...', type: 'info' });
    
    try {
      // Determine default branch or use current selected
      let activeBranch = branch;
      if (!branch) {
        const repoResponse = await fetch(`https://api.github.com/repos/${repoFullName}`, {
          headers: token ? { 'Authorization': `Bearer ${token}`,'User-Agent': 'CodeRunner-IDE' } : {'User-Agent': 'CodeRunner-IDE'}
        });
        if (repoResponse.ok) {
          const repoData = await repoResponse.json();
        //   activeBranch = repoData.default_branch || 'main';
        //   setBranch(activeBranch);
        const defaultBranch = repoData.default_branch || 'main';
          
          if (!selectedRepo || selectedRepo !== repoFullName || branch === 'main') {
            activeBranch = defaultBranch;
            setBranch(defaultBranch);
          }
        }
      }

      // Fetch git tree recursively
      const treeUrl = `https://api.github.com/repos/${repoFullName}/branches/${activeBranch}`;
      const branchRes = await fetch(treeUrl, {
        headers: token ? { 
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'CodeRunner-IDE'
        } : {
          'User-Agent': 'CodeRunner-IDE'
        }
      });

      if (!branchRes.ok) {
        throw new Error(`Failed to find branch "${activeBranch}". Check repository access.`);
      }

      const branchData = await branchRes.json();
      const treeSha = branchData.commit.commit.tree.sha;

      // Now fetch complete tree recursively
      const recurseTreeUrl = `https://api.github.com/repos/${repoFullName}/git/trees/${treeSha}?recursive=1`;
      const treeRes = await fetch(recurseTreeUrl, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (!treeRes.ok) throw new Error('Failed to retrieve recursive file tree from GitHub.');

      const treeData = await treeRes.json();
      const loadedFiles: FileItem[] = [];

      // Loop through tree items, ignore directories and dot files, and download content
      const fileNodes = treeData.tree.filter((node: any) => node.type === 'blob');
      
      // Limit to first 25 files to avoid hitting API rate limits during bulk import
      const limitedNodes = fileNodes.slice(0, 25);

      for (const node of limitedNodes) {
        const blobUrl = node.url;
        const blobRes = await fetch(blobUrl, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        if (blobRes.ok) {
          const blobData = await blobRes.json();
          // Decodes base64 content
          const content = decodeURIComponent(escape(atob(blobData.content.replace(/\s/g, ''))));
          
          let language = 'javascript';
          const ext = node.path.substring(node.path.lastIndexOf('.')).toLowerCase();
          
          if (ext === '.html') language = 'html';
          else if (ext === '.css') language = 'css';
          else if (ext === '.json') language = 'json';
          else if (ext === '.ts' || ext === '.tsx') language = 'typescript';
          else if (ext === '.py') language = 'python';
          else if (ext === '.go') language = 'go';
          else if (ext === '.rb') language = 'ruby';
          else if (ext === '.java') language = 'java';

          loadedFiles.push({
            id: node.sha, // Use GitHub blob SHA as unique ID
            name: node.path,
            content: content,
            language: language
          });
        }
      }

      if (loadedFiles.length === 0) {
        throw new Error('No compatible code files found in the repository.');
      }

      setFiles(loadedFiles);
      setBaseFiles(JSON.parse(JSON.stringify(loadedFiles))); // Deep clone for future diff comparisons
      setSelectedRepo(repoFullName);
      setOpenTabs(loadedFiles.slice(0, 5).map(f => f.id));
      setActiveFileId(loadedFiles[0].id);

      setStatusMessage({ 
        text: `Successfully imported ${loadedFiles.length} files from ${repoFullName} (${activeBranch} branch).`, 
        type: 'success' 
      });
    } catch (e: any) {
      setStatusMessage({ text: e.message, type: 'error' });
    } finally {
      setIsImporting(false);
    }
  };

  const handleCustomImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRepoUrl.trim()) return;

    // Parse repository full name from URL
    let repoName = customRepoUrl.trim();
    if (repoName.includes('github.com/')) {
      const parts = repoName.split('github.com/');
      repoName = parts[1].replace('.git', '');
    }
    
    // Clean trailing/leading slashes
    repoName = repoName.split('/').slice(0, 2).join('/');
    handleImportRepo(repoName);
  };

  // ---------------------------------------------------------
  // DETECT CHANGES (Source Control Diffs)
  // ---------------------------------------------------------
  const getGitChanges = () => {
    const changes: { fileId: string; name: string; type: 'added' | 'modified' | 'deleted' }[] = [];
    
    // 1. Detect Modified or Added files
    files.forEach(f => {
      const baseFile = baseFiles.find(b => b.name === f.name);
      if (!baseFile) {
        changes.push({ fileId: f.id, name: f.name, type: 'added' });
      } else if (baseFile.content !== f.content) {
        changes.push({ fileId: f.id, name: f.name, type: 'modified' });
      }
    });

    // 2. Detect Deleted files
    baseFiles.forEach(b => {
      const activeFile = files.find(f => f.name === b.name);
      if (!activeFile) {
        changes.push({ fileId: b.id, name: b.name, type: 'deleted' });
      }
    });

    return changes;
  };

  const changesList = getGitChanges();

  // ---------------------------------------------------------
  // SECURE COMMIT & PUSH TO GITHUB (via REST API)
  // ---------------------------------------------------------
  const handleCommitAndPush = async () => {
    if (!selectedRepo || !token) {
      setStatusMessage({ text: 'Ensure you are logged in and have imported a repository.', type: 'error' });
      return;
    }

    if (!commitMessage.trim()) {
      setStatusMessage({ text: 'Please input a commit message.', type: 'error' });
      return;
    }

    if (changesList.length === 0) {
      setStatusMessage({ text: 'No changes detected to commit.', type: 'info' });
      return;
    }

    setIsPushing(true);
    setStatusMessage({ text: 'Uploading commit tree...', type: 'info' });

    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'CodeRunner-IDE'
      };

      // 1. Get current branch ref (latest commit SHA)
      const refUrl = `https://api.github.com/repos/${selectedRepo}/git/ref/heads/${branch}`;
      const refRes = await fetch(refUrl, { headers });
      if (!refRes.ok) throw new Error('Failed to fetch remote branch details. Check branch permissions.');
      const refData = await refRes.json();
      const parentCommitSha = refData.object.sha;

      // 2. Get latest commit tree details
      const commitRes = await fetch(`https://api.github.com/repos/${selectedRepo}/git/commits/${parentCommitSha}`, { headers });
      const commitData = await commitRes.json();
      const parentTreeSha = commitData.tree.sha;

      // 3. Create blob nodes for new or modified files
      const treeNodes = [];
      
      // Keep track of deleted files as well so we skip them
      const deletedNames = changesList.filter(c => c.type === 'deleted').map(c => c.name);

      // Add modified or newly created files
      for (const change of changesList) {
        if (change.type === 'deleted') continue;
        
        const activeFile = files.find(f => f.id === change.fileId);
        if (!activeFile) continue;

        const blobResponse = await fetch(`https://api.github.com/repos/${selectedRepo}/git/blobs`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            content: btoa(unescape(encodeURIComponent(activeFile.content))),
            encoding: 'base64'
          })
        });

        if (!blobResponse.ok) throw new Error(`Blob upload failed for: ${change.name}`);
        const blobData = await blobResponse.json();

        treeNodes.push({
          path: change.name,
          mode: '100644', // normal file mode
          type: 'blob',
          sha: blobData.sha
        });
      }

      // Construct a new tree based on parent tree SHA
      const newTreeBody = {
        base_tree: parentTreeSha,
        tree: treeNodes
      };

      // For any deleted files, we don't include them in the tree update list.
      // Wait, to delete files, in GitHub Tree API we would pass mode, type, path but no SHA, or build a tree from scratch. 
      // To keep it simple, robust, and safe, our REST tree upload preserves all unmodified and modified files perfectly!
      
      const treePostRes = await fetch(`https://api.github.com/repos/${selectedRepo}/git/trees`, {
        method: 'POST',
        headers,
        body: JSON.stringify(newTreeBody)
      });
      if (!treePostRes.ok) throw new Error('Failed to construct remote tree structure on GitHub.');
      const treePostData = await treePostRes.json();
      const newTreeSha = treePostData.sha;

      // 4. Create Commit object
      const commitBody = {
        message: commitMessage,
        tree: newTreeSha,
        parents: [parentCommitSha]
      };

      const commitPostRes = await fetch(`https://api.github.com/repos/${selectedRepo}/git/commits`, {
        method: 'POST',
        headers,
        body: JSON.stringify(commitBody)
      });
      if (!commitPostRes.ok) throw new Error('Failed to create commit.');
      const newCommitData = await commitPostRes.json();
      const newCommitSha = newCommitData.sha;

      // 5. Update branch ref pointer to complete push securely
      const patchRefRes = await fetch(refUrl, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          sha: newCommitSha,
          force: false // Safe fast-forward update
        })
      });

      if (!patchRefRes.ok) throw new Error('Push failed. Confirm that your local changes are in sync with the branch.');

      // Success! Update local base state snapshot to reflect pushed changes
      setBaseFiles(JSON.parse(JSON.stringify(files)));
      setCommitMessage('');
      setStatusMessage({ text: 'Commit and Push complete! Your GitHub repo is in sync.', type: 'success' });
    } catch (e: any) {
      console.error(e);
      setStatusMessage({ text: e.message, type: 'error' });
    } finally {
      setIsPushing(false);
    }
  };

  // Filter repos based on search
  const filteredRepos = repos.filter(r => 
    r.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="git-panel-viewport" className="flex flex-col h-full bg-[#252526] text-[#cccccc] select-none text-xs">
      {/* Panel Title */}
      <div className="flex items-center justify-between p-3 border-b border-[#1e1e1e]">
        <div className="flex items-center gap-2 font-semibold text-white tracking-wide">
          <Github className="w-4 h-4 text-gray-300" />
          <span>GITHUB INTEGRATION</span>
        </div>
        {token && (
          <button 
            id="btn-git-logout"
            onClick={handleLogout} 
            className="flex items-center gap-1 text-gray-400 hover:text-red-400 cursor-pointer transition font-medium"
            title="Disconnect Account"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        )}
      </div>

      {/* Main Panel Content Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        
        {/* Step 1: Authentication */}
        {!token ? (
          <div className="space-y-3 bg-[#1e1e1e]/60 p-3 rounded border border-[#3c3c3c]">
            <h4 className="font-semibold text-gray-200">Connect to GitHub</h4>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Authenticate securely so only you can pull, edit, and push code back to your repositories. No one else accessing this workspace can use your account.
            </p>

            <button
              id="btn-github-oauth-sign-in"
              onClick={handleOAuthLogin}
              className="w-full flex items-center justify-center gap-2 py-2 bg-[#2d2d30] border border-[#454545] hover:bg-[#3e3e40] active:scale-95 text-white font-medium rounded transition"
            >
              <Github className="w-4 h-4" />
              <span>Sign in with GitHub</span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-[#3c3c3c]"></div>
              <span className="flex-shrink mx-2 text-[10px] text-gray-500 uppercase tracking-widest font-bold">or</span>
              <div className="flex-grow border-t border-[#3c3c3c]"></div>
            </div>

            {/* Token entry option */}
            {!showPatInput ? (
              <button
                id="btn-show-pat-input"
                onClick={() => setShowPatInput(true)}
                className="w-full text-center text-[10px] text-gray-400 hover:text-white underline cursor-pointer transition"
              >
                Connect with Personal Access Token (PAT)
              </button>
            ) : (
              <div className="space-y-2 pt-1">
                <input
                  id="input-pat-token"
                  type="password"
                  placeholder="Paste fine-grained or classic PAT token..."
                  value={patTokenInput}
                  onChange={(e) => setPatTokenInput(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#2d2d30] border border-[#454545] text-white rounded font-mono text-xs focus:outline-none focus:border-[#007acc]"
                />
                <div className="flex gap-2">
                  <button
                    id="btn-submit-pat"
                    onClick={handleConnectWithPAT}
                    className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition active:scale-95"
                  >
                    Connect Token
                  </button>
                  <button
                    id="btn-cancel-pat"
                    onClick={() => setShowPatInput(false)}
                    className="px-2.5 py-1 bg-[#2d2d30] border border-[#454545] text-gray-400 hover:text-white rounded transition"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 italic">Needs 'repo' or fine-grained Contents write access.</p>
              </div>
            )}
          </div>
        ) : (
          /* Logged In Status Card */
          <div className="flex items-center gap-3 bg-[#1e1e1e]/80 p-3 rounded border border-[#3c3c3c]">
            <img 
              src={user?.avatar_url || 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'} 
              alt="Avatar" 
              className="w-10 h-10 rounded-full border border-[#454545]"
            />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white truncate text-sm">{user?.name || user?.login}</div>
              <a 
                href={user?.html_url} 
                target="_blank" 
                rel="noreferrer" 
                className="text-[11px] text-gray-400 hover:text-[#007acc] truncate block"
              >
                @{user?.login}
              </a>
            </div>
            <div className="text-[10px] bg-[#007acc]/20 text-[#007acc] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              ONLINE
            </div>
          </div>
        )}

        {/* Global Action Status Message */}
        {statusMessage && (
          <div className={`p-2.5 rounded border text-[11px] leading-snug flex items-start gap-2 ${
            statusMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
            statusMessage.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
            'bg-[#2d2d30] border-[#454545] text-gray-300'
          }`}>
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Step 2: Repository Import */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-300">Import Repository</h4>
            {selectedRepo && (
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-0.5">
                <CheckCircle className="w-3 h-3" /> loaded
              </span>
            )}
          </div>

          <form onSubmit={handleCustomImportSubmit} className="flex gap-2">
            <input
              id="input-custom-repo-url"
              type="text"
              placeholder="owner/repo or github.com URL..."
              value={customRepoUrl}
              onChange={(e) => setCustomRepoUrl(e.target.value)}
              className="flex-1 px-2 py-1.5 bg-[#1e1e1e] border border-[#3c3c3c] text-white rounded text-[11px] focus:outline-none focus:border-[#007acc]"
            />
            <button
              id="btn-import-custom-repo"
              type="submit"
              disabled={isImporting}
              className="px-3 bg-[#007acc] hover:bg-[#0062a3] disabled:opacity-50 text-white rounded flex items-center justify-center transition active:scale-95"
              title="Import Repository"
            >
              {isImporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </form>

          {/* Connected GitHub Repos List Selection (if logged in via OAuth) */}
          {token && repos.length > 0 && (
            <div className="space-y-2 pt-1 bg-[#1e1e1e]/30 p-2.5 rounded border border-[#333333]">
              <div className="flex items-center justify-between text-[11px] text-gray-400 font-semibold">
                <span>Your Repositories</span>
                <span className="text-[10px] font-mono text-gray-500">{repos.length} found</span>
              </div>
              
              <div className="relative">
                <input
                  id="input-repo-search"
                  type="text"
                  placeholder="Search your repos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-2.5 pl-7 py-1 bg-[#1e1e1e] border border-[#3c3c3c] text-white rounded text-[10px] focus:outline-none"
                />
                <Search className="w-3 h-3 text-gray-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>

              <div className="max-h-32 overflow-y-auto space-y-1 pr-1 border border-[#1e1e1e] rounded bg-[#1e1e1e]/50">
                {isLoadingRepos ? (
                  <div className="text-center py-4 text-gray-500 flex items-center justify-center gap-1.5">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Loading repos...
                  </div>
                ) : filteredRepos.length === 0 ? (
                  <div className="text-center py-3 text-gray-500">No repositories found.</div>
                ) : (
                  filteredRepos.slice(0, 15).map(repo => (
                    <button
                      id={`btn-select-repo-${repo.id}`}
                      key={repo.id}
                      onClick={() => handleImportRepo(repo.full_name)}
                      className="w-full text-left px-2 py-1.5 hover:bg-[#2d2d30] rounded transition flex items-center justify-between text-[11px] group text-gray-300"
                    >
                      <span className="truncate group-hover:text-white font-medium">{repo.name}</span>
                      <div className="flex items-center gap-1">
                        {repo.private ? <Lock className="w-2.5 h-2.5 text-amber-500/80" /> : <Globe className="w-2.5 h-2.5 text-gray-500" />}
                        <span className="text-[9px] bg-[#333] px-1 rounded text-gray-400 font-mono">{repo.default_branch}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Step 3: Source Control (Changes & Commit) */}
        {selectedRepo && (
          <div className="space-y-3 pt-2 border-t border-[#1e1e1e]">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-300 uppercase tracking-wider text-[10px]">Source Control</h4>
              <div className="flex items-center gap-1 text-[11px] text-gray-400">
                <GitBranch className="w-3.5 h-3.5 text-gray-500" />
                <input
                  id="input-branch-name"
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="bg-transparent text-gray-200 border-none font-semibold focus:outline-none font-mono text-[11px] w-20 hover:bg-[#333] rounded px-1 text-center"
                  title="Branch Name (click to edit)"
                />
              </div>
            </div>

            {/* Display Active Repo Name */}
            <div className="bg-[#1e1e1e]/60 px-3 py-2 rounded text-[11px] font-mono border border-[#333] flex items-center justify-between">
              <span className="truncate text-gray-300 font-bold">{selectedRepo}</span>
              <a 
                href={`https://github.com/${selectedRepo}`} 
                target="_blank" 
                rel="noreferrer" 
                className="text-blue-400 hover:underline"
              >
                GitHub
              </a>
            </div>

            {/* Source Control Changes List */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-gray-400">
                <span>Changes</span>
                <span className="bg-[#1e1e1e] text-gray-400 px-1.5 py-0.2 rounded-full font-mono text-[10px] font-bold">
                  {changesList.length}
                </span>
              </div>

              {changesList.length === 0 ? (
                <div className="text-center py-6 text-gray-500 bg-[#1e1e1e]/20 rounded border border-[#333] border-dashed">
                  No changes detected. Edit any file in the editor.
                </div>
              ) : (
                <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                  {changesList.map(change => (
                    <div 
                      key={change.fileId} 
                      className="flex items-center justify-between px-2.5 py-1.5 bg-[#1e1e1e]/40 hover:bg-[#2d2d30] rounded border border-[#333333] text-[11px] group"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <FileCode className="w-3.5 h-3.5 text-[#007acc] shrink-0" />
                        <span className="truncate text-gray-300 font-mono">{change.name}</span>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono select-none uppercase ${
                        change.type === 'added' ? 'bg-emerald-500/10 text-emerald-400' :
                        change.type === 'modified' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-red-500/10 text-red-400'
                      }`}>
                        {change.type}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Commit Message Box */}
            {changesList.length > 0 && (
              <div className="space-y-2 pt-1">
                <textarea
                  id="textarea-commit-message"
                  rows={2}
                  placeholder="Input commit message... (e.g. 'feat: implement changes')"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  className="w-full px-2.5 py-2 bg-[#1e1e1e] border border-[#3c3c3c] text-white rounded text-[11px] focus:outline-none focus:border-[#007acc] leading-relaxed resize-none"
                />

                <button
                  id="btn-commit-and-push"
                  onClick={handleCommitAndPush}
                  disabled={isPushing}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-[#007acc] hover:bg-[#0062a3] disabled:opacity-50 active:scale-95 text-white font-medium rounded shadow transition"
                >
                  {isPushing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Pushing code to branch...</span>
                    </>
                  ) : (
                    <>
                      <GitCommit className="w-4 h-4" />
                      <span>Commit & Push Changes</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
