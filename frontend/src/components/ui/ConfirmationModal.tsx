import React from "react";
import { Modal } from "./modal";
import { AlertTriangle, Info } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "info";
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
}) => {
  const variantConfig = {
    danger: {
      icon: AlertTriangle,
      confirmButtonClass: "bg-red-600 hover:bg-red-700 text-white",
      iconClass: "text-red-500",
    },
    info: {
      icon: Info,
      confirmButtonClass: "bg-blue-600 hover:bg-blue-700 text-white",
      iconClass: "text-blue-500",
    },
  };

  const config = variantConfig[variant];
  const IconComponent = config.icon;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      closeOnOverlayClick={!isLoading}
    >
      <div className="p-6">
        <div className="flex items-start space-x-3">
          <div className={`p-2 rounded-full ${config.iconClass} bg-opacity-10`}>
            <IconComponent size={24} />
          </div>
          <div className="flex-1">
            <p className="text-gray-600">{message}</p>
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-3 rounded-lg transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed ${config.confirmButtonClass}`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Processing...
              </div>
            ) : (
              confirmText
            )}
          </button>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition-colors font-medium disabled:bg-gray-200 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
