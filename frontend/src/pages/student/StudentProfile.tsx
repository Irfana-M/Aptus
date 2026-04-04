import React, { useState, useEffect } from "react";
import StudentLayout from "../../components/students/StudentLayout";
import { Upload, User, Edit2, X, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../app/store";
import {
  fetchStudentProfile,
  updateStudentProfile,
} from "../../features/student/studentThunk";
import toast from "react-hot-toast";
import { fetchGrades } from "../../features/trial/student/studentTrialThunk";
import {
  selectGrades,
  selectGradesLoading,
} from "../../features/trial/student/studentTrialSelectors";
import { updateProfileStatus } from "../../features/auth/authSlice";
import { ROUTES } from "../../constants/routes.constants";
import { Loader } from "../../components/ui/Loader";

interface FormFieldProps {
  label: string;
  type: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  rows?: number;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  type,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  disabled = false,
  rows = 3,
}) => {
  const inputClasses = `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
    error ? "border-red-500" : "border-gray-300"
  } ${disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""}`;

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {type === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          className={inputClasses}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClasses}
        />
      )}

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

// Info Row Component for View Mode
const InfoRow: React.FC<{ label: string; value: string | undefined }> = ({
  label,
  value,
}) => (
  <div className="py-3 border-b border-gray-100 last:border-0 flex flex-col sm:flex-row sm:items-center">
    <span className="text-sm font-medium text-gray-500 w-1/3">{label}</span>
    <span className="text-sm text-gray-900 font-medium flex-1">
      {value || "-"}
    </span>
  </div>
);

