import type { FC, ReactNode } from 'react';

interface ReportTerminalProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

const ReportTerminal: FC<ReportTerminalProps> = ({ title = 'Report', children, className = '' }) => (
  <div className={`report-terminal ${className}`}>
    <div className="report-terminal__header">
      <span className="report-terminal__title">{title}</span>
    </div>
    <div className="report-terminal__body">{children}</div>
  </div>
);

export default ReportTerminal;
