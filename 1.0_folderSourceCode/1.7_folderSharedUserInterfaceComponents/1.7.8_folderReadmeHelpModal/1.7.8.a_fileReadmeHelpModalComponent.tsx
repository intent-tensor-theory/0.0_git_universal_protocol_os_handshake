// ============================================
// PROTOCOL OS - README HELP MODAL COMPONENT
// ============================================
// Address: 1.7.8.a
// Purpose: Displays README documentation in a blur overlay modal
// Features: Markdown rendering, copy to clipboard, download as file
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import { getReadmePath, SECTION_TITLES } from './1.7.8.c_fileReadmePathRegistry';
import './1.7.8.b_fileReadmeHelpModalStyles.css';

interface ReadmeHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  section: 1 | 2 | 3 | 4;
  authType?: string; // Required for section 2 to get dynamic README
}

export const ReadmeHelpModal: React.FC<ReadmeHelpModalProps> = ({
  isOpen,
  onClose,
  section,
  authType,
}) => {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Fetch README content when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchReadme = async () => {
      setIsLoading(true);
      setError(null);
      setContent('');

      const path = getReadmePath(section, authType);
      
      if (!path) {
        if (section === 2 && !authType) {
          setError('Please select a protocol first to view its configuration guide.');
        } else {
          setError('Documentation not found for this section.');
        }
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(path);
        if (!response.ok) {
          throw new Error(`Failed to load documentation (${response.status})`);
        }
        const text = await response.text();
        setContent(text);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load documentation');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReadme();
  }, [isOpen, section, authType]);

  // Handle copy to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [content]);

  // Handle download as file
  const handleDownload = useCallback(() => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${SECTION_TITLES[section].replace(/\s+/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [content, section]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="readme-modal-overlay" onClick={onClose}>
      <div className="readme-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="readme-modal-header">
          <h2 className="readme-modal-title">
            <span className="readme-modal-section-badge">{section}</span>
            {SECTION_TITLES[section]}
          </h2>
          <div className="readme-modal-actions">
            {content && (
              <>
                <button
                  className="readme-modal-btn readme-modal-btn--copy"
                  onClick={handleCopy}
                  title="Copy to clipboard"
                >
                  {copySuccess ? '✓ Copied!' : '📋 Copy'}
                </button>
                <button
                  className="readme-modal-btn readme-modal-btn--download"
                  onClick={handleDownload}
                  title="Download as .md file"
                >
                  ⬇️ Download
                </button>
              </>
            )}
            <button
              className="readme-modal-btn readme-modal-btn--close"
              onClick={onClose}
              title="Close (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="readme-modal-content">
          {isLoading && (
            <div className="readme-modal-loading">
              <div className="readme-modal-spinner"></div>
              <p>Loading documentation...</p>
            </div>
          )}
          
          {error && (
            <div className="readme-modal-error">
              <p>⚠️ {error}</p>
            </div>
          )}
          
          {!isLoading && !error && content && (
            <div className="readme-modal-markdown">
              <MarkdownRenderer content={content} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// SIMPLE MARKDOWN RENDERER
// ============================================
// Converts markdown to HTML without external dependencies

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const renderMarkdown = (md: string): string => {
    let html = md
      // Escape HTML
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      
      // Code blocks (``` ... ```)
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="code-block"><code>$2</code></pre>')
      
      // Inline code (`...`)
      .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
      
      // Headers
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      
      // Bold
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      
      // Italic
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      
      // Horizontal rule
      .replace(/^---$/gm, '<hr />')
      
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      
      // Tables (simplified - captures pipe-delimited rows)
      .replace(/^\|(.+)\|$/gm, (match, content) => {
        const cells = content.split('|').map((cell: string) => cell.trim());
        const isHeader = cells.every((cell: string) => cell.match(/^-+$/));
        if (isHeader) return ''; // Skip separator row
        const cellTag = 'td';
        const cellsHtml = cells.map((cell: string) => `<${cellTag}>${cell}</${cellTag}>`).join('');
        return `<tr>${cellsHtml}</tr>`;
      })
      
      // Wrap table rows
      .replace(/(<tr>[\s\S]*?<\/tr>)\n(<tr>)/g, '$1$2')
      
      // Unordered lists
      .replace(/^\- (.*$)/gm, '<li>$1</li>')
      .replace(/^\* (.*$)/gm, '<li>$1</li>')
      
      // Ordered lists
      .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
      
      // Wrap consecutive li elements in ul
      .replace(/(<li>[\s\S]*?<\/li>)(?=\n(?!<li>)|\n*$)/g, '<ul>$1</ul>')
      
      // Blockquotes
      .replace(/^&gt; (.*$)/gm, '<blockquote>$1</blockquote>')
      
      // Paragraphs (double newlines)
      .replace(/\n\n/g, '</p><p>')
      
      // Single newlines to <br> (within paragraphs)
      .replace(/\n/g, '<br />');

    // Wrap in paragraph if not already wrapped
    if (!html.startsWith('<')) {
      html = `<p>${html}</p>`;
    }

    return html;
  };

  return (
    <div 
      className="markdown-body"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  );
};

export default ReadmeHelpModal;
