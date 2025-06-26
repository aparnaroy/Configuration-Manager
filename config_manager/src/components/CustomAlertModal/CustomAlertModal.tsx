import './CustomAlertModal.css';

type CustomAlertModalProps = {
  show: boolean;
  title: string;
  message: string;
  onClose: () => void;
};

export const CustomAlertModal = ({ show, title, message, onClose }: CustomAlertModalProps) => {
  if (!show) return null;

  return (
    <div className="custom-alert-overlay">
      <div className="custom-alert-modal">
        <div className="custom-alert-header">
          <span>{title}</span>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>
        <div className="custom-alert-body">{message}</div>
        <div className="custom-alert-footer">
          <button onClick={onClose} className="ok-btn">OK</button>
        </div>
      </div>
    </div>
  );
};
