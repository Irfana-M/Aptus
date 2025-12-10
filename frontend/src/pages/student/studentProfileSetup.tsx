import React, { useState } from 'react';
import Header from '../../components/layout/Header';
import { Upload, User } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../app/store';
import { fetchStudentProfile, updateStudentProfile } from '../../features/student/studentThunk';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { 
  fetchGrades 
} from '../../features/trial/student/studentTrialThunk';
import { 
  selectGrades, 
  selectGradesLoading 
} from '../../features/trial/student/studentTrialSelectors';
import { updateProfileStatus } from '../../features/auth/authSlice';

// Reusable Header Component
// Header removed in favor of shared component

// Reusable FormField Component
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

// Main Profile Setup Component
const ProfileSetup: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { profile, loading } = useSelector((state: RootState) => state.student);
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Trial slice selectors for consistent grade/syllabus data
  const grades = useSelector(selectGrades);
  const gradesLoading = useSelector(selectGradesLoading);
  
  const [availableSyllabi, setAvailableSyllabi] = useState<string[]>([]);

  const [profileData, setProfileData] = useState({
    fullName: '',
    emailId: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: '',
    age: '',
    address: '',
    country: '',
    postalCode: '',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    relationship: '',
    institution: '',
    grade: '',
    syllabus: '',
    learningGoal: '',
    profileImageUrl: ''
  });

  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [idProof, setIdProof] = useState<File | null>(null);

  useEffect(() => {
    dispatch(fetchStudentProfile());
    dispatch(fetchGrades()); // Fetch grades on mount
  }, [dispatch]);

  // Update available syllabi when grade changes
  useEffect(() => {
    if (profileData.grade) {
      // Find grade by name or ID - logic from TrialBookingPage roughly
      // But here profileData.grade might be name or ID. 
      // If we switch to ID for storage in select, we must ensure we map it back or use ID consistently.
      // The profileData structure seems to use strings. Let's assume we store Grade ID if possible or Name.
      // Given the previous usage was a text input, it was likely Name.
      // But now we want structured data. We should probably store the ID if backend expects ID.
      // However, typical profile might just store "Grade 10" string.
      // Let's look at getUniqueGrades logic.
      
      const selectedGrade = grades.find((g) => g.name === profileData.grade || g.id === profileData.grade);
      
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
    if (profile || user) {
        // Merge user and profile data
        const data = profile || user;
        setProfileData(prev => ({
            ...prev,
            fullName: data.name || data.fullName || '',
            emailId: data.email || data.emailId || '',
            phoneNumber: data.phoneNumber || '',
            profileImageUrl: data.profileImageUrl || '',
            // Add other fields mapping if they exist in the fetched profile
            // For now assuming the basic auth user details are primary source for initial load
            // If the dedicated student profile has more fields (like address), map them here
            ...data // Spread the rest to catch matching fields
        }));
    }
  }, [profile, user]);

  const handleChange = (field: string) => (value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (type: 'profile' | 'id') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type and size
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a valid image file (JPEG, PNG, WEBP)');
        return;
      }

      if (file.size > maxSize) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      if (type === 'profile') {
        setProfilePicture(file);
      } else {
        setIdProof(file);
      }
    }
  };

  const validateForm = () => {
    const requiredFields = [
      'fullName', 'emailId', 'phoneNumber', 'dateOfBirth', 'gender',
      'address', 'country', 'postalCode',
      'parentName', 'parentEmail', 'parentPhone', 'relationship',
      'grade', 'syllabus',
      'institution', 'learningGoal' 
    ];

    for (const field of requiredFields) {
      if (!profileData[field as keyof typeof profileData]) {
        toast.error(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
        const formData = new FormData();
        
        // Append all text fields
        Object.entries(profileData).forEach(([key, value]) => {
          if (value && typeof value === 'string') {
            formData.append(key, value);
          }
        });

        // Append files if they exist
        if (profilePicture && profilePicture instanceof File) {
          formData.append('profilePicture', profilePicture);
        }
        
        if (idProof && idProof instanceof File) {
          formData.append('idProof', idProof);
        }

        const resultAction = await dispatch(updateStudentProfile(formData));
        if (updateStudentProfile.fulfilled.match(resultAction)) {
             dispatch(updateProfileStatus({ isProfileComplete: true }));
             toast.success('Profile updated successfully!');
             navigate('/student/time-slots'); // Redirect to Time Slots for booking
        } else {
            toast.error('Failed to update profile: ' + (resultAction.payload as string));
        }
    } catch (err) {
        console.error("Failed to update profile", err);
        toast.error("An unexpected error occurred.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">


        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-2">
                <h1 className="text-2xl font-bold text-gray-800">Profile Setup</h1>
                <button className="text-blue-600 text-sm font-medium hover:underline">
                  Uploads
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                Complete your profile to get started with personalized learning.
              </p>

              {/* Basic Information */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h2>
                <FormField
                  label="Full Name"
                  type="text"
                  value={profileData.fullName}
                  onChange={handleChange('fullName')}
                  required
                />
                <FormField
                  label="Email ID"
                  type="email"
                  value={profileData.emailId}
                  onChange={handleChange('emailId')}
                  required
                />
                <FormField
                  label="Phone Number"
                  type="tel"
                  value={profileData.phoneNumber}
                  onChange={handleChange('phoneNumber')}
                />
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    label="Date of Birth"
                    type="date"
                    value={profileData.dateOfBirth}
                    onChange={handleChange('dateOfBirth')}
                  />
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gender
                    </label>
                    <select
                        value={profileData.gender}
                        onChange={(e) => handleChange('gender')(e.target.value)}
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
                  onChange={handleChange('age')}
                />
              </div>

              {/* Address */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Address</h2>
                <FormField
                  label="Address"
                  type="textarea"
                  value={profileData.address}
                  onChange={handleChange('address')}
                  rows={4}
                />
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    label="Country"
                    type="text"
                    value={profileData.country}
                    onChange={handleChange('country')}
                  />
                  <FormField
                    label="Postal Code"
                    type="text"
                    value={profileData.postalCode}
                    onChange={handleChange('postalCode')}
                  />
                </div>
              </div>

              {/* Parent/Guardian Details */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Parent/Guardian Details</h2>
                <FormField
                  label="Name"
                  type="text"
                  value={profileData.parentName}
                  onChange={handleChange('parentName')}
                />
                <FormField
                  label="Email"
                  type="email"
                  value={profileData.parentEmail}
                  onChange={handleChange('parentEmail')}
                />
                <FormField
                  label="Phone"
                  type="tel"
                  value={profileData.parentPhone}
                  onChange={handleChange('parentPhone')}
                />
                <FormField
                  label="Relationship"
                  type="text"
                  value={profileData.relationship}
                  onChange={handleChange('relationship')}
                />
              </div>

              {/* Academic Preferences */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Academic Preferences</h2>
                <FormField
                  label="Institution"
                  type="text"
                  value={profileData.institution}
                  onChange={handleChange('institution')}
                />
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grade <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    value={profileData.grade}
                    onChange={(e) => handleChange('grade')(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                    disabled={gradesLoading}
                  >
                    <option value="">Select Grade</option>
                    {[...new Set(grades.map(g => g.name))].map(gradeName => (
                         <option key={gradeName} value={gradeName}>{gradeName}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Syllabus <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    value={profileData.syllabus}
                    onChange={(e) => handleChange('syllabus')(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
                    disabled={!profileData.grade}
                  >
                    <option value="">Select Syllabus</option>
                    {availableSyllabi.map(syllabus => (
                         <option key={syllabus} value={syllabus}>{syllabus}</option>
                    ))}
                  </select>
                </div>

                <FormField
                  label="Short Bio / Learning Goal"
                  type="textarea"
                  value={profileData.learningGoal}
                  onChange={handleChange('learningGoal')}
                  rows={4}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Saving...' : 'Save Profile & Select Time Slot'}
              </button>
            </div>
          </div>

          {/* Right Column - Uploads */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              {/* Profile Picture Upload */}
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  {profilePicture ? (
                    <img
                      src={URL.createObjectURL(profilePicture)}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover mx-auto"
                    />
                  ) : profileData.profileImageUrl ? (
                    <img
                      src={profileData.profileImageUrl}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover mx-auto"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                      <User className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-gray-800 mt-4 mb-1">
                  Upload Profile Picture
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                  Click to upload your profile photo
                </p>
                <label className="inline-block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload('profile')}
                    className="hidden"
                  />
                  <span className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors">
                    <Upload className="w-4 h-4" />
                    Choose File
                  </span>
                </label>
              </div>

              <div className="border-t pt-6">
                {/* ID Proof Upload */}
                <div className="text-center">
                  {idProof ? (
                    <img
                      src={URL.createObjectURL(idProof)}
                      alt="ID Proof"
                      className="w-full h-40 object-cover rounded-lg mb-3"
                    />
                  ) : (
                    <div className="w-full h-40 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                      <Upload className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <h3 className="text-sm font-semibold text-gray-800 mb-1">
                    Upload ID Proof
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">
                    Click to upload your ID proof
                  </p>
                  <label className="inline-block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload('id')}
                      className="hidden"
                    />
                    <span className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                      Upload
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;