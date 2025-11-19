import React from "react";
import { AlertCircle, CheckCircle } from "lucide-react";
import { useZodForm } from "../../hooks/useZodForm";
import { adminCreateStudentSchema, adminUpdateStudentSchema } from "../../lib/schemas";
import type { StudentBaseResponseDto } from "../../types/studentTypes";
import { selectAdminLoading } from "../../features/admin/adminSelectors";
import { FormModal } from "../../components/ui/FormModal";
import { useSelector } from "react-redux";

interface StudentModalProps {
  student?: StudentBaseResponseDto | null;
  onClose: () => void;
  onSave: (data: Partial<StudentBaseResponseDto>) => void;
  isOpen: boolean;
  loading?: boolean;
}

// Define the form data type based on your schema
type StudentFormData = {
  fullName: string;
  email: string;
  phoneNumber: string;
};

export const StudentModal: React.FC<StudentModalProps> = ({
  student,
  onClose,
  onSave,
  isOpen,
  loading = false
}) => {
  const globalLoading = useSelector(selectAdminLoading);
  const isLoading = loading || globalLoading;

  const schema = student ? adminUpdateStudentSchema : adminCreateStudentSchema;
  
  // Properly typed initial values
  const initialValues: StudentFormData = {
    fullName: student?.fullName || "",
    email: student?.email || "",
    phoneNumber: student?.phoneNumber || "",
  };

  const {
    formData,
    errors,
    touched,
    setFieldValue,
    setFieldTouched,
    validateForm,
    isFormValid,
    resetForm
  } = useZodForm<StudentFormData>(schema, initialValues);

  // Reset form when modal opens/closes or student changes
  React.useEffect(() => {
    if (isOpen) {
      resetForm(initialValues);
    }
  }, [isOpen, student]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched to show validation errors
    (Object.keys(formData) as Array<keyof StudentFormData>).forEach(field => {
      setFieldTouched(field);
    });

    const isValid = validateForm();
    console.log("📝 Form validation result:", { isValid, formData, errors });

    if (!isValid) {
      console.log("❌ Form validation failed:", errors);
      return;
    }

    // For update, only send changed fields to avoid unnecessary updates
    let dataToSave: Partial<StudentBaseResponseDto> = { ...formData };
    
    if (student) {
      // For updates, only include fields that have actually changed
      dataToSave = {};
      if (formData.fullName !== student.fullName) {
        dataToSave.fullName = formData.fullName;
      }
      if (formData.email !== student.email) {
        dataToSave.email = formData.email;
      }
      if (formData.phoneNumber !== student.phoneNumber) {
        dataToSave.phoneNumber = formData.phoneNumber;
      }
      
      // If nothing changed, show message and return
      if (Object.keys(dataToSave).length === 0) {
        console.log("ℹ️ No changes detected");
        onClose();
        return;
      }
    }

    console.log("✅ Submitting form data:", dataToSave);
    onSave(dataToSave);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getFieldStatus = (field: keyof StudentFormData) => {
    if (!touched[field]) return 'default';
    if (errors[field]) return 'error';
    return 'success';
  };

  const getStatusIcon = (field: keyof StudentFormData) => {
    const status = getFieldStatus(field);
    switch (status) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getInputClass = (field: keyof StudentFormData) => {
    const baseClass = "w-full p-3 bg-white border rounded-lg text-gray-900 focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed";
    const status = getFieldStatus(field);
    
    switch (status) {
      case 'error':
        return `${baseClass} border-red-500 pr-10`;
      case 'success':
        return `${baseClass} border-green-500 pr-10`;
      default:
        return `${baseClass} border-gray-300`;
    }
  };

  // Debug current form state
  React.useEffect(() => {
    console.log("🔍 StudentModal Debug:", {
      isOpen,
      student: student?.id,
      formData,
      errors,
      touched,
      isFormValid
    });
  }, [formData, errors, touched, isFormValid, isOpen, student]);

  return (
    <FormModal
      isOpen={isOpen}
      onClose={handleClose}
      onSubmit={handleSubmit}
      title={student ? "Edit Student" : "Add Student"}
      isLoading={isLoading}
      isSubmitDisabled={!isFormValid && Object.keys(touched).length > 0}
      submitText={student ? "Update Student" : "Add Student"}
      size="md"
    >
      <div className="space-y-4">
        {/* Full Name Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name {!student && "*"}
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFieldValue("fullName", e.target.value)}
              onBlur={() => setFieldTouched("fullName")}
              className={getInputClass("fullName")}
              placeholder="Enter full name"
              disabled={isLoading}
              maxLength={100}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {getStatusIcon("fullName")}
            </div>
          </div>
          {errors.fullName && touched.fullName && (
            <p className="text-red-500 text-xs mt-1 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              {errors.fullName}
            </p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email {!student && "*"}
          </label>
          <div className="relative">
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFieldValue("email", e.target.value)}
              onBlur={() => setFieldTouched("email")}
              className={getInputClass("email")}
              placeholder="Enter email address"
              disabled={isLoading}
              maxLength={100}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {getStatusIcon("email")}
            </div>
          </div>
          {errors.email && touched.email && (
            <p className="text-red-500 text-xs mt-1 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              {errors.email}
            </p>
          )}
        </div>

        {/* Phone Number Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number {!student && "*"}
          </label>
          <div className="relative">
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFieldValue("phoneNumber", e.target.value)}
              onBlur={() => setFieldTouched("phoneNumber")}
              className={getInputClass("phoneNumber")}
              placeholder="Enter phone number"
              disabled={isLoading || !!student} // Disable for edits if needed
              maxLength={15}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {getStatusIcon("phoneNumber")}
            </div>
          </div>
          {errors.phoneNumber && touched.phoneNumber && (
            <p className="text-red-500 text-xs mt-1 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              {errors.phoneNumber}
            </p>
          )}
          {student && (
            <p className="text-gray-500 text-xs mt-1">
              Phone number cannot be changed for existing students
            </p>
          )}
        </div>
      </div>
    </FormModal>
  );
};