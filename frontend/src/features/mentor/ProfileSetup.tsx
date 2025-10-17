import { useState } from "react";
import { GraduationCap, Bell, User } from "lucide-react";
import FormField from "../../components/ui/FormField";
import { Button } from "../../components/ui/Button";

interface ProfileState {
  personalDetails: {
    fullName: string;
    email: string;
    phoneNumber: string;
    location: string;
    briefBio: string;
  };
  academicQualifications: {
    degree: string;
    university: string;
    graduationYear: string;
  };
  experience: {
    institution: string;
    role: string;
    duration: string;
  };
  subjectPreferences: {
    subjects: string;
    levels: string;
  };
  certifications: {
    certificationName: string;
    issuingOrganization: string;
  };
  profileMedia: {
    videoUrl: string;
  };
}

const initialState: ProfileState = {
  personalDetails: {
    fullName: "",
    email: "",
    phoneNumber: "",
    location: "",
    briefBio: "",
  },
  academicQualifications: {
    degree: "",
    university: "",
    graduationYear: "",
  },
  experience: {
    institution: "",
    role: "",
    duration: "",
  },
  subjectPreferences: {
    subjects: "",
    levels: "",
  },
  certifications: {
    certificationName: "",
    issuingOrganization: "",
  },
  profileMedia: {
    videoUrl: "",
  },
};

export default function TutorProfileSetup() {
  const [profileData, setProfileData] = useState<ProfileState>(initialState);
  const [activeTab, setActiveTab] = useState<"personal" | "academic">("personal");

  const updateField = (section: keyof ProfileState, field: string, value: string) => {
    setProfileData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleSubmit = () => {
    console.log("Profile Data:", profileData);
    alert("Profile setup completed!");
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

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Tabs */}
          <div className="border-b flex">
            <button
              onClick={() => setActiveTab("personal")}
              className={`px-6 py-3 font-medium ${
                activeTab === "personal"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Personal Details
            </button>
            <button
              onClick={() => setActiveTab("academic")}
              className={`px-6 py-3 font-medium ${
                activeTab === "academic"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Academic Qualifications
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Tutor Profile Setup</h2>

            {/* Personal Details Section */}
            <section className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Personal Details
              </h3>
              <div className="space-y-4">
                <FormField
                  label="Full Name"
                  type="text"
                  value={profileData.personalDetails.fullName}
                  onChange={(v) => updateField("personalDetails", "fullName", v)}
                  required
                />
                <FormField
                  label="Email"
                  type="email"
                  value={profileData.personalDetails.email}
                  onChange={(v) => updateField("personalDetails", "email", v)}
                  required
                />
                <FormField
                  label="Phone Number"
                  type="tel"
                  value={profileData.personalDetails.phoneNumber}
                  onChange={(v) => updateField("personalDetails", "phoneNumber", v)}
                />
                <FormField
                  label="Location"
                  type="text"
                  value={profileData.personalDetails.location}
                  onChange={(v) => updateField("personalDetails", "location", v)}
                />
                <FormField
                  label="Brief Bio"
                  type="text"
                  value={profileData.personalDetails.briefBio}
                  onChange={(v) => updateField("personalDetails", "briefBio", v)}
                  placeholder="Tell us about yourself"
                />
              </div>
            </section>

            {/* Academic Qualifications Section */}
            <section className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Academic Qualifications
              </h3>
              <div className="space-y-4">
                <FormField
                  label="Degree"
                  type="text"
                  value={profileData.academicQualifications.degree}
                  onChange={(v) => updateField("academicQualifications", "degree", v)}
                  placeholder="e.g., Bachelor of Science"
                />
                <FormField
                  label="University"
                  type="text"
                  value={profileData.academicQualifications.university}
                  onChange={(v) => updateField("academicQualifications", "university", v)}
                  placeholder="Enter university name"
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
              </div>
            </section>

            {/* Submit Button */}
            <div className="flex justify-end mt-6">
              <Button variant="primary" size="lg" onClick={handleSubmit}>
                Create Tutor Profile
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
