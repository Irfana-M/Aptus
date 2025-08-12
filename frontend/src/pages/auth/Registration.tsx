import React, { useState } from 'react';
import FormField from '../../components/ui/FormField';
import Button from '../../components/ui/Button';
import Tab from '../../components/ui/Tab';
import Logo from '../../components/ui/Logo';
import { UserRepository } from '../../repositories/UserRepository';
import type { User } from '../../types';
import  registerBanner from '../../assets/images/register_banner.jpeg';



const RegistrationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'student' | 'mentor'>('student');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<User>({
    email: '',
    fullName: '',
    password: '',
    confirmPassword: '',
    mobileNumber: ''
  });
  const [errors, setErrors] = useState<Partial<User>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<User> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!UserRepository.validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.fullName) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!UserRepository.validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.mobileNumber) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (!UserRepository.validateMobile(formData.mobileNumber)) {
      newErrors.mobileNumber = 'Please enter a valid mobile number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await UserRepository.register({
        ...formData,
        role: activeTab});

      if (result.success) {
        alert('Registration successful!');
        setFormData({
          email: '',
          fullName: '',
          password: '',
          confirmPassword: '',
          mobileNumber: '',
          role: activeTab,
        });
      }
    } catch (error) {
      console.error('Registration failed:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof User, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-400 to-blue-500 p-12 items-center justify-center">
        <div className="max-w-md text-center">
          <div className="bg-white rounded-lg p-8 shadow-lg">
            <img
            src={registerBanner}
            alt="Join Our Learnig Community"
            className="w-full h-full object-cover rounded-lg"
            />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Join Our Learning Community</h2>
            <p className="text-gray-600">Connect with mentors and expand your knowledge</p>
          </div>
        </div>
      </div>

   
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <Logo />
          
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Mentora!</h1>
          </div>

         
          <div className="flex space-x-2 mb-8 bg-gray-100 p-1 rounded-full">
            <Tab
              label="Student"
              isActive={activeTab === 'student'}
              onClick={() => setActiveTab('student')}
            />
            <Tab
              label="Mentor"
              isActive={activeTab === 'mentor'}
              onClick={() => setActiveTab('mentor')}
            />
          </div>

          
          <div className="space-y-4">
            <FormField
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(value) => updateField('email', value)}
              placeholder="Enter your email"
              required
              error={errors.email}
            />

            <FormField
              label="First Name"
              type="text"
              value={formData.fullName}
              onChange={(value) => updateField('fullName', value)}
              placeholder="Enter your first name"
              required
              error={errors.fullName}
            />

            <FormField
              label="Password"
              type="password"
              value={formData.password}
              onChange={(value) => updateField('password', value)}
              placeholder="Enter your password"
              required
              error={errors.password}
            />

            <FormField
              label="Confirm Password"
              type="password"
              value={formData.confirmPassword}
              onChange={(value) => updateField('confirmPassword', value)}
              placeholder="Confirm your password"
              required
              error={errors.confirmPassword}
            />

            <FormField
              label="Mobile Number"
              type="tel"
              value={formData.mobileNumber}
              onChange={(value) => updateField('mobileNumber', value)}
              placeholder="Enter your mobile number"
              required
              error={errors.mobileNumber}
            />

            <div className="pt-4">
              <Button
                variant="primary"
                onClick={handleRegister}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </Button>
            </div>

            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button className="text-teal-500 hover:text-teal-600 font-medium">
                  Sign Up
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;