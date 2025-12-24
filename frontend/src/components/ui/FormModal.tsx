import React from "react";
import { Modal } from "./modal";

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  submitText?: string;
  cancelText?: string;
  isLoading?: boolean;
  isSubmitDisabled?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

export const FormModal: React.FC<FormModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  onSubmit,
  submitText = "Save",
  cancelText = "Cancel",
  isLoading = false,
  isSubmitDisabled = false,
  size = "lg",
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      closeOnOverlayClick={!isLoading}
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

        {/* Form Actions */}
        <div className="flex space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="submit"
            disabled={isLoading || isSubmitDisabled}
            className="flex-1 bg-cyan-600 text-white py-3 rounded-lg hover:bg-cyan-700 transition-colors font-medium disabled:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Saving...
              </div>
            ) : (
              submitText
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition-colors font-medium disabled:bg-gray-200 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
        </div>
      </form>
    </Modal>
  );
};
