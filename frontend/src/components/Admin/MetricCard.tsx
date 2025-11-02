import { type ReactNode } from 'react';
import './MetricCard.css';

interface MetricCardProps {
  title: string;
  children: ReactNode;
  className?: string;
}

function MetricCard({ title, children, className = '' }: MetricCardProps) {
  return (
    <div className={`metric-card ${className}`}>
      <h3 className="metric-title">{title}</h3>
      <div className="metric-content">
        {children}
      </div>
    </div>
  );
}

export default MetricCard;