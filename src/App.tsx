/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback, useRef, createContext, useContext } from 'react';
import { 
  BrowserRouter, 
  Routes, 
  Route, 
  useParams, 
  useNavigate, 
  Link 
} from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { 
  GoogleAuthProvider, 
  OAuthProvider,
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  Timestamp,
  getDocs,
  deleteDoc,
  getDocFromServer,
  updateDoc,
  where,
  addDoc,
  limit
} from 'firebase/firestore';
import { auth, db } from './firebase';
import {
  UserProfile,
  Language,
  Role,
  MatchSuggestion,
  UrgentPost,
  Recommendation,
  NeedComment,
  OptimizationSuggestion,
  EMPLOYEE_COUNT_RANGES,
  type EmployeeCountRange,
  getProfileAiRecommendationReadiness,
  normalizedTargetKeywords,
} from './types';
import {
  TRANSLATIONS,
  ACTIVITY_CATEGORIES,
  CITIES,
  WORK_FUNCTION_OPTIONS,
  isEmployeeCountRange,
  companySizeFromEmployeeRange,
  formatEmployeeCountDisplay,
  employeeCountToSelectDefault,
  activityCategoryLabel,
  workFunctionLabel,
} from './constants';
import {
  NEED_OPTIONS,
  NEED_OPTION_VALUE_SET,
  formatHighlightedNeedsForText,
  needOptionLabel,
  sanitizeHighlightedNeeds,
} from './needOptions';
import {
  getPassionLabel,
  getPassionEmoji,
  sanitizePassionIds,
} from './lib/passionConfig';
import PassionPicker from './components/PassionPicker';
import HeroSection from './components/home/HeroSection';
import WelcomeContextCard from './components/home/WelcomeContextCard';
import NewMembersStrip from './components/home/NewMembersStrip';
import OpportunitiesSection from './components/home/OpportunitiesSection';
import { homeLanding } from './copy/homeLanding';
import AffinityScore from './components/AffinityScore';
import { profileMatchesSearchQuery } from './profileSearch';
import { 
  Search, 
  Globe, 
  Mail, 
  Phone, 
  Building2, 
  Users, 
  Calendar, 
  MapPin, 
  Briefcase, 
  LogOut, 
  User as UserIcon, 
  Linkedin,
  Download,
  Plus,
  Edit2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Languages,
  ExternalLink,
  Heart,
  Zap,
  Share2,
  Trophy,
  Activity,
  Target,
  MessageSquare,
  Star,
  Send,
  Copy,
  RefreshCw,
  ArrowLeft,
  UserCog
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { GoogleGenAI } from "@google/genai";
import { cn } from './cn';

type SocialAuthProvider = 'google' | 'microsoft' | 'apple';

function buildAuthProvider(which: SocialAuthProvider) {
  if (which === 'google') {
    const p = new GoogleAuthProvider();
    p.setCustomParameters({ prompt: 'select_account' });
    return p;
  }
  if (which === 'microsoft') {
    const p = new OAuthProvider('microsoft.com');
    p.addScope('email');
    p.addScope('profile');
    p.setCustomParameters({ prompt: 'select_account' });
    return p;
  }
  const p = new OAuthProvider('apple.com');
  p.addScope('email');
  p.addScope('name');
  return p;
}

function BrandGoogle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function BrandMicrosoft({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 23 23" aria-hidden>
      <path fill="#f25022" d="M1 1h10v10H1z" />
      <path fill="#7fba00" d="M1 12h10v10H1z" />
      <path fill="#00a4ef" d="M12 1h10v10H12z" />
      <path fill="#ffb900" d="M12 12h10v10H12z" />
    </svg>
  );
}

function BrandApple({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

interface SocialSignInButtonsProps {
  lang: Language;
  t: (key: string) => string;
  busy: SocialAuthProvider | null;
  onSignIn: (p: SocialAuthProvider) => void;
}

function SocialSignInButtons({ lang, t, busy, onSignIn }: SocialSignInButtonsProps) {
  const connecting = lang === 'fr' ? 'Connexion...' : 'Conectando...';
  const baseBtn =
    'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none disabled:cursor-not-allowed';

  const stackBtn = `w-full ${baseBtn} py-3 rounded-xl text-sm`;

  return (
    <div className="flex w-full flex-col gap-2">
      <button
        type="button"
        onClick={() => onSignIn('google')}
        disabled={busy !== null}
        className={`${stackBtn} bg-white text-stone-900 shadow-lg hover:bg-stone-100`}
      >
        <BrandGoogle className="h-5 w-5 shrink-0" />
        {busy === 'google' ? connecting : t('continueGoogle')}
      </button>
      <button
        type="button"
        onClick={() => onSignIn('microsoft')}
        disabled={busy !== null}
        className={`${stackBtn} bg-[#2F2F2F] text-white hover:bg-[#1f1f1f]`}
      >
        <BrandMicrosoft className="h-5 w-5 shrink-0" />
        {busy === 'microsoft' ? connecting : t('continueMicrosoft')}
      </button>
      <button
        type="button"
        onClick={() => onSignIn('apple')}
        disabled={busy !== null}
        className={`${stackBtn} bg-black text-white hover:bg-stone-900`}
      >
        <BrandApple className="h-5 w-5 shrink-0" />
        {busy === 'apple' ? connecting : t('continueApple')}
      </button>
    </div>
  );
}

const ADMIN_EMAIL = "chinois2001@gmail.com";
const getGeminiApiKey = () =>
  import.meta.env.VITE_GEMINI_API_KEY ||
  (import.meta.env as any).GEMINI_API_KEY ||
  ((globalThis as any)?.process?.env?.GEMINI_API_KEY as string | undefined);

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/** Langue UI partagée : un seul état pour l’annuaire, les pages profil/besoin et les cartes. */
type LanguageContextValue = {
  lang: Language;
  setLang: React.Dispatch<React.SetStateAction<Language>>;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
}

function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>('fr');
  const t = useCallback((key: string) => TRANSLATIONS[key]?.[lang] || key, [lang]);
  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

type ProfileCardVariant = 'default' | 'company' | 'activity';

const ProfileCard = ({ p, isOwn = false, onEdit, onDelete, onSelect, user, profile, variant = 'default' }: { 
  p: UserProfile, 
  isOwn?: boolean, 
  onEdit?: (p: UserProfile) => void, 
  onDelete?: (uid: string) => void,
  onSelect: (p: UserProfile) => void,
  user: any,
  profile: UserProfile | null,
  variant?: ProfileCardVariant
}) => {
  const isActive = Date.now() - (p.lastSeen ?? 0) < 2592000000; // 30 days
  const { lang, t } = useLanguage();
  const [recCount, setRecCount] = useState(0);

  useEffect(() => {
    const q = query(collection(db, 'recommendations'), where('profileId', '==', p.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRecCount(snapshot.size);
    });
    return unsubscribe;
  }, [p.uid]);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      key={p.uid}
      onClick={() => onSelect(p)}
      className="flex h-full min-h-0 flex-col bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all group cursor-pointer relative"
    >
      <div className="mb-2 flex shrink-0 justify-between items-start gap-2">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="relative shrink-0">
            <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center text-stone-400 overflow-hidden shrink-0 border border-stone-200">
              {p.photoURL ? (
                <img src={p.photoURL} alt={p.fullName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <UserIcon size={24} />
              )}
            </div>
            {isActive && (
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" title="Actif ce mois" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            {variant === 'company' && (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <Building2 size={18} className="text-stone-500 shrink-0" />
                  <h3 className="text-lg sm:text-xl font-bold text-stone-900 group-hover:text-stone-800 transition-colors leading-tight truncate">
                    {p.companyName}
                  </h3>
                </div>
                <p className="text-sm text-stone-600 font-medium flex items-center gap-1.5 flex-wrap">
                  <UserIcon size={14} className="text-stone-400 shrink-0" />
                  <span className="truncate">{p.fullName}</span>
                </p>
                {p.positionCategory ? (
                  <div className="mt-1 flex items-start gap-1.5 text-xs text-stone-500">
                    <UserCog size={12} className="mt-0.5 shrink-0 text-stone-400" />
                    <span className="line-clamp-2 break-words leading-snug">
                      {workFunctionLabel(p.positionCategory, lang)}
                    </span>
                  </div>
                ) : null}
                <div className="mt-1 flex items-start gap-1.5 text-xs text-stone-500">
                  <MapPin size={12} className="shrink-0 mt-0.5 text-stone-400" />
                  <span className="min-w-0 flex-1 leading-snug line-clamp-2 break-words">
                    {[p.city, p.neighborhood, p.state || 'Jalisco'].filter(Boolean).join(', ')}
                  </span>
                </div>
                <div className="mt-0.5 flex items-start gap-1.5 text-xs text-stone-500">
                  <Briefcase size={12} className="shrink-0 mt-0.5 text-stone-400" />
                  <span className="min-w-0 flex-1 leading-snug line-clamp-2 break-words">
                    {p.activityCategory ? activityCategoryLabel(p.activityCategory, lang) : '—'}
                  </span>
                </div>
                {p.bio?.trim() ? (
                  <p className="mt-1.5 text-sm text-stone-500 italic line-clamp-2 min-w-0 break-words leading-snug">
                    {p.bio.trim()}
                  </p>
                ) : null}
              </>
            )}
            {variant === 'activity' && (
              <>
                <div className="flex items-start gap-2 mb-1">
                  <Briefcase size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                  <h3 className="text-base sm:text-lg font-bold text-stone-900 leading-snug line-clamp-2 break-words">
                    {p.activityCategory
                      ? activityCategoryLabel(p.activityCategory, lang)
                      : lang === 'fr'
                        ? 'Secteur non renseigné'
                        : 'Sector no indicado'}
                  </h3>
                </div>
                <p className="text-sm font-semibold text-stone-800 truncate">{p.companyName}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-stone-500">
                  <span className="truncate">{p.fullName}</span>
                </p>
                {p.positionCategory ? (
                  <div className="mt-1 flex items-start gap-1.5 text-[11px] text-stone-500">
                    <UserCog size={11} className="mt-0.5 shrink-0 text-stone-400" />
                    <span className="line-clamp-2 leading-snug break-words">
                      {workFunctionLabel(p.positionCategory, lang)}
                    </span>
                  </div>
                ) : null}
                <div className="mt-1 flex items-start gap-1.5 text-[11px] text-stone-500">
                  <MapPin size={11} className="shrink-0 mt-0.5 text-stone-400" />
                  <span className="min-w-0 flex-1 leading-snug line-clamp-2 break-words">
                    {[p.city, p.neighborhood, p.state || 'Jalisco'].filter(Boolean).join(', ')}
                  </span>
                </div>
                {p.bio?.trim() ? (
                  <p className="mt-1.5 text-sm text-stone-500 italic line-clamp-2 min-w-0 break-words leading-snug">
                    {p.bio.trim()}
                  </p>
                ) : null}
              </>
            )}
            {variant === 'default' && (
              <>
                <h3 className="font-bold text-stone-900 group-hover:text-stone-700 transition-colors leading-tight line-clamp-2 break-words">
                  {p.fullName}
                </h3>
                <p className="text-xs text-stone-500 font-medium truncate mt-0.5">{p.companyName}</p>
                {p.positionCategory ? (
                  <div className="mt-1 flex items-start gap-1.5 text-xs text-stone-600">
                    <UserCog size={12} className="mt-0.5 shrink-0 text-stone-400" />
                    <span className="line-clamp-2 break-words leading-snug">
                      {workFunctionLabel(p.positionCategory, lang)}
                    </span>
                  </div>
                ) : null}
                <div className="mt-1 flex items-start gap-1.5 text-xs text-stone-500">
                  <MapPin size={12} className="shrink-0 mt-0.5 text-stone-400" />
                  <span className="min-w-0 flex-1 leading-snug line-clamp-2 break-words">
                    {[p.city, p.neighborhood, p.state || 'Jalisco'].filter(Boolean).join(', ')}
                  </span>
                </div>
                <div className="mt-0.5 flex items-start gap-1.5 text-xs text-stone-500">
                  <Briefcase size={12} className="shrink-0 mt-0.5 text-stone-400" />
                  <span className="min-w-0 flex-1 leading-snug line-clamp-2 break-words">
                    {p.activityCategory ? activityCategoryLabel(p.activityCategory, lang) : '—'}
                  </span>
                </div>
                {p.bio?.trim() ? (
                  <p className="mt-1.5 text-sm text-stone-500 italic line-clamp-2 min-w-0 break-words leading-snug">
                    {p.bio.trim()}
                  </p>
                ) : null}
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex flex-col items-center gap-2 pb-0.5">
            {recCount > 0 && (
              <div
                className="relative mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm ring-1 ring-blue-600/20"
                title={lang === 'fr' ? `${recCount} recommandation(s)` : `${recCount} recomendacion(es)`}
                onClick={(e) => e.stopPropagation()}
              >
                <Star size={16} className="fill-white text-white" strokeWidth={1.5} />
                <span className="absolute -bottom-1.5 left-1/2 min-w-[15px] -translate-x-1/2 rounded-full bg-white px-0.5 py-px text-center text-[8px] font-black leading-tight text-blue-600 shadow-sm ring-1 ring-blue-100">
                  {recCount > 99 ? '99+' : recCount}
                </span>
              </div>
            )}
            {(p.linkedin || p.whatsapp) && (
              <div className="flex flex-col items-center gap-1">
                {p.linkedin && (
                  <a 
                    href={p.linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    onClick={(e) => e.stopPropagation()}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-stone-300 transition-colors hover:bg-stone-50 hover:text-[#0A66C2]"
                    title="LinkedIn"
                  >
                    <Linkedin size={18} strokeWidth={1.75} className="shrink-0" />
                  </a>
                )}
                {p.whatsapp && (
                  (p.isWhatsappPublic || (user && profile?.isValidated)) ? (
                    <a 
                      href={`https://wa.me/${p.whatsapp.replace(/\D/g, '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      onClick={(e) => e.stopPropagation()}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-stone-300 transition-colors hover:bg-stone-50 hover:text-[#25D366]"
                      title="WhatsApp"
                    >
                      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" fill="currentColor" aria-hidden>
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    </a>
                  ) : (
                    <span
                      className="flex h-9 w-9 shrink-0 cursor-default items-center justify-center rounded-md text-stone-200"
                      title={t('restrictedInfo')}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" fill="currentColor" aria-hidden>
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    </span>
                  )
                )}
              </div>
            )}
          </div>
          {profile?.role === 'admin' && (
            <div className="flex items-center gap-1">
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit?.(p); }}
                className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-stone-600 transition-all"
                title={t('edit')}
              >
                <Edit2 size={14} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete?.(p.uid); }}
                className="p-1.5 hover:bg-red-50 rounded-lg text-stone-400 hover:text-red-600 transition-all"
                title={t('delete')}
              >
                <Plus size={14} className="rotate-45" />
              </button>
            </div>
          )}
        </div>
      </div>

      {sanitizePassionIds(p.passionIds).length > 0 && (
        <div className="mb-1 flex flex-wrap gap-1">
          {sanitizePassionIds(p.passionIds).map((id) => (
            <span
              key={id}
              className="inline-flex max-w-full items-center gap-0.5 rounded-md bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold text-rose-800 ring-1 ring-rose-100"
            >
              <span aria-hidden>{getPassionEmoji(id)}</span>
              <span className="line-clamp-1">{getPassionLabel(id, lang)}</span>
            </span>
          ))}
        </div>
      )}

      <div className="min-h-0 flex flex-1 flex-col gap-1 pt-1">
        <div className="flex flex-col justify-start gap-1.5">
          {(p.highlightedNeeds && p.highlightedNeeds.length > 0) && (
            <div className="flex flex-wrap gap-1">
              {p.highlightedNeeds.slice(0, 3).map((id) => (
                <span
                  key={id}
                  className="max-w-full rounded-md bg-violet-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-violet-800"
                >
                  <span className="line-clamp-2">{needOptionLabel(id, lang)}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto flex w-full shrink-0 flex-col gap-1.5 border-t border-stone-100 pt-2.5">
        <div className="w-full min-h-[2.25rem] flex items-stretch">
          {(p.isEmailPublic || (user && profile?.isValidated)) ? (
            <a 
              href={`mailto:${p.email}`} 
              onClick={(e) => e.stopPropagation()}
              className="flex w-full min-w-0 items-center gap-2 rounded-lg bg-stone-50 px-3 py-2 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-100"
            >
              <Mail size={14} className="shrink-0 text-stone-500" />
              <span className="truncate">{p.email}</span>
            </a>
          ) : (
            <div className="flex w-full min-w-0 items-center gap-2 rounded-lg bg-stone-50 px-3 py-2 text-xs italic text-stone-400 blur-[2px] select-none">
              <Mail size={14} className="shrink-0" />
              <span>email@example.com</span>
            </div>
          )}
        </div>
        <div className="w-full min-h-[2.25rem] flex items-stretch">
          {p.whatsapp ? (
            (p.isWhatsappPublic || (user && profile?.isValidated)) ? (
              <a 
                href={`https://wa.me/${p.whatsapp.replace(/\D/g, '')}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                onClick={(e) => e.stopPropagation()}
                className="flex w-full min-w-0 items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 transition-colors hover:bg-emerald-100"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-emerald-600" fill="currentColor" aria-hidden>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <span className="truncate">{p.whatsapp}</span>
              </a>
            ) : (
              <div className="flex w-full min-w-0 items-center gap-2 rounded-lg bg-stone-50 px-3 py-2 text-xs italic text-stone-400 blur-[2px] select-none">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="currentColor" aria-hidden>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <span>+52 33 0000 0000</span>
              </div>
            )
          ) : (
            <div className="w-full rounded-lg border border-transparent bg-transparent px-3 py-2 min-h-[2.25rem]" aria-hidden />
          )}
        </div>
      </div>
    </motion.div>
  );
};

const MatchCard = ({ m, p, onShare, expanded, onToggleHook }: { 
  m: MatchSuggestion, 
  p: UserProfile, 
  onShare: (id: string) => void,
  expanded: boolean,
  onToggleHook: () => void
}) => {
  return (
    <div className="bg-white rounded-2xl border border-indigo-100 p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-12 -mt-12 blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex items-start justify-between mb-4 relative">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 overflow-hidden border border-indigo-100">
            {p.photoURL ? (
              <img src={p.photoURL} alt={p.fullName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <UserIcon size={24} />
            )}
          </div>
          <div>
            <h4 className="font-bold text-stone-900 leading-tight">{p.fullName}</h4>
            <p className="text-xs text-stone-500 font-medium">{p.companyName}</p>
          </div>
        </div>
        <div className="px-2 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm">
          {m.type}
        </div>
      </div>

      <p className="text-xs text-stone-600 italic mb-4 leading-relaxed line-clamp-2">
        {m.reason}
      </p>

      <div className="space-y-3">
        <button 
          onClick={onToggleHook}
          className="w-full py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all flex items-center justify-center gap-2"
        >
          <MessageSquare size={14} />
          Comment l'aborder ?
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 text-xs text-stone-600 leading-relaxed">
                {m.hook}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => onShare(p.uid)}
          className="w-full py-2 border border-stone-200 text-stone-600 rounded-xl text-xs font-bold hover:bg-stone-50 transition-all flex items-center justify-center gap-2"
        >
          <Share2 size={14} />
          Voir le profil
        </button>
      </div>
    </div>
  );
};

const ShareNeedsModal = ({ isOpen, onClose, profile }: { isOpen: boolean, onClose: () => void, profile: UserProfile }) => {
  const { lang } = useLanguage();
  const [message, setMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const typed = formatHighlightedNeedsForText(profile.highlightedNeeds, lang);
    if (!typed) return;
    const intro = lang === 'fr' ? 'Bonjour, ' : 'Hola, ';
    const bits: string[] = [
      lang === 'fr' ? `je mets en avant ces besoins : ${typed}.` : `destaco estas necesidades: ${typed}.`,
    ];
    const outro =
      lang === 'fr'
        ? 'Si vous avez des pistes ou connaissez quelqu’un, contactez-moi ! '
        : 'Si tiene pistas o conoce a alguien, ¡escríbame! ';
    setMessage(intro + bits.join(' ') + ' ' + outro + `${window.location.origin}/profil/${profile.uid}`);
  }, [profile.highlightedNeeds, profile.uid, lang]);

  const handleRegenerate = async () => {
    setIsGenerating(true);
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const apiKey = getGeminiApiKey();
      if (!apiKey) throw new Error('missing-gemini-api-key');
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Reformule de manière professionnelle et engageante pour un partage LinkedIn/WhatsApp. Besoins structurés (tags): "${formatHighlightedNeedsForText(profile.highlightedNeeds, 'fr') || '—'}". Message court (max 200 caractères), sans guillemets autour du résultat.`,
      });
      const text = response.text || '';
      setMessage(`${text}\n\nMon profil : ${window.location.origin}/profil/${profile.uid}`);
    } catch (error) {
      console.error('Gemini error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    alert('Copié !');
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-stone-200"
      >
        <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
          <h3 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <Share2 className="text-indigo-600" size={24} />
            Partager mes besoins
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-full transition-colors">
            <Plus className="rotate-45 text-stone-500" size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-2">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Aperçu du besoin</p>
            {sanitizeHighlightedNeeds(profile.highlightedNeeds).length > 0 && (
              <div className="flex flex-wrap gap-1">
                {sanitizeHighlightedNeeds(profile.highlightedNeeds).map((id) => (
                  <span key={id} className="rounded-lg bg-white/80 px-2 py-0.5 text-[10px] font-bold text-violet-800">
                    {needOptionLabel(id, lang)}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-stone-700 flex justify-between items-center">
              Message personnalisé
              <button 
                onClick={handleRegenerate}
                disabled={
                  isGenerating ||
                  !formatHighlightedNeedsForText(profile.highlightedNeeds, lang)
                }
                className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-bold disabled:opacity-50"
              >
                <RefreshCw size={12} className={isGenerating ? "animate-spin" : ""} />
                Régénérer avec l'IA
              </button>
            </label>
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full h-32 p-4 bg-stone-50 border border-stone-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
              placeholder="Votre message ici..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 py-3 bg-stone-100 text-stone-700 rounded-2xl font-bold hover:bg-stone-200 transition-all"
            >
              <Copy size={18} />
              Copier
            </button>
            <button 
              onClick={handleWhatsApp}
              className="flex items-center justify-center gap-2 py-3 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200"
            >
              <Phone size={18} />
              WhatsApp
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const ProfilePage = () => {
  const { lang, t } = useLanguage();
  const { profileId } = useParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [showRecModal, setShowRecModal] = useState(false);
  const [recText, setRecText] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const docSnap = await getDoc(doc(db, 'users', user.uid));
        if (docSnap.exists()) setCurrentProfile(docSnap.data() as UserProfile);
      } else {
        setCurrentProfile(null);
      }
    });
    return unsubAuth;
  }, []);

  useEffect(() => {
    if (!profileId) return;
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const docSnap = await getDoc(doc(db, 'users', profileId));
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();

    const q = query(collection(db, 'recommendations'), where('profileId', '==', profileId), orderBy('createdAt', 'desc'));
    const unsubRecs = onSnapshot(q, (snapshot) => {
      setRecs(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Recommendation)));
    });
    return unsubRecs;
  }, [profileId]);

  const handleShare = () => {
    if (profile && navigator.share) {
      navigator.share({
        title: `Profil de ${profile.fullName}`,
        text: profile.bio || '',
        url: window.location.href
      });
    }
  };

  const handleAddRec = async () => {
    if (!currentUser || !currentProfile || !profileId || !recText.trim()) return;
    try {
      await addDoc(collection(db, 'recommendations'), {
        authorId: currentUser.uid,
        authorName: currentProfile.fullName,
        authorPhoto: currentProfile.photoURL || '',
        profileId,
        text: recText.substring(0, 200),
        createdAt: Date.now()
      });
      setRecText('');
      setShowRecModal(false);
    } catch (error) {
      console.error('Error adding recommendation:', error);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-stone-50"><RefreshCw className="animate-spin text-indigo-600" /></div>;
  if (!profile) return <div className="min-h-screen flex items-center justify-center bg-stone-50">{t('profileNotFound')}</div>;

  const hasAlreadyRecommended = recs.some(r => r.authorId === currentUser?.uid);
  const tp = (key: keyof typeof TRANSLATIONS) => TRANSLATIONS[key][lang];
  const websiteDisplay = profile.website?.trim()
    ? profile.website.replace(/^https?:\/\//i, '')
    : '';

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      <Helmet>
        <title>{profile.fullName} | Community Hub</title>
        <meta property="og:title" content={`Profil de ${profile.fullName}`} />
        <meta
          property="og:description"
          content={(
            profile.bio ||
            formatHighlightedNeedsForText(profile.highlightedNeeds, lang) ||
            ''
          ).substring(0, 150)}
        />
        {profile.photoURL && <meta property="og:image" content={profile.photoURL} />}
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 pt-8">
        <button onClick={() => navigate('/')} className="mb-6 flex items-center gap-2 text-stone-500 hover:text-stone-900 font-bold transition-colors">
          <ArrowLeft size={20} />
          Retour à l'accueil
        </button>

        <div className="bg-white rounded-[2.5rem] shadow-xl border border-stone-200 overflow-hidden">
          <div className="h-48 bg-gradient-to-r from-indigo-600 to-violet-600 relative">
            <div className="absolute -bottom-16 left-8 p-2 bg-white rounded-3xl shadow-lg">
              <div className="w-32 h-32 bg-stone-100 rounded-2xl overflow-hidden border-4 border-white">
                {profile.photoURL ? (
                  <img src={profile.photoURL} alt={profile.fullName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <UserIcon size={48} className="m-auto mt-8 text-stone-300" />
                )}
              </div>
            </div>
            <button 
              onClick={handleShare}
              className="absolute top-6 right-6 p-3 bg-white/20 backdrop-blur-md text-white rounded-2xl hover:bg-white/30 transition-all border border-white/30 shadow-lg"
            >
              <Share2 size={20} />
            </button>
          </div>

          <div className="pt-20 pb-10 px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-black text-stone-900 tracking-tight">{profile.fullName}</h1>
                </div>
                <p className="text-xl text-stone-500 font-medium flex items-center gap-2">
                  <Building2 size={20} className="text-stone-400" />
                  {profile.companyName}
                </p>
                {profile.positionCategory && (
                  <p className="text-base text-stone-600 mt-2 flex items-center gap-2">
                    <UserCog size={18} className="text-stone-400 shrink-0" />
                    {workFunctionLabel(profile.positionCategory, lang)}
                  </p>
                )}
              </div>

              {currentUser && (
                <div className="flex gap-3">
                  <a 
                    href={`mailto:${profile.email}`}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                  >
                    <Mail size={18} />
                    Message
                  </a>
                  {profile.whatsapp && (
                    <a 
                      href={`https://wa.me/${profile.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200"
                    >
                      <Phone size={18} />
                      WhatsApp
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-8">
                <section>
                  <h2 className="text-xs font-black text-stone-400 uppercase tracking-[0.2em] mb-4">{tp('companyDescription')}</h2>
                  <p className="text-stone-700 leading-relaxed text-lg whitespace-pre-wrap">{profile.bio?.trim() || tp('noCompanyDescription')}</p>
                </section>

                {sanitizePassionIds(profile.passionIds).length > 0 && (
                  <section className="bg-rose-50/70 p-6 rounded-3xl border border-rose-100">
                    <h2 className="text-xs font-black text-rose-600 uppercase tracking-[0.2em] mb-3">{tp('passions')}</h2>
                    <div className="flex flex-wrap gap-2">
                      {sanitizePassionIds(profile.passionIds).map((id) => (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-sm font-bold text-rose-900 shadow-sm"
                        >
                          <span aria-hidden>{getPassionEmoji(id)}</span>
                          {getPassionLabel(id, lang)}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                <section className="bg-indigo-50/60 p-6 rounded-3xl border border-indigo-100">
                  <h2 className="text-xs font-black text-indigo-500 uppercase tracking-[0.2em] mb-3">{tp('needsSought')}</h2>
                  {sanitizeHighlightedNeeds(profile.highlightedNeeds).length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {sanitizeHighlightedNeeds(profile.highlightedNeeds).map((id) => (
                        <span
                          key={id}
                          className="rounded-xl border border-violet-200 bg-white px-3 py-1.5 text-sm font-bold text-violet-900 shadow-sm"
                        >
                          {needOptionLabel(id, lang)}
                        </span>
                      ))}
                    </div>
                  )}
                  {sanitizeHighlightedNeeds(profile.highlightedNeeds).length === 0 && (
                    <p className="text-stone-800 leading-relaxed text-lg font-medium">{tp('noNeedsSpecified')}</p>
                  )}
                  {sanitizeHighlightedNeeds(profile.highlightedNeeds).length > 0 && (
                    <button
                      type="button"
                      onClick={() => navigate(`/besoin/${profile.uid}`)}
                      className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200"
                    >
                      {lang === 'fr' ? 'Voir le besoin' : 'Ver la necesidad'}
                      <ChevronRight size={16} />
                    </button>
                  )}
                </section>

                {profile.pitchVideoUrl && (
                  <section>
                    <h2 className="text-xs font-black text-stone-400 uppercase tracking-[0.2em] mb-4">Pitch Vidéo</h2>
                    <div className="aspect-video bg-stone-900 rounded-3xl overflow-hidden shadow-2xl border-4 border-white ring-1 ring-stone-200">
                      <video 
                        src={profile.pitchVideoUrl} 
                        controls 
                        className="w-full h-full object-contain"
                        onPlay={(e) => {
                          const v = e.target as HTMLVideoElement;
                          if (v.duration > 60) {
                            setTimeout(() => {
                              v.pause();
                              alert("Le pitch est limité à 60 secondes.");
                            }, 60000);
                          }
                        }}
                      />
                    </div>
                  </section>
                )}

                <section className="bg-stone-50 p-8 rounded-[2rem] border border-stone-200">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                      <Star className="text-amber-500" fill="currentColor" size={24} />
                      {recs.length} Recommandations
                    </h2>
                    {currentUser && !hasAlreadyRecommended && currentUser.uid !== profileId && (
                      <button 
                        onClick={() => setShowRecModal(true)}
                        className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                      >
                        <Plus size={16} />
                        Je recommande
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    {recs.map(r => (
                      <div key={r.id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-stone-100 rounded-xl overflow-hidden border border-stone-200">
                            {r.authorPhoto ? (
                              <img src={r.authorPhoto} alt={r.authorName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <UserIcon size={20} className="m-auto mt-2 text-stone-300" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-stone-900">{r.authorName}</p>
                            <p className="text-[10px] text-stone-400 font-medium">
                              {new Date(r.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <p className="text-stone-600 text-sm leading-relaxed italic">{r.text}</p>
                      </div>
                    ))}
                    {recs.length === 0 && (
                      <p className="text-center text-stone-400 py-8 italic">Aucune recommandation pour le moment.</p>
                    )}
                  </div>
                </section>
              </div>

              <div className="space-y-6">
                {currentProfile && currentUser && currentProfile.uid !== profile.uid && (
                  <AffinityScore
                    viewer={currentProfile}
                    target={profile}
                    lang={lang}
                    t={(k) => tp(k as keyof typeof TRANSLATIONS)}
                    canRevealPrivateWhatsApp={!!currentUser}
                  />
                )}
                <div className="bg-stone-50 p-6 rounded-3xl border border-stone-200">
                  <h2 className="text-xs font-black text-stone-400 uppercase tracking-[0.2em] mb-4">Détails</h2>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600">
                        <Activity size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Catégorie</p>
                        <p className="text-sm font-bold text-stone-900">
                          {activityCategoryLabel(profile.activityCategory, lang)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600">
                        <Users size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Taille</p>
                        <p className="text-sm font-bold text-stone-900">{profile.companySize} employés</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600">
                        <MapPin size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Ville</p>
                        <p className="text-sm font-bold text-stone-900">{profile.city}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-stone-50 p-6 rounded-3xl border border-stone-200">
                  <h2 className="text-xs font-black text-stone-400 uppercase tracking-[0.2em] mb-4">{tp('contactLinks')}</h2>
                  <div className="space-y-3">
                    {(profile.isEmailPublic || currentUser) ? (
                      <a href={`mailto:${profile.email}`} className="flex items-start gap-3 p-3 rounded-2xl hover:bg-white transition-colors border border-transparent hover:border-stone-100">
                        <div className="w-10 h-10 rounded-xl bg-stone-900 flex items-center justify-center text-white shrink-0">
                          <Mail size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">{tp('email')}</p>
                          <p className="text-sm font-medium text-stone-900 break-all">{profile.email}</p>
                        </div>
                      </a>
                    ) : (
                      <div className="flex items-start gap-3 p-3 rounded-2xl bg-stone-100/50">
                        <div className="w-10 h-10 rounded-xl bg-stone-200 flex items-center justify-center text-stone-500 shrink-0">
                          <Mail size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">{tp('email')}</p>
                          <p className="text-sm text-stone-500">{tp('restrictedInfo')}</p>
                        </div>
                      </div>
                    )}

                    {profile.whatsapp ? (
                      (profile.isWhatsappPublic || currentUser) ? (
                        <a href={`https://wa.me/${profile.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 p-3 rounded-2xl hover:bg-emerald-50/80 transition-colors border border-transparent hover:border-emerald-100">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shrink-0">
                            <Phone size={18} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] uppercase tracking-widest text-emerald-600/70 font-bold">{tp('whatsapp')}</p>
                            <p className="text-sm font-medium text-stone-900">{profile.whatsapp}</p>
                          </div>
                        </a>
                      ) : (
                        <div className="flex items-start gap-3 p-3 rounded-2xl bg-stone-100/50">
                          <div className="w-10 h-10 rounded-xl bg-stone-200 flex items-center justify-center text-stone-500 shrink-0">
                            <Phone size={18} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">{tp('whatsapp')}</p>
                            <p className="text-sm text-stone-500">{tp('restrictedInfo')}</p>
                          </div>
                        </div>
                      )
                    ) : null}

                    {profile.website?.trim() ? (
                      <a href={profile.website.trim()} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 p-3 rounded-2xl hover:bg-white transition-colors border border-transparent hover:border-stone-100">
                        <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600 shrink-0">
                          <Globe size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">{tp('website')}</p>
                          <p className="text-sm font-medium text-stone-900 break-all">{websiteDisplay}</p>
                        </div>
                      </a>
                    ) : null}
                  </div>
                </div>

                {profile.targetSectors && profile.targetSectors.length > 0 && (
                  <div>
                    <h2 className="text-xs font-black text-stone-400 uppercase tracking-[0.2em] mb-4">{tp('targetSectors')}</h2>
                    <div className="flex flex-wrap gap-2">
                      {profile.targetSectors.map(s => (
                        <span key={s} className="px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-700 shadow-sm">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showRecModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl"
          >
            <h3 className="text-xl font-bold text-stone-900 mb-4">Recommander {profile.fullName}</h3>
            <textarea 
              value={recText}
              onChange={(e) => setRecText(e.target.value)}
              maxLength={200}
              className="w-full h-32 p-4 bg-stone-50 border border-stone-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none mb-4"
              placeholder="Pourquoi recommandez-vous ce membre ? (max 200 caractères)"
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setShowRecModal(false)}
                className="flex-1 py-3 bg-stone-100 text-stone-600 rounded-2xl font-bold hover:bg-stone-200 transition-all"
              >
                Annuler
              </button>
              <button 
                onClick={handleAddRec}
                disabled={!recText.trim()}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
              >
                Publier
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const NeedPage = () => {
  const { lang, t } = useLanguage();
  const { needId } = useParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [urgentPost, setUrgentPost] = useState<UrgentPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<NeedComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const docSnap = await getDoc(doc(db, 'users', user.uid));
        if (docSnap.exists()) setCurrentProfile(docSnap.data() as UserProfile);
      }
    });
    return unsubAuth;
  }, []);

  useEffect(() => {
    if (!needId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        if (needId.startsWith('up_')) {
          const docSnap = await getDoc(doc(db, 'urgent_posts', needId));
          if (docSnap.exists()) {
            const data = docSnap.data() as UrgentPost;
            setUrgentPost(data);
            const userSnap = await getDoc(doc(db, 'users', data.authorId));
            if (userSnap.exists()) setProfile(userSnap.data() as UserProfile);
          }
        } else {
          const docSnap = await getDoc(doc(db, 'users', needId));
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          }
        }
      } catch (error) {
        console.error('Error fetching need data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    const q = query(collection(db, 'need_comments'), where('needId', '==', needId), orderBy('createdAt', 'asc'));
    const unsubComments = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as NeedComment)));
    });
    return unsubComments;
  }, [needId]);

  const handleAddComment = async () => {
    if (!currentUser || !currentProfile || !needId || !commentText.trim()) return;
    try {
      await addDoc(collection(db, 'need_comments'), {
        authorId: currentUser.uid,
        authorName: currentProfile.fullName,
        authorPhoto: currentProfile.photoURL || '',
        needId,
        text: commentText,
        createdAt: Date.now()
      });
      setCommentText('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-stone-50"><RefreshCw className="animate-spin text-indigo-600" /></div>;
  if (!profile) return <div className="min-h-screen flex items-center justify-center bg-stone-50">{t('needNotFound')}</div>;

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      <Helmet>
        <title>Besoin de {profile.fullName} | Community Hub</title>
        <meta property="og:title" content={`Besoin de ${profile.fullName}`} />
        <meta
          property="og:description"
          content={
            urgentPost?.text ||
            formatHighlightedNeedsForText(profile.highlightedNeeds, lang) ||
            ''
          }
        />
      </Helmet>

      <div className="max-w-3xl mx-auto px-4 pt-8">
        <button onClick={() => navigate('/')} className="mb-6 flex items-center gap-2 text-stone-500 hover:text-stone-900 font-bold transition-colors">
          <ArrowLeft size={20} />
          Retour à l'accueil
        </button>

        <div className="bg-white rounded-[2.5rem] shadow-xl border border-stone-200 overflow-hidden mb-8">
          <div className="p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-stone-100 rounded-2xl overflow-hidden border border-stone-200">
                {profile.photoURL ? (
                  <img src={profile.photoURL} alt={profile.fullName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <UserIcon size={32} className="m-auto mt-4 text-stone-300" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-stone-900">{profile.fullName}</h1>
                <p className="text-stone-500 font-medium">{profile.companyName}</p>
              </div>
              {urgentPost && (
                <div className="ml-auto px-4 py-2 bg-red-100 text-red-700 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-sm">
                  <Zap size={14} fill="currentColor" />
                  Urgent
                </div>
              )}
            </div>

            <div className="bg-stone-50 p-8 rounded-[2rem] border border-stone-200 mb-8">
              <h2 className="text-xs font-black text-stone-400 uppercase tracking-[0.2em] mb-4">Description du besoin</h2>
              <p className="text-xl text-stone-800 font-bold leading-tight italic">
                {urgentPost?.text ||
                  formatHighlightedNeedsForText(profile.highlightedNeeds, lang) ||
                  'Aucun besoin spécifié.'}
              </p>
            </div>

            <div className="flex items-center justify-between p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-xl shadow-sm text-indigo-600">
                  <UserIcon size={20} />
                </div>
                <p className="text-sm font-bold text-stone-700">Voir le profil complet</p>
              </div>
              <button 
                onClick={() => navigate(`/profil/${profile.uid}`)}
                className="px-6 py-2 bg-white text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-all border border-indigo-200 shadow-sm"
              >
                Ouvrir
              </button>
            </div>
          </div>
        </div>

        <section className="bg-white rounded-[2.5rem] shadow-xl border border-stone-200 overflow-hidden">
          <div className="p-8 border-b border-stone-100">
            <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
              <MessageSquare className="text-indigo-600" size={24} />
              {comments.length} Commentaires
            </h2>
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-4">
              {comments.map(c => (
                <div key={c.id} className="flex gap-4">
                  <div className="w-10 h-10 bg-stone-100 rounded-xl overflow-hidden border border-stone-200 shrink-0">
                    {c.authorPhoto ? (
                      <img src={c.authorPhoto} alt={c.authorName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <UserIcon size={20} className="m-auto mt-2 text-stone-300" />
                    )}
                  </div>
                  <div className="flex-1 bg-stone-50 p-4 rounded-2xl border border-stone-100">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-bold text-stone-900">{c.authorName}</p>
                      <p className="text-[10px] text-stone-400 font-medium">
                        {new Date(c.createdAt).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'es-MX')}
                      </p>
                    </div>
                    <p className="text-stone-700 text-sm leading-relaxed">{c.text}</p>
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-center text-stone-400 py-8 italic">Soyez le premier à commenter ce besoin.</p>
              )}
            </div>

            {currentUser && (
              <div className="pt-6 border-t border-stone-100">
                <div className="flex gap-3">
                  <textarea 
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="flex-1 p-4 bg-stone-50 border border-stone-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none h-24"
                    placeholder="Ajouter un commentaire..."
                  />
                  <button 
                    onClick={handleAddComment}
                    disabled={!commentText.trim()}
                    className="self-end p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

type AiMatchBlockReason =
  | 'incomplete_profile'
  | 'few_members'
  | 'api_error'
  | 'empty_result'
  | null;

function parseMatchmakerResponse(raw: string, validUids: Set<string>): MatchSuggestion[] {
  const stripFences = (s: string) => s.replace(/```json/gi, '').replace(/```/g, '').trim();
  const tryParse = (s: string): MatchSuggestion[] => {
    const parsed = JSON.parse(s) as { m?: unknown };
    const rows = parsed?.m;
    if (!Array.isArray(rows)) throw new Error('matchmaker-no-m-array');
    return rows
      .map((x: { id?: unknown; t?: unknown; s?: unknown; r?: unknown; h?: unknown }) => ({
        profileId: String(x?.id ?? '').trim(),
        type: String(x?.t ?? ''),
        score: Number(x?.s) || 0,
        reason: String(x?.r ?? ''),
        hook: String(x?.h ?? ''),
      }))
      .filter((row) => row.profileId && validUids.has(row.profileId));
  };
  const clean = stripFences(raw);
  try {
    return tryParse(clean);
  } catch {
    const i = clean.indexOf('{');
    const j = clean.lastIndexOf('}');
    if (i >= 0 && j > i) return tryParse(clean.slice(i, j + 1));
    throw new Error('matchmaker-json');
  }
}

const MainApp = () => {
  const { lang, setLang, t } = useLanguage();
  const h = homeLanding(lang);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isShareNeedsModalOpen, setIsShareNeedsModalOpen] = useState(false);
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLinkedInModalOpen, setIsLinkedInModalOpen] = useState(false);
  const directoryMainRef = useRef<HTMLDivElement>(null);
  const [membersSortRecent, setMembersSortRecent] = useState(false);
  const [showValidationPanel, setShowValidationPanel] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'companies' | 'members' | 'activities' | 'opportunities'>('members');
  const [matches, setMatches] = useState<MatchSuggestion[]>([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchBlockReason, setMatchBlockReason] = useState<AiMatchBlockReason>(null);
  const [aiRecResolved, setAiRecResolved] = useState(false);
  const [urgentPosts, setUrgentPosts] = useState<UrgentPost[]>([]);
  const [highlightedNeedFilter, setHighlightedNeedFilter] = useState('');
  const [passionIdFilter, setPassionIdFilter] = useState('');
  const [highlightedNeedsDraft, setHighlightedNeedsDraft] = useState<string[]>([]);
  const [passionIdsDraft, setPassionIdsDraft] = useState<string[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showUrgentPostModal, setShowUrgentPostModal] = useState(false);
  const [expandedHookId, setExpandedHookId] = useState<string | null>(null);
  const [authProviderBusy, setAuthProviderBusy] = useState<SocialAuthProvider | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [profileSaveBusy, setProfileSaveBusy] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);
  const [optimizationBusy, setOptimizationBusy] = useState(false);
  const [optimizationError, setOptimizationError] = useState<string | null>(null);

  const getAuthErrorMessage = (code: string) => {
    const host = typeof window !== 'undefined' ? window.location.host : '';
    const fr = {
      unauthorizedDomain: `Ce domaine (${host}) n'est pas autorisé dans Firebase Auth. Ajoutez-le dans Authentication > Settings > Authorized domains.`,
      providerDisabled:
        "Ce fournisseur (Google, Microsoft ou Apple) n'est pas activé dans Firebase Auth > Sign-in method.",
      popupClosed: "La fenêtre de connexion a été fermée avant la fin. Réessayez.",
      generic: "Connexion impossible. Vérifiez la configuration Firebase Auth et que le fournisseur est activé."
    };
    const es = {
      unauthorizedDomain: `Este dominio (${host}) no está autorizado en Firebase Auth. Agrégalo en Authentication > Settings > Authorized domains.`,
      providerDisabled:
        "Este proveedor (Google, Microsoft o Apple) no está habilitado en Firebase Auth > Sign-in method.",
      popupClosed: "La ventana de inicio de sesión se cerró antes de terminar. Inténtalo de nuevo.",
      generic: "No se pudo iniciar sesión. Verifica Firebase Auth y que el proveedor esté habilitado."
    };
    const msg = lang === 'fr' ? fr : es;

    if (code === 'auth/unauthorized-domain') return msg.unauthorizedDomain;
    if (code === 'auth/operation-not-allowed') return msg.providerDisabled;
    if (code === 'auth/popup-closed-by-user') return msg.popupClosed;
    return msg.generic;
  };

  const pendingProfiles = useMemo(() => {
    return allProfiles.filter(p => p.isValidated === false);
  }, [allProfiles]);

  useEffect(() => {
    if (!isEditing) return;
    const src = editingProfile ?? profile;
    if (!src) return;
    setHighlightedNeedsDraft(sanitizeHighlightedNeeds(src.highlightedNeeds));
    setPassionIdsDraft(sanitizePassionIds(src.passionIds));
  }, [isEditing, editingProfile?.uid, profile?.uid]);

  const toggleHighlightedNeedDraft = (id: string) => {
    setHighlightedNeedsDraft((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const stats = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const validatedProfiles = allProfiles.filter(p => p.isValidated !== false);
    const sortedByDate = [...validatedProfiles].sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    const newThisWeek = sortedByDate.filter(p => p.createdAt.toDate().getTime() > sevenDaysAgo.getTime());
    const last10 = sortedByDate.slice(0, 10);
    
    return {
      total: validatedProfiles.length,
      newThisWeekCount: newThisWeek.length,
      newThisWeekProfiles: newThisWeek as UserProfile[],
      last10: last10 as UserProfile[]
    };
  }, [allProfiles]);

  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) setAuthError(null);
      if (u) {
        const docRef = doc(db, 'users', u.uid);
        const docSnap = await getDoc(docRef);
        
        // Update lastSeen
        await updateDoc(docRef, { lastSeen: Date.now() }).catch(() => {
          // If update fails, it might be because the doc doesn't exist yet
        });

        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          setProfile(null);
          setShowOnboarding(true);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    const profilesQuery = query(collection(db, 'users'), orderBy('fullName', 'asc'));
    const unsubscribeProfiles = onSnapshot(profilesQuery, (snapshot) => {
      const profiles = snapshot.docs.map(doc => doc.data() as UserProfile);
      setAllProfiles(profiles);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));

    const urgentQuery = query(
      collection(db, 'urgent_posts'), 
      where('expiresAt', '>', Date.now()), 
      orderBy('expiresAt', 'desc')
    );
    const unsubscribeUrgent = onSnapshot(urgentQuery, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UrgentPost));
      setUrgentPosts(posts.slice(0, 5));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'urgent_posts'));

    return () => {
      unsubscribe();
      unsubscribeProfiles();
      unsubscribeUrgent();
    };
  }, []);

  const fetchMatches = useCallback(async (u: UserProfile, profiles: UserProfile[]) => {
    if (!u.uid) return;

    try {
      const readiness = getProfileAiRecommendationReadiness(u);
      const storageKey = `ai_matches_v2_${u.uid}`;

      if (readiness < 0.8) {
        sessionStorage.removeItem(storageKey);
        setMatches([]);
        setMatchLoading(false);
        setMatchBlockReason('incomplete_profile');
        return;
      }

      const cached = sessionStorage.getItem(storageKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as MatchSuggestion[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            const validUids = new Set(profiles.map((p) => p.uid).filter(Boolean));
            const filtered = parsed.filter((m) => validUids.has(m.profileId));
            if (filtered.length > 0) {
              setMatches(filtered);
              setMatchBlockReason(null);
              return;
            }
            sessionStorage.removeItem(storageKey);
          }
        } catch {
          sessionStorage.removeItem(storageKey);
        }
      }

      const other = profiles.filter((p) => p.uid !== u.uid).slice(0, 50);
      if (other.length < 3) {
        setMatches([]);
        setMatchLoading(false);
        setMatchBlockReason('few_members');
        return;
      }

      const validUids = new Set(other.map((p) => p.uid));

      setMatchLoading(true);
      setMatchBlockReason(null);
      try {
        const apiKey = getGeminiApiKey();
        if (!apiKey) throw new Error('missing-gemini-api-key');
        const ai = new GoogleGenAI({ apiKey });
        const fp = u.accountType === 'foreign' ? 'Prioriser Distributeurs/Partenaires locaux.' : '';
        const uKeywords = normalizedTargetKeywords(u).join(',') || 'tous';
        const prompt = `B2B GDL. Membre:${u.fullName}|${u.companyName}|secteur:${u.activityCategory ?? '?'}|fonction:${u.positionCategory ?? '?'}|taille:${u.companySize ?? '?'}|bio:${u.bio ?? ''}|besoins_struct:${(u.highlightedNeeds ?? []).join(',') || 'aucun'}|cibles:${uKeywords}.${fp} Disponibles:${other.map(p => `${p.uid}|${p.fullName}|${p.companyName}|secteur:${p.activityCategory ?? '?'}|fonction:${p.positionCategory ?? '?'}|taille:${p.companySize ?? '?'}|besoins_struct:${(p.highlightedNeeds ?? []).join(',') || 'aucun'}|cibles:${normalizedTargetKeywords(p).join(',') || '—'}|bio:${p.bio ?? ''}`).join(';')}. Top3 JSON:{"m":[{"id":"uid","t":"Client|Fournisseur|Partenaire|Distributeur|Investisseur","s":8,"r":"raison","h":"accroche"}]}`;
        
        const res = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt
        });

        const text = res.text || '';
        const result = parseMatchmakerResponse(text, validUids);

        if (result.length === 0) {
          setMatches([]);
          setMatchBlockReason('empty_result');
          return;
        }

        sessionStorage.setItem(storageKey, JSON.stringify(result));
        setMatches(result);
        setMatchBlockReason(null);
      } catch (error) {
        console.error("Matchmaker error:", error);
        setMatches([]);
        setMatchBlockReason('api_error');
      } finally {
        setMatchLoading(false);
      }
    } finally {
      setAiRecResolved(true);
    }
  }, []);

  const refreshAiMatches = useCallback(() => {
    if (!profile?.uid) return;
    sessionStorage.removeItem(`ai_matches_v2_${profile.uid}`);
    fetchMatches(profile, allProfiles);
  }, [profile, allProfiles, fetchMatches]);

  useEffect(() => {
    setAiRecResolved(false);
    setMatches([]);
    setMatchBlockReason(null);
  }, [user?.uid]);

  useEffect(() => {
    if (user && profile) {
      fetchMatches(profile, allProfiles);
    }
  }, [user?.uid, profile, allProfiles.length, fetchMatches]);

  useEffect(() => {
    if (user) setShowAuthModal(false);
  }, [user]);

  useEffect(() => {
    getRedirectResult(auth).catch((error) => {
      const code = (error as { code?: string })?.code ?? '';
      if (!code || code === 'auth/popup-closed-by-user') return;
      setAuthError(`${getAuthErrorMessage(code)}${code ? ` (code: ${code})` : ''}`);
    });
  }, []);

  const handleSocialLogin = async (which: SocialAuthProvider) => {
    const provider = buildAuthProvider(which);
    setAuthProviderBusy(which);
    setAuthError(null);
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login failed', error);
      const firebaseCode = (error as { code?: string })?.code ?? '';
      const shouldFallbackToRedirect = [
        'auth/popup-blocked',
        'auth/popup-closed-by-user',
        'auth/cancelled-popup-request',
        'auth/operation-not-supported-in-this-environment',
      ].includes(firebaseCode);

      if (shouldFallbackToRedirect) {
        try {
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectError) {
          console.error('Redirect login failed', redirectError);
          const redirectCode = (redirectError as { code?: string })?.code ?? '';
          setAuthError(`${getAuthErrorMessage(redirectCode)}${redirectCode ? ` (code: ${redirectCode})` : ''}`);
          return;
        }
      }

      setAuthError(`${getAuthErrorMessage(firebaseCode)}${firebaseCode ? ` (code: ${firebaseCode})` : ''}`);
    } finally {
      setAuthProviderBusy(null);
    }
  };

  const handleLogout = () => signOut(auth);

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setProfileSaveBusy(true);
    setProfileSaveError(null);

    const formData = new FormData(e.currentTarget);
    const targetUid = editingProfile?.uid || user.uid;
    const isSelf = targetUid === user.uid;
    const getTrimmed = (key: string) => String(formData.get(key) || '').trim();
    const optionalString = (key: string) => {
      const v = getTrimmed(key);
      return v.length > 0 ? v : undefined;
    };
    const optionalNumber = (key: string) => {
      const raw = getTrimmed(key);
      if (!raw) return undefined;
      const n = Number(raw);
      return Number.isFinite(n) ? n : undefined;
    };
    const requiredFieldLabels = {
      fr: {
        fullName: 'Nom complet',
        companyName: 'Nom de la societe',
        activityCategory: 'Categorie',
        positionCategory: 'Fonction dans l\'entreprise',
        email: 'Email',
        website: 'Site web',
        whatsapp: 'WhatsApp',
        bio: 'Presentation'
      },
      es: {
        fullName: 'Nombre completo',
        companyName: 'Nombre de la empresa',
        activityCategory: 'Categoria',
        positionCategory: 'Funcion en la empresa',
        email: 'Correo electronico',
        website: 'Sitio web',
        whatsapp: 'WhatsApp',
        bio: 'Presentacion'
      }
    };
    const labels = requiredFieldLabels[lang];
    const requiredKeys: Array<keyof typeof requiredFieldLabels.fr> = [
      'fullName',
      'companyName',
      'activityCategory',
      'positionCategory',
      'email',
      'website',
      'whatsapp',
      'bio'
    ];
    const missingFields = requiredKeys.filter((key) => !getTrimmed(key));
    const websiteValue = getTrimmed('website');
    const invalidWebsite = websiteValue && !/^https?:\/\/.+/i.test(websiteValue);
    if (missingFields.length > 0 || invalidWebsite) {
      const missingLabels = missingFields.map((key) => labels[key]);
      if (invalidWebsite) {
        missingLabels.push(
          lang === 'fr'
            ? 'Site web (doit commencer par http:// ou https://)'
            : 'Sitio web (debe iniciar con http:// o https://)'
        );
      }
      setProfileSaveError(
        lang === 'fr'
          ? `Pour terminer l'enregistrement, merci de completer les champs suivants : ${missingLabels.join(', ')}.`
          : `Para guardar, completa estos campos: ${missingLabels.join(', ')}.`
      );
      setProfileSaveBusy(false);
      return;
    }

    const posVal = getTrimmed('positionCategory');
    if (posVal && !(WORK_FUNCTION_OPTIONS as readonly string[]).includes(posVal)) {
      setProfileSaveError(
        lang === 'fr'
          ? 'La fonction dans l\'entreprise selectionnee est invalide.'
          : 'La funcion en la empresa seleccionada no es valida.'
      );
      setProfileSaveBusy(false);
      return;
    }

    const ecRaw = getTrimmed('employeeCount');
    let employeeCountVal: EmployeeCountRange | undefined;
    if (ecRaw === '') {
      employeeCountVal = undefined;
    } else if (isEmployeeCountRange(ecRaw)) {
      employeeCountVal = ecRaw;
    } else {
      setProfileSaveError(
        lang === 'fr'
          ? 'La fourchette « Nombre d\'employés » sélectionnée est invalide.'
          : 'El rango de « Número de empleados » seleccionado no es válido.'
      );
      setProfileSaveBusy(false);
      return;
    }

    const baseProfile = isSelf ? profile : editingProfile;
    const computedCompanySize: UserProfile['companySize'] = employeeCountVal
      ? companySizeFromEmployeeRange(employeeCountVal)
      : (baseProfile?.companySize ?? 'solo');

    const newProfile: Partial<UserProfile> = {
      uid: targetUid,
      fullName: getTrimmed('fullName'),
      companyName: getTrimmed('companyName'),
      creationYear: optionalNumber('creationYear'),
      city: optionalString('city'),
      state: optionalString('state'),
      neighborhood: optionalString('neighborhood'),
      activityCategory: optionalString('activityCategory'),
      positionCategory: optionalString('positionCategory'),
      email: getTrimmed('email'),
      website: optionalString('website'),
      whatsapp: optionalString('whatsapp'),
      linkedin: optionalString('linkedin'),
      photoURL: optionalString('photoURL'),
      arrivalYear: optionalNumber('arrivalYear'),
      employeeCount: employeeCountVal,
      isEmailPublic: formData.get('isEmailPublic') === 'on',
      isWhatsappPublic: formData.get('isWhatsappPublic') === 'on',
      bio: optionalString('bio'),
      highlightedNeeds: sanitizeHighlightedNeeds(highlightedNeedsDraft),
      passionIds: sanitizePassionIds(passionIdsDraft),
      targetSectors: (formData.get('targetSectors') as string)?.split(',').map(s => s.trim()).filter(Boolean) || [],
      companySize: computedCompanySize,
      accountType: ((isSelf ? profile?.accountType : editingProfile?.accountType) ?? 'local') as 'local' | 'foreign',
      role: (targetUid === user.uid && user.email === ADMIN_EMAIL) ? 'admin' : (editingProfile?.role || profile?.role || 'user') as Role,
      createdAt: (isSelf ? profile?.createdAt : editingProfile?.createdAt) || Timestamp.now(),
      isValidated: isSelf ? (profile?.isValidated ?? false) : (editingProfile?.isValidated ?? true),
    };
    const sanitizedProfile = Object.fromEntries(
      Object.entries(newProfile).filter(([, value]) => value !== undefined)
    ) as Partial<UserProfile>;

    try {
      await setDoc(doc(db, 'users', targetUid), sanitizedProfile);
      if (isSelf) {
        setProfile(sanitizedProfile as UserProfile);
      }
      setIsEditing(false);
      setEditingProfile(null);
    } catch (error) {
      console.error('Profile save failed', error);
      const code = (error as { code?: string })?.code || '';
      if (code === 'permission-denied') {
        setProfileSaveError(
          lang === 'fr'
            ? "Enregistrement refusé par les règles Firestore (permission-denied). Vérifie les règles 'users'."
            : "Guardado rechazado por reglas de Firestore (permission-denied). Revisa las reglas de 'users'."
        );
      } else {
        setProfileSaveError(
          lang === 'fr'
            ? `Impossible d'enregistrer le profil.${code ? ` (code: ${code})` : ''}`
            : `No se pudo guardar el perfil.${code ? ` (code: ${code})` : ''}`
        );
      }
      return;
    } finally {
      setProfileSaveBusy(false);
    }
  };

  const handleDeleteProfile = async (uid: string) => {
    try {
      await deleteDoc(doc(db, 'users', uid));
      if (uid === user?.uid) {
        setProfile(null);
      }
      setProfileToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${uid}`);
    }
  };

  const exportToExcel = async () => {
    if (profile?.role !== 'admin') return;
    
    const data = allProfiles.map(p => ({
      ...p,
      createdAt: p.createdAt.toDate().toISOString()
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Profiles");
    XLSX.writeFile(workbook, "Annuaire_Guadalajara.xlsx");
  };

  const filteredProfiles = useMemo(() => {
    return allProfiles.filter(p => {
      // Only show validated profiles to non-admins
      if (profile?.role !== 'admin' && p.isValidated === false) return false;

      const matchesSearch = profileMatchesSearchQuery(p, searchTerm);
      const matchesCategory = filterCategory === '' || p.activityCategory === filterCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [allProfiles, searchTerm, filterCategory, profile]);

  const membersFiltered = useMemo(() => {
    return filteredProfiles.filter((p) => {
      if (highlightedNeedFilter && !(p.highlightedNeeds || []).includes(highlightedNeedFilter)) {
        return false;
      }
      if (
        passionIdFilter &&
        !sanitizePassionIds(p.passionIds).includes(passionIdFilter)
      ) {
        return false;
      }
      return true;
    });
  }, [filteredProfiles, highlightedNeedFilter, passionIdFilter]);

  const membersDisplayList = useMemo(() => {
    const list = [...membersFiltered];
    if (membersSortRecent) {
      list.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    }
    return list;
  }, [membersFiltered, membersSortRecent]);

  const profilesSortedForCompanies = useMemo(() => {
    return [...filteredProfiles].sort((a, b) => {
      const locale = lang === 'fr' ? 'fr' : 'es';
      const byCompany = a.companyName.localeCompare(b.companyName, locale, { sensitivity: 'base' });
      if (byCompany !== 0) return byCompany;
      return a.fullName.localeCompare(b.fullName, locale, { sensitivity: 'base' });
    });
  }, [filteredProfiles, lang]);

  const activityCategoryPopularity = useMemo(() => {
    const counts = new Map<string, number>();
    filteredProfiles.forEach((p) => {
      const cat = p.activityCategory || '';
      counts.set(cat, (counts.get(cat) || 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [filteredProfiles]);

  const profilesSortedForActivities = useMemo(() => {
    const rank = new Map<string, number>();
    activityCategoryPopularity.forEach(([cat], i) => rank.set(cat, i));
    const locale = lang === 'fr' ? 'fr' : 'es';
    return [...filteredProfiles].sort((a, b) => {
      const ca = a.activityCategory || '';
      const cb = b.activityCategory || '';
      const ra = rank.has(ca) ? rank.get(ca)! : 999;
      const rb = rank.has(cb) ? rank.get(cb)! : 999;
      if (ra !== rb) return ra - rb;
      const byCompany = a.companyName.localeCompare(b.companyName, locale, { sensitivity: 'base' });
      if (byCompany !== 0) return byCompany;
      return a.fullName.localeCompare(b.fullName, locale, { sensitivity: 'base' });
    });
  }, [filteredProfiles, activityCategoryPopularity, lang]);

  const handleValidateProfile = async (uid: string, isValid: boolean) => {
    try {
      await setDoc(doc(db, 'users', uid), { isValidated: isValid }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
    }
  };

  const generateOptimizationSuggestion = async (targetProfile: UserProfile) => {
    setOptimizationBusy(true);
    setOptimizationError(null);
    try {
      const apiKey = getGeminiApiKey();
      if (!apiKey) throw new Error('missing-gemini-api-key');
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Tu es expert en profils B2B. Analyse ce profil et propose des optimisations concretes.
Reponds STRICTEMENT en JSON valide:
{"bioSuggested":"...","summary":["...","...","..."]}
Contraintes:
- bioSuggested: 80 a 500 caracteres, ton professionnel, clair et concret.
- summary: 3 a 6 actions courtes et actionnables (dont au besoin l'amelioration des besoins structures listes).
Profil:
Nom: ${targetProfile.fullName}
Societe: ${targetProfile.companyName}
Categorie: ${targetProfile.activityCategory ?? ''}
Fonction dans l'entreprise: ${targetProfile.positionCategory ?? ''}
Bio actuelle: ${targetProfile.bio ?? ''}
Besoins mis en avant (codes): ${(targetProfile.highlightedNeeds ?? []).join(', ') || 'aucun'}`;

      const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      const text = (res.text || '').replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(text) as { bioSuggested: string; summary: string[]; lookingForSuggested?: string };
      const suggestion: OptimizationSuggestion = {
        bioSuggested: (parsed.bioSuggested || '').trim(),
        summary: Array.isArray(parsed.summary) ? parsed.summary.filter(Boolean).map(s => String(s).trim()) : [],
        generatedAt: Date.now(),
        generatedBy: user?.uid || 'system'
      };

      if (!suggestion.bioSuggested || suggestion.summary.length === 0) {
        throw new Error('invalid-ai-suggestion');
      }

      await setDoc(doc(db, 'users', targetProfile.uid), { optimizationSuggestion: suggestion }, { merge: true });
      setSelectedProfile((prev) => prev && prev.uid === targetProfile.uid ? { ...prev, optimizationSuggestion: suggestion } : prev);
      setAllProfiles((prev) => prev.map(p => p.uid === targetProfile.uid ? { ...p, optimizationSuggestion: suggestion } : p));
    } catch (error) {
      console.error('Optimization generation failed', error);
      const msg = (error as { message?: string; code?: string })?.message || '';
      const code = (error as { code?: string })?.code || '';
      if (msg.includes('missing-gemini-api-key')) {
        setOptimizationError(
          lang === 'fr'
            ? "La cle Gemini est absente. Ajoute VITE_GEMINI_API_KEY dans .env.local puis redemarre le serveur."
            : "Falta la clave Gemini. Agrega VITE_GEMINI_API_KEY en .env.local y reinicia el servidor."
        );
        return;
      }
      setOptimizationError(
        lang === 'fr'
          ? `Impossible de generer les suggestions IA pour ce profil.${code ? ` (code: ${code})` : ''}`
          : `No se pudieron generar sugerencias IA para este perfil.${code ? ` (code: ${code})` : ''}`
      );
    } finally {
      setOptimizationBusy(false);
    }
  };

  const sendOptimizationEmail = (targetProfile: UserProfile) => {
    const suggestion = targetProfile.optimizationSuggestion;
    if (!suggestion?.summary?.length) return;
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const subject = encodeURIComponent("Votre profil n'est pas encore valide - optimisations recommandees");
    const bodyLines = [
      `Bonjour ${targetProfile.fullName},`,
      '',
      "Votre profil n'est pas encore valide pour publication. Voici les optimisations recommandees :",
      '',
      ...suggestion.summary.map((s) => `- ${s}`),
      '',
      'Suggestion de presentation :',
      suggestion.bioSuggested,
      '',
      `Connectez-vous pour appliquer automatiquement ces suggestions puis les ajuster: ${baseUrl}`,
      '',
      'Merci'
    ];
    const body = encodeURIComponent(bodyLines.join('\n'));
    window.location.href = `mailto:${targetProfile.email}?subject=${subject}&body=${body}`;
  };

  const startEditing = (p: UserProfile) => {
    setEditingProfile(p);
    setIsEditing(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-stone-400 animate-pulse font-medium">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-stone-200">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-0 sm:h-16 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex w-full min-w-0 items-start gap-2 sm:w-auto sm:flex-1 sm:items-center sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 bg-stone-900 rounded-lg sm:rounded-xl flex items-center justify-center text-white shadow-md sm:shadow-lg">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1 pr-1">
              <h1 className="text-[10px] font-medium leading-snug tracking-tight text-stone-900 break-words sm:text-[11px] sm:font-semibold md:text-sm lg:text-base xl:text-lg">
                {t('title')}
              </h1>
              <p className="text-[9px] leading-snug text-stone-500 mt-0.5 line-clamp-2 sm:text-[10px] sm:mt-1 md:text-xs md:line-clamp-none">
                {t('subtitle')}
              </p>
            </div>
            {/* Langues alignées avec le titre sur mobile uniquement */}
            <div className="ml-auto shrink-0 self-start pt-0.5 sm:hidden">
              <div className="flex bg-stone-100 p-0.5 rounded-lg border border-stone-200">
                <button
                  type="button"
                  onClick={() => setLang('fr')}
                  className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${lang === 'fr' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                >
                  FR
                </button>
                <button
                  type="button"
                  onClick={() => setLang('es')}
                  className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${lang === 'es' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                >
                  ES
                </button>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col items-end gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end sm:gap-4 shrink-0">
            <div className="hidden bg-stone-100 p-0.5 sm:flex sm:p-1 sm:rounded-lg sm:rounded-xl border border-stone-200">
              <button 
                onClick={() => setLang('fr')}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold transition-all ${lang === 'fr' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
              >
                FR
              </button>
              <button 
                onClick={() => setLang('es')}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold transition-all ${lang === 'es' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
              >
                ES
              </button>
            </div>

            {user ? (
              <div className="flex items-center gap-2 sm:gap-4">
                {profile?.role === 'admin' && (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setShowValidationPanel(true)}
                      className="relative flex items-center gap-2 px-3 py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors text-sm font-medium"
                    >
                      <Users size={16} />
                      <span className="hidden sm:inline">{t('newProfiles')}</span>
                      {pendingProfiles.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                          {pendingProfiles.length}
                        </span>
                      )}
                    </button>
                    <button 
                      onClick={exportToExcel}
                      className="hidden sm:flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium"
                    >
                      <Download size={16} />
                      {t('exportData')}
                    </button>
                  </div>
                )}
                <div className="h-8 w-px bg-stone-200 hidden sm:block" />
                <button 
                  onClick={handleLogout}
                  className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors text-stone-600"
                  title={t('logout')}
                >
                  <LogOut size={18} />
                </button>
                <img 
                  src={user.photoURL || ''} 
                  alt={user.displayName || ''} 
                  className="w-8 h-8 rounded-full border border-stone-200"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAuthError(null);
                  setShowAuthModal(true);
                }}
                disabled={authProviderBusy !== null}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-stone-900 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-stone-800 transition-all shadow-sm sm:shadow-md hover:shadow-lg active:scale-95 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {authProviderBusy !== null
                  ? lang === 'fr'
                    ? 'Connexion...'
                    : 'Conectando...'
                  : t('login')}
              </button>
            )}
          </div>
        </div>
      </header>

      <AnimatePresence>
        {showAuthModal && !user && (
          <div className="fixed inset-0 z-[170] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
              onClick={() => {
                if (authProviderBusy === null) setShowAuthModal(false);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => {
                  if (authProviderBusy === null) setShowAuthModal(false);
                }}
                className="absolute right-4 top-4 rounded-full p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-900"
                aria-label={t('close')}
              >
                <Plus size={22} className="rotate-45" />
              </button>
              <h2 className="pr-10 text-xl font-bold tracking-tight text-stone-900">{t('login')}</h2>
              <p className="mt-1 text-sm text-stone-500">{t('signInWithProvider')}</p>
              <div className="mt-5">
                <SocialSignInButtons
                  lang={lang}
                  t={t}
                  busy={authProviderBusy}
                  onSignIn={handleSocialLogin}
                />
              </div>
              {authError && (
                <p className="mt-4 text-sm text-red-600 leading-snug">{authError}</p>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {user && (
        <div className="bg-stone-50 border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <section className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden relative">
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-stone-50 transition-colors"
                onClick={() => setIsProfileExpanded(!isProfileExpanded)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-stone-100 rounded-lg flex items-center justify-center text-stone-600">
                    <UserIcon size={16} />
                  </div>
                  <div className="flex items-baseline gap-3">
                    <h2 className="text-lg font-semibold tracking-tight">{t('myProfile')}</h2>
                    {!isProfileExpanded && profile && (
                      <p className="text-stone-500 text-sm font-medium">{profile.fullName} • {profile.companyName}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsEditing(!isEditing); setIsProfileExpanded(true); }}
                    className="p-2 hover:bg-stone-200 rounded-lg transition-colors text-stone-500"
                    title={t('edit')}
                  >
                    <Edit2 size={18} />
                  </button>
                  {user && !profile && !isProfileExpanded && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsEditing(true); setIsProfileExpanded(true); }}
                      className="px-4 py-1.5 bg-stone-900 text-white text-xs rounded-lg hover:bg-stone-800 transition-all font-medium"
                    >
                      {t('register')}
                    </button>
                  )}
                  <div className="p-2 text-stone-400">
                    {isProfileExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>
              </div>

            <AnimatePresence>
              {isProfileExpanded && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="p-6 pt-0 border-t border-stone-100">
                    {profile?.isValidated === false && (
                      <div className="mt-6 p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-3">
                        <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg shrink-0">
                          <Users size={14} />
                        </div>
                        <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
                          {t('validationMessage')}
                        </p>
                      </div>
                    )}
                    {profile?.isValidated === false && profile.optimizationSuggestion && !isEditing && (
                      <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl space-y-3">
                        <p className="text-xs font-bold text-indigo-900">
                          {lang === 'fr'
                            ? "Suggestions IA disponibles pour optimiser votre profil avant validation."
                            : "Sugerencias IA disponibles para optimizar tu perfil antes de la validación."}
                        </p>
                        <ul className="text-xs text-indigo-800 list-disc pl-4 space-y-1">
                          {profile.optimizationSuggestion.summary.slice(0, 4).map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProfile({
                                ...profile,
                                bio: profile.optimizationSuggestion?.bioSuggested || profile.bio,
                              });
                              setIsEditing(true);
                            }}
                            className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all"
                          >
                            {lang === 'fr' ? 'Appliquer les suggestions IA' : 'Aplicar sugerencias IA'}
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="mt-6">
                      {isEditing ? (
                        <form onSubmit={handleSaveProfile} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-4">
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{t('fullName')}</label>
                                <input name="fullName" defaultValue={editingProfile?.fullName || profile?.fullName} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-900 outline-none transition-all" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{t('companyName')}</label>
                                <input name="companyName" defaultValue={editingProfile?.companyName || profile?.companyName} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-900 outline-none transition-all" />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{t('creationYear')}</label>
                                  <input type="number" name="creationYear" defaultValue={editingProfile?.creationYear || profile?.creationYear} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-900 outline-none transition-all" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{t('employeeCount')}</label>
                                  <select
                                    name="employeeCount"
                                    defaultValue={employeeCountToSelectDefault(
                                      editingProfile?.employeeCount ?? profile?.employeeCount
                                    )}
                                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-900 outline-none transition-all"
                                  >
                                    <option value="">
                                      {lang === 'fr' ? '— Choisir une fourchette —' : '— Elegir un rango —'}
                                    </option>
                                    {EMPLOYEE_COUNT_RANGES.map((r) => (
                                      <option key={r} value={r}>
                                        {r}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{t('city')}</label>
                                <select name="city" defaultValue={editingProfile?.city || profile?.city} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-900 outline-none transition-all">
                                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{t('neighborhood')}</label>
                                <input name="neighborhood" defaultValue={editingProfile?.neighborhood || profile?.neighborhood} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-900 outline-none transition-all" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{t('state')}</label>
                                <input name="state" defaultValue={editingProfile?.state || profile?.state || 'Jalisco'} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-900 outline-none transition-all" />
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{t('activityCategory')}</label>
                                <select name="activityCategory" defaultValue={editingProfile?.activityCategory || profile?.activityCategory} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-900 outline-none transition-all">
                                  {ACTIVITY_CATEGORIES.map((c) => (
                                    <option key={c} value={c}>
                                      {activityCategoryLabel(c, lang)}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{t('email')}</label>
                                <input type="email" name="email" defaultValue={editingProfile?.email || profile?.email || user.email || ''} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-900 outline-none transition-all" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{t('website')}</label>
                                <input name="website" defaultValue={editingProfile?.website || profile?.website} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-900 outline-none transition-all" />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1 max-w-2xl">
                            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{t('workFunction')}</label>
                            <p className="text-[10px] text-stone-400 leading-snug">{t('workFunctionHint')}</p>
                            <select
                              name="positionCategory"
                              defaultValue={editingProfile?.positionCategory || profile?.positionCategory || ''}
                              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-900 outline-none transition-all text-sm mt-1"
                            >
                              <option value="">{t('selectWorkFunction')}</option>
                              {WORK_FUNCTION_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                  {workFunctionLabel(opt, lang)}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{t('whatsapp')}</label>
                              <input name="whatsapp" defaultValue={editingProfile?.whatsapp || profile?.whatsapp} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-900 outline-none transition-all" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{t('arrivalYear')}</label>
                              <input type="number" name="arrivalYear" defaultValue={editingProfile?.arrivalYear || profile?.arrivalYear} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-900 outline-none transition-all" />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{t('linkedin')}</label>
                              <div className="flex gap-2">
                                <input 
                                  name="linkedin" 
                                  id="linkedin-input"
                                  defaultValue={editingProfile?.linkedin || profile?.linkedin} 
                                  placeholder="https://linkedin.com/in/..."
                                  className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-900 outline-none transition-all" 
                                />
                                <button
                                  type="button"
                                  onClick={() => setIsLinkedInModalOpen(true)}
                                  className="px-3 py-2 bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200 transition-all flex items-center gap-2 text-xs font-medium"
                                >
                                  <Linkedin size={14} />
                                  {t('fetchPhoto')}
                                </button>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{t('photoURL')}</label>
                              <input 
                                name="photoURL" 
                                defaultValue={editingProfile?.photoURL || profile?.photoURL} 
                                placeholder="https://..."
                                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-900 outline-none transition-all" 
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Bio / Description</label>
                            <textarea name="bio" defaultValue={editingProfile?.bio || profile?.bio} placeholder="Décrivez votre activité ou votre parcours..." className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-900 outline-none transition-all min-h-[6rem]" />
                          </div>

                          <PassionPicker
                            value={passionIdsDraft}
                            onChange={setPassionIdsDraft}
                            lang={lang}
                            t={t}
                          />

                          <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-4 md:p-5 space-y-4">
                            <div>
                              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
                                {t('highlightedNeedsTitle')}
                              </label>
                              <p className="text-[10px] text-stone-400 mt-1 leading-relaxed">{t('highlightedNeedsHint')}</p>
                              <p className="text-xs font-bold text-indigo-600 mt-2">
                                {highlightedNeedsDraft.length}/3 — {t('highlightedNeedsCount')}
                              </p>
                            </div>
                            {NEED_OPTIONS.map((group) => (
                              <div key={group.label.fr} className="space-y-2">
                                <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">
                                  {group.label[lang]}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {group.options.map((opt) => {
                                    const selected = highlightedNeedsDraft.includes(opt.value);
                                    const disabled = !selected && highlightedNeedsDraft.length >= 3;
                                    return (
                                      <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => toggleHighlightedNeedDraft(opt.value)}
                                        disabled={disabled}
                                        className={cn(
                                          'max-w-[260px] rounded-lg border px-2.5 py-1.5 text-left text-xs font-medium transition-all',
                                          selected
                                            ? 'border-indigo-500 bg-indigo-600 text-white shadow-sm'
                                            : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300',
                                          disabled && !selected && 'cursor-not-allowed opacity-40 hover:border-stone-200'
                                        )}
                                      >
                                        {opt.label[lang]}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                            <div className="space-y-1 border-t border-stone-200 pt-4 mt-2">
                              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
                                {t('targetSectors')}
                              </label>
                              <p className="text-[10px] text-stone-400 leading-relaxed">{t('needKeywordsHint')}</p>
                              <input
                                name="targetSectors"
                                defaultValue={(editingProfile?.targetSectors || profile?.targetSectors || []).join(', ')}
                                placeholder={t('needKeywordsPlaceholder')}
                                className="mt-2 w-full px-3 py-2 bg-white border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-900 outline-none transition-all text-sm"
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-6 py-2">
                            <label className="flex items-center gap-3 cursor-pointer group">
                              <input type="checkbox" name="isEmailPublic" defaultChecked={editingProfile?.isEmailPublic ?? profile?.isEmailPublic} className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900" />
                              <span className="text-sm text-stone-600 group-hover:text-stone-900 transition-colors">{t('isEmailPublic')}</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                              <input type="checkbox" name="isWhatsappPublic" defaultChecked={editingProfile?.isWhatsappPublic ?? profile?.isWhatsappPublic} className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900" />
                              <span className="text-sm text-stone-600 group-hover:text-stone-900 transition-colors">{t('isWhatsappPublic')}</span>
                            </label>
                          </div>

                          <div className="flex gap-3 pt-4 border-t border-stone-100">
                            <button type="submit" disabled={profileSaveBusy} className="px-8 bg-stone-900 text-white py-2 rounded-lg hover:bg-stone-800 transition-all font-medium disabled:opacity-60 disabled:cursor-not-allowed">
                              {profileSaveBusy ? (lang === 'fr' ? 'Enregistrement...' : 'Guardando...') : t('save')}
                            </button>
                            <button type="button" onClick={() => { setIsEditing(false); setEditingProfile(null); }} className="px-8 bg-stone-100 text-stone-600 py-2 rounded-lg hover:bg-stone-200 transition-all font-medium">{t('cancel')}</button>
                          </div>
                          {profileSaveError && (
                            <p className="text-xs text-red-600">{profileSaveError}</p>
                          )}
                        </form>
                      ) : profile ? (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-400 overflow-hidden">
                              {profile.photoURL ? (
                                <img src={profile.photoURL} alt={profile.fullName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <UserIcon size={32} />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-lg leading-tight">{profile.fullName}</h3>
                              </div>
                              <p className="text-stone-500 text-sm">{profile.companyName}</p>
                              {profile.linkedin && (
                                <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-blue-600 transition-colors mt-1 inline-block">
                                  <Linkedin size={16} />
                                </a>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-3 text-stone-600">
                              <Briefcase size={16} className="text-stone-400" />
                              <span className="text-sm">
                                {activityCategoryLabel(profile.activityCategory, lang)}
                              </span>
                            </div>
                            {profile.positionCategory && (
                              <div className="flex items-center gap-3 text-stone-600">
                                <UserCog size={16} className="text-stone-400 shrink-0" />
                                <span className="text-sm">
                                  {workFunctionLabel(profile.positionCategory, lang)}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-3 text-stone-600">
                              <MapPin size={16} className="text-stone-400" />
                              <span className="text-sm">{profile.city}, {profile.neighborhood}, {profile.state || 'Jalisco'}</span>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center gap-3 text-stone-600">
                              <Mail size={16} className="text-stone-400" />
                              <span className="text-sm">{profile.email}</span>
                            </div>
                            {profile.whatsapp && (
                              <div className="flex items-center gap-3 text-stone-600">
                                <Phone size={16} className="text-stone-400" />
                                <span className="text-sm">{profile.whatsapp}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-start justify-between">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1">{t('arrivalYear')}</p>
                                <p className="text-sm font-medium">
                                  {profile.arrivalYear ? `${profile.arrivalYear} (${new Date().getFullYear() - profile.arrivalYear} ans)` : '-'}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1">{t('employeeCount')}</p>
                                <p className="text-sm font-medium">
                                  {formatEmployeeCountDisplay(profile.employeeCount) || '-'}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <button 
                                onClick={() => setProfileToDelete(profile.uid)}
                                className="p-2 hover:bg-red-50 text-stone-300 hover:text-red-500 rounded-lg transition-colors"
                                title={t('delete')}
                              >
                                <Plus size={18} className="rotate-45" />
                              </button>
                              {sanitizeHighlightedNeeds(profile.highlightedNeeds).length > 0 && (
                                <button 
                                  onClick={() => setIsShareNeedsModalOpen(true)}
                                  className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors"
                                  title="Partager mes besoins"
                                >
                                  <Share2 size={18} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        {profile.bio && (
                          <div className="mt-6 pt-6 border-t border-stone-100">
                            <p className="text-xs font-black text-stone-400 uppercase tracking-widest mb-2">Bio</p>
                            <p className="text-sm text-stone-600 leading-relaxed">{profile.bio}</p>
                            {sanitizeHighlightedNeeds(profile.highlightedNeeds).length > 0 && (
                              <button 
                                onClick={() => setIsShareNeedsModalOpen(true)}
                                className="mt-4 flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                              >
                                <Share2 size={14} />
                                Partager mes besoins
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center text-stone-300 mx-auto mb-4">
                            <Plus size={32} />
                          </div>
                          <p className="text-stone-500 text-sm mb-6">{t('noProfile')}</p>
                          <button 
                            onClick={() => setIsEditing(true)}
                            className="px-8 bg-stone-900 text-white py-2 rounded-lg hover:bg-stone-800 transition-all font-medium"
                          >
                            {t('register')}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            </section>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8 lg:items-stretch">
          {/* Ligne 1 (desktop) : Bienvenue | Hero — même hauteur de ligne */}
          {!user && (
            <>
              <div className="order-5 h-full min-h-0 lg:order-none lg:col-span-4">
                <WelcomeContextCard title={t('welcome')} body={t('welcomeIntro')} />
              </div>
              <div className="order-1 h-full min-h-0 lg:order-none lg:col-span-8">
                <HeroSection
                  copy={h}
                  authBusy={authProviderBusy !== null}
                  onCreateProfile={() => {
                    setAuthError(null);
                    setShowAuthModal(true);
                  }}
                  onExploreMembers={() => {
                    setViewMode('members');
                    setMembersSortRecent(false);
                    requestAnimationFrame(() =>
                      directoryMainRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    );
                  }}
                  className="h-full w-full"
                />
              </div>
            </>
          )}

          {/* Colonne gauche — recherche + stats */}
          <div className="order-6 space-y-6 lg:order-none lg:col-span-4">
            {/* Search & Filter in Sidebar */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">{t('search')}</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                  <input 
                    type="text" 
                    placeholder={t('searchPlaceholder')} 
                    value={searchTerm}
                    aria-label={t('searchPlaceholder')}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-900 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">{t('activityCategory')}</label>
                <select 
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-900 outline-none transition-all text-sm font-medium"
                >
                  <option value="">{t('allIndustries')}</option>
                  {ACTIVITY_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {activityCategoryLabel(c, lang)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Total Members Block (Smaller) */}
            <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-stone-50 rounded-lg flex items-center justify-center text-stone-900">
                  <Users size={16} />
                </div>
                <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">{t('memberCount')}</p>
              </div>
              <p className="text-lg font-bold text-stone-900">{stats.total}</p>
            </div>
          </div>

          {/* Colonne droite — nouveaux membres, opportunités, onglets, listes */}
          <div
            ref={directoryMainRef}
            id="directory-main"
            className="order-2 scroll-mt-24 space-y-6 lg:order-none lg:col-span-8"
          >
            <NewMembersStrip
              copy={h}
              lang={lang}
              profiles={stats.newThisWeekProfiles}
              totalNewThisWeek={stats.newThisWeekCount}
              onSeeAll={() => {
                setViewMode('members');
                setMembersSortRecent(true);
                requestAnimationFrame(() =>
                  directoryMainRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                );
              }}
            />

            {/* Opportunités du réseau (données = besoins urgents) */}
            <OpportunitiesSection
              copy={h}
              lang={lang}
              posts={urgentPosts}
              allProfiles={allProfiles}
              user={user}
              onSeeAll={() => {
                setViewMode('opportunities');
                requestAnimationFrame(() =>
                  directoryMainRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                );
              }}
              onPost={() => setShowUrgentPostModal(true)}
              onCreateProfile={() => {
                setAuthError(null);
                setShowAuthModal(true);
              }}
              onOpenPost={(post) => {
                const author = allProfiles.find((ap) => ap.uid === post.authorId);
                if (author) setSelectedProfile(author);
              }}
            />

            {/* View Mode Tabs */}
            <div className="flex bg-white p-1 rounded-2xl border border-stone-200 shadow-sm overflow-x-auto no-scrollbar">
              {[
                { id: 'companies', icon: Building2, label: t('companies') },
                { id: 'members', icon: Users, label: t('members') },
                { id: 'activities', icon: Activity, label: t('activities') },
                { id: 'opportunities', icon: Target, label: t('opportunities') }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setViewMode(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                    viewMode === tab.id 
                      ? "bg-stone-900 text-white shadow-lg" 
                      : "text-stone-400 hover:text-stone-600 hover:bg-stone-50"
                  )}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Recommendations Section */}
            {user && profile && (
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-indigo-500" />
                  <h2 className="text-lg font-bold text-stone-900">{t('recommendedForYou')}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {matchLoading || (matches.length === 0 && !aiRecResolved) ? (
                    [1, 2, 3].map(i => (
                      <div key={i} className="h-48 bg-white rounded-2xl border border-stone-100 animate-pulse flex flex-col p-5 gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-stone-100 rounded-xl" />
                          <div className="space-y-2 flex-1">
                            <div className="h-4 bg-stone-100 rounded w-3/4" />
                            <div className="h-3 bg-stone-100 rounded w-1/2" />
                          </div>
                        </div>
                        <div className="h-16 bg-stone-50 rounded-xl" />
                      </div>
                    ))
                  ) : matches.length > 0 ? (
                    matches.map(m => {
                      const p = allProfiles.find(ap => ap.uid === m.profileId);
                      if (!p) return null;
                      return (
                        <React.Fragment key={m.profileId}>
                          <MatchCard 
                            m={m} 
                            p={p} 
                            onShare={(id) => {
                              const found = allProfiles.find(ap => ap.uid === id);
                              if (found) setSelectedProfile(found);
                            }}
                            expanded={expandedHookId === m.profileId}
                            onToggleHook={() => setExpandedHookId(expandedHookId === m.profileId ? null : m.profileId)}
                          />
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <div className="col-span-3 py-8 px-4 text-center bg-white rounded-2xl border border-dashed border-stone-200 space-y-3">
                      <p className="text-sm text-stone-500">
                        {matchBlockReason === 'incomplete_profile' && t('aiRecCompleteProfile')}
                        {matchBlockReason === 'few_members' && t('aiRecFewMembers')}
                        {matchBlockReason === 'api_error' && t('aiRecUnavailable')}
                        {(matchBlockReason === 'empty_result' || matchBlockReason === null) &&
                          t('aiRecNoSuggestions')}
                      </p>
                      {(matchBlockReason === 'api_error' || matchBlockReason === 'empty_result') && (
                        <button
                          type="button"
                          onClick={refreshAiMatches}
                          disabled={matchLoading}
                          className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2 text-xs font-bold text-white hover:bg-stone-800 disabled:opacity-50"
                        >
                          <RefreshCw size={14} className={matchLoading ? 'animate-spin' : ''} />
                          {t('aiRecRetry')}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Main Content Area based on viewMode */}
            <div className="space-y-6">
              {viewMode === 'companies' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                  {profilesSortedForCompanies.map((p) => (
                    <React.Fragment key={p.uid}>
                      <ProfileCard 
                        variant="company"
                        p={p} 
                        onSelect={setSelectedProfile}
                        onEdit={startEditing}
                        onDelete={setProfileToDelete}
                        user={user}
                        profile={profile}
                      />
                    </React.Fragment>
                  ))}
                </div>
              )}

              {viewMode === 'members' && (
                <div className="space-y-6">
                  {membersSortRecent && (
                    <div className="flex flex-col gap-2 rounded-2xl border border-blue-100 bg-blue-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-medium text-blue-950">{h.membersSortBanner}</p>
                      <button
                        type="button"
                        onClick={() => setMembersSortRecent(false)}
                        className="text-sm font-semibold text-blue-800 underline-offset-2 hover:underline"
                      >
                        {h.membersSortReset}
                      </button>
                    </div>
                  )}
                  {highlightedNeedFilter && (
                    <div className="flex items-center justify-between bg-violet-50 p-4 rounded-2xl border border-violet-100">
                      <div className="flex items-center gap-3">
                        <Target className="w-5 h-5 text-violet-600" />
                        <p className="text-sm font-medium text-violet-900">
                          {t('filterByTypedNeed')}{' '}
                          <span className="font-bold">{needOptionLabel(highlightedNeedFilter, lang)}</span>
                        </p>
                      </div>
                      <button 
                        onClick={() => setHighlightedNeedFilter('')}
                        className="text-xs font-bold text-violet-700 hover:text-violet-900 underline"
                      >
                        {lang === 'fr' ? 'Effacer le filtre' : 'Quitar filtro'}
                      </button>
                    </div>
                  )}
                  {passionIdFilter && (
                    <div className="flex items-center justify-between bg-rose-50 p-4 rounded-2xl border border-rose-100">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xl shrink-0" aria-hidden>
                          {getPassionEmoji(passionIdFilter)}
                        </span>
                        <p className="text-sm font-medium text-rose-900 min-w-0">
                          {t('filterByPassion')}{' '}
                          <span className="font-bold">{getPassionLabel(passionIdFilter, lang)}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPassionIdFilter('')}
                        className="text-xs font-bold text-rose-700 hover:text-rose-900 underline shrink-0"
                      >
                        {lang === 'fr' ? 'Effacer le filtre' : 'Quitar filtro'}
                      </button>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                    {membersDisplayList.map((p) => (
                      <React.Fragment key={p.uid}>
                        <ProfileCard 
                          p={p} 
                          onSelect={setSelectedProfile}
                          onEdit={startEditing}
                          onDelete={setProfileToDelete}
                          user={user}
                          profile={profile}
                        />
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {viewMode === 'activities' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-sm flex flex-col lg:flex-row lg:items-end gap-4">
                    <div className="flex-1 min-w-[220px] space-y-1">
                      <label className="text-[10px] uppercase tracking-widest text-stone-400 font-bold block">
                        {t('activityCategory')}
                      </label>
                      <select 
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-900 outline-none transition-all text-sm font-medium"
                      >
                        <option value="">{t('allIndustries')}</option>
                        {ACTIVITY_CATEGORIES.map((c) => (
                          <option key={c} value={c}>{activityCategoryLabel(c, lang)}</option>
                        ))}
                      </select>
                    </div>
                    <p className="text-xs text-stone-500 leading-relaxed lg:max-w-md">
                      {t('filterSectorHint')}
                    </p>
                  </div>
                  {activityCategoryPopularity.filter(([cat]) => cat).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {activityCategoryPopularity
                        .filter(([cat]) => cat)
                        .slice(0, 12)
                        .map(([cat, count]) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setFilterCategory(filterCategory === cat ? '' : cat)}
                            className={cn(
                              'px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all',
                              filterCategory === cat
                                ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                                : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-300 hover:bg-stone-100'
                            )}
                          >
                            {activityCategoryLabel(cat, lang)}
                            <span className="opacity-70 font-medium"> · {count}</span>
                          </button>
                        ))}
                    </div>
                  )}
                  {profilesSortedForActivities.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-stone-200">
                      <Briefcase size={40} className="mx-auto text-stone-200 mb-3" />
                      <p className="text-stone-500 text-sm font-medium px-4">
                        {lang === 'fr'
                          ? 'Aucun profil pour ce secteur. Essayez « Toutes les industries » ou un autre secteur.'
                          : 'No hay perfiles para este sector. Prueba « Todas las industrias » u otro sector.'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                      {profilesSortedForActivities.map((p) => (
                        <React.Fragment key={p.uid}>
                          <ProfileCard 
                            variant="activity"
                            p={p} 
                            onSelect={setSelectedProfile}
                            onEdit={startEditing}
                            onDelete={setProfileToDelete}
                            user={user}
                            profile={profile}
                          />
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {viewMode === 'opportunities' && (
                <div className="space-y-8">
                  <div className="bg-stone-900 rounded-3xl p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                    <div className="relative z-10">
                      <h2 className="text-3xl font-bold tracking-tight mb-2">{t('radar')}</h2>
                      <p className="text-stone-400 text-sm mb-8">{lang === 'fr' ? 'Visualisez les besoins et opportunités du réseau en temps réel.' : 'Visualiza las necesidades y oportunidades de la red en tiempo real.'}</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                          <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1">{lang === 'fr' ? 'Membres Actifs' : 'Miembros Activos'}</p>
                          <p className="text-2xl font-bold">{allProfiles.filter(p => Date.now() - (p.lastSeen ?? 0) < 2592000000).length}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                          <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1">{lang === 'fr' ? 'Besoins Postés' : 'Necesidades Publicadas'}</p>
                          <p className="text-2xl font-bold">{urgentPosts.length}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                          <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1">{t('keywordsUniqueStat')}</p>
                          <p className="text-2xl font-bold">{[...new Set(allProfiles.flatMap(p => p.targetSectors || []))].length}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                    <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm">
                      <h3 className="text-lg font-bold text-stone-900 mb-6 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-emerald-600" />
                        {t('keywordsTopRadar')}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {(Object.entries(
                          allProfiles.reduce((acc, p) => {
                            (p.targetSectors || []).forEach(s => acc[s] = (acc[s] || 0) + 1);
                            return acc;
                          }, {} as Record<string, number>)
                        ) as [string, number][]).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([key, count]) => (
                          <div key={key} className="px-4 py-2 bg-stone-50 border border-stone-100 rounded-2xl flex items-center gap-3">
                            <span className="text-sm font-medium text-stone-700">{key}</span>
                            <span className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-[10px] font-bold text-stone-400 border border-stone-100">
                              {count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm">
                      <h3 className="text-lg font-bold text-stone-900 mb-6 flex items-center gap-2">
                        <span className="text-xl" aria-hidden>
                          🎯
                        </span>
                        {t('passionsRadarNetwork')}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          const counts = allProfiles.reduce((acc, p) => {
                            sanitizePassionIds(p.passionIds).forEach((id) => {
                              acc[id] = (acc[id] || 0) + 1;
                            });
                            return acc;
                          }, {} as Record<string, number>);
                          const entries = (Object.entries(counts) as [string, number][]).sort(
                            (a, b) => b[1] - a[1] || getPassionLabel(a[0], lang).localeCompare(getPassionLabel(b[0], lang))
                          );
                          if (entries.length === 0) {
                            return (
                              <p className="text-sm text-stone-400 italic py-2 w-full text-center">
                                {t('passionsRadarEmpty')}
                              </p>
                            );
                          }
                          return entries.slice(0, 18).map(([id, count]) => (
                            <button
                              key={id}
                              type="button"
                              onClick={() => {
                                setViewMode('members');
                                setHighlightedNeedFilter('');
                                setPassionIdFilter(id);
                              }}
                              className="px-4 py-2 bg-stone-50 border border-stone-100 rounded-2xl flex items-center gap-2 hover:border-violet-200 hover:bg-violet-50/60 transition-all text-left group"
                            >
                              <span className="text-base shrink-0" aria-hidden>
                                {getPassionEmoji(id)}
                              </span>
                              <span className="text-sm font-medium text-stone-700 group-hover:text-violet-900">
                                {getPassionLabel(id, lang)}
                              </span>
                              <span className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-[10px] font-bold text-stone-400 border border-stone-100 group-hover:border-violet-100">
                                {count}
                              </span>
                            </button>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-stone-900 mb-6 flex items-center gap-2">
                      <Target className="w-5 h-5 text-violet-600" />
                      {t('typedNeedsRadar')}
                    </h3>
                    <div className="space-y-4 max-h-[min(420px,50vh)] overflow-y-auto pr-1">
                      {(Object.entries(
                        allProfiles.reduce((acc, p) => {
                          (p.highlightedNeeds || []).forEach((id) => {
                            if (!NEED_OPTION_VALUE_SET.has(id)) return;
                            acc[id] = (acc[id] || 0) + 1;
                          });
                          return acc;
                        }, {} as Record<string, number>)
                      ) as [string, number][])
                        .sort((a, b) => b[1] - a[1])
                        .map(([needId, count]) => (
                          <div key={needId} className="flex items-center justify-between group">
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between gap-2 mb-1">
                                <span className="text-sm font-medium text-stone-700 line-clamp-2">
                                  {needOptionLabel(needId, lang)}
                                </span>
                                <span className="text-xs font-bold text-stone-400 shrink-0">{count}</span>
                              </div>
                              <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(count / Math.max(allProfiles.length, 1)) * 100}%` }}
                                  className="h-full bg-violet-500 rounded-full"
                                />
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setViewMode('members');
                                setPassionIdFilter('');
                                setHighlightedNeedFilter(needId);
                              }}
                              className="ml-4 p-2 text-stone-300 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 shrink-0"
                            >
                              <ChevronRight size={16} />
                            </button>
                          </div>
                        ))}
                      {allProfiles.every(
                        (p) => !(p.highlightedNeeds || []).some((id) => NEED_OPTION_VALUE_SET.has(id))
                      ) && (
                        <p className="text-sm text-stone-400 italic py-4 text-center">
                          {t('typedNeedsRadarEmpty')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

            {filteredProfiles.length === 0 && (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-stone-300">
                <Search size={48} className="mx-auto text-stone-200 mb-4" />
                <p className="text-stone-400 font-medium">{t('noSearchResults')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>

      {/* Profile Detail Modal */}
      <AnimatePresence>
        {selectedProfile && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProfile(null)}
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 sm:p-8 overflow-y-auto">
                <button 
                  onClick={() => setSelectedProfile(null)}
                  className="absolute top-6 right-6 p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-400 hover:text-stone-900"
                >
                  <Plus size={24} className="rotate-45" />
                </button>

                <div className="flex flex-col sm:flex-row gap-5 items-start mb-5">
                  <div className="w-24 h-24 bg-stone-100 rounded-3xl flex items-center justify-center text-stone-300 flex-shrink-0 overflow-hidden">
                    {selectedProfile.photoURL ? (
                      <img src={selectedProfile.photoURL} alt={selectedProfile.fullName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <UserIcon size={48} />
                    )}
                  </div>
                  <div className="pt-2 flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-3xl font-bold tracking-tight text-stone-900 mb-1">{selectedProfile.fullName}</h2>
                        <p className="text-xl text-stone-500 font-medium">{selectedProfile.companyName}</p>
                        {selectedProfile.positionCategory && (
                          <p className="text-sm text-stone-600 mt-2 flex items-center gap-2">
                            <UserCog size={16} className="text-stone-400 shrink-0" />
                            {workFunctionLabel(selectedProfile.positionCategory, lang)}
                          </p>
                        )}
                      </div>
                      {selectedProfile.linkedin && (
                        <a 
                          href={selectedProfile.linkedin} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="p-3 bg-stone-50 text-stone-400 hover:text-blue-600 hover:bg-stone-100 rounded-2xl transition-all"
                        >
                          <Linkedin size={24} />
                        </a>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-stone-100 text-stone-600 rounded-full text-xs font-bold uppercase tracking-wider">
                        {activityCategoryLabel(selectedProfile.activityCategory, lang)}
                      </span>
                      <span className="px-3 py-1 bg-stone-100 text-stone-600 rounded-full text-xs font-bold uppercase tracking-wider">
                        {selectedProfile.city}
                      </span>
                    </div>
                    {profile?.role === 'admin' && selectedProfile.isValidated === false && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={async () => {
                            await handleValidateProfile(selectedProfile.uid, true);
                            setSelectedProfile((prev) => prev ? { ...prev, isValidated: true } : prev);
                          }}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all"
                        >
                          {t('validate')}
                        </button>
                        <button
                          onClick={() => generateOptimizationSuggestion(selectedProfile)}
                          disabled={optimizationBusy}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {optimizationBusy ? (lang === 'fr' ? 'Analyse IA...' : 'Analizando IA...') : (lang === 'fr' ? 'Analyser avec IA' : 'Analizar con IA')}
                        </button>
                      </div>
                    )}
                    {profile?.role === 'admin' && selectedProfile.isValidated === false && selectedProfile.optimizationSuggestion && (
                      <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl space-y-3">
                        <p className="text-xs font-bold text-indigo-900">
                          {lang === 'fr' ? 'Resume des optimisations proposees:' : 'Resumen de optimizaciones propuestas:'}
                        </p>
                        <ul className="text-xs text-indigo-800 list-disc pl-4 space-y-1">
                          {selectedProfile.optimizationSuggestion.summary.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                        <button
                          onClick={() => sendOptimizationEmail(selectedProfile)}
                          className="px-4 py-2 bg-white text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-all"
                        >
                          {lang === 'fr' ? 'Envoyer ces suggestions par email' : 'Enviar estas sugerencias por correo'}
                        </button>
                      </div>
                    )}
                    {optimizationError && (
                      <p className="mt-3 text-xs text-red-600">{optimizationError}</p>
                    )}
                  </div>
                </div>

                {user && profile && profile.uid !== selectedProfile.uid && (
                  <AffinityScore
                    viewer={profile}
                    target={selectedProfile}
                    lang={lang}
                    t={t}
                    canRevealPrivateWhatsApp={!!user}
                  />
                )}

                <div className="mb-4 space-y-3 md:mb-5">
                  <div className="rounded-2xl border border-indigo-100/50 bg-indigo-50/50 p-4">
                    <h3 className="mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                      <Search size={12} />
                      {t('needsSought')}
                    </h3>
                    {sanitizeHighlightedNeeds(selectedProfile.highlightedNeeds).length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-1">
                        {sanitizeHighlightedNeeds(selectedProfile.highlightedNeeds).map((id) => (
                          <span
                            key={id}
                            className="rounded-lg border border-violet-200 bg-white px-2 py-0.5 text-[10px] font-bold text-violet-800"
                          >
                            {needOptionLabel(id, lang)}
                          </span>
                        ))}
                      </div>
                    )}
                    {sanitizeHighlightedNeeds(selectedProfile.highlightedNeeds).length === 0 && (
                      <p className="text-sm font-medium text-indigo-900">{t('noNeedsSpecified')}</p>
                    )}
                  </div>
                  {selectedProfile.targetSectors && selectedProfile.targetSectors.length > 0 && (
                    <div className="rounded-xl border border-indigo-100/40 bg-indigo-50/30 px-4 py-3">
                      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-indigo-400">{t('targetSectors')}</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedProfile.targetSectors.map((s) => (
                          <span
                            key={s}
                            className="rounded-full bg-stone-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-600"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-5">
                  <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4 md:p-5">
                    <div className="grid grid-cols-1 gap-y-3 md:grid-cols-2 md:gap-x-8 md:gap-y-3">
                      <h3 className="order-1 text-[10px] uppercase tracking-[0.2em] text-stone-400 font-black md:order-1">
                        {t('companyDescription')}
                      </h3>
                      <h3 className="order-3 text-[10px] uppercase tracking-[0.2em] text-stone-400 font-black md:order-2">
                        {t('company')}
                      </h3>
                      <div className="order-2 min-w-0 md:order-3">
                        <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">
                          {selectedProfile.bio?.trim() ? selectedProfile.bio.trim() : t('noCompanyDescription')}
                        </p>
                      </div>
                      <div className="order-4 space-y-2 md:order-4">
                        <div className="flex items-center gap-3 group">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-stone-400 shadow-sm ring-1 ring-stone-100 group-hover:bg-stone-100 transition-colors">
                            <Building2 size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{t('creationYear')}</p>
                            <p className="text-sm font-medium text-stone-900">{selectedProfile.creationYear || '-'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 group">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-stone-400 shadow-sm ring-1 ring-stone-100 group-hover:bg-stone-100 transition-colors">
                            <Users size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{t('employeeCount')}</p>
                            <p className="text-sm font-medium text-stone-900">
                              {formatEmployeeCountDisplay(selectedProfile.employeeCount) || '-'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 group">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-stone-400 shadow-sm ring-1 ring-stone-100 group-hover:bg-stone-100 transition-colors">
                            <Calendar size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{t('arrivalYear')}</p>
                            <p className="text-sm font-medium text-stone-900">
                              {selectedProfile.arrivalYear
                                ? `${selectedProfile.arrivalYear} (${new Date().getFullYear() - selectedProfile.arrivalYear} ans)`
                                : '-'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 group">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-stone-400 shadow-sm ring-1 ring-stone-100 group-hover:bg-stone-100 transition-colors">
                            <Heart size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold tracking-wide text-stone-400">{t('passions')}</p>
                            {sanitizePassionIds(selectedProfile.passionIds).length > 0 ? (
                              <div className="mt-1 flex flex-wrap gap-1.5">
                                {sanitizePassionIds(selectedProfile.passionIds).map((id) => (
                                  <span
                                    key={id}
                                    className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-900 ring-1 ring-rose-100"
                                  >
                                    <span aria-hidden>{getPassionEmoji(id)}</span>
                                    {getPassionLabel(id, lang)}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm font-medium text-stone-400">—</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
                  <div>
                      <h3 className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">{t('details')}</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-4 group">
                          <div className="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center text-stone-400 group-hover:bg-stone-100 transition-colors">
                            <MapPin size={18} />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">{t('city')}</p>
                            <p className="text-sm font-medium text-stone-900">{selectedProfile.city}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 group">
                          <div className="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center text-stone-400 group-hover:bg-stone-100 transition-colors">
                            <MapPin size={18} />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">{t('neighborhood')}</p>
                            <p className="text-sm font-medium text-stone-900">{selectedProfile.neighborhood || '-'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 group">
                          <div className="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center text-stone-400 group-hover:bg-stone-100 transition-colors">
                            <MapPin size={18} />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">{t('state')}</p>
                            <p className="text-sm font-medium text-stone-900">{selectedProfile.state || 'Jalisco'}</p>
                          </div>
                        </div>
                      </div>
                  </div>

                  <div className="border-t border-stone-200 pt-6 md:border-t-0 md:border-l md:border-stone-200 md:pt-0 md:pl-8">
                      <h3 className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-black mb-2">
                        {lang === 'fr' ? 'Contact' : 'Contacto'}
                      </h3>
                      <div className="space-y-4">
                        <div className="group">
                          {(selectedProfile.isEmailPublic || user) ? (
                            <a href={`mailto:${selectedProfile.email}`} className="flex items-start gap-4 p-3 rounded-2xl hover:bg-stone-50 transition-all border border-transparent hover:border-stone-100">
                              <div className="w-10 h-10 rounded-xl bg-stone-900 flex items-center justify-center text-white shrink-0">
                                <Mail size={18} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">{t('email')}</p>
                                <p className="text-sm font-medium text-stone-900 break-all">{selectedProfile.email}</p>
                              </div>
                            </a>
                          ) : (
                            <div className="flex items-center gap-4 p-3">
                              <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400">
                                <Mail size={18} />
                              </div>
                              <div className="blur-[4px] select-none">
                                <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">{t('email')}</p>
                                <p className="text-sm font-medium text-stone-900">email@example.com</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {selectedProfile.whatsapp && (
                          <div className="group">
                            {(selectedProfile.isWhatsappPublic || user) ? (
                              <a href={`https://wa.me/${selectedProfile.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-start gap-4 p-3 rounded-2xl hover:bg-emerald-50 transition-all border border-transparent hover:border-emerald-100">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shrink-0">
                                  <Phone size={18} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[10px] uppercase tracking-widest text-emerald-600/50 font-bold">{t('whatsapp')}</p>
                                  <p className="text-sm font-medium text-stone-900">{selectedProfile.whatsapp}</p>
                                </div>
                              </a>
                            ) : (
                              <div className="flex items-center gap-4 p-3">
                                <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400">
                                  <Phone size={18} />
                                </div>
                                <div className="blur-[4px] select-none">
                                  <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">{t('whatsapp')}</p>
                                  <p className="text-sm font-medium text-stone-900">+52 33 0000 0000</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {selectedProfile.website && (
                          <div className="group">
                            <a href={selectedProfile.website} target="_blank" rel="noopener noreferrer" className="flex items-start gap-4 p-3 rounded-2xl hover:bg-stone-50 transition-all border border-transparent hover:border-stone-100">
                              <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600 shrink-0">
                                <Globe size={18} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">{t('website')}</p>
                                <p className="text-sm font-medium text-stone-900 break-words break-all">{selectedProfile.website.replace(/^https?:\/\//, '')}</p>
                              </div>
                            </a>
                          </div>
                        )}
                      </div>
                  </div>
                </div>
                </div>

                {!user && (!selectedProfile.isEmailPublic || (selectedProfile.whatsapp && !selectedProfile.isWhatsappPublic)) && (
                  <div
                    className="mt-8 p-6 bg-stone-900 rounded-2xl text-white text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="text-sm font-medium mb-4 opacity-90">{t('registerPrompt')}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthError(null);
                        setSelectedProfile(null);
                        setShowAuthModal(true);
                      }}
                      disabled={authProviderBusy !== null}
                      className="w-full rounded-xl bg-white py-3 text-sm font-bold text-stone-900 transition-colors hover:bg-stone-100 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {t('register')}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Validation Panel Modal */}
      <AnimatePresence>
        {showValidationPanel && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowValidationPanel(false)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
            >
              <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-stone-900 rounded-xl flex items-center justify-center text-white">
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{t('newProfiles')}</h3>
                    <p className="text-xs text-stone-500">{pendingProfiles.length} {t('pendingValidation').toLowerCase()}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowValidationPanel(false)}
                  className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-400 hover:text-stone-900"
                >
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {pendingProfiles.length === 0 ? (
                  <div className="text-center py-12">
                    <Users size={48} className="mx-auto text-stone-100 mb-4" />
                    <p className="text-stone-400 font-medium">{t('noPendingProfiles')}</p>
                  </div>
                ) : (
                  pendingProfiles.map(p => (
                    <div key={p.uid} className="bg-stone-50 rounded-2xl p-4 border border-stone-100">
                      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-stone-300 overflow-hidden shrink-0">
                            {p.photoURL ? (
                              <img src={p.photoURL} alt={p.fullName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <UserIcon size={24} />
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-stone-900">{p.fullName}</h4>
                            <p className="text-xs text-stone-500">{p.companyName} • {activityCategoryLabel(p.activityCategory, lang)}</p>
                            <p className="text-[10px] text-stone-400 mt-1">{p.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button 
                            onClick={() => {
                              setShowValidationPanel(false);
                              setSelectedProfile(p);
                            }}
                            className="flex-1 sm:flex-none px-4 py-2 bg-white text-stone-600 rounded-lg text-xs font-bold border border-stone-200 hover:bg-stone-100 transition-all"
                          >
                            {t('details')}
                          </button>
                          <button 
                            onClick={() => handleValidateProfile(p.uid, true)}
                            className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all"
                          >
                            {t('validate')}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showOnboarding && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-stone-900/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl p-8 text-center"
            >
              <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Trophy size={40} />
              </div>
              <h2 className="text-2xl font-bold text-stone-900 mb-4">{t('onboardingWelcomeTitle')}</h2>
              <p className="text-stone-600 mb-8 leading-relaxed">
                {t('onboardingWelcomeBody')}
              </p>
              <div className="space-y-4">
                <button 
                  onClick={() => { setShowOnboarding(false); setIsEditing(true); }}
                  className="w-full bg-stone-900 text-white py-4 rounded-2xl font-bold hover:bg-stone-800 transition-all shadow-lg"
                >
                  {t('onboardingCompleteProfile')}
                </button>
                <button 
                  onClick={() => setShowOnboarding(false)}
                  className="w-full bg-stone-100 text-stone-600 py-4 rounded-2xl font-bold hover:bg-stone-200 transition-all"
                >
                  {t('onboardingLater')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUrgentPostModal && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUrgentPostModal(false)}
              className="absolute inset-0 bg-stone-900/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl p-8"
            >
              <button 
                onClick={() => setShowUrgentPostModal(false)}
                className="absolute top-6 right-6 p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-400 hover:text-stone-900"
              >
                <Plus size={20} className="rotate-45" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
                  <Zap size={24} />
                </div>
                <h3 className="text-xl font-bold text-stone-900">{t('postUrgentNeed')}</h3>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!user || !profile) return;
                const formData = new FormData(e.currentTarget);
                const text = formData.get('text') as string;
                const sector = formData.get('sector') as string;
                
                try {
                  await addDoc(collection(db, 'urgent_posts'), {
                    authorId: user.uid,
                    authorName: profile.fullName,
                    authorCompany: profile.companyName,
                    authorPhoto: profile.photoURL || '',
                    text,
                    sector,
                    createdAt: Date.now(),
                    expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
                  });
                  setShowUrgentPostModal(false);
                } catch (error) {
                  handleFirestoreError(error, OperationType.CREATE, 'urgent_posts');
                }
              }} className="space-y-6">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{t('bio')} (max 200 caractères)</label>
                  <textarea 
                    name="text" 
                    required 
                    maxLength={200}
                    placeholder="Ex: Cherche distributeur logistique pour Guadalajara..." 
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all h-32 resize-none" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{t('activityCategory')}</label>
                  <select name="sector" required className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all">
                    {ACTIVITY_CATEGORIES.map(c => <option key={c} value={c}>{activityCategoryLabel(c, lang)}</option>)}
                  </select>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Votre annonce sera visible par tous les membres pendant 7 jours. Elle apparaîtra en priorité sur la page d'accueil.
                  </p>
                </div>
                <button 
                  type="submit" 
                  className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200"
                >
                  {t('save')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isLinkedInModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLinkedInModalOpen(false)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8"
            >
              <button 
                onClick={() => setIsLinkedInModalOpen(false)}
                className="absolute top-6 right-6 p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-400 hover:text-stone-900"
              >
                <Plus size={20} className="rotate-45" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                  <Linkedin size={24} />
                </div>
                <h3 className="text-xl font-bold text-stone-900">{t('linkedinPhotoHelperTitle')}</h3>
              </div>

              <div className="space-y-4 mb-8">
                <p className="text-sm text-stone-600 leading-relaxed">{t('linkedinPhotoHelperStep1')}</p>
                <p className="text-sm text-stone-600 leading-relaxed">{t('linkedinPhotoHelperStep2')}</p>
                <p className="text-sm text-stone-600 leading-relaxed">{t('linkedinPhotoHelperStep3')}</p>
                <p className="text-sm text-stone-600 leading-relaxed font-medium text-stone-900">{t('linkedinPhotoHelperStep4')}</p>
              </div>

              <div className="flex flex-col gap-3">
                <a 
                  href={(document.getElementById('linkedin-input') as HTMLInputElement)?.value || "https://linkedin.com"} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-stone-900 text-white rounded-xl font-bold text-center hover:bg-stone-800 transition-all flex items-center justify-center gap-2"
                >
                  <ExternalLink size={18} />
                  {t('openLinkedin')}
                </a>
                <button 
                  onClick={() => setIsLinkedInModalOpen(false)}
                  className="w-full py-3 bg-stone-100 text-stone-600 rounded-xl font-bold hover:bg-stone-200 transition-all"
                >
                  {t('cancel')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {profileToDelete && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setProfileToDelete(null)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 text-center"
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6">
                <Plus size={32} className="rotate-45" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-2">{t('delete')}</h3>
              <p className="text-sm text-stone-500 mb-8 leading-relaxed">{t('confirmDelete')}</p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => handleDeleteProfile(profileToDelete)}
                  className="w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all"
                >
                  {t('delete')}
                </button>
                <button 
                  onClick={() => setProfileToDelete(null)}
                  className="w-full py-3 bg-stone-100 text-stone-600 rounded-xl font-bold hover:bg-stone-200 transition-all"
                >
                  {t('cancel')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="mt-12 border-t border-stone-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-center text-xs text-stone-400 sm:text-left">
              © {new Date().getFullYear()} {t('signature')}
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-xs text-stone-400 transition-colors hover:text-stone-900">
                Privacy
              </a>
              <a href="#" className="text-xs text-stone-400 transition-colors hover:text-stone-900">
                Terms
              </a>
              <a href="#" className="text-xs text-stone-400 transition-colors hover:text-stone-900">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
      {profile && (
        <ShareNeedsModal 
          isOpen={isShareNeedsModalOpen} 
          onClose={() => setIsShareNeedsModalOpen(false)} 
          profile={profile} 
        />
      )}
    </div>
  );
};

const App = () => {
  return (
    <HelmetProvider>
      <LanguageProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainApp />} />
            <Route path="/profil/:profileId" element={<ProfilePage />} />
            <Route path="/besoin/:needId" element={<NeedPage />} />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </HelmetProvider>
  );
};

export default App;
