import { Chip, Tooltip } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import DataObjectIcon from '@mui/icons-material/DataObject';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { useReportViewer } from '../../context/ReportViewerContext';
import type { MessageAttachment } from '../../service/sessions';

interface ReportAttachmentProps {
  file: MessageAttachment;
}

/**
 * Compact chip rendered under an assistant message representing a file
 * the agent produced (e.g. a deep-research target report). Clicking the
 * chip opens the file in the right-side `ReportViewerPanel`.
 */
export const ReportAttachment = ({ file }: ReportAttachmentProps) => {
  const { openFile } = useReportViewer();
  const isMd =
    file.mime_type === 'text/markdown' || /\.md$/i.test(file.original_filename);
  const isJson =
    file.mime_type === 'application/json' || /\.json$/i.test(file.original_filename);
  const Icon = isMd ? DescriptionIcon : isJson ? DataObjectIcon : InsertDriveFileIcon;
  const tooltip = isMd
    ? '点击查看 Markdown 报告'
    : isJson
      ? '点击查看原始 JSON'
      : '点击查看附件';

  return (
    <Tooltip title={tooltip}>
      <Chip
        icon={<Icon />}
        label={file.original_filename}
        onClick={() => openFile(file)}
        clickable
        size="small"
        variant="outlined"
        color={isMd ? 'primary' : 'default'}
        sx={{
          maxWidth: '100%',
          '& .MuiChip-label': {
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          },
        }}
      />
    </Tooltip>
  );
};
