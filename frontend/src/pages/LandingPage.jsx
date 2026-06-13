import React, { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  BookOpen,
  Users,
  Award,
  ChevronRight,
  PlayCircle,
  X,
  Check,
  Calendar,
  Star,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import HLS from 'hls.js';
import './LandingPage.css';
import ParticleButton from '../components/ParticleButton';

// FAQ Accordion Item Component
function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-white/10 py-8">
      <button
        className="w-full flex justify-between items-center text-left text-lg md:text-xl font-semibold hover:text-green-400 transition-colors focus:outline-none px-3 py-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="text-gray-400 ml-4 flex-shrink-0"
        >
          <ChevronDown size={20} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: "auto", opacity: 1, marginTop: 12 }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden text-gray-400 text-sm md:text-base leading-relaxed"
          >
            {answer}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LandingPage() {
  const { loginWithOAuth, loginWithCredentials, signupWithCredentials, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const videoRef = useRef(null);

  // Modal & Auth State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [loadingRole, setLoadingRole] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (user) {
      navigate(user.role === 'teacher' ? '/teacher' : '/student');
    }
  }, [user, navigate]);

  // Setup HLS video
  useEffect(() => {
    if (videoRef.current && HLS.isSupported()) {
      const hls = new HLS({ enableWorker: false });
      hls.loadSource('https://stream.mux.com/tLkHO1qZoaaQOUeVWo8hEBeGQfySP02EPS02BmnNFyXys.m3u8');
      hls.attachMedia(videoRef.current);
      hls.on(HLS.Events.MANIFEST_PARSED, function() {
        videoRef.current?.play().catch(err => console.log('Autoplay blocked:', err));
      });
      return () => {
        hls.destroy();
      };
    }
  }, []);

  const handleGoogleSuccess = async (tokenResponse, role) => {
    try {
      setAuthError('');
      const userInfo = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      });
      const success = await loginWithOAuth(userInfo.data, role);
      if (success) {
        setIsAuthModalOpen(false);
        navigate(role === 'teacher' ? '/teacher' : '/student');
      }
    } catch (err) {
      console.error('Google login failed', err);
      setAuthError('Google login failed. Please try again.');
    } finally {
      setLoadingRole(null);
    }
  };

  const loginTeacher = useGoogleLogin({
    onSuccess: (codeResponse) => handleGoogleSuccess(codeResponse, 'teacher'),
    onError: (error) => { console.error('Login Failed:', error); setLoadingRole(null); }
  });

  const loginStudent = useGoogleLogin({
    onSuccess: (codeResponse) => handleGoogleSuccess(codeResponse, 'student'),
    onError: (error) => { console.error('Login Failed:', error); setLoadingRole(null); }
  });

  const handleGoogleLoginClick = (role) => {
    setLoadingRole(role);
    setAuthError('');
    if (role === 'teacher') loginTeacher();
    else loginStudent();
  };

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setSubmitting(true);

    if (!email.trim() || !password.trim()) {
      setAuthError('Please fill in all fields.');
      setSubmitting(false);
      return;
    }

    if (activeTab === 'signup' && !name.trim()) {
      setAuthError('Please enter your name.');
      setSubmitting(false);
      return;
    }

    try {
      if (activeTab === 'login') {
        const res = await loginWithCredentials(email, password);
        if (res.success) {
          setIsAuthModalOpen(false);
          navigate(res.user.role === 'teacher' ? '/teacher' : '/student');
        } else {
          setAuthError(res.message);
        }
      } else {
        const res = await signupWithCredentials(name, email, password, role);
        if (res.success) {
          setIsAuthModalOpen(false);
          navigate(res.user.role === 'teacher' ? '/teacher' : '/student');
        } else {
          setAuthError(res.message);
        }
      }
    } catch (err) {
      setAuthError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const openAuth = (tab = 'login', initialRole = 'student') => {
    setActiveTab(tab);
    setRole(initialRole);
    setAuthError('');
    setIsAuthModalOpen(true);
  };

  return (
    <div className="bg-[#070b0a] text-white min-h-screen font-sans selection:bg-green-500 selection:text-white overflow-x-hidden">
      
      {/* Header/Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 backdrop-blur-md bg-black/40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center">
          <div className="text-2xl font-bold text-white">EduVerse</div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 mb-16 md:mb-24 overflow-hidden">
        
        {/* Background Video */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover opacity-60"
          muted
          loop
          playsInline
        />

        {/* Video Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#070b0a] to-transparent opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070b0a] via-transparent to-transparent" />

        {/* Grid Lines (Desktop Only) */}
        <div className="hidden lg:block absolute inset-0 pointer-events-none">
          <div className="absolute top-0 bottom-0 left-1/4 w-px bg-white/10" />
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/10" />
          <div className="absolute top-0 bottom-0 left-3/4 w-px bg-white/10" />
        </div>

        {/* Central Glow - SVG Ellipse */}
        <svg className="absolute top-1/4 left-1/2 transform -translate-x-1/2 w-96 h-48 pointer-events-none" viewBox="0 0 400 200">
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="25" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="gradientGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#0d9488" />
            </linearGradient>
          </defs>
          <ellipse cx="200" cy="100" rx="150" ry="80" fill="url(#gradientGlow)" filter="url(#glow)" opacity="0.3" />
        </svg>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col items-center text-center">
          <motion.div
            className="w-full flex flex-col items-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            
           { /* Liquid Glass Card*/
            /* <motion.div
              className="mb-8 w-52 h-52 rounded-3xl backdrop-blur-sm border border-white/10 flex flex-col items-center justify-center text-center p-6"
              style={{
                background: 'rgba(255, 255, 255, 0.01)',
                backgroundBlendMode: 'luminosity',
                backdropFilter: 'blur(4px)',
                boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.1)',
              }}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: -50, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="text-sm font-bold text-gray-300 mb-3">[ 2025 ]</div>
              <h3 className="text-lg font-serif italic text-green-400 mb-2">Taught by</h3>
              <h3 className="text-base font-bold text-white">Industry Professionals</h3>
              <p className="text-xs text-gray-400 mt-3">Premium Quality Education</p>
            </motion.div> */ }

            {/* Eyebrow */}
            <motion.span
              className="inline-block text-xs md:text-sm font-bold uppercase tracking-widest text-green-400 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Career-Ready Curriculum
            </motion.span>

            {/* Main Headline */}
            <motion.h1
              className="text-4xl md:text-5xl lg:text-7xl font-black uppercase tracking-tight leading-tight mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Learn.
              <span className="block">Teach.</span>
              <span className="block">
                Grow<span className="text-green-400">.</span>
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              className="text-gray-300 mb-12 text-lg md:text-xl max-w-xl leading-relaxed"
              style={{ opacity: 0.7 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              transition={{ delay: 0.5 }}
            >
              A comprehensive live stream learning environment. Connect with top educators, practice with interactive testing, and launch your career.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <ParticleButton
                onClick={() => openAuth('login', 'student')}
                className="min-w-[330px] min-h-[88px] hover:scale-105 active:scale-95"
              >
                Get Started
              </ParticleButton>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Student / Teacher Info Cards */}
      <section className="mt-20 md:mt-32 py-24 md:py-32 px-6 md:px-8 mb-24 md:mb-32 relative flex flex-col items-center bg-black/40">
        <div className="w-full max-w-4xl mx-auto text-center mb-20">
          <motion.div
            className="w-full flex flex-col items-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-gray-400 mb-6">
              <GraduationCap size={15} className="text-green-400" /> Who is EduVerse for?
            </span>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight">
              Built for <span className="text-green-400">Everyone</span>
            </h2>
            <p className="text-gray-400 mt-6 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Whether you're here to learn or to teach, EduVerse gives you everything you need to succeed.
            </p>
          </motion.div>
        </div>

        <div className="w-full max-w-7xl mx-auto grid md:grid-cols-2 gap-10 items-stretch">
          {/* Student Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="group bg-gradient-to-br from-green-900/10 via-green-950/20 to-black/40 border border-green-500/20 rounded-3xl py-20 px-14 md:py-28 md:px-20 hover:border-green-500/40 transition-all flex flex-col items-start text-left"
          >
            <div className="flex items-center gap-6 mb-10">
              <div className="w-28 h-28 rounded-3xl bg-green-500/10 border border-green-500/25 flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform flex-shrink-0">
                <GraduationCap size={52} />
              </div>
              <h3 className="text-5xl font-extrabold">For Students</h3>
            </div>

            <p className="text-gray-400 mt-8 text-xl leading-relaxed">
              Unleash your potential with conceptual live learning paths and real-time validation.
            </p>

            <div className="w-20 h-px bg-green-500/30 my-10" />

            <ul className="space-y-7 w-full">
              {[
                "Interactive Live Classrooms",
                "Comprehensive Practice Mock Tests",
                "One to one doubt session",
      
              ].map((item) => (
                <li key={item} className="flex items-center gap-5 text-gray-300 text-lg">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                    <Check size={15} className="text-green-400" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => openAuth('signup', 'student')}
              className="mt-14 inline-flex min-h-[84px] min-w-[300px] items-center justify-center gap-7 bg-green-600/10 hover:bg-green-600/20 border border-green-500/30 text-green-300 hover:text-white px-20 py-7 rounded-2xl font-extrabold text-xl tracking-wide transition-all hover:scale-[1.03] active:scale-[0.97] w-fit self-center"
            >
              <span className="px-2">Start Learning</span> <ChevronRight size={20} />
            </button>
          </motion.div>

          {/* Teacher Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="group bg-gradient-to-br from-cyan-900/10 via-cyan-950/20 to-black/40 border border-cyan-500/20 rounded-3xl py-20 px-14 md:py-28 md:px-20 hover:border-cyan-500/40 transition-all flex flex-col items-start text-left"
          >
            <div className="flex items-center gap-6 mb-10">
              <div className="w-28 h-28 rounded-3xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform flex-shrink-0">
                <Users size={52} />
              </div>
              <h3 className="text-5xl font-extrabold">For Teachers</h3>
            </div>

            <p className="text-gray-400 mt-8 text-xl leading-relaxed">
              Build your digital academy, expand your reach across the nation, and earn doing what you love.
            </p>

            <div className="w-20 h-px bg-cyan-500/30 my-10" />

            <ul className="space-y-7 w-full">
              {[
                "Structured Multi-chapter Course Creator",
  
              "Fair Revenue Sharing & Instant Payouts",
                "Granular attendance and performance analytics",
              ].map((item) => (
                <li key={item} className="flex items-center gap-5 text-gray-300 text-lg">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                    <Check size={15} className="text-cyan-400" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => openAuth('signup', 'teacher')}
              className="mt-14 inline-flex min-h-[84px] min-w-[300px] items-center justify-center gap-7 bg-cyan-600/10 hover:bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 hover:text-white px-20 py-7 rounded-2xl font-extrabold text-xl tracking-wide transition-all hover:scale-[1.03] active:scale-[0.97] w-fit self-center"
            >
              <span className="px-2">Start Teaching</span> <ChevronRight size={20} />
            </button>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32 relative w-full bg-gradient-to-b from-black/40 to-black">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-green-700/40 via-cyan-700/40 to-green-700/40 px-8 pt-16 pb-20 md:px-28 md:pt-24 md:pb-28 flex flex-col items-center text-center border border-green-500/20 backdrop-blur-sm">
            <div className="absolute top-[-50px] left-[-50px] w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-[-50px] right-[-50px] w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 w-full flex flex-col items-center gap-12 md:gap-16">
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-tight">
                Ready To Start Your Journey?
              </h2>
              
              <p className="text-lg md:text-xl text-white/90 max-w-2xl leading-relaxed">
                Join thousands of learners mastering complicated topics and experienced educators scaling their classrooms digitally.
              </p>

              <div className="flex flex-col sm:flex-row justify-center items-center gap-6 md:gap-10 w-full">
              <button
                onClick={() => openAuth('signup', 'student')}
                className="inline-flex min-h-[64px] min-w-[210px] items-center justify-center gap-5 bg-green-500 hover:bg-green-600 text-black px-12 py-5 rounded-full font-extrabold text-sm uppercase tracking-wide transition-all hover:scale-105 active:scale-95"
              >
                <span className="px-2">Student Sign Up</span> <ArrowRight size={18} />
              </button>

              <button
                onClick={() => openAuth('signup', 'teacher')}
                className="inline-flex min-h-[64px] min-w-[210px] items-center justify-center gap-5 bg-transparent hover:bg-white/10 border border-white/30 text-white px-12 py-5 rounded-full font-extrabold text-sm uppercase tracking-wide transition-all"
              >
                <span className="px-2">Teacher Sign Up</span> <ArrowRight size={18} />
              </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-20 text-center text-sm text-gray-500 bg-black">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <span className="font-bold text-lg text-white">EduVerse</span>
          <span>© 2026 EduVerse. All rights reserved.</span>
          <div className="flex gap-6 text-xs text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Contact Support</a>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {isAuthModalOpen && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 50,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '16px',
              background: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(12px)',
            }}
            onClick={() => setIsAuthModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              style={{
                position: 'relative', width: '100%', maxWidth: '480px',
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '28px',
                padding: '40px 36px',
                boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
                overflow: 'hidden',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                style={{
                  display: 'flex', gap: 12, marginBottom: 28, borderBottom: '1px solid rgba(255,255,255,0.1)',
                  paddingBottom: 20,
                }}
              >
                <button
                  onClick={() => { setActiveTab('login'); setAuthError(''); }}
                  style={{
                    flex: 1, padding: '12px 0', fontWeight: 700, fontSize: 16,
                    color: activeTab === 'login' ? 'white' : '#6b7280',
                    borderBottom: activeTab === 'login' ? '2px solid #10b981' : 'none',
                    background: 'none', border: 'none', cursor: 'pointer'
                  }}
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setActiveTab('signup'); setAuthError(''); }}
                  style={{
                    flex: 1, padding: '12px 0', fontWeight: 700, fontSize: 16,
                    color: activeTab === 'signup' ? 'white' : '#6b7280',
                    borderBottom: activeTab === 'signup' ? '2px solid #10b981' : 'none',
                    background: 'none', border: 'none', cursor: 'pointer'
                  }}
                >
                  Sign Up
                </button>
              </motion.div>

              <button
                onClick={() => setIsAuthModalOpen(false)}
                style={{
                  position: 'absolute', top: 16, right: 16, background: 'none', border: 'none',
                  color: '#9ca3af', cursor: 'pointer', padding: 8
                }}
              >
                <X size={24} />
              </button>

              {authError && (
                <div style={{
                  marginBottom: 16, padding: 12, background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#fca5a5', fontSize: 14
                }}>
                  {authError}
                </div>
              )}

              <form onSubmit={handleCustomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {activeTab === 'signup' && (
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 8 }}>Full Name</label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={submitting || loadingRole !== null}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px 16px', color: 'white', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 8 }}>Email</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting || loadingRole !== null}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px 16px', color: 'white', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 8 }}>Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting || loadingRole !== null}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px 16px', color: 'white', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                {activeTab === 'signup' && (
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 8 }}>Register As</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <button
                        type="button"
                        onClick={() => setRole('student')}
                        disabled={submitting || loadingRole !== null}
                        style={{
                          padding: '14px', borderRadius: 12, border: role === 'student' ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                          background: role === 'student' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)',
                          color: role === 'student' ? 'white' : '#9ca3af', fontWeight: 700, fontSize: 15, cursor: 'pointer'
                        }}
                      >
                        👩‍🎓 Student
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('teacher')}
                        disabled={submitting || loadingRole !== null}
                        style={{
                          padding: '14px', borderRadius: 12, border: role === 'teacher' ? '1px solid #06b6d4' : '1px solid rgba(255,255,255,0.1)',
                          background: role === 'teacher' ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.03)',
                          color: role === 'teacher' ? 'white' : '#9ca3af', fontWeight: 700, fontSize: 15, cursor: 'pointer'
                        }}
                      >
                        👨‍🏫 Teacher
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || loadingRole !== null}
                  style={{
                    width: '100%', marginTop: 8, padding: '16px', borderRadius: 14, border: 'none',
                    background: 'linear-gradient(90deg, #10b981, #06b6d4)', color: 'white', fontWeight: 800,
                    fontSize: 16, cursor: 'pointer', boxShadow: '0 8px 24px rgba(16,185,129,0.3)',
                    opacity: submitting ? 0.6 : 1
                  }}
                >
                  {submitting ? 'Please wait...' : activeTab === 'login' ? 'Sign In' : 'Create Account'}
                </button>

                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => handleGoogleLoginClick('student')}
                    disabled={submitting || loadingRole !== null}
                    style={{
                      flex: 1, padding: '14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.03)', color: 'white', fontWeight: 600, fontSize: 14,
                      cursor: 'pointer', opacity: loadingRole === 'student' ? 0.6 : 1
                    }}
                  >
                    {loadingRole === 'student' ? '...' : '👨‍🎓 Google'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGoogleLoginClick('teacher')}
                    disabled={submitting || loadingRole !== null}
                    style={{
                      flex: 1, padding: '14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.03)', color: 'white', fontWeight: 600, fontSize: 14,
                      cursor: 'pointer', opacity: loadingRole === 'teacher' ? 0.6 : 1
                    }}
                  >
                    {loadingRole === 'teacher' ? '...' : '👨‍🏫 Google'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
