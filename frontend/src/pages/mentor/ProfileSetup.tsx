import { useState, useEffect } from "react";
import {
  Camera,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  UserCheck,
  Eye,
} from "lucide-react";
import FormField from "../../components/ui/FormField";
import { Button } from "../../components/ui/Button";
import type { AppDispatch } from "../../app/store";
// ProfileState interface defined below
// Removed duplicate initialState declaration manually 
import {
  updateMentorProfile,
  submitProfileForApproval,
  fetchMentorProfile,
} from "../../features/mentor/mentorThunk";
import { toast } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../app/store";
import Layout from "../../components/layout/Layout";
import { ROUTES } from "../../constants/routes.constants";

interface ProfileState {
  personalDetails: {
    fullName: string;
    email: string;
    phoneNumber: string;
    location: string;
    bio: string;
  };
  academicQualifications: {
    institutionName: string;
    degree: string;
    graduationYear: string;
  };
  experiences: {
    institution?: string;
    jobTitle: string;
    duration: string;
  }[];
  subjectProficiency: {
    subject: string;
    level: "basic" | "intermediate" | "expert" | string;
  }[];
  certification: {
    name: string;
    issuingOrganization: string;
  };
  availability: { day: string; slots: { startTime: string; endTime: string }[] }[];
  profilePicture?: File | null;
}

interface ValidationErrors {
  [key: string]: string;
}

const TIME_SLOTS = [
  "08:00-09:00",
  "09:00-10:00",
  "10:00-11:00",
  "11:00-12:00",
  "12:00-13:00",
  "13:00-14:00",
  "14:00-15:00",
  "15:00-16:00",
  "16:00-17:00",
  "17:00-18:00",
  "18:00-19:00",
  "19:00-20:00",
  "20:00-21:00",
];

const DAYS_OF_WEEK = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
];

const GRADUATION_YEARS = Array.from({ length: 30 }, (_, i) =>
  (new Date().getFullYear() - i).toString()
);
const SUBJECT_OPTIONS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "English",
  "History",
  "Geography",
  "Economics",
  "Business Studies",
  "Psychology",
  "Sociology",
  "Art",
  "Music",
  "Physical Education",
];

const LEVEL_OPTIONS = ["basic", "intermediate", "expert"];

type ApprovalStatus = "pending" | "approved" | "rejected" | "not_submitted";

const initialState: ProfileState = {
  personalDetails: {
    fullName: "",
    email: "",
    phoneNumber: "",
    location: "",
    bio: "",
  },
  academicQualifications: {
    institutionName: "",
    degree: "",
    graduationYear: "",
  },
  experiences: [],
  subjectProficiency: [],
  certification: {
    name: "",
    issuingOrganization: "",
  },
  availability: [],
  profilePicture: null,
};

