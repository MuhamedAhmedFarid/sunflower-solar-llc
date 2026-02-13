
import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [onClose, duration]);

  return (
    <div className="fixed bottom-5 right-5 bg-primary text-white py-3 px-6 rounded-lg shadow-2xl shadow-primary/20 animate-fade-in-up border border-primary/20">
      <p className="font-semibold text-sm">{message}</p>
    </div>
  );
};

export default Toast;
