import React from 'react';
import Editor from '@monaco-editor/react';
import { FileItem } from '../types';

interface CodeEditorProps {
  file: FileItem | null;
}

export function CodeEditor({ file }: CodeEditorProps) {
  const handleEditorChange = (value: string | undefined) => {
    if (file && value !== undefined) {
      // Update file content in the files state through the webcontainer mount
      if (file.type === 'file') {
        file.content = value;
      }
    }
  };

  if (!file) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        Select a file to view its contents
      </div>
    );
  }

  // Only show editor for files, not folders
  if (file.type === 'folder') {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        Cannot edit folder contents directly
      </div>
    );
  }

  return (
    <Editor
      height="100%"
      defaultLanguage={getLanguageFromPath(file.path)}
      theme="vs-dark"
      value={file.content}
      onChange={handleEditorChange}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        wordWrap: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
      }}
      path={file.path}
    />
  );
}

// Helper function to determine language based on file extension
function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
      return 'javascript';
    case 'ts':
      return 'typescript';
    case 'jsx':
    case 'tsx':
      return 'typescript';
    case 'css':
      return 'css';
    case 'html':
      return 'html';
    case 'json':
      return 'json';
    default:
      return 'plaintext';
  }
}