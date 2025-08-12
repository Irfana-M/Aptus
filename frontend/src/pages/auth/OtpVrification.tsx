import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import FormField from '../../components/ui/FormField';
import Button from '../../components/ui/Button';
import Tab from '../../components/ui/Tab';
import Logo from '../../components/ui/Logo';
import OtpInput from '../../components/ui/OtpInput';
import Notification from '../../components/ui/Notification';
import { UserRepository } from '../../repositories/UserRepository';
import  registerBanner from '../../assets/images/register_banner.jpeg';

interface OtpFormData {
  email: string;
  otp: string; 
  role: 'student' | 'mentor';
}

const OtpVerificationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'student' | 'mentor'>('student');
  const [formData, setFormData] = useState<OtpFormData>({
    email: 'user@example.com', 
    otp: '',
    role: 'student',
  });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [timer, setTimer] = useState(59);
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ show: false, message: '', type: 'info' });

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ show: true, message, type });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string | undefined> = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!UserRepository.validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.otp) {
      newErrors.otp = 'OTP is required';
    } else if (!UserRepository.validateOTP(formData.otp)) {
      newErrors.otp = 'OTP must be 6 digits';
    }
    if (!formData.role || !UserRepository.validateRole(formData.role)) {
      newErrors.role = 'Please select a valid role';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleVerifyOtp = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const result = await UserRepository.verifyOTP(formData.email, formData.otp, formData.role);
      if (result.success) {
        showNotification(result.message, 'success');
        setTimeout(() => {
          console.log('Redirecting to dashboard...');
          // Replace with actual redirect, e.g., history.push('/dashboard')
        }, 2000);
      } else {
        showNotification(result.message, 'error');
      }
    } catch (error) {
      console.error('OTP verification failed:', error);
      showNotification('Verification failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    const newErrors: Record<string, string | undefined> = {};
    if (!UserRepository.validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
      setErrors(newErrors);
      return;
    }
    if (!UserRepository.validateRole(formData.role)) {
      newErrors.role = 'Please select a valid role';
      setErrors(newErrors);
      return;
    }
    setResendLoading(true);
    setCanResend(false);
    setTimer(59);
    try {
      const result = await UserRepository.sendOTP(formData.email, formData.role);
      if (result.success) {
        showNotification(result.message, 'success');
        setFormData(prev => ({ ...prev, otp: '' }));
      } else {
        showNotification('Failed to resend OTP. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Resend OTP failed:', error);
      showNotification('Failed to resend OTP. Please try again.', 'error');
    } finally {
      setResendLoading(false);
    }
  };

  const handleTimerTick = () => {
    setTimer(prev => {
      if (prev <= 1) {
        setCanResend(true);
        return 0;
      }
      return prev - 1;
    });
  };

  useEffect(() => {
    if (!canResend && timer > 0) {
      const interval = setInterval(handleTimerTick, 1000);
      return () => clearInterval(interval);
    }
  }, [timer, canResend]);

  const updateField = (field: keyof OtpFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleTabChange = (role: 'student' | 'mentor') => {
    setActiveTab(role);
    updateField('role', role);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Notification */}
      <Notification
        message={notification.message}
        type={notification.type}
        show={notification.show}
        onClose={hideNotification}
      />

      
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

      {/* Right Side - OTP Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <Logo />
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">OTP Verification</h1>
            <p className="text-gray-600 mb-6">Enter the 6-digit code sent to your email</p>
          </div>

          <div className="flex space-x-2 mb-8 bg-gray-100 p-1 rounded-full">
            <Tab
              label="Student"
              isActive={activeTab === 'student'}
              onClick={() => handleTabChange('student')}
            />
            <Tab
              label="Mentor"
              isActive={activeTab === 'mentor'}
              onClick={() => handleTabChange('mentor')}
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
              disabled
            />
            <OtpInput
              length={6}
              value={formData.otp}
              onChange={(value) => updateField('otp', value)}
              disabled={loading}
              error={errors.otp}
            />
            {errors.role && <p className="text-sm text-red-500">{errors.role}</p>}
            {canResend ? (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Didn't receive the code?</p>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleResendOtp}
                  disabled={resendLoading}
                  loading={resendLoading}
                  className="w-full"
                >
                  {resendLoading ? 'Sending...' : 'Resend Code'}
                </Button>
              </div>
            ) : (
              <div className="text-sm text-gray-600 text-center">
                Resend code in <span className="font-semibold text-teal-600">{formatTime(timer)}</span>
              </div>
            )}
            <div className="pt-4">
              <Button
                variant="primary"
                size="md"
                onClick={handleVerifyOtp}
                disabled={formData.otp.length !== 6 || loading}
                loading={loading}
                className="w-full"
              >
                Verify
              </Button>
            </div>
            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Back to{' '}
                <Link to="/register" className="text-teal-600 hover:text-teal-700 font-medium">
                  Registration
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Demo:</strong> Use OTP <code className="bg-blue-200 px-2 py-1 rounded">123456</code> for testing
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtpVerificationPage;