import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Props {
  content: string;
}

export default function MarkdownRenderer({ content }: Props) {
  return (
    <div className="markdown-body text-dark-200 leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 text-white">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-semibold mb-3 mt-6 text-dark-100">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-medium mb-2 mt-4 text-dark-200">{children}</h3>,
          p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return <code className="bg-dark-800 text-primary-300 px-1.5 py-0.5 rounded text-sm" {...props}>{children}</code>;
            }
            return (
              <pre className="bg-dark-800 rounded-lg p-4 mb-4 overflow-x-auto">
                <code className={`text-dark-200 text-sm ${className || ''}`} {...props}>{children}</code>
              </pre>
            );
          },
          ul: ({ children }) => <ul className="mb-3 pl-6 list-disc">{children}</ul>,
          ol: ({ children }) => <ol className="mb-3 pl-6 list-decimal">{children}</ol>,
          li: ({ children }) => <li className="mb-1">{children}</li>,
          strong: ({ children }) => <strong className="text-primary-300 font-semibold">{children}</strong>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary-500 pl-4 py-1 mb-3 bg-dark-800/50 rounded-r">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4">
              <table className="w-full border-collapse">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-dark-600 px-3 py-2 text-left text-sm font-semibold bg-dark-800">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border border-dark-600 px-3 py-2 text-sm">{children}</td>
          ),
          hr: () => <hr className="border-dark-700 my-4" />,
          a: ({ href, children }) => (
            <a href={href} className="text-primary-400 hover:text-primary-300 underline" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
