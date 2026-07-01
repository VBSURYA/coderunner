import React, { useState } from 'react';
import { FileItem, LANGUAGE_METADATA } from '../types';
import { 
  FileCode, 
  FileJson, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  ChevronRight,
  Code,
  ChevronDown,
  Folder,
} from 'lucide-react';

interface FileTreeProps {
  files: FileItem[];
  activeFileId: string | null;
  onSelectFile: (id: string) => void;
  onCreateFile: (name: string, language: string) => void;
  onRenameFile: (id: string, newName: string) => void;
  onDeleteFile: (id: string) => void;
}

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  fileId?: string;
  children?: TreeNode[];
  fileItem?: FileItem;
}


export default function FileTree({
  files,
  activeFileId,
  onSelectFile,
  onCreateFile,
  onRenameFile,
  onDeleteFile
}: FileTreeProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileLang, setNewFileLang] = useState('javascript');
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [createFolderPath, setCreateFolderPath] = useState<string | null>(null);


  // Track expanded folder paths
  const [expandedPaths, setExpandedPaths] = useState<Record<string, boolean>>({});

  // Auto-expand newly imported folders to ensure instant visibility, while preserving user collapses
  const filenamesJoined = files.map(f => f.name).sort().join(',');
  useEffect(() => {
    const paths: Record<string, boolean> = {};
    files.forEach(file => {
      const parts = file.name.split('/');
      let currentPath = '';
      for (let i = 0; i < parts.length - 1; i++) {
        currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
        paths[currentPath] = true;
      }
    });

    setExpandedPaths(prev => {
      const next = { ...prev };
      Object.keys(paths).forEach(p => {
        if (next[p] === undefined) {
          next[p] = true; // Default to open
        }
      });
      return next;
    });
  }, [filenamesJoined]);



  const handleStartCreate = () => {
    setCreateFolderPath(null);
    setIsCreating(true);
    setNewFileName('untitled.js');
    setNewFileLang('javascript');
  };

   const handleStartCreateInFolder = (folderPath: string) => {
    setCreateFolderPath(folderPath);
    setIsCreating(true);
    setNewFileName('untitled.js');
    setNewFileLang('javascript');
    
    // Auto-expand folder being created in
    setExpandedPaths(prev => ({ ...prev, [folderPath]: true }));
  };

  const handleFileNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewFileName(val);
    
    // Auto detect language from extension
    const ext = val.substring(val.lastIndexOf('.')).toLowerCase();
    for (const [lang, meta] of Object.entries(LANGUAGE_METADATA)) {
      if (ext === meta.defaultExtension) {
        setNewFileLang(lang);
        break;
      }
    }
  };

  const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    setNewFileLang(lang);
    
    // Auto update extension
    const meta = LANGUAGE_METADATA[lang];
    if (meta) {
      const dotIndex = newFileName.lastIndexOf('.');
      const baseName = dotIndex !== -1 ? newFileName.substring(0, dotIndex) : newFileName || 'untitled';
      setNewFileName(baseName + meta.defaultExtension);
    }
  };

  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    const fullPath = createFolderPath 
      ? `${createFolderPath}/${newFileName.trim()}` 
      : newFileName.trim();
    
    // Check if filename already exists
    if (files.some(f => f.name.toLowerCase() === fullPath.toLowerCase())) {
      alert('A file with this name already exists.');
      return;
    }

    onCreateFile(fullPath, newFileLang);
    setIsCreating(false);
    setNewFileName('');
    setCreateFolderPath(null);
  };

  const handleStartRename = (nodeName: string, file: FileItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFileId(file.id);
    setEditingName(nodeName);
  };

  const handleSubmitRename = (id: string, originalPath: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!editingName.trim()) return;

    // Preserve the original path structure up to the renamed node name
    const parts = originalPath.split('/');
    let newFullPath = '';
    if (parts.length > 1) {
      const parentParts = parts.slice(0, parts.length - 1);
      newFullPath = parentParts.join('/') + '/' + editingName.trim();
    } else {
      newFullPath = editingName.trim();
    }


    if (files.some(f => f.id !== id && f.name.toLowerCase() === newFullPath.toLowerCase())) {
      alert('A file with this name already exists.');
      return;
    }

    onRenameFile(id, newFullPath);
    setEditingFileId(null);
  };

    const toggleFolder = (path: string) => {
    setExpandedPaths(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const getFileIcon = (fileName: string, language: string) => {
    const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    if (ext === '.html') return <FileCode className="w-4 h-4 text-orange-500" />;
    if (ext === '.css') return <FileCode className="w-4 h-4 text-blue-400" />;
    if (ext === '.json') return <FileJson className="w-4 h-4 text-yellow-500" />;
    if (language === 'python') return <Code className="w-4 h-4 text-emerald-400" />;
    if (language === 'typescript') return <Code className="w-4 h-4 text-sky-400" />;
    if (language === 'cpp') return <Code className="w-4 h-4 text-purple-400" />;
    if (language === 'java') return <Code className="w-4 h-4 text-amber-500" />;
    return <FileCode className="w-4 h-4 text-yellow-400" />;
  };


   // ---------------------------------------------------------
  // CONSTRUCT TREE HIERARCHY FROM FLAT FILENAMES
  // ---------------------------------------------------------
  const buildTree = (): TreeNode => {
    const root: TreeNode = {
      name: 'Root',
      path: '',
      type: 'folder',
      children: []
    };

    files.forEach(file => {
      const parts = file.name.split('/');
      let current = root;
      let currentPath = '';

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!part) continue;
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        const isLast = i === parts.length - 1;
        let existing = current.children?.find(child => child.name === part);

        if (!existing) {
          existing = {
            name: part,
            path: currentPath,
            type: isLast ? 'file' : 'folder',
            fileId: isLast ? file.id : undefined,
            children: isLast ? undefined : [],
            fileItem: isLast ? file : undefined
          };
          current.children?.push(existing);
        }
        current = existing;
      }
    });

    // Sort: folders first, then files. Alphabetically sorted.
    const sortTree = (node: TreeNode) => {
      if (node.children) {
        node.children.sort((a, b) => {
          if (a.type !== b.type) {
            return a.type === 'folder' ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        });
        node.children.forEach(sortTree);
      }
    };
    sortTree(root);

    return root;
  };

  const fileTreeRoot = buildTree();

  // Recursive Tree Node Renderer
  const renderNode = (node: TreeNode, level: number = 0) => {
    if (node.path === '') {
      // Root folder wrapper
      return (
        <div className="space-y-[2px]">
          {node.children?.map(child => renderNode(child, level))}
        </div>
      );
    }

    const isFolder = node.type === 'folder';
    const isExpanded = !!expandedPaths[node.path];

    if (isFolder) {
      return (
        <div key={node.path} className="space-y-[2px]">
          {/* Folder row */}
          <div
            id={`folder-item-${node.path.replace(/\//g, '-')}`}
            onClick={() => toggleFolder(node.path)}
            className="group flex items-center justify-between px-3 py-1.5 rounded cursor-pointer hover:bg-[#2a2d2e] text-gray-300 hover:text-white transition text-xs select-none"
            style={{ paddingLeft: `${12 + level * 10}px` }}
          >
            <div className="flex items-center gap-1.5 flex-1 min-w-0 font-medium">
              <span className="text-gray-400">
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </span>
              <Folder className={`w-4 h-4 shrink-0 ${isExpanded ? 'text-amber-400' : 'text-amber-500/80'}`} />
              <span className="truncate font-mono">{node.name}</span>
            </div>

            {/* Folder Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition duration-150">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartCreateInFolder(node.path);
                }}
                className="p-0.5 rounded text-gray-400 hover:text-white hover:bg-[#3e3e42]"
                title="New File in this folder"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Children nodes */}
          {isExpanded && node.children && (
            <div className="space-y-[2px]">
              {node.children.map(child => renderNode(child, level + 1))}
            </div>
          )}
        </div>
      );
    } else {
      // File node
      const file = node.fileItem!;
      const isActive = file.id === activeFileId;
      const isEditing = file.id === editingFileId;

      return (
        <div
          key={file.id}
          id={`file-item-${file.id}`}
          onClick={() => !isEditing && onSelectFile(file.id)}
          className={`group flex items-center justify-between px-3 py-1.5 rounded cursor-pointer transition text-xs ${
            isActive 
              ? 'bg-[#37373d] text-white border-l-2 border-[#007acc]' 
              : 'hover:bg-[#2a2d2e] text-gray-400 hover:text-gray-200'
          }`}
          style={{ paddingLeft: `${24 + level * 10}px` }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {getFileIcon(file.name, file.language)}
            
            {isEditing ? (
              <form 
                onSubmit={(e) => handleSubmitRename(file.id, node.path, e)} 
                onClick={(e) => e.stopPropagation()}
                className="flex-1 animate-fade-in"
              >
                <input
                  id={`input-rename-${file.id}`}
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="w-full px-1 py-0.5 bg-[#2c2c2c] text-white text-xs border border-[#007acc] focus:outline-none rounded font-mono"
                  autoFocus
                  onBlur={() => setEditingFileId(null)}
                />
              </form>
            ) : (
              <span className="truncate font-mono">{node.name}</span>
            )}
          </div>

          {!isEditing && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition duration-150">
              <button
                id={`btn-rename-${file.id}`}
                onClick={(e) => handleStartRename(node.name, file, e)}
                className="p-0.5 rounded text-gray-400 hover:text-white hover:bg-[#3e3e42]"
                title="Rename file"
              >
                <Edit3 className="w-3 h-3" />
              </button>
              <button
                id={`btn-delete-${file.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Are you sure you want to delete ${file.name}?`)) {
                    onDeleteFile(file.id);
                  }
                }}
                className="p-0.5 rounded text-gray-400 hover:text-red-400 hover:bg-[#3e3e42]"
                title="Delete file"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      );
    }
  };


  return (
    <div id="file-tree-container" className="flex flex-col h-full bg-[#252526] text-[#cccccc] select-none">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e1e] bg-[#252526]">
        <div className="flex items-center gap-2">
          <ChevronRight className="w-4 h-4 text-gray-500 transform rotate-90" />
          <span className="text-xs font-semibold tracking-wider text-[#cccccc]/70 uppercase">Explorer</span>
        </div>
        <button
          id="btn-new-file"
          onClick={handleStartCreate}
          className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#333333] transition"
          title="New File"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {/* Create File Box */}
        {isCreating && (
          <form onSubmit={handleSubmitCreate} className="px-3 py-2 bg-[#1e1e1e] border border-[#007acc]/50 rounded mx-2 mb-2 animate-fade-in">
            <div className="flex flex-col gap-2">
               <div className="text-[10px] text-gray-500 font-mono truncate">
                Creating in: <span className="text-[#007acc]">{createFolderPath ? createFolderPath + '/' : 'Root'}</span>
              </div>
              <input
                id="input-new-filename"
                type="text"
                value={newFileName}
                onChange={handleFileNameChange}
                className="w-full px-2 py-1 text-xs bg-[#2c2c2c] text-white rounded border border-[#454545] focus:outline-none focus:border-[#007acc]"
                placeholder="filename.js"
                autoFocus
              />
              <div className="flex items-center justify-between gap-2">
                <select
                  id="select-new-file-lang"
                  value={newFileLang}
                  onChange={handleLangChange}
                  className="px-1 py-0.5 text-[10px] bg-[#2c2c2c] text-gray-300 rounded border border-[#454545] focus:outline-none"
                >
                  {Object.entries(LANGUAGE_METADATA).map(([key, meta]) => (
                    <option key={key} value={key}>{meta.label}</option>
                  ))}
                </select>
                <div className="flex items-center gap-1">
                  <button
                    type="submit"
                    className="p-1 bg-[#007acc] hover:bg-[#0062a3] rounded text-white"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {setIsCreating(false); setCreateFolderPath(null);}}
                    className="p-1 bg-[#3e3e42] hover:bg-[#4f4f4f] rounded text-gray-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* Files List */}
        {files.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-gray-500">
            No files in workspace.<br />Click "+" or import a repo.
          </div>
        ) : (
          <div id="file-list" className="space-y-[2px] px-1">
           {renderNode(fileTreeRoot)}
          </div>
        )}
      </div>
      
      {/* Templates Quick Start */}
      <div className="p-3 border-t border-[#1e1e1e] bg-[#1e1e1e]">
        <div className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase mb-2">Templates</div>
        <div className="grid grid-cols-2 gap-1.5">
          {Object.entries(LANGUAGE_METADATA)
            .filter(([_, meta]) => ['javascript', 'python', 'html', 'cpp'].includes(_))
            .map(([lang, meta]) => (
              <button
                key={lang}
                onClick={() => onCreateFile(`sample${meta.defaultExtension}`, lang)}
                className="flex items-center justify-center gap-1 px-2 py-1 text-[10px] text-gray-400 bg-[#252526] border border-[#3e3e3e] hover:border-[#007acc] hover:text-white rounded transition"
              >
                <span>+</span>
                <span className="font-mono">{meta.icon}</span>
              </button>
            ))
          }
        </div>
      </div>
    </div>
  );
}
