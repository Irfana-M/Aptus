import React, { useState, useEffect, useRef } from 'react';

interface OtpInputProps {
  length: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

const OtpInput: React.FC<OtpInputProps> = ({ length, value, onChange, disabled = false, error }) => {
  const inputRefs = useRef(Array(length).fill(null).map(() => React.createRef<HTMLInputElement>())); // Type inference

  const [otp, setOtp] = useState<string[]>(new Array(length).fill(''));

  useEffect(() => {
    if (value.length <= length) {
      const otpArray = value.split('').concat(new Array(length - value.length).fill(''));
      setOtp(otpArray);
    }
  }, [value, length]);

  const handleChange = (index: number, digit: string) => {
    if (disabled) return;

    const newDigit = digit.replace(/[^0-9]/g, '');
    if (newDigit.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = newDigit;
    setOtp(newOtp);

    const otpValue = newOtp.join('');
    onChange(otpValue);

    if (newDigit && index < length - 1) {
      inputRefs.current[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].current?.focus();
    }
  };

  const handlePaste = (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, length);
    const otpArray = pastedData.split('').concat(new Array(length - pastedData.length).fill(''));
    setOtp(otpArray);
    onChange(pastedData);
    if (index < length - 1) {
      inputRefs.current[Math.min(index + pastedData.length, length - 1)].current?.focus();
    }
  };

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">OTP Code</label>
      <div className="flex justify-center space-x-3">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={inputRefs.current[index]}
            type="text"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={(e) => handlePaste(index, e)}
            disabled={disabled}
            className={`w-12 h-12 text-center text-lg font-semibold border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors ${
              error ? 'border-red-500' : digit ? 'border-teal-500 bg-teal-50' : 'border-gray-300'
            } ${disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:border-gray-400'}`}
          />
        ))}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default OtpInput;