export default function MentorProfileSetup() {
  const dispatch = useDispatch<AppDispatch>();
  const { profile, loading } = useSelector((state: RootState) => state.mentor);
  const [profileData, setProfileData] = useState<ProfileState>(initialState);
  const [activeTab, setActiveTab] = useState<
    "personal" | "academic" | "experience" | "availability"
  >("personal");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [approvalStatus, setApprovalStatus] =
    useState<ApprovalStatus>("not_submitted");
  const [currentSubject, setCurrentSubject] = useState({
    subject: "",
    level: "",
  });
  const [currentExperience, setCurrentExperience] = useState({
    institution: "",
    jobTitle: "",
    duration: "",
  });
  const [isEditing, setIsEditing] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load mentor profile data on component mount
  useEffect(() => {
    dispatch(fetchMentorProfile());
  }, [dispatch]);

  // Update local state when mentor data is loaded
  useEffect(() => {
    if (profile) {
      setProfileData({
        personalDetails: {
          fullName: profile.fullName || "",
          email: profile.email || "",
          phoneNumber: profile.phoneNumber || "",
          location: profile.location || "",
          bio: profile.bio || "",
        },
        academicQualifications:
          profile.academicQualifications?.[0] ||
          initialState.academicQualifications,
        experiences: profile.experiences || [],
        subjectProficiency: profile.subjectProficiency || [],
        certification: profile.certification?.[0] || initialState.certification,
        availability: profile.availability || [],
        profilePicture: null,
      });
      setApprovalStatus(profile.approvalStatus || "not_submitted");

      // Set editing mode based on approval status
      if (
        profile.approvalStatus === "approved" ||
        profile.approvalStatus === "pending"
      ) {
        setIsEditing(false);
      } else {
        setIsEditing(true);
      }
    }
  }, [profile]);

  const updateField = (
    section: keyof ProfileState,
    field: string,
    value: string
  ) => {
    if (section === "profilePicture") return;

    setProfileData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));

    // Clear validation error when user starts typing
    if (validationErrors[`${section}.${field}`]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`${section}.${field}`];
        return newErrors;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
      const maxSize = 5 * 1024 * 1024;

      if (!validTypes.includes(file.type)) {
        toast.error("Please upload a valid image file (JPEG, PNG, GIF)", {
          position: "bottom-right",
        });
        return;
      }

      if (file.size > maxSize) {
        toast.error("Image size should be less than 5MB", {
          position: "bottom-right",
        });
        return;
      }

      setProfileData((prev) => ({
        ...prev,
        profilePicture: file,
      }));
    }
  };

  const addSubjectProficiency = () => {
    if (currentSubject.subject && currentSubject.level) {
      setProfileData((prev) => ({
        ...prev,
        subjectProficiency: [
          ...prev.subjectProficiency,
          {
            subject: currentSubject.subject,
            level: currentSubject.level as "basic" | "intermediate" | "expert",
          },
        ],
      }));
      setCurrentSubject({ subject: "", level: "" });
    } else {
      toast.error("Please select both subject and level", {
        position: "bottom-right",
      });
    }
  };

  const removeSubjectProficiency = (index: number) => {
    setProfileData((prev) => ({
      ...prev,
      subjectProficiency: prev.subjectProficiency.filter((_, i) => i !== index),
    }));
  };

  const addExperience = () => {
    if (
      currentExperience.institution &&
      currentExperience.jobTitle &&
      currentExperience.duration
    ) {
      setProfileData((prev) => ({
        ...prev,
        experiences: [...prev.experiences, {
          institution: currentExperience.institution,
          jobTitle: currentExperience.jobTitle,
          duration: currentExperience.duration
        }],
      }));
      setCurrentExperience({ institution: "", jobTitle: "", duration: "" });
    } else {
      toast.error("Please fill all experience fields", {
        position: "bottom-right",
      });
    }
  };

  const removeExperience = (index: number) => {
    setProfileData((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((_, i) => i !== index),
    }));
  };

  const toggleAvailability = (day: string, slot: string) => {
    setProfileData((prev) => {
      const existing = prev.availability.find(a => a.day === day);
      let newAvailability = [...prev.availability];
      const [startTime, endTime] = slot.split("-");

      if (existing) {
        // Toggle slot
        const hasSlot = existing.slots.some(s => s.startTime === startTime && s.endTime === endTime);
        
        let newSlots;
        if (hasSlot) {
            newSlots = existing.slots.filter(s => !(s.startTime === startTime && s.endTime === endTime));
        } else {
            newSlots = [...existing.slots, { startTime, endTime }];
        }
        
        if (newSlots.length === 0) {
           newAvailability = newAvailability.filter(a => a.day !== day);
        } else {
           newAvailability = newAvailability.map(a => 
             a.day === day ? { ...a, slots: newSlots } : a
           );
        }
      } else {
        // Add new day with slot
        newAvailability.push({ day: day, slots: [{ startTime, endTime }] });
      }
      return { ...prev, availability: newAvailability };
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getNestedValue = (obj: any, path: string) => {
    return path.split(".").reduce((acc, part) => acc && acc[part], obj);
  };

  const validateForm = () => {
    const errors: ValidationErrors = {};

    if (!profileData.personalDetails.fullName)
      errors["personalDetails.fullName"] = "Full Name is required";
    if (!profileData.personalDetails.email)
      errors["personalDetails.email"] = "Email is required";
    if (!profileData.personalDetails.phoneNumber)
      errors["personalDetails.phoneNumber"] = "Phone Number is required";
    if (!profileData.personalDetails.location)
      errors["personalDetails.location"] = "Location is required";

    if (!profileData.academicQualifications.institutionName)
      errors["academicQualifications.institutionName"] =
        "Institution Name is required";
    if (!profileData.academicQualifications.degree)
      errors["academicQualifications.degree"] = "Degree is required";
    if (!profileData.academicQualifications.graduationYear)
      errors["academicQualifications.graduationYear"] =
        "Graduation Year is required";

    if (profileData.subjectProficiency.length === 0)
      errors["subjectProficiency"] = "At least one subject is required";

    if (!profileData.certification.name)
      errors["certification.name"] = "Certification Name is required";

    if (profileData.availability.length === 0)
      errors["availability"] = "Please select your availability";

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Helper function to create FormData
  const createFormData = (isComplete: boolean = true): FormData => {
    const formData = new FormData();

    // Personal details
    formData.append("fullName", profileData.personalDetails.fullName);
    formData.append("email", profileData.personalDetails.email);
    formData.append("phoneNumber", profileData.personalDetails.phoneNumber);
    formData.append("location", profileData.personalDetails.location);
    formData.append("bio", profileData.personalDetails.bio);

    // Academic qualifications
    const academicQual = {
      institutionName: profileData.academicQualifications.institutionName,
      degree: profileData.academicQualifications.degree,
      graduationYear: profileData.academicQualifications.graduationYear,
    };
    formData.append("academicQualifications", JSON.stringify([academicQual]));

    // Experiences
    formData.append("experiences", JSON.stringify(profileData.experiences));

    // Subject proficiency
    formData.append(
      "subjectProficiency",
      JSON.stringify(profileData.subjectProficiency)
    );

    // Certification
    const certification = {
      name: profileData.certification.name,
      issuingOrganization: profileData.certification.issuingOrganization,
    };
    formData.append("certification", JSON.stringify([certification]));

    // Availability - Clean up specifically for backend
    // Ensure we only send the necessary fields and structure matches correctly
    const requestAvailability = profileData.availability.map(d => ({
        day: d.day,
        slots: d.slots.map(s => ({ startTime: s.startTime, endTime: s.endTime }))
    }));
    formData.append("availability", JSON.stringify(requestAvailability));

    formData.append("isProfileComplete", isComplete.toString());

    if (profileData.profilePicture) {
      formData.append("profilePicture", profileData.profilePicture);
    }

    return formData;
  };

  const handleSaveDraft = async () => {
    if (!validateForm()) {
      toast.error("Please fill all required fields correctly", {
        position: "bottom-right",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = createFormData(false); // Save as draft
      await dispatch(updateMentorProfile(formData)).unwrap();

      toast.success("Profile saved as draft successfully!", {
        position: "bottom-right",
      });
    } catch (error) {
      console.error("Save draft error:", error);
      toast.error("Failed to save profile. Please try again.", {
        position: "bottom-right",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!validateForm()) {
      toast.error("Please fill all required fields correctly", {
        position: "bottom-right",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = createFormData(true); // Submit for approval
      await dispatch(updateMentorProfile(formData)).unwrap();
      await dispatch(submitProfileForApproval()).unwrap();

      setApprovalStatus("pending");
      setIsEditing(false);

      toast.success(
        "Profile submitted for admin approval successfully! You will hear back within 24-48 hours.",
        {
          position: "bottom-right",
          duration: 5000,
        }
      );
    } catch (error: unknown) {
      console.error("Submission error:", error);
      const errorMessage =
        (error as Error)?.message || "Failed to submit profile. Please try again.";
      toast.error(errorMessage, {
        position: "bottom-right",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!validateForm()) {
      toast.error("Please fill all required fields correctly", {
        position: "bottom-right",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = createFormData(true); // Treat update as complete
      await dispatch(updateMentorProfile(formData)).unwrap();
      
      setIsEditing(false); // Return to view mode
      
      toast.success("Profile updated successfully!", {
        position: "bottom-right",
      });
    } catch (error) {
       console.error("Update error:", error);
       toast.error("Failed to update profile. Please try again.", {
         position: "bottom-right",
       });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reload original profile data
    if (profile) {
      setProfileData({
        personalDetails: {
          fullName: profile.fullName || "",
          email: profile.email || "",
          phoneNumber: profile.phoneNumber || "",
          location: profile.location || "",
          bio: profile.bio || "",
        },
        academicQualifications:
          profile.academicQualifications?.[0] ||
          initialState.academicQualifications,
        experiences: profile.experiences || [],
        subjectProficiency: profile.subjectProficiency || [],
        certification: profile.certification?.[0] || initialState.certification,
        availability: profile.availability || [],
        profilePicture: null,
      });
    }
  };

  const getStatusIcon = () => {
    switch (approvalStatus) {
      case "approved":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (approvalStatus) {
      case "approved":
        return "Your profile has been approved! You can now start accepting students.";
      case "rejected":
        return "Your profile submission was rejected. Please update your information and try again.";
      case "pending":
        return "Your profile is under review. You'll hear back within 24-48 hours.";
      default:
        return "Complete your profile and submit for approval to start mentoring.";
    }
  };

  const getStatusColor = () => {
    switch (approvalStatus) {
      case "approved":
        return "bg-green-50 border-green-200 text-green-800";
      case "rejected":
        return "bg-red-50 border-red-200 text-red-800";
      case "pending":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      default:
        return "bg-blue-50 border-blue-200 text-blue-800";
    }
  };

  // Render form fields in view or edit mode
  const renderFormField = (
    section: keyof ProfileState,
    field: string,
    props: React.ComponentProps<typeof FormField> & { label: string; required?: boolean }
  ) => {
    if (
      !isEditing &&
      (approvalStatus === "approved" || approvalStatus === "pending")
    ) {
      return (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {props.label}{" "}
            {props.required && <span className="text-red-500">*</span>}
          </label>
          <div className="px-3 py-2 bg-gray-50 rounded-md border border-gray-200 min-h-[42px]">
            <p className="text-gray-900">
              {getNestedValue(profileData, `${section}.${field}`) ||
                "Not provided"}
            </p>
          </div>
        </div>
      );
    }

    return <FormField {...props} />;
  };

  // Render subject proficiency in view mode
  const renderSubjectProficiencyView = () => {
    if (
      !isEditing &&
      (approvalStatus === "approved" || approvalStatus === "pending")
    ) {
      return (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Subject Proficiency
          </h3>
          {profileData.subjectProficiency.length === 0 ? (
            <p className="text-gray-500">No subjects added</p>
          ) : (
            <div className="space-y-2">
              {profileData.subjectProficiency.map((subject, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded"
                >
                  <span className="font-medium">
                    {subject.subject} -{" "}
                    {subject.level.charAt(0).toUpperCase() +
                      subject.level.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Edit mode
    return (
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Subject Proficiency <span className="text-red-500">*</span>
        </h3>
        {validationErrors["subjectProficiency"] && (
          <p className="text-red-500 text-sm mb-3">
            {validationErrors["subjectProficiency"]}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <select
              value={currentSubject.subject}
              onChange={(e) =>
                setCurrentSubject((prev) => ({
                  ...prev,
                  subject: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[rgb(73,187,189)] focus:border-[rgb(73,187,189)] transition-colors"
              disabled={!isEditing}
            >
              <option value="">Select a subject</option>
              {SUBJECT_OPTIONS.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Level
            </label>
            <select
              value={currentSubject.level}
              onChange={(e) =>
                setCurrentSubject((prev) => ({
                  ...prev,
                  level: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[rgb(73,187,189)] focus:border-[rgb(73,187,189)] transition-colors"
              disabled={!isEditing}
            >
              <option value="">Select level</option>
              {LEVEL_OPTIONS.map((level) => (
                <option key={level} value={level}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isEditing && (
          <Button
            type="button"
            variant="outline"
            onClick={addSubjectProficiency}
            disabled={!currentSubject.subject || !currentSubject.level}
          >
            Add Subject
          </Button>
        )}

        {/* Display added subjects */}
        {profileData.subjectProficiency.length > 0 && (
          <div className="mt-4 space-y-2">
            {profileData.subjectProficiency.map((subject, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded"
              >
                <span className="font-medium">
                  {subject.subject} -{" "}
                  {subject.level.charAt(0).toUpperCase() +
                    subject.level.slice(1)}
                </span>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => removeSubjectProficiency(index)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Action buttons based on approval status
  const renderActionButtons = () => {
    switch (approvalStatus) {
      case "approved":
        return (
          <div className="flex justify-end space-x-4 mt-8">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleUpdateProfile}
                  disabled={isSubmitting}
                  className="px-8"
                >
                  {isSubmitting ? "Updating..." : "Update Profile"}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="lg"
                onClick={handleEditProfile}
                disabled={loading}
                className="px-8"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
            <Button
              variant="primary" 
              size="lg"
              onClick={() => (window.location.href = ROUTES.MENTOR.DASHBOARD)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8" 
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
          </div>
        );

      case "pending":
        return (
          <div className="flex justify-end space-x-4 mt-8">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleUpdateProfile}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Updating..." : "Update Application"}
                </Button>
              </>
            ) : (
                <Button
                variant="outline"
                size="lg"
                onClick={handleEditProfile}
                disabled={loading}
                >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
                </Button>
            )}
          </div>
        );

      case "rejected":
        return (
          <div className="flex justify-end space-x-4 mt-8">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleSubmitForApproval}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Resubmit for Approval"}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="lg"
                onClick={handleEditProfile}
                disabled={loading}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        );

      case "not_submitted":
      default:
        return (
          <div className="flex justify-end space-x-4 mt-8">
            <Button
              variant="outline"
              size="lg"
              onClick={handleSaveDraft}
              disabled={isSubmitting || !isEditing}
            >
              Save Draft
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={handleSubmitForApproval}
              disabled={isSubmitting || !isEditing}
            >
              {isSubmitting ? "Submitting..." : "Submit for Approval"}
            </Button>
          </div>
        );
    }
  };

  const handleLoginClick = () => {
    window.location.href = "/login";
  };

  const handleGetStartedClick = () => {
    window.location.href = "/signup";
  };

  return (
    <Layout
      onLoginClick={handleLoginClick}
      onGetStartedClick={handleGetStartedClick}
    >
      <div className="min-h-screen bg-gray-50">
        {/* Approval Status Banner */}
        {approvalStatus !== "not_submitted" && (
          <div className={`border-l-4 ${getStatusColor()} p-4 mt-4 rounded-r`}>
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <p className="font-medium">{getStatusText()}</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              Tutor Profile{" "}
              {!isEditing &&
                (approvalStatus === "approved" ||
                  approvalStatus === "pending") &&
                "(View Mode)"}
            </h2>
            {!isEditing &&
              (approvalStatus === "approved" ||
                approvalStatus === "pending") && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <Eye className="w-5 h-5" />
                  <span className="text-sm">Viewing Profile</span>
                </div>
              )}
          </div>
        </div>

        {/* Tabs - Always show but conditionally enable */}
        <div className="border-b flex justify-start overflow-x-auto">
          {["personal", "academic", "experience", "availability"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as "personal" | "academic" | "experience" | "availability")}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-[rgb(73,187,189)] text-[rgb(73,187,189)]"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab === "personal"
                ? "Personal Details"
                : tab === "academic"
                ? "Academic Qualifications"
                : tab === "experience"
                ? "Experience"
                : "Availability"}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white rounded-lg shadow-sm mt-4">
          {activeTab === "personal" && (
            <>
              <section className="space-y-4">
                {renderFormField("personalDetails", "fullName", {
                  label: "Full Name",
                  type: "text",
                  value: profileData.personalDetails.fullName,
                  onChange: (v: string) =>
                    updateField("personalDetails", "fullName", v),
                  required: true,
                  error: validationErrors["personalDetails.fullName"],
                  disabled: !isEditing,
                })}
                {renderFormField("personalDetails", "email", {
                  label: "Email",
                  type: "email",
                  value: profileData.personalDetails.email,
                  onChange: (v: string) =>
                    updateField("personalDetails", "email", v),
                  required: true,
                  error: validationErrors["personalDetails.email"],
                  disabled: !isEditing,
                })}
                {renderFormField("personalDetails", "phoneNumber", {
                  label: "Phone Number",
                  type: "tel",
                  value: profileData.personalDetails.phoneNumber,
                  onChange: (v: string) =>
                    updateField("personalDetails", "phoneNumber", v),
                  required: true,
                  error: validationErrors["personalDetails.phoneNumber"],
                  disabled: !isEditing,
                })}
                {renderFormField("personalDetails", "location", {
                  label: "Location",
                  type: "text",
                  value: profileData.personalDetails.location,
                  onChange: (v: string) =>
                    updateField("personalDetails", "location", v),
                  required: true,
                  error: validationErrors["personalDetails.location"],
                  disabled: !isEditing,
                })}
                {renderFormField("personalDetails", "bio", {
                  label: "Bio",
                  type: "textarea",
                  value: profileData.personalDetails.bio,
                  onChange: (v: string) =>
                    updateField("personalDetails", "bio", v),
                  placeholder:
                    "Tell us about yourself, your teaching philosophy, and why you'd make a great mentor...",
                  rows: 4,
                  disabled: !isEditing,
                })}
              </section>

              {/* Profile Picture Upload */}
              <section className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Profile Picture
                </h3>
                {!isEditing &&
                (approvalStatus === "approved" ||
                  approvalStatus === "pending") ? (
                  <div className="px-3 py-2 bg-gray-50 rounded-md border border-gray-200 min-h-[42px]">
                    <p className="text-gray-900">
                      {profileData.profilePicture
                        ? profileData.profilePicture.name
                        : "No file uploaded"}
                    </p>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[rgb(73,187,189)] transition-colors">
                    <Camera className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 mb-2">
                      Upload your profile picture (optional)
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      id="profile-upload"
                      className="hidden"
                      disabled={!isEditing}
                    />
                    <label
                      htmlFor="profile-upload"
                      className="inline-block px-5 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors"
                    >
                      Choose File
                    </label>
                    {profileData.profilePicture && (
                      <p className="text-sm text-green-600 mt-2">
                        {profileData.profilePicture.name}
                      </p>
                    )}
                  </div>
                )}
              </section>
            </>
          )}

          {activeTab === "academic" && (
            <>
              {renderFormField("academicQualifications", "institutionName", {
                label: "Institution Name",
                type: "text",
                value: profileData.academicQualifications.institutionName,
                onChange: (v: string) =>
                  updateField("academicQualifications", "institutionName", v),
                placeholder: "e.g., University of California, Berkeley",
                required: true,
                error:
                  validationErrors["academicQualifications.institutionName"],
                disabled: !isEditing,
              })}
              {renderFormField("academicQualifications", "degree", {
                label: "Degree",
                type: "text",
                value: profileData.academicQualifications.degree,
                onChange: (v: string) =>
                  updateField("academicQualifications", "degree", v),
                placeholder: "e.g., Bachelor of Science in Computer Science",
                required: true,
                error: validationErrors["academicQualifications.degree"],
                disabled: !isEditing,
              })}

              {/* Graduation Year */}
              {!isEditing &&
              (approvalStatus === "approved" ||
                approvalStatus === "pending") ? (
                renderFormField("academicQualifications", "graduationYear", {
                  label: "Graduation Year",
                  type: "text",
                  value: profileData.academicQualifications.graduationYear,
                  onChange: (v: string) =>
                    updateField("academicQualifications", "graduationYear", v),
                  required: true,
                  error:
                    validationErrors["academicQualifications.graduationYear"],
                  disabled: true,
                })
              ) : (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Graduation Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={profileData.academicQualifications.graduationYear}
                    onChange={(e) =>
                      updateField(
                        "academicQualifications",
                        "graduationYear",
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[rgb(73,187,189)] focus:border-[rgb(73,187,189)] transition-colors"
                    disabled={!isEditing}
                  >
                    <option value="">Select Graduation Year</option>
                    {GRADUATION_YEARS.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  {validationErrors[
                    "academicQualifications.graduationYear"
                  ] && (
                    <p className="text-red-500 text-sm mt-1">
                      {
                        validationErrors[
                          "academicQualifications.graduationYear"
                        ]
                      }
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === "experience" && (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Work Experience
              </h3>
              
              <div className="space-y-4 mb-6">
                <FormField
                  label="Institution"
                  type="text"
                  value={currentExperience.institution}
                  onChange={(v: string) => setCurrentExperience(prev => ({ ...prev, institution: v }))}
                  placeholder="e.g., ABC High School or XYZ Tutoring Center"
                  disabled={!isEditing}
                />
                 <FormField
                  label="Job Title"
                  type="text"
                  value={currentExperience.jobTitle}
                  onChange={(v: string) => setCurrentExperience(prev => ({ ...prev, jobTitle: v }))}
                  placeholder="e.g., Math Teacher, Private Tutor"
                  disabled={!isEditing}
                />
                 <FormField
                  label="Duration"
                  type="text"
                  value={currentExperience.duration}
                  onChange={(v: string) => setCurrentExperience(prev => ({ ...prev, duration: v }))}
                  placeholder="e.g., 2 years, 2018-2020"
                  disabled={!isEditing}
                />
                
                {isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addExperience}
                    disabled={!currentExperience.institution || !currentExperience.jobTitle}
                  >
                    Add Experience
                  </Button>
                )}
              </div>

              {/* List of added experiences */}
              {profileData.experiences.length > 0 && (
                <div className="space-y-3 mb-6">
                  {profileData.experiences.map((exp, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg flex justify-between items-start border border-gray-200">
                      <div>
                        <h4 className="font-medium text-gray-900">{exp.jobTitle}</h4>
                        <p className="text-gray-600 text-sm">{exp.institution}</p>
                        <p className="text-gray-500 text-xs mt-1">{exp.duration}</p>
                      </div>
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => removeExperience(index)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Subject Proficiency */}
              {renderSubjectProficiencyView()}

              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">
                Certifications
              </h3>
              {renderFormField("certification", "name", {
                label: "Certification Name",
                type: "text",
                value: profileData.certification.name,
                onChange: (v: string) =>
                  updateField("certification", "name", v),
                placeholder:
                  "e.g., Teaching Certificate, Subject Matter Certification",
                required: true,
                error: validationErrors["certification.name"],
                disabled: !isEditing,
              })}
              {renderFormField("certification", "issuingOrganization", {
                label: "Issuing Organization",
                type: "text",
                value: profileData.certification.issuingOrganization,
                onChange: (v: string) =>
                  updateField("certification", "issuingOrganization", v),
                placeholder:
                  "e.g., State Board of Education, Professional Association",
                disabled: !isEditing,
              })}
            </>
          )}

          {activeTab === "availability" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Weekly Availability <span className="text-red-500">*</span>
              </h3>
              <p className="text-sm text-gray-500">
                Select the time slots you are available to take classes for each day.
              </p>
              
              {validationErrors["availability"] && (
                <p className="text-red-500 text-sm">{validationErrors["availability"]}</p>
              )}

              <div className="space-y-6">
                {DAYS_OF_WEEK.map((day) => {
                   const dayAvailability = profileData.availability?.find(
                     (a) => a.day === day
                   );
                   
                   return (
                    <div key={day} className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">{day}</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {TIME_SLOTS.map((slot) => {
                          const [startTime, endTime] = slot.split('-');
                          const isSelected = dayAvailability?.slots.some(
                              (s) => s.startTime === startTime && s.endTime === endTime
                          );
                          return (
                            <button
                              key={slot}
                              type="button"
                              disabled={!isEditing}
                              onClick={() => toggleAvailability(day, slot)}
                              className={`text-xs p-2 rounded border transition-colors ${
                                isSelected
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "bg-white text-gray-700 border-gray-200 hover:border-blue-400"
                              } ${!isEditing ? "opacity-75 cursor-not-allowed" : ""}`}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                   );
                })}
              </div>
            </div>
          )}

          {renderActionButtons()}
        </div>
      </div>
    </Layout>
  );
}