// Main Profile Setup Component
const StudentProfile: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { profile, loading } = useSelector((state: RootState) => state.student);
  const { user } = useSelector((state: RootState) => state.auth);

  const grades = useSelector(selectGrades);
  const gradesLoading = useSelector(selectGradesLoading);

  const [availableSyllabi, setAvailableSyllabi] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(true); // Default to editing first, check persistence later

  const [profileData, setProfileData] = useState({
    fullName: "",
    emailId: "",
    phoneNumber: "",
    dateOfBirth: "",
    gender: "",
    age: "",
    address: "",
    country: "",
    postalCode: "",
    parentName: "",
    parentEmail: "",
    parentPhone: "",
    relationship: "",
    institution: "",
    grade: "",
    syllabus: "",
    learningGoal: "",
    profileImageUrl: "",
  });

  const [profilePicture, setProfilePicture] = useState<File | null>(null);

  useEffect(() => {
    dispatch(fetchStudentProfile());
    dispatch(fetchGrades());
  }, [dispatch]);

  // Determine initial edit mode based on profile existence
  useEffect(() => {
    if (profile && profile.isProfileCompleted) {
      setIsEditing(false);
    } else if (user && user.isProfileComplete) {
      setIsEditing(false);
    }
  }, [profile, user]);

  useEffect(() => {
    if (profileData.grade) {
      const selectedGrade = grades.find(
        (g) => g.name === profileData.grade || g.id === profileData.grade,
      );

      if (selectedGrade) {
        const gradeName = selectedGrade.name;
        const syllabiForThisGrade = grades
          .filter((g) => g.name === gradeName)
          .map((g) => g.syllabus);

        setAvailableSyllabi([...new Set(syllabiForThisGrade)]);
      }
    } else {
      setAvailableSyllabi([]);
    }
  }, [profileData.grade, grades]);

  useEffect(() => {
    if (profile) {
      const contactInfo = profile.contactInfo || {};
      const parentInfo = contactInfo.parentInfo || {};
      const academicDetails = profile.academicDetails || {};

      setProfileData((prev) => ({
        ...prev,
        fullName: profile.fullName || prev.fullName,
        emailId: profile.email || prev.emailId,
        phoneNumber: profile.phoneNumber || prev.phoneNumber,
        dateOfBirth: profile.dateOfBirth
          ? new Date(profile.dateOfBirth).toISOString().split("T")[0]
          : prev.dateOfBirth,
        gender: profile.gender || prev.gender,
        age: profile.age !== undefined ? profile.age.toString() : prev.age,
        profileImageUrl: profile.profileImageUrl || prev.profileImageUrl,
        address: contactInfo.address || prev.address,
        country: contactInfo.country || prev.country,
        postalCode: contactInfo.postalCode || prev.postalCode,
        parentName: parentInfo.name || prev.parentName,
        parentEmail: parentInfo.email || prev.parentEmail,
        parentPhone: parentInfo.phoneNumber || prev.parentPhone,
        relationship: parentInfo.relationship || prev.relationship,
        institution: academicDetails.institutionName || prev.institution,
        grade: academicDetails.grade || prev.grade,
        syllabus: academicDetails.syllabus || prev.syllabus,
        learningGoal: profile.goal || prev.learningGoal,
      }));
    } else if (user) {
      // Fallback to basic user info if profile not fetched or incomplete
      setProfileData((prev) => ({
        ...prev,
        fullName: user.fullName || prev.fullName,
        emailId: user.email || prev.emailId,
        profileImageUrl:
          user.profileImageUrl ||
          (user as unknown as { profilePicture?: string }).profilePicture ||
          prev.profileImageUrl,
      }));
    }
  }, [profile, user]);

  // Improved handleDOBChange
  const handleDOBChange = (value: string) => {
    setProfileData((prev) => {
      const newData = { ...prev, dateOfBirth: value };
      if (value) {
        const birthDate = new Date(value);
        const today = new Date();
        let calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          calculatedAge--;
        }
        newData.age = calculatedAge.toString();
      }
      return newData;
    });
  };

  const handleChange = (field: string) => (value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload =
    (type: "profile") => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const validTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/webp",
        ];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (!validTypes.includes(file.type)) {
          toast.error("Please upload a valid image file (JPEG, PNG, WEBP)");
          return;
        }

        if (file.size > maxSize) {
          toast.error("Image size should be less than 5MB");
          return;
        }

        if (type === "profile") {
          setProfilePicture(file);
        }
      }
    };

  const validateForm = () => {
    const errors: string[] = [];

    if (!profileData.fullName?.trim()) errors.push("Full Name is required");
    if (!profileData.emailId?.trim()) errors.push("Email ID is required");
    if (!profileData.phoneNumber?.trim())
      errors.push("Phone Number is required");
    if (!profileData.dateOfBirth) errors.push("Date of Birth is required");
    if (!profileData.gender) errors.push("Gender is required");
    if (!profileData.age) errors.push("Age is required");
    if (!profileData.address?.trim()) errors.push("Address is required");
    if (!profileData.country?.trim()) errors.push("Country is required");
    
    if (!profileData.postalCode?.trim()) {
      errors.push("Postal Code is required");
    } else {
      const postal = profileData.postalCode.trim();
      const country = profileData.country;
      if (country === "India" && !/^[1-9][0-9]{5}$/.test(postal)) {
        errors.push("Invalid Indian Postal Code (must be 6 digits)");
      } else if (country === "USA" && !/^\d{5}(-\d{4})?$/.test(postal)) {
        errors.push("Invalid US ZIP Code");
      } else if (country === "UK" && !/^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i.test(postal)) {
        errors.push("Invalid UK Postcode");
      } else if (country === "Canada" && !/^[A-Za-z]\d[A-Za-z] ?\d[A-Za-z]\d$/.test(postal)) {
        errors.push("Invalid Canadian Postal Code");
      } else if (!/^[A-Za-z0-9\s-]{3,10}$/.test(postal)) {
        errors.push("Invalid Postal Code format");
      }
    }

    if (!profileData.parentName?.trim()) errors.push("Parent Name is required");
    if (!profileData.parentPhone?.trim())
      errors.push("Parent Phone is required");
    if (!profileData.relationship?.trim())
      errors.push("Relationship is required");
    if (!profileData.institution?.trim())
      errors.push("Institution is required");
    if (!profileData.grade) errors.push("Grade is required");
    if (!profileData.syllabus) errors.push("Syllabus is required");
    if (!profileData.learningGoal?.trim())
      errors.push("Learning Goal is required");

    const ageNum = parseInt(profileData.age);
    if (isNaN(ageNum) || ageNum < 10 || ageNum > 20) {
      errors.push("Age must be between 10 and 20 years");
    }

    if (errors.length > 0) {
      toast.error(errors.join(" • "));
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const formData = new FormData();
      Object.entries(profileData).forEach(([key, value]) => {
        if (value && typeof value === "string") {
          formData.append(key, value);
        }
      });

      if (profilePicture && profilePicture instanceof File) {
        formData.append("profilePicture", profilePicture);
      }

      const resultAction = await dispatch(updateStudentProfile(formData));
      if (updateStudentProfile.fulfilled.match(resultAction)) {
        console.log(
          "✅ Profile updated successfully, total profile in state:",
          resultAction.payload,
        );

        dispatch(updateProfileStatus(resultAction.payload));

        toast.success("Profile updated successfully!");
        setIsEditing(false);
        navigate(ROUTES.STUDENT.BOOK_FREE_TRIAL);
      } else {
        toast.error(
          "Failed to update profile: " + (resultAction.payload as string),
        );
      }
    } catch (err) {
      console.error("Failed to update profile", err);
      toast.error("An unexpected error occurred.");
    }
  };

  return (
    <StudentLayout title="My Profile">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Form/View */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {isEditing ? "Edit Profile" : "Profile Details"}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {isEditing
                    ? "Update your personal information"
                    : "View and manage your profile"}
                </p>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors font-medium border border-indigo-200"
                >
                  <Edit2 size={16} />
                  Edit Profile
                </button>
              )}
              {isEditing &&
                (profile?.isProfileCompleted || user?.isProfileComplete) && (
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors font-medium border border-gray-200"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                )}
              {!isEditing && (
                <button
                  onClick={() => {
                    const hasLockedPreferences =
                      profile?.preferredTimeSlots?.some((p: unknown) => {
                        const group = p as { status?: string };
                        return (
                          group.status &&
                          group.status !== "preferences_submitted"
                        );
                      });
                    if (hasLockedPreferences) {
                      toast.error(
                        "Preferences are locked because a mentor request is pending or active.",
                      );
                      return;
                    }
                    navigate(ROUTES.STUDENT.PREFERENCES.SUBJECTS);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors font-medium ml-2 ${
                    profile?.preferredTimeSlots?.some(
                      (p: unknown) =>
                        (p as { status?: string }).status &&
                        (p as { status?: string }).status !==
                          "preferences_submitted",
                    )
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-teal-600 hover:bg-teal-700"
                  }`}
                  title={
                    profile?.preferredTimeSlots?.some(
                      (p: unknown) =>
                        (p as { status?: string }).status &&
                        (p as { status?: string }).status !==
                          "preferences_submitted",
                    )
                      ? "Preferences are locked"
                      : "Update Preferences"
                  }
                >
                  Update Preferences <ArrowRight size={16} />
                </button>
              )}
            </div>

            {isEditing ? (
              // EDIT MODE FORM
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Basic Information */}
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">
                    Basic Information
                  </h2>
                  <FormField
                    label="Full Name"
                    type="text"
                    value={profileData.fullName}
                    onChange={handleChange("fullName")}
                    required
                  />
                  <FormField
                    label="Email ID"
                    type="email"
                    value={profileData.emailId}
                    onChange={handleChange("emailId")}
                    required
                  />
                  <FormField
                    label="Phone Number"
                    type="tel"
                    value={profileData.phoneNumber}
                    onChange={handleChange("phoneNumber")}
                    required
                  />
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      label="Date of Birth"
                      type="date"
                      value={profileData.dateOfBirth}
                      onChange={handleDOBChange}
                      required
                    />
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gender <span className="text-red-500 ml-1">*</span>
                      </label>
                      <select
                        value={profileData.gender}
                        onChange={(e) => handleChange("gender")(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <FormField
                    label="Age"
                    type="number"
                    value={profileData.age}
                    onChange={handleChange("age")}
                    required
                  />
                </div>

                {/* Address */}
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">
                    Address
                  </h2>
                  <FormField
                    label="Address"
                    type="textarea"
                    value={profileData.address}
                    onChange={handleChange("address")}
                    rows={3}
                    required
                  />
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country <span className="text-red-500 ml-1">*</span>
                      </label>
                      <select
                        value={profileData.country}
                        onChange={(e) => {
                          handleChange("country")(e.target.value);
                          handleChange("postalCode")("");
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                      >
                        <option value="">Select Country</option>
                        <option value="India">India</option>
                        <option value="USA">USA</option>
                        <option value="UK">UK</option>
                        <option value="Canada">Canada</option>
                      </select>
                    </div>
                    <FormField
                      label="Postal Code"
                      type="text"
                      value={profileData.postalCode}
                      onChange={handleChange("postalCode")}
                      required
                      disabled={!profileData.country}
                    />
                  </div>
                </div>

                {/* Parent/Guardian Details */}
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">
                    Parent/Guardian Details
                  </h2>
                  <FormField
                    label="Name"
                    type="text"
                    value={profileData.parentName}
                    onChange={handleChange("parentName")}
                    required
                  />
                  <FormField
                    label="Email"
                    type="email"
                    value={profileData.parentEmail}
                    onChange={handleChange("parentEmail")}
                  />
                  <FormField
                    label="Phone"
                    type="tel"
                    value={profileData.parentPhone}
                    onChange={handleChange("parentPhone")}
                    required
                  />
                  <FormField
                    label="Relationship"
                    type="text"
                    value={profileData.relationship}
                    onChange={handleChange("relationship")}
                    required
                  />
                </div>

                {/* Academic Preferences */}
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">
                    Academic Preferences
                  </h2>
                  <FormField
                    label="Institution"
                    type="text"
                    value={profileData.institution}
                    onChange={handleChange("institution")}
                    required
                  />

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Grade <span className="text-red-500 ml-1">*</span>
                      </label>
                      <select
                        value={profileData.grade}
                        onChange={(e) => handleChange("grade")(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                        disabled={gradesLoading}
                      >
                        <option value="">Select Grade</option>
                        {[...new Set(grades.map((g) => g.name))].map(
                          (gradeName) => (
                            <option key={gradeName} value={gradeName}>
                              {gradeName}
                            </option>
                          ),
                        )}
                      </select>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Syllabus <span className="text-red-500 ml-1">*</span>
                      </label>
                      <select
                        value={profileData.syllabus}
                        onChange={(e) =>
                          handleChange("syllabus")(e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                        disabled={!profileData.grade}
                      >
                        <option value="">Select Syllabus</option>
                        {availableSyllabi.map((syllabus) => (
                          <option key={syllabus} value={syllabus}>
                            {syllabus}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <FormField
                    label="Short Bio / Learning Goal"
                    type="textarea"
                    value={profileData.learningGoal}
                    onChange={handleChange("learningGoal")}
                    rows={3}
                    required
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className={`w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {loading ? (
                    <Loader size="sm" color="white" text="Saving..." />
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            ) : (
              // VIEW MODE
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <h3 className="text-sm uppercase tracking-wider text-gray-500 font-bold mb-4">
                    Personal Info
                  </h3>
                  <InfoRow label="Full Name" value={profileData.fullName} />
                  <InfoRow label="Email" value={profileData.emailId} />
                  <InfoRow label="Phone" value={profileData.phoneNumber} />
                  <InfoRow label="DOB" value={profileData.dateOfBirth} />
                  <InfoRow label="Gender" value={profileData.gender} />
                  <InfoRow label="Age" value={profileData.age} />
                </div>

                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <h3 className="text-sm uppercase tracking-wider text-gray-500 font-bold mb-4">
                    Address
                  </h3>
                  <InfoRow label="Address" value={profileData.address} />
                  <InfoRow label="Country" value={profileData.country} />
                  <InfoRow label="Postal Code" value={profileData.postalCode} />
                </div>

                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <h3 className="text-sm uppercase tracking-wider text-gray-500 font-bold mb-4">
                    Guardian Info
                  </h3>
                  <InfoRow label="Name" value={profileData.parentName} />
                  <InfoRow label="Email" value={profileData.parentEmail} />
                  <InfoRow label="Phone" value={profileData.parentPhone} />
                  <InfoRow
                    label="Relationship"
                    value={profileData.relationship}
                  />
                </div>

                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <h3 className="text-sm uppercase tracking-wider text-gray-500 font-bold mb-4">
                    Academic Info
                  </h3>
                  <InfoRow
                    label="Institution"
                    value={profileData.institution}
                  />
                  <InfoRow label="Grade" value={profileData.grade} />
                  <InfoRow label="Syllabus" value={profileData.syllabus} />
                  <InfoRow label="Goal" value={profileData.learningGoal} />
                </div>

                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm uppercase tracking-wider text-gray-500 font-bold">
                      Preferences
                    </h3>
                    <button
                      onClick={() =>
                        navigate(ROUTES.STUDENT.PREFERENCES.SUBJECTS)
                      }
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                    >
                      Edit Preferences
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-gray-500 font-medium">
                        Selected Subjects
                      </label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profile?.preferredSubjects &&
                        profile.preferredSubjects.length > 0 ? (
                          profile.preferredSubjects.map(
                            (subject: unknown, idx: number) => {
                              const subj = subject as
                                | { subjectName?: string }
                                | string;
                              return (
                                <span
                                  key={idx}
                                  className="px-3 py-1 bg-white border border-gray-100 rounded-lg text-sm text-gray-700 shadow-sm"
                                >
                                  {typeof subj === "string"
                                    ? subj
                                    : subj.subjectName || "Subject"}
                                </span>
                              );
                            },
                          )
                        ) : (
                          <span className="text-sm text-gray-400 italic font-medium">
                            No subjects selected
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-medium">
                        Preferred Time Slots
                      </label>
                      <div className="space-y-2 mt-2 font-medium">
                        {profile?.preferredTimeSlots &&
                        profile.preferredTimeSlots.length > 0 ? (
                          profile.preferredTimeSlots.map(
                            (groupVal: unknown, gIdx: number) => {
                              const group = groupVal as {
                                subjectId?: { subjectName?: string } | string;
                                status?: string;
                                slots?: {
                                  day: string;
                                  startTime: string;
                                  endTime: string;
                                }[];
                              };
                              // Handle both populated object and flat ID cases for subject
                              const subjectName =
                                typeof group.subjectId === "object"
                                  ? group.subjectId?.subjectName
                                  : "Subject";

                              // Iterate over slots array within the group
                              // Iterate over slots array within the group
                              const status =
                                group.status || "preferences_submitted";
                              const isLocked =
                                status !== "preferences_submitted";

                              const getStatusBadge = (s: string) => {
                                switch (s) {
                                  case "mentor_requested":
                                    return (
                                      <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold uppercase rounded-full">
                                        Pending Match
                                      </span>
                                    );
                                  case "mentor_assigned":
                                    return (
                                      <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded-full">
                                        Assigned
                                      </span>
                                    );
                                  case "active":
                                    return (
                                      <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase rounded-full">
                                        Active
                                      </span>
                                    );
                                  default:
                                    return null;
                                }
                              };

                              return Array.isArray(group.slots)
                                ? group.slots.map((slot, sIdx: number) => (
                                    <div
                                      key={`${gIdx}-${sIdx}`}
                                      className="flex items-center gap-2 text-sm text-gray-700 bg-white p-2 rounded-lg border border-gray-100 shadow-sm relative overflow-hidden"
                                    >
                                      {isLocked && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-300"></div>
                                      )}
                                      <span
                                        className="text-teal-600 font-bold text-xs uppercase w-24 truncate"
                                        title={subjectName}
                                      >
                                        {subjectName}
                                      </span>
                                      <span className="text-indigo-600 font-bold w-20">
                                        {slot.day}
                                      </span>
                                      <span className="truncate flex-1">
                                        {slot.startTime} - {slot.endTime}
                                      </span>
                                      {getStatusBadge(status)}
                                    </div>
                                  ))
                                : null;
                            },
                          )
                        ) : (
                          <span className="text-sm text-gray-400 italic">
                            No time slots selected
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
            <div className="text-center mb-6">
              <div className="relative inline-block group">
                {profilePicture ? (
                  <img
                    src={URL.createObjectURL(profilePicture)}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover mx-auto ring-4 ring-offset-2 ring-indigo-50"
                  />
                ) : profileData.profileImageUrl ? (
                  <img
                    src={profileData.profileImageUrl}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover mx-auto ring-4 ring-offset-2 ring-indigo-50"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-indigo-50 flex items-center justify-center mx-auto ring-4 ring-offset-2 ring-gray-50">
                    <User className="w-16 h-16 text-indigo-300" />
                  </div>
                )}

                {isEditing && (
                  <label className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-lg border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors">
                    <Upload size={16} className="text-indigo-600" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload("profile")}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <h3 className="text-lg font-bold text-gray-800 mt-4">
                {profileData.fullName || "Student Name"}
              </h3>
              <p className="text-sm text-gray-500">
                {profileData.emailId || "student@example.com"}
              </p>
              {profileData.grade && (
                <span className="inline-block mt-2 px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-full">
                  {profileData.grade}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};
export default StudentProfile;
