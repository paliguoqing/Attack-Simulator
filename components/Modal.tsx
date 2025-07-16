import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div 
        className={`bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-full ${sizeClasses[size]} flex flex-col max-h-[90vh]`}
      >
        {/* Title Bar */}
        <div className="flex justify-between items-center p-6 pb-4 border-b border-neutral-200 dark:border-neutral-700 flex-shrink-0">
          <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100">{title}</h2>
          <button
            onClick={onClose}
            className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Area - scrollable and takes remaining space */}
        <div className="overflow-y-auto flex-grow p-6">
          {children}
        </div>
      </div>
    </div>
  );
};