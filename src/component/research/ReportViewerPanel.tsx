import { useEffect, useState } from 'react';
import {
  Drawer,
  Box,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
  Tooltip,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useReportViewer } from '../../context/ReportViewerContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

/**
 * Resolve a possibly relative `download_url` (e.g. "/api/v1/...") into a
 * fully-qualified URL pointing at the API host.
 */
function resolveDownloadUrl(url: string): string {
  if (/^https?:\/\//.test(url)) return url;
  // download_url from the backend looks like "/api/v1/projects/.../download".
  // API_BASE already includes "/api/v1", so strip it to avoid duplication.
  const base = API_BASE.replace(/\/api\/v1\/?$/, '');
  return `${base}${url}`;
}

/**
 * Code-block renderer that gives chemistry/biology-specific languages
 * (smiles, sequence, fasta) a distinct visual treatment so users can
 * spot SMILES strings, peptide sequences, etc. at a glance.
 */
const codeRenderer = ({ inline, className, children, ...rest }: any) => {
  const match = /language-(\w+)/.exec(className || '');
  const lang = match?.[1]?.toLowerCase();

  if (inline) {
    return (
      <code className={className} {...rest}>
        {children}
      </code>
    );
  }

  const palette: Record<string, { bg: string; border: string; label: string }> = {
    smiles: { bg: '#fff8e1', border: '#ffb300', label: 'SMILES' },
    sequence: { bg: '#e8f5e9', border: '#43a047', label: 'SEQUENCE' },
    fasta: { bg: '#e3f2fd', border: '#1e88e5', label: 'FASTA' },
  };
  const sty = lang ? palette[lang] : undefined;

  if (sty) {
    return (
      <Box
        sx={{
          position: 'relative',
          my: 1.5,
          p: 1.5,
          pt: 2.5,
          bgcolor: sty.bg,
          borderLeft: `4px solid ${sty.border}`,
          borderRadius: 1,
          fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
          fontSize: '0.85rem',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          overflowX: 'auto',
        }}
      >
        <Typography
          variant="caption"
          sx={{
            position: 'absolute',
            top: 4,
            right: 8,
            fontSize: '0.65rem',
            fontWeight: 700,
            color: sty.border,
            letterSpacing: 1,
          }}
        >
          {sty.label}
        </Typography>
        <code className={className} {...rest}>
          {children}
        </code>
      </Box>
    );
  }

  return (
    <Box
      component="pre"
      sx={{
        bgcolor: '#f5f5f5',
        p: 1.5,
        borderRadius: 1,
        overflowX: 'auto',
        fontSize: '0.85rem',
      }}
    >
      <code className={className} {...rest}>
        {children}
      </code>
    </Box>
  );
};

const markdownComponents = {
  code: codeRenderer,
  table: (props: any) => (
    <Box
      component="table"
      sx={{
        borderCollapse: 'collapse',
        width: '100%',
        my: 1.5,
        '& th, & td': { border: '1px solid #ddd', px: 1, py: 0.5, textAlign: 'left' },
        '& thead th': { bgcolor: '#f5f5f5', fontWeight: 600 },
      }}
      {...props}
    />
  ),
  a: (props: any) => (
    <a {...props} target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2' }} />
  ),
};

export const ReportViewerPanel = () => {
  const { currentFile, isOpen, close } = useReportViewer();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentFile || !isOpen) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setContent('');

    const url = resolveDownloadUrl(currentFile.download_url);
    const token = localStorage.getItem('token');

    (async () => {
      try {
        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        if (!cancelled) setContent(text);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load report');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentFile, isOpen]);

  const isMarkdown =
    currentFile?.mime_type === 'text/markdown' ||
    /\.md$/i.test(currentFile?.original_filename || '');

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={close}
      ModalProps={{ keepMounted: false }}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: '70vw', md: '55vw' },
          maxWidth: 1100,
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            borderBottom: 1,
            borderColor: 'divider',
            flexShrink: 0,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" noWrap sx={{ fontWeight: 600 }}>
              {currentFile?.original_filename || 'Report'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {currentFile?.mime_type}
            </Typography>
          </Box>
          {currentFile && (
            <>
              <Tooltip title="Open in new tab">
                <IconButton
                  size="small"
                  component="a"
                  href={resolveDownloadUrl(currentFile.download_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <OpenInNewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Download">
                <IconButton
                  size="small"
                  component="a"
                  href={resolveDownloadUrl(currentFile.download_url)}
                  download={currentFile.original_filename}
                >
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <Tooltip title="Close">
            <IconButton size="small" onClick={close}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Body */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={28} />
            </Box>
          )}
          {error && <Alert severity="error">{error}</Alert>}
          {!loading && !error && content && (
            isMarkdown ? (
              <Box
                sx={{
                  '& h1, & h2, & h3': { mt: 2, mb: 1 },
                  '& h1': { fontSize: '1.6rem', borderBottom: '1px solid #eee', pb: 0.5 },
                  '& h2': { fontSize: '1.3rem' },
                  '& h3': { fontSize: '1.1rem' },
                  '& p': { lineHeight: 1.7 },
                  '& ul, & ol': { pl: 3 },
                  '& blockquote': {
                    borderLeft: '4px solid #e0e0e0',
                    pl: 2,
                    color: 'text.secondary',
                    my: 1,
                  },
                }}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {content}
                </ReactMarkdown>
              </Box>
            ) : (
              <Box
                component="pre"
                sx={{
                  fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
                  fontSize: '0.85rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {content}
              </Box>
            )
          )}
        </Box>
      </Box>
    </Drawer>
  );
};
