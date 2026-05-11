import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { MessageAttachment } from '../service/sessions';

interface ReportViewerContextValue {
  currentFile: MessageAttachment | null;
  isOpen: boolean;
  openFile: (file: MessageAttachment) => void;
  close: () => void;
}

const ReportViewerContext = createContext<ReportViewerContextValue | null>(null);

export const ReportViewerProvider = ({ children }: { children: ReactNode }) => {
  const [currentFile, setCurrentFile] = useState<MessageAttachment | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openFile = useCallback((file: MessageAttachment) => {
    setCurrentFile(file);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const value = useMemo(
    () => ({ currentFile, isOpen, openFile, close }),
    [currentFile, isOpen, openFile, close]
  );

  return <ReportViewerContext.Provider value={value}>{children}</ReportViewerContext.Provider>;
};

export const useReportViewer = (): ReportViewerContextValue => {
  const ctx = useContext(ReportViewerContext);
  if (!ctx) {
    throw new Error('useReportViewer must be used inside <ReportViewerProvider>');
  }
  return ctx;
};
