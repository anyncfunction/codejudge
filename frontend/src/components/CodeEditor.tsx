import Editor from '@monaco-editor/react';
import { Code2 } from 'lucide-react';

interface CodeEditorProps {
  code: string;
  language: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export default function CodeEditor({ code, language, onChange, readOnly = false }: CodeEditorProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        <div className="flex-1 border-b border-dark-700" />
        <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-dark-400">
          <Code2 className="w-3.5 h-3.5" />
          {language === 'python' ? 'Python' : language === 'cpp' ? 'C++' : 'JavaScript'}
        </span>
      </div>

      <div className="rounded-lg border border-dark-700 overflow-hidden">
        <Editor
          height="400px"
          language={language === 'python' ? 'python' : language === 'cpp' ? 'cpp' : 'javascript'}
          value={code}
          onChange={(value) => onChange(value || '')}
          theme="vs-dark"
          options={{
            readOnly,
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            lineNumbers: 'on',
            renderLineHighlight: 'line',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            padding: { top: 12 },
          }}
          loading={
            <div className="h-full flex items-center justify-center text-dark-500">
              加载编辑器中...
            </div>
          }
        />
      </div>
    </div>
  );
}
