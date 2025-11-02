import './SemaforoIndicator.css';

interface SemaforoIndicatorProps {
  status: 'verde' | 'amarillo' | 'rojo';
  size?: 'small' | 'medium' | 'large';
}

function SemaforoIndicator({ status, size = 'medium' }: SemaforoIndicatorProps) {
  const getColor = () => {
    switch (status) {
      case 'verde': return '#4CAF50';
      case 'amarillo': return '#FFC107';
      case 'rojo': return '#F44336';
      default: return '#999';
    }
  };

  return (
    <div className={`semaforo-indicator ${size}`}>
      <div 
        className="semaforo-light" 
        style={{ backgroundColor: getColor() }}
      />
    </div>
  );
}

export default SemaforoIndicator;