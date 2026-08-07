import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ArrowLeft, ArrowRight } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import api from '../services/api';
import AuthHeroPanel from '../components/AuthHeroPanel';
import Logo from '../components/Logo';
import SEO from '../components/SEO';

const SharedLogo = () => (
  <div className="flex flex-col items-center justify-center">
    <Logo className="w-14 h-14 sm:w-16 sm:h-16 object-contain mb-1" />
  </div>
);

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingText, setLoadingText] = useState('Log into Account');
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (isSubmitting) {
      setLoadingText('Signing in...');
    } else {
      setLoadingText('Log into Account');
    }
  }, [isSubmitting]);

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setIsSubmitting(true);
      setLoadingText('Signing in...');
      setServerError('');

      const response = await api.post('/auth/google', {
        idToken: credentialResponse.credential
      });

        const resData = response.data?.data || response.data;
        const accessToken =
          resData?.access_token ||
          resData?.accessToken ||
          resData?.token;
        const refreshToken =
          resData?.refresh_token || resData?.refreshToken;

        if (accessToken) {
          if (rememberMe) {
            localStorage.setItem('access_token', accessToken);
          } else {
            sessionStorage.setItem('access_token', accessToken);
          }
        }
        if (refreshToken) {
          if (rememberMe) {
            localStorage.setItem('refresh_token', refreshToken);
          } else {
            sessionStorage.setItem('refresh_token', refreshToken);
          }
        }

        const parsedName = resData?.fullName || resData?.name || resData?.displayName || resData?.authorName || '';
        const parsedAvatar = resData?.avatarUrl || resData?.authorAvatarUrl || null;
        const parsedRole = resData?.role || resData?.accountType || 'user';
        const parsedId = resData?.id || resData?._id || '';
        const userEmail = resData?.email || '';

        const userObj = resData?.user || {
          id: parsedId,
          fullName: parsedName || (userEmail.split('@')[0] ? userEmail.split('@')[0].replace(/[._0-9]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).trim() : ''),
          email: userEmail,
          avatarUrl: parsedAvatar,
          role: parsedRole
        };
        
        const storeName = userObj.fullName || userObj.name || userObj.displayName || '';

        if (rememberMe) {
          localStorage.setItem('user', JSON.stringify(userObj));
          localStorage.setItem('user_name', storeName);
          localStorage.setItem('user_email', userEmail);
        } else {
          sessionStorage.setItem('user', JSON.stringify(userObj));
          sessionStorage.setItem('user_name', storeName);
          sessionStorage.setItem('user_email', userEmail);
        }

        toast.success('Logged in successfully!');
        navigate('/');
      } catch (error) {
        const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Google sign-in failed. Please try again.';
        toast.error(errorMsg);
        setServerError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleError = () => {
    toast.error('Google sign-in popup failed. Please try again.');
    setServerError('Google sign-in popup failed.');
  };

  const handleFacebookLogin = () => {
    const appId = import.meta.env.VITE_FACEBOOK_APP_ID;
    if (!appId || appId === '%VITE_FACEBOOK_APP_ID%') {
      toast.error('Facebook login is not configured on this environment (missing App ID).');
      return;
    }

    if (!window.FB) {
      toast.error('Facebook SDK not loaded. Please try again later.');
      return;
    }
    
    window.FB.login((response) => {
      const processLogin = async () => {
        if (response.authResponse) {
          try {
            setIsSubmitting(true);
            setLoadingText('Signing in...');
            setServerError('');

            const apiResponse = await api.post('/auth/facebook', {
              accessToken: response.authResponse.accessToken
            });

            const resData = apiResponse.data?.data || apiResponse.data;
            const accessToken =
              resData?.access_token ||
              resData?.accessToken ||
              resData?.token;
            const refreshToken =
              resData?.refresh_token || resData?.refreshToken;

            if (accessToken) {
              if (rememberMe) {
                localStorage.setItem('access_token', accessToken);
              } else {
                sessionStorage.setItem('access_token', accessToken);
              }
            }
            if (refreshToken) {
              if (rememberMe) {
                localStorage.setItem('refresh_token', refreshToken);
              } else {
                sessionStorage.setItem('refresh_token', refreshToken);
              }
            }

            const parsedName = resData?.fullName || resData?.name || resData?.displayName || resData?.authorName || '';
            const parsedAvatar = resData?.avatarUrl || resData?.authorAvatarUrl || null;
            const parsedRole = resData?.role || resData?.accountType || 'user';
            const parsedId = resData?.id || resData?._id || '';
            const userEmail = resData?.email || '';

            const userObj = resData?.user || {
              id: parsedId,
              fullName: parsedName || (userEmail.split('@')[0] ? userEmail.split('@')[0].replace(/[._0-9]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).trim() : ''),
              email: userEmail,
              avatarUrl: parsedAvatar,
              role: parsedRole
            };
            
            const storeName = userObj.fullName || userObj.name || userObj.displayName || '';

            if (rememberMe) {
              localStorage.setItem('user', JSON.stringify(userObj));
              localStorage.setItem('user_name', storeName);
              localStorage.setItem('user_email', userEmail);
            } else {
              sessionStorage.setItem('user', JSON.stringify(userObj));
              sessionStorage.setItem('user_name', storeName);
              sessionStorage.setItem('user_email', userEmail);
            }

            toast.success('Logged in successfully!');
            navigate('/');
          } catch (error) {
            toast.error(error.response?.data?.message || error.response?.data?.error || 'Facebook sign-in failed. Please try again.');
            setServerError('Facebook sign-in failed.');
          } finally {
            setIsSubmitting(false);
          }
        } else {
          toast.error('Facebook sign-in was cancelled or failed.');
        }
      };
      processLogin();
    }, { scope: 'email,public_profile' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setServerError('Please enter your email and password.');
      return;
    }

    setServerError('');
    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/login', {
        email: email.trim(),
        password: password,
        rememberMe: rememberMe,
      });


      const resData = response.data?.data || response.data;
      const accessToken =
        resData?.access_token ||
        resData?.accessToken ||
        resData?.token;
      const refreshToken =
        resData?.refresh_token || resData?.refreshToken;

      if (accessToken) {
        if (rememberMe) {
          localStorage.setItem('access_token', accessToken);
        } else {
          sessionStorage.setItem('access_token', accessToken);
        }
      }
      if (refreshToken) {
        if (rememberMe) {
          localStorage.setItem('refresh_token', refreshToken);
        } else {
          sessionStorage.setItem('refresh_token', refreshToken);
        }
      }

      const parsedName = resData?.fullName || resData?.name || resData?.displayName || resData?.authorName || '';
      const parsedAvatar = resData?.avatarUrl || resData?.authorAvatarUrl || null;
      const parsedRole = resData?.role || resData?.accountType || 'user';
      const parsedId = resData?.id || resData?._id || '';

      const userObj = resData?.user || {
        id: parsedId,
        fullName: parsedName || (email.split('@')[0] ? email.split('@')[0].replace(/[._0-9]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).trim() : ''),
        email: resData?.email || email.trim(),
        avatarUrl: parsedAvatar,
        role: parsedRole
      };
      
      const storeName = userObj.fullName || userObj.name || userObj.displayName || '';

      if (rememberMe) {
        localStorage.setItem('user', JSON.stringify(userObj));
        localStorage.setItem('user_name', storeName);
        localStorage.setItem('user_email', email.trim());
      } else {
        sessionStorage.setItem('user', JSON.stringify(userObj));
        sessionStorage.setItem('user_name', storeName);
        sessionStorage.setItem('user_email', email.trim());
      }

      toast.success('Logged in successfully!');
      navigate('/');
    } catch (error) {

      // Connection failure: timeout (ECONNABORTED) or no response from server
      if (error.isConnectionError || error.code === 'ECONNABORTED' || !error.response) {
        setServerError('Connection failed. Please try again.');
        return;
      }
      
      // Check for specific backend errors, e.g. suspended accounts
      const apiErrorMsg = error.response?.data?.message || error.response?.data?.error;
      if (apiErrorMsg && (apiErrorMsg.toLowerCase().includes('suspend') || apiErrorMsg.toLowerCase().includes('remov'))) {
        setServerError('This account has been suspended/removed. Contact support.');
      } else if (apiErrorMsg && apiErrorMsg.toLowerCase().includes('social login')) {
        setServerError(apiErrorMsg);
      } else {
        setServerError(apiErrorMsg || 'Invalid email or password.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex lg:flex font-body bg-white-bg">
        <SEO title="Login" />
      {/* Left Column */}
      <AuthHeroPanel />

      {/* Right Column */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-auth-form px-8 my-auto">
          {/* Shared logo at top */}
          <div className="mb-6 flex justify-center">
            <SharedLogo />
          </div>

          {/* Heading & subtext */}
          <div className="text-center mb-6">
            <h1 className="font-heading text-auth-heading text-primary mb-1">
              {(() => {
                const name = localStorage.getItem('user_name') || sessionStorage.getItem('user_name');
                return name ? `Welcome Back, ${name.split(' ')[0]}` : 'Welcome Back';
              })()}
            </h1>
            <p className="font-body text-auth-subtext text-paragraph">
              Welcome back! Please enter your details.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 font-body" noValidate>
            {serverError && (
              <div className="p-3 bg-alert-errorLight border border-alert-error/20 rounded-lg text-alert-error text-sm font-medium mb-4">
                {serverError}
              </div>
            )}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-black mb-1"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-white-stroke rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                placeholder="enter your email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-black mb-1"
              >
                Create Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 border border-white-stroke rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                  placeholder="*************"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-black-icon hover:text-black focus:outline-none p-1 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember for 30 days & Forgot password */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm pt-1">
              <label htmlFor="rememberMe" className="flex items-center gap-2 cursor-pointer text-black select-none">
                <input
                  id="rememberMe"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-primary border-white-stroke rounded focus:ring-primary/20"
                />
                <span>Remember for 30 days</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-primary hover:underline font-semibold"
              >
                Forgot password?
              </Link>
            </div>

            {/* Log into Account button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-sm cursor-pointer"
            >
              {isSubmitting ? loadingText : 'Log into Account'}
            </button>

            <div className="w-full mt-3 flex justify-center h-[46px] items-center relative z-0">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="outline"
                size="large"
              />
            </div>

            <button
              type="button"
              onClick={handleFacebookLogin}
              className="w-full mt-3 px-4 py-3 bg-white border border-white-stroke text-black font-semibold rounded-lg hover:bg-white-bg transition-all flex items-center justify-center gap-3 text-sm shadow-sm"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Sign in with Facebook
            </button>
          </form>

          {/* Bottom text matching design */}
          <div className="mt-6 text-center text-sm text-paragraph font-body">
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              className="text-primary font-semibold hover:underline"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

