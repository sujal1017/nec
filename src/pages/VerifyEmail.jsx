import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [verificationCode, setVerificationCode] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [codeRequested, setCodeRequested] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState({
    success: false,
    message: '',
    verified: false
  });

  // Extract email from URL query params if available
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const emailParam = params.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [location]);

  const handleChange = (e) => {
    const { value } = e.target;
    // Only allow numbers and limit to 6 digits
    if (/^\d{0,6}$/.test(value)) {
      setVerificationCode(value);
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const validate = useCallback(() => {
    const newErrors = {};
    
    if (!verificationCode && codeRequested) {
      newErrors.code = 'Verification code is required';
    } else if (verificationCode.length !== 6 && codeRequested) {
      newErrors.code = 'Verification code must be 6 digits';
    }

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    return newErrors;
  }, [verificationCode, email, codeRequested]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setErrors({});
    setIsVerifying(true);
    
    try {
      // Replace with your actual API endpoint
      // const response = await axios.post('/api/verify-email', {
      //   email,
      //   verificationCode
      // });
      
      // For demonstration purposes
      setTimeout(() => {
        setIsVerifying(false);
        setVerificationStatus({
          success: true,
          message: 'Email verified successfully!',
          verified: true
        });
        
        // Redirect to login page after successful verification
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }, 1500);
    } catch (error) {
      console.error('Error verifying email:', error);
      setIsVerifying(false);
      setVerificationStatus({
        success: false,
        message: 'Failed to verify email. Please check your code and try again.',
        verified: false
      });
    }
  }, [email, verificationCode, validate, navigate]);

  const handleRequestCode = useCallback(async () => {
    const validationErrors = validate();
    if (validationErrors.email) {
      setErrors({ email: validationErrors.email });
      return;
    }
    
    setErrors({});
    setIsSendingCode(true);
    
    try {
      // Replace with your actual API endpoint
      // await axios.post('/api/request-verification', { email });
      
      // For demonstration purposes
      setTimeout(() => {
        setIsSendingCode(false);
        setCodeRequested(true);
        setVerificationStatus({
          success: true,
          message: 'A verification code has been sent to your email!',
          verified: false
        });
        
        setTimeout(() => {
          setVerificationStatus(prev => ({
            ...prev,
            message: ''
          }));
        }, 5000);
      }, 2000);
    } catch (error) {
      console.error('Error requesting verification code:', error);
      setIsSendingCode(false);
      setVerificationStatus({
        success: false,
        message: 'Failed to send verification code. Please try again.',
        verified: false
      });
    }
  }, [email, validate]);

  const handleResendCode = useCallback(async () => {
    const validationErrors = validate();
    if (validationErrors.email) {
      setErrors({ email: validationErrors.email });
      return;
    }
    
    setErrors({});
    setIsSendingCode(true);
    
    try {
      // Replace with your actual API endpoint
      // await axios.post('/api/resend-verification', { email });
      
      // For demonstration purposes
      setTimeout(() => {
        setIsSendingCode(false);
        setVerificationStatus({
          success: true,
          message: 'A new verification code has been sent to your email!',
          verified: false
        });
        
        setTimeout(() => {
          setVerificationStatus(prev => ({
            ...prev,
            message: ''
          }));
        }, 5000);
      }, 2000);
    } catch (error) {
      console.error('Error resending verification code:', error);
      setIsSendingCode(false);
      setVerificationStatus({
        success: false,
        message: 'Failed to resend verification code. Please try again.',
        verified: false
      });
    }
  }, [email, validate]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="w-full max-w-md m-auto bg-white rounded-lg shadow-xl p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Verify Your Email</h2>
        
        {verificationStatus.verified ? (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <p>{verificationStatus.message}</p>
            <p className="mt-2">Redirecting to login page...</p>
          </div>
        ) : (
          <>
            {verificationStatus.message && (
              <div className={`${verificationStatus.success ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700'} border px-4 py-3 rounded mb-4`}>
                <p>{verificationStatus.message}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={handleEmailChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Enter your email address"
                  disabled={codeRequested && !isSendingCode}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>
              
              {!codeRequested ? (
                <div className="flex flex-col space-y-4">
                  <button
                    type="button"
                    onClick={handleRequestCode}
                    disabled={isSendingCode}
                    className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-300 ${isSendingCode ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isSendingCode ? 'Sending Code...' : 'Request Verification Code'}
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-1">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      id="verificationCode"
                      value={verificationCode}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.code ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                    />
                    {errors.code && (
                      <p className="text-red-500 text-xs mt-1">{errors.code}</p>
                    )}
                  </div>
                  
                  <div className="flex flex-col space-y-4">
                    <button
                      type="submit"
                      disabled={isVerifying}
                      className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-300 ${isVerifying ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {isVerifying ? 'Verifying...' : 'Verify Email'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={isSendingCode}
                      className={`text-blue-600 hover:text-blue-800 text-sm font-medium ${isSendingCode ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {isSendingCode ? 'Sending...' : 'Resend verification code'}
                    </button>
                  </div>
                </>
              )}
            </form>
            
            <div className="text-center mt-6">
              <Link to="/login" className="text-sm text-blue-600 hover:text-blue-800">
                Back to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;