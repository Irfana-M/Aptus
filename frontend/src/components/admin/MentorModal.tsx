import React from "react";
//import { useDispatch, useSelector } from "react-redux";
import { AlertCircle, CheckCircle } from "lucide-react";
import { useZodForm } from "../../hooks/useZodForm";
import { adminCreateMentorSchema, adminUpdateMentorSchema } from "../../lib/schemas/mentor.schemas";
import type { MentorProfile } from "../../features/mentor/mentorSlice";
//import type { AppDispatch } from "../../app/store";
import { selectAdminLoading } from "../../features/admin/adminSelectors";
import { FormModal } from "../../components/ui/FormModal";
import { useSelector } from "react-redux";

interface MentorModalProps {
  mentor?: MentorProfile | null;
  onClose: () => void;
  onSave: (data: any) => void;
  isOpen: boolean;
  loading?: boolean;
}

export const MentorModal: React.FC<MentorModalProps> = ({
  mentor,
  onClose,
  onSave,
  isOpen,
  loading = false
}) => {
  //const dispatch = useDispatch<AppDispatch>();
  const globalLoading = useSelector(selectAdminLoading);
  const isLoading = loading || globalLoading;

  const schema = mentor ? adminUpdateMentorSchema : adminCreateMentorSchema;
  
  const initialValues = mentor ? {
    fullName: mentor.fullName || "",
    email: mentor.email || "",
    phoneNumber: mentor.phoneNumber || "",
    location: mentor.location || "",
    bio: mentor.bio || "",
  } : {
    fullName: "",
    email: "",
    phoneNumber: "",
    location: "",
    bio: "",
  };

  const {
    formData,
    errors,
    touched,
    setFieldValue,
    setFieldTouched,
    validateForm,
    isFormValid
  } = useZodForm(schema, initialValues);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    Object.keys(formData).forEach(field => {
      setFieldTouched(field);
    });

    if (!validateForm()) return;

    await onSave(formData);
  };

  const getFieldStatus = (field: string) => {
    if (!touched[field]) return 'default';
    if (errors[field]) return 'error';
    return 'success';
  };

  const getStatusIcon = (field: string) => {
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

  const getInputClass = (field: string) => {
    const baseClass = "w-full p-3 bg-white border rounded-lg text-gray-900 focus:ring-2 focus:ring-cyan-600 focus:border-transparent transition-colors";
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

  const getTextareaClass = (field: string) => {
    const baseClass = "w-full p-3 bg-white border rounded-lg text-gray-900 focus:ring-2 focus:ring-cyan-600 focus:border-transparent transition-colors resize-none";
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

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={mentor ? "Edit Mentor" : "Add Mentor"}
      isLoading={isLoading}
      isSubmitDisabled={!isFormValid}
      submitText={mentor ? "Update Mentor" : "Add Mentor"}
      size="lg"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Full Name Field */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name {!mentor && "*"}
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.fullName || ""}
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
            {errors.fullName && (
              <p className="text-red-500 text-xs mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.fullName}
              </p>
            )}
          </div>

          {/* Email Field */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email {!mentor && "*"}
            </label>
            <div className="relative">
              <input
                type="email"
                value={formData.email || ""}
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
            {errors.email && (
              <p className="text-red-500 text-xs mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Phone Number Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <div className="relative">
              <input
                type="tel"
                value={formData.phoneNumber || ""}
                onChange={(e) => setFieldValue("phoneNumber", e.target.value)}
                onBlur={() => setFieldTouched("phoneNumber")}
                className={getInputClass("phoneNumber")}
                placeholder="Enter phone number"
                disabled={isLoading}
                maxLength={15}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {getStatusIcon("phoneNumber")}
              </div>
            </div>
            {errors.phoneNumber && (
              <p className="text-red-500 text-xs mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.phoneNumber}
              </p>
            )}
          </div>

          {/* Location Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.location || ""}
                onChange={(e) => setFieldValue("location", e.target.value)}
                onBlur={() => setFieldTouched("location")}
                className={getInputClass("location")}
                placeholder="Enter location"
                disabled={isLoading}
                maxLength={100}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {getStatusIcon("location")}
              </div>
            </div>
            {errors.location && (
              <p className="text-red-500 text-xs mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.location}
              </p>
            )}
          </div>

          {/* Bio Field */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bio
            </label>
            <div className="relative">
              <textarea
                value={formData.bio || ""}
                onChange={(e) => setFieldValue("bio", e.target.value)}
                onBlur={() => setFieldTouched("bio")}
                className={getTextareaClass("bio")}
                placeholder="Enter bio (optional)"
                disabled={isLoading}
                rows={4}
                maxLength={500}
              />
              <div className="absolute right-3 top-3">
                {getStatusIcon("bio")}
              </div>
            </div>
            {errors.bio && (
              <p className="text-red-500 text-xs mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.bio}
              </p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              {formData.bio?.length || 0}/500 characters
            </p>
          </div>
        </div>
      </div>
    </FormModal>
  );
};