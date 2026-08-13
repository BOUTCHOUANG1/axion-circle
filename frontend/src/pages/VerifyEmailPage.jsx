import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import api from '../services/api';
import AuthHeroPanel from '../components/AuthHeroPanel';
import Logo from '../components/Logo';
import SEO from '../components/SEO';

const SharedLogo = () => (
  <div className="flex flex-col items-center justify-center">
    <Logo className="w-14 h-14 sm:w-16 sm:h-16 object-contain mb-1" />
  </div>
);

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [countdown, setCountdown] = useState(30);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChange = (index, value) => {
    if (value.length > 1) {
      // Handle paste
      const pastedData = value.slice(0, 6).split('');
      const newCode = [...code];
      pastedData.forEach((char, i) => {
        if (index + i < 6) {
          newCode[index + i] = char;
        }
      });
      setCode(newCode);
      
      const nextEmptyIndex = newCode.findIndex(c => c === '');
      if (nextEmptyIndex !== -1 && inputRefs.current[nextEmptyIndex]) {
        inputRefs.current[nextEmptyIndex].focus();
      } else if (inputRefs.current[5]) {
        inputRefs.current[5].focus();
      }
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  useEffect(() => {
    const fullCode = code.join('');
    if (fullCode.length === 6 && !isSubmitting && !isSuccess) {
      submitCode(fullCode);
    }
  }, [code, isSubmitting, isSuccess]);

  const submitCode = async (fullCode) => {
    setIsSubmitting(true);
    setServerError('');
    try {
      await api.post('/auth/verify-email', { email, code: fullCode });
      setIsSuccess(true);
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Invalid or expired verification code.';
      setServerError(errorMsg);
      setCode(['', '', '', '', '', '']);
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    
    try {
      await api.post('/auth/resend-verification', { email });
      setCountdown(30);
      toast.success('New code sent!');
    } catch (error) {
      toast.error('Failed to resend code. Please try again.');
    }
  };

  const maskEmail = (emailStr) => {
    if (!emailStr) return '';
    const [local, domain] = emailStr.split('@');
    if (local.length <= 3) return emailStr;
    return `${local.slice(0, 3)}***@${domain}`;
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex lg:flex font-body bg-white-bg">
        <SEO title="Verify Email" />
        <AuthHeroPanel />
        <div className="w-full lg:w-1/2 min-h-screen flex flex-col items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-sm px-4 sm:px-8 my-auto flex flex-col items-center text-center animate-in fade-in duration-300">
            <div className="w-24 h-24 bg-alert-success/10 rounded-full flex items-center justify-center mb-6 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                 {/* Decorative confetti pieces */}
                 <div className="absolute w-2 h-4 bg-blue-500 rounded-full -top-4 left-4 transform rotate-45"></div>
                 <div className="absolute w-3 h-3 bg-yellow-400 rounded-full -top-2 right-2"></div>
                 <div className="absolute w-4 h-2 bg-red-500 rounded-full top-8 -right-6 transform -rotate-45"></div>
                 <div className="absolute w-3 h-3 bg-purple-400 rounded-full bottom-4 -left-4"></div>
                 <div className="absolute w-2 h-4 bg-green-500 rounded-full -bottom-6 left-8 transform rotate-12"></div>
                 <div className="absolute w-4 h-4 bg-orange-400 rounded-full -bottom-2 right-8 clip-star"></div>
              </div>
              <div className="w-20 h-20 bg-alert-success rounded-full flex items-center justify-center relative z-10">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-black mb-3">
              Email Verified
            </h1>
            <p className="text-paragraph text-sm sm:text-base mb-8 max-w-xs">
              Your email address have successfully been verified.
            </p>
            
            <button
              onClick={() => navigate('/')}
              className="w-full px-4 py-3 bg-alert-success text-white font-semibold rounded-lg hover:bg-alert-success/90 active:scale-[0.99] transition-all shadow-sm cursor-pointer"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex lg:flex font-body bg-white-bg">
      <AuthHeroPanel />
      
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-sm px-4 my-auto flex flex-col items-center">
          <div className="mb-6 flex justify-center">
            <SharedLogo />
          </div>

          <div className="text-center mb-8">
            <h1 className="font-heading text-2xl font-bold text-black mb-2">
              Enter Code
            </h1>
            <p className="text-paragraph text-sm max-w-xs mx-auto">
              enter the 6digit code we sent to your email address{' '}
              <span className="text-primary font-bold">{maskEmail(email)}</span>
            </p>
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium text-black mb-3 text-left">
              Enter verification code
            </label>
            <div className="flex justify-between gap-2 mb-2">
              {code.map((digit, index) => (
                <input
                  key={index}
                  aria-label={`Digit ${index + 1}`}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  maxLength={6} // allow pasting full code
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={isSubmitting}
                  className={`w-12 h-12 text-center text-lg font-semibold border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    serverError ? 'border-alert-error focus:ring-alert-errorLight' : 'border-white-stroke focus:border-primary focus:ring-primary/20 bg-[#F9FAFB]'
                  }`}
                />
              ))}
            </div>
            
            {serverError && (
              <p className="text-alert-error text-xs text-center mb-3">
                {serverError}
              </p>
            )}

            <div className="flex items-center justify-start text-xs mt-3">
              <span className="text-paragraph mr-1">Didn't receive code?</span>
              <button
                type="button"
                onClick={handleResend}
                disabled={countdown > 0 || isSubmitting}
                className={`font-semibold ${countdown > 0 ? 'text-paragraph cursor-not-allowed' : 'text-primary hover:underline'}`}
              >
                Resend code {countdown > 0 && <span className="text-alert-warning ml-1">0:{countdown.toString().padStart(2, '0')}</span>}
              </button>
            </div>
          </div>

          <div className="mt-12 text-center w-full">
            <button
              onClick={() => navigate('/register')}
              className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-alert-success hover:text-alert-success/80 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
