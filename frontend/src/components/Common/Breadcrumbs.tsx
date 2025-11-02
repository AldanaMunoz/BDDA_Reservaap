import { useNavigate } from 'react-router-dom';
import './Breadcrumbs.css';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

function Breadcrumbs({ items }: BreadcrumbsProps) {
  const navigate = useNavigate();

  return (
    <div className="breadcrumbs">
      {items.map((item, index) => (
        <span key={index} className="breadcrumb-item">
          {item.path ? (
            <>
              <span 
                className="breadcrumb-link" 
                onClick={() => navigate(item.path!)}
              >
                {item.label}
              </span>
              {index < items.length - 1 && <span className="breadcrumb-separator">›</span>}
            </>
          ) : (
            <>
              <span className="breadcrumb-current">{item.label}</span>
              {index < items.length - 1 && <span className="breadcrumb-separator">›</span>}
            </>
          )}
        </span>
      ))}
    </div>
  );
}

export default Breadcrumbs;