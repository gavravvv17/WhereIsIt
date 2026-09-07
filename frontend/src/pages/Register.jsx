import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Package, Mail, Lock, User, Loader2, ArrowRight, ShieldCheck, RefreshCw, KeyRound } from 'lucide-react';

const Register = () => {
  const { initiateRegister, verifyRegister, resendOtp } = useAuth();
  const navigate = useNavigate();

  // Form Step: 1 = Details, 2 = OTP Verification
  const [step, setStep] = useState(1);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');

  // UI State
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Cooldown Timer State
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (step === 2) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step]);

  const handleInitRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password and Confirm Password do not match');
      return;
    }

    setSubmitting(true);
    const result = await initiateRegister(name, email, password, confirmPassword);
    if (result.success) {
      setStep(2);
      setResendCooldown(60);
      setSuccessMsg(result.message || 'Verification code sent to your email.');
    } else {
      setError(result.error);
    }
    setSubmitting(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (otp.trim().length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setSubmitting(true);
    const result = await verifyRegister(email, otp.trim());
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
    setSubmitting(false);
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    setError('');
    setSuccessMsg('');
    setSubmitting(true);

    const result = await resendOtp(email, 'SIGNUP');
    if (result.success) {
      setResendCooldown(60);
      setSuccessMsg(result.message || 'New OTP sent to your email.');
    } else {
      setError(result.error);
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-theme-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center items-center gap-2 mb-2">
          <div className="w-12 h-12 bg-primary-green text-white flex items-center justify-center rounded-[12px] nav-shadow">
            <Package size={26} />
          </div>
          <span className="text-2xl font-bold text-dark-green">WhereIsIt</span>
        </div>
        <h2 className="text-3xl font-extrabold text-primary-text">
          {step === 1 ? 'Create Your Account' : 'Verify Email Address'}
        </h2>
        <p className="mt-2 text-sm text-secondary-text">
          {step === 1
            ? 'Remember what to pack. Remember where you kept it.'
            : `We've sent a 6-digit verification code to ${email}`}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-theme-surface py-8 px-4 border border-theme-border shadow-sm rounded-[18px] sm:px-10">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-[#EF4444] text-sm rounded-[12px] p-3 text-center">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-6 bg-soft-mint border border-primaryGreen/30 text-dark-green text-sm rounded-[12px] p-3 text-center font-medium">
              {successMsg}
            </div>
          )}

          {step === 1 ? (
            /* Step 1: Account Details Form */
            <form className="space-y-5" onSubmit={handleInitRegister}>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-primary-text">
                  Full Name
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary-text">
                    <User size={18} />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-theme-border rounded-[11px] bg-theme-bg text-primary-text placeholder-secondary-text focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-transparent text-sm transition-theme"
                    placeholder="Joe Smith"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-primary-text">
                  Email Address
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary-text">
                    <Mail size={18} />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-theme-border rounded-[11px] bg-theme-bg text-primary-text placeholder-secondary-text focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-transparent text-sm transition-theme"
                    placeholder="joe@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-primary-text">
                  Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary-text">
                    <Lock size={18} />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-theme-border rounded-[11px] bg-theme-bg text-primary-text placeholder-secondary-text focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-transparent text-sm transition-theme"
                    placeholder="Min 6 characters"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-primary-text">
                  Confirm Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary-text">
                    <Lock size={18} />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-theme-border rounded-[11px] bg-theme-bg text-primary-text placeholder-secondary-text focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-transparent text-sm transition-theme"
                    placeholder="Repeat password"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-[12px] shadow-sm text-sm font-semibold text-white bg-primary-green hover:bg-dark-green focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-green disabled:opacity-50 transition-theme group mt-2"
                >
                  {submitting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      Send Verification OTP
                      <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Step 2: OTP Verification Screen */
            <form className="space-y-6" onSubmit={handleVerifyOtp}>
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-primary-text text-center mb-2">
                  Enter 6-Digit OTP
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary-text">
                    <KeyRound size={18} />
                  </div>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    className="block w-full pl-10 pr-3 py-3 border border-theme-border rounded-[11px] bg-theme-bg text-center font-mono text-xl tracking-[0.4em] font-extrabold text-primary-text placeholder-secondary-text focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-transparent transition-theme"
                    placeholder="123456"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end text-xs text-secondary-text bg-soft-mint/60 p-3 rounded-[12px] border border-theme-border">
                {resendCooldown > 0 ? (
                  <span>Resend in <strong>{resendCooldown}s</strong></span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={submitting}
                    className="text-primary-green font-bold hover:underline flex items-center gap-1"
                  >
                    <RefreshCw size={12} /> Resend OTP
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={submitting || otp.length !== 6}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-[12px] shadow-sm text-sm font-semibold text-white bg-primary-green hover:bg-dark-green focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-green disabled:opacity-50 transition-theme"
                >
                  {submitting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck size={18} />
                      Verify & Complete Sign Up
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-center text-xs text-secondary-text hover:text-primary-text font-medium transition-theme py-1"
                >
                  ← Edit Account Details
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-secondary-text">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-primary-green hover:text-dark-green transition-theme">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
