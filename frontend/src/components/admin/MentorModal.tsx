import React from "react";
import { AlertCircle, CheckCircle } from "lucide-react";
import { useZodForm } from "../../hooks/useZodForm";
import { adminCreateMentorSchema, adminUpdateMentorSchema } from "../../lib/schemas/mentor.schemas";
import type { MentorProfile } from "../../features/mentor/mentorSlice";
import { selectAdminLoading } from "../../features/admin/adminSelectors";
import { FormModal } from "../../components/ui/FormModal";
import { useSelector } from "react-redux";

type FormField = "fullName" | "email" | "phoneNumber" | "location" | "bio";

interface MentorModalProps {
  mentor?: MentorProfile | null;
  onClose: () => void;
  onSave: (data: Partial<MentorProfile>) => void;
  isOpen: boolean;
  loading?: boolean;
}

export const MentorModal: React.FC<MentorModalProps> = ({
  mentor,
  onClose,
  onSave,
  isOpen,
  loading = false,
}) => {
  const globalLoading = useSelector(selectAdminLoading);
  const isLoading = loading || globalLoading;

  const schema = mentor ? adminUpdateMentorSchema : adminCreateMentorSchema;

  const initialValues = mentor
    ? {
        fullName: mentor.fullName || "",
        email: mentor.email || "",
        phoneNumber: mentor.phoneNumber || "",
        location: mentor.location || "",
        bio: mentor.bio || "",
      }
    : {
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
    isFormValid,
  } = useZodForm<Partial<MentorProfile>>(schema, initialValues);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Touch all fields
    (["fullName", "email", "phoneNumber", "location", "bio"] as const).forEach((field) => {
      setFieldTouched(field);
    });

    if (!validateForm()) return;

    await onSave(formData);
  };

  const getFieldStatus = (field: FormField): "default" | "error" | "success" => {
    if (!touched[field]) return "default";
    if (errors[field]) return "error";
    return "success";
  };

  const getStatusIcon = (field: FormField) => {
    const status = getFieldStatus(field);
    switch (status) {
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getInputClass = (field: FormField) => {
    const baseClass =
      "w-full p-3 bg-white border rounded-lg text-gray-900 focus:ring-2 focus:ring-cyan-600 focus:border-transparent transition-colors";
    const status = getFieldStatus(field);

    switch (status) {
      case "error":
        return `${baseClass} border-red-500 pr-10`;
      case "success":
        return `${baseClass} border-green-500 pr-10`;
      default:
        return `${baseClass} border-gray-300`;
    }
  };

  const getTextareaClass = (field: FormField) => {
    const baseClass =
      "w-full p-3 bg-white border rounded-lg text-gray-900 focus:ring-2 focus:ring-cyan-600 focus:border-transparent transition-colors resize-none";
    const status = getFieldStatus(field);

    switch (status) {
      case "error":
        return `${baseClass} border-red-500 pr-10`;
      case "success":
        return `${baseClass} border-green-500 pr-10`;
      default:
        return `${baseClass} border-gray-300`;
    }
  };

  const fields: { name: FormField; label: string; type?: string }[] = [
    { name: "fullName", label: "Full Name", type: "text" },
    { name: "email", label: "Email", type: "email" },
    { name: "phoneNumber", label: "Phone Number", type: "tel" },
    { name: "location", label: "Location", type: "text" },
    { name: "bio", label: "Bio" },
  ];

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
          {fields.map((field) => (
            <div
              key={field.name}
              className={field.name === "fullName" || field.name === "email" || field.name === "bio" ? "md:col-span-2" : ""}
            >
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label} {!mentor && (field.name === "fullName" || field.name === "email") && "*"}
              </label>
              <div className="relative">
                {field.name === "bio" ? (
                  <textarea
                    value={formData[field.name] || ""}
                    onChange={(e) => setFieldValue(field.name, e.target.value)}
                    onBlur={() => setFieldTouched(field.name)}
                    className={getTextareaClass(field.name)}
                    placeholder="Enter bio (optional)"
                    disabled={isLoading}
                    rows={4}
                    maxLength={500}
                  />
                ) : (
                  <input
                    type={field.type || "text"}
                    value={formData[field.name] || ""}
                    onChange={(e) => setFieldValue(field.name, e.target.value)}
                    onBlur={() => setFieldTouched(field.name)}
                    className={getInputClass(field.name)}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    disabled={isLoading}
                    maxLength={field.name === "phoneNumber" ? 15 : 100}
                  />
                )}
                <div className="absolute right-3 top-3">
                  {getStatusIcon(field.name)}
                </div>
              </div>

              {errors[field.name] && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors[field.name]}
                </p>
              )}

              {field.name === "bio" && (
                <p className="text-gray-500 text-xs mt-1">
                  {(formData.bio?.length || 0)}/500 characters
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </FormModal>
  );
};
