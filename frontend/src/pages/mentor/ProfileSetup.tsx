import { useState } from "react";
import { GraduationCap, Bell, User, Camera } from "lucide-react";
import FormField from "../../components/ui/FormField";
import { Button } from "../../components/ui/Button";
import type { AppDispatch } from "../../app/store";
import {
  updateMentorProfile,
  submitProfileForApproval,
} from "../../features/mentor/mentorThunk";
import { toast } from "react-hot-toast";
import { useDispatch } from "react-redux";

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
    institution: string;
    jobTitle: string;
    duration: string;
  };
  subjectProficiency: {
    subject: string;
    level: string;
  };
  certification: {
    name: string;
    issuingOrganization: string;
  };
  profilePicture?: File | null;
}

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
  experiences: {
    institution: "",
    jobTitle: "", 
    duration: "",
  },
  subjectProficiency: {
    subject: "",
    level: "",
  },
  certification: {
    name: "",
    issuingOrganization: "",
  },
  profilePicture: null,
};

export default function MentorProfileSetup() {
  const dispatch = useDispatch<AppDispatch>();
  const [profileData, setProfileData] = useState<ProfileState>(initialState);
  const [activeTab, setActiveTab] = useState<
    "personal" | "academic" | "experience"
  >("personal");

  const updateField = (
    section: keyof ProfileState,
    field: string,
    value: string
  ) => {
    if (section === "profilePicture") return; // avoid updating directly
    setProfileData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileData((prev) => ({
        ...prev,
        profilePicture: file,
      }));
    }
  };

  const handleSubmit = async () => {
  try {
    const formData = new FormData();

    // ✅ Personal Details (direct fields in schema)
    formData.append("fullName", profileData.personalDetails.fullName);
    formData.append("email", profileData.personalDetails.email);
    formData.append("phoneNumber", profileData.personalDetails.phoneNumber);
    formData.append("location", profileData.personalDetails.location);
    formData.append("bio", profileData.personalDetails.bio);

    // ✅ Academic Qualifications (as array)
    const academicQual = {
      institutionName: profileData.academicQualifications.institutionName,
      degree: profileData.academicQualifications.degree,
      graduationYear: profileData.academicQualifications.graduationYear,
    };
    formData.append("academicQualifications", JSON.stringify([academicQual]));

    // ✅ Experiences (as array)
    const experience = {
      institution: profileData.experiences.institution,
      jobTitle: profileData.experiences.jobTitle,
      duration: profileData.experiences.duration,
    };
    formData.append("experiences", JSON.stringify([experience]));

    // ✅ Subject Proficiency (as array)
    const subjectProf = {
      subject: profileData.subjectProficiency.subject,
      level: profileData.subjectProficiency.level,
    };
    formData.append("subjectProficiency", JSON.stringify([subjectProf]));

    // ✅ Certification (as array)
    const certification = {
      name: profileData.certification.name,
      issuingOrganization: profileData.certification.issuingOrganization,
    };
    formData.append("certification", JSON.stringify([certification]));

    // ✅ Profile completion
    formData.append("isProfileComplete", "true");

    if (profileData.profilePicture) {
      formData.append("profilePicture", profileData.profilePicture);
    }

    await dispatch(updateMentorProfile(formData)).unwrap();
    await dispatch(submitProfileForApproval()).unwrap();

    toast.success("Profile submitted for admin approval successfully!", {
      position: "bottom-right",
    });
  } catch (error) {
    console.error("Submission error:", error);
    toast.error("Failed to submit profile. Please try again.", {
      position: "bottom-right",
    });
  }
};
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Mentora</span>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <Bell className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <User className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b flex">
        {["personal", "academic", "experience"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-3 font-medium ${
              activeTab === tab
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab === "personal"
              ? "Personal Details"
              : tab === "academic"
              ? "Academic Qualifications"
              : "Experience"}
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white rounded-lg shadow-sm mt-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Tutor Profile Setup
        </h2>

        {activeTab === "personal" && (
          <>
            <section className="space-y-4">
              <FormField
                label="Full Name"
                type="text"
                value={profileData.personalDetails.fullName}
                onChange={(v) => updateField("personalDetails", "fullName", v)}
              />
              <FormField
                label="Email"
                type="email"
                value={profileData.personalDetails.email}
                onChange={(v) => updateField("personalDetails", "email", v)}
              />
              <FormField
                label="Phone Number"
                type="tel"
                value={profileData.personalDetails.phoneNumber}
                onChange={(v) =>
                  updateField("personalDetails", "phoneNumber", v)
                }
              />
              <FormField
                label="Location"
                type="text"
                value={profileData.personalDetails.location}
                onChange={(v) => updateField("personalDetails", "location", v)}
              />
              <FormField
                label="Bio"
                type="text"
                value={profileData.personalDetails.bio}
                onChange={(v) => updateField("personalDetails", "bio", v)}
                placeholder="Tell us about yourself"
              />
            </section>

            {/* Profile Picture Upload */}
            <section className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Profile Picture
              </h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
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
                />
                <label
                  htmlFor="profile-upload"
                  className="inline-block px-5 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200"
                >
                  Choose File
                </label>
                {profileData.profilePicture && (
                  <p className="text-sm text-green-600 mt-2">
                    {profileData.profilePicture.name}
                  </p>
                )}
              </div>
            </section>
          </>
        )}

        {activeTab === "academic" && (
          <>
            <FormField
              label="Institution Name"
              type="text"
              value={profileData.academicQualifications.institutionName}
              onChange={(v) =>
                updateField("academicQualifications", "institutionName", v)
              }
              placeholder="e.g., Bachelor of Science"
            />
            <FormField
              label="Degree"
              type="text"
              value={profileData.academicQualifications.degree}
              onChange={(v) =>
                updateField("academicQualifications", "degree", v)
              }
            />
            <FormField
              label="Graduation Year"
              type="text"
              value={profileData.academicQualifications.graduationYear}
              onChange={(v) =>
                updateField("academicQualifications", "graduationYear", v)
              }
              placeholder="e.g., 2020"
            />
          </>
        )}

        {activeTab === "experience" && (
          <>
            <FormField
              label="Institution"
              type="text"
              value={profileData.experiences.institution}
              onChange={(v) => updateField("experiences", "institution", v)}
            />
            <FormField
              label="Job Title"
              type="text"
              value={profileData.experiences.jobTitle}
              onChange={(v) => updateField("experiences", "jobTitle", v)}
            />
            <FormField
              label="Duration"
              type="text"
              value={profileData.experiences.duration}
              onChange={(v) => updateField("experiences", "duration", v)}
              placeholder="e.g., 2 years"
            />

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">
              Subject Proficiency
            </h3>
            <FormField
              label="Subjects"
              type="text"
              value={profileData.subjectProficiency.subject}
              onChange={(v) => updateField("subjectProficiency", "subject", v)}
              placeholder="e.g., Math, Physics"
            />
            <FormField
              label="Level"
              type="text"
              value={profileData.subjectProficiency.level}
              onChange={(v) => updateField("subjectProficiency", "level", v)}
              placeholder="e.g., High School, College"
            />

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">
              Certifications
            </h3>
            <FormField
              label="Certification Name"
              type="text"
              value={profileData.certification.name}
              onChange={(v) =>
                updateField("certification", "name", v)
              }
            />
            <FormField
              label="Issuing Organization"
              type="text"
              value={profileData.certification.issuingOrganization}
              onChange={(v) =>
                updateField("certification", "issuingOrganization", v)
              }
            />
          </>
        )}

        <div className="flex justify-end mt-8">
          <Button variant="primary" size="lg" onClick={handleSubmit}>
            Request Admin Approval
          </Button>
        </div>
      </div>
    </div>
  );
}
