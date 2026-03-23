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
  setPersistence,
  browserLocalPersistence,
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
  deleteField,
  getDocFromServer,
  updateDoc,
  where,
  addDoc,
  limit,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import {
  UserProfile,
  Language,
  Role,
  GENDER_STAT_VALUES,
  type GenderStat,
  type CommunityCompanyKind,
  type CommunityMemberStatus,
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
  cityOptionLabel,
  WORK_FUNCTION_OPTIONS,
  MEMBERS_THRESHOLD,
  isEmployeeCountRange,
  companySizeFromEmployeeRange,
  formatEmployeeCountDisplay,
  employeeCountToSelectDefault,
  activityCategoryLabel,
  workFunctionLabel,
} from './constants';
import { EN_STRINGS } from './i18n/en';
import { pickLang, uiLocale, sortLocale } from './lib/uiLocale';
import {
  profileMatchesLocationFilter,
  type LocationFilterKey,
  type ProfileTypeFilterKey,
} from './lib/directoryFilters';
import { NATIONALITY_OPTIONS, nationalityLabel } from './lib/nationalityOptions';
import {
  loadUserAdminPrivate,
  saveUserAdminPrivate,
  legacyAdminFromUserDoc,
  USER_ADMIN_PRIVATE_COLLECTION,
  type UserAdminPrivateDoc,
} from './lib/userAdminPrivate';
import {
  AUTH_LEADS_COLLECTION,
  upsertAuthLeadFromFirebaseUser,
  type AuthLeadDoc,
} from './lib/authLeads';
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
import {
  WORKING_LANGUAGE_OPTIONS,
  TYPICAL_CLIENT_SIZE_VALUES,
  sanitizeWorkingLanguageCodes,
  typicalClientSizeLabel,
  workingLanguageLabel,
  type TypicalClientSize,
} from './lib/contactPreferences';
import {
  profileMeetsPublicationRequirements,
  AI_OPTIMIZATION_READINESS_TARGET,
} from './lib/profilePublicationRules';
import {
  profileCoachFingerprint,
  formatLocalProfileCoachLine,
  fetchAiProfileCoachLine,
  normalizeAiCoachToSingleTip,
} from './lib/profileCoach';
import {
  URGENT_POST_PRIVATE_COLLECTION,
  mergeUrgentPostFromFirestore,
  isUrgentPostListedForEveryone,
  isUrgentPostPendingModeration,
  type UrgentPostPrivateDoc,
} from './lib/urgentPosts';
import { getGeminiApiKey } from './lib/geminiEnv';
import IceBreakerInterests from './components/profile/IceBreakerInterests';
import HeroSection from './components/home/HeroSection';
import WelcomeContextCard from './components/home/WelcomeContextCard';
import SearchBlock, { DirectoryRandomProfileButton } from './components/home/SearchBlock';
import MembersCountBlock from './components/home/MembersCountBlock';
import InviteNetworkModal from './components/home/InviteNetworkModal';
import NewMembersStrip from './components/home/NewMembersStrip';
import OpportunitiesSection from './components/home/OpportunitiesSection';
import NetworkRadarSection from './components/home/NetworkRadarSection';
import AiTranslatedFreeText from './components/AiTranslatedFreeText';
import ProfileAvatar from './components/ProfileAvatar';
import {
  ProfileCardBio,
  ProfileCardEmailContact,
  ProfileCardWhatsappContactFooter,
} from './components/profile/ProfileCardUi';
import { Header as AppHeader } from './components/Header';
import { DirectoryTabBar } from './components/DirectoryUi';
import HomeFunFactStrip from './components/home/HomeFunFactStrip';
import DashboardPage from './components/dashboard/DashboardPage';
import { homeLanding } from './copy/homeLanding';
import AffinityScore from './components/AffinityScore';
import { profileMatchesSearchQuery } from './profileSearch';
import {
  GUEST_DIRECTORY_PREVIEW_LIMIT,
  isGuestDirectoryRestricted,
} from './lib/guestDirectory';
import { GuestDirectoryInterstitial } from './components/guest/GuestDirectoryInterstitial';
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
  LayoutDashboard,
  Target,
  MessageSquare,
  Star,
  Send,
  Copy,
  RefreshCw,
  ArrowLeft,
  UserCog,
  Sparkles,
  Maximize2,
  LogIn,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { GoogleGenAI } from "@google/genai";
import { cn } from './cn';
import { cardPad, pageMainPad, pageSectionPad } from './lib/pageLayout';

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
  const connecting = pickLang('Connexion...', 'Conectando...', 'Signing in...', lang);
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
const isAdminEmail = (email?: string | null) =>
  (email || '').trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();

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

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback(
    (key: string) => {
      const row = TRANSLATIONS[key];
      if (!row) return key;
      if (lang === 'en') return EN_STRINGS[key] ?? row.fr;
      return row[lang];
    },
    [lang]
  );
  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

const EMPTY_URGENT_AUTHOR_IDS: ReadonlySet<string> = new Set();
const PROFILE_CARD_TAG_GROUP_LIMIT = 3;
const PROFILE_CARD_NEW_MS = 7 * 24 * 60 * 60 * 1000;

function trimProfileWebsite(website: string | undefined | null): { href: string; label: string } | null {
  const w = website?.trim();
  if (!w) return null;
  const href = /^https?:\/\//i.test(w) ? w : `https://${w}`;
  const label = w.replace(/^https?:\/\//i, '');
  return { href, label };
}

/** Site web sous le nom de société : une ligne, domaine tronqué (évite le retour laid dans la colonne Contact). */
function ProfileWebsiteInlineLink({
  website,
  className,
  onClick,
}: {
  website: string | undefined | null;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  const ws = trimProfileWebsite(website);
  if (!ws) return null;
  return (
    <a
      href={ws.href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className={cn(
        'inline-flex min-w-0 max-w-full items-center gap-1.5 font-medium text-blue-700 transition-colors hover:text-blue-900 hover:underline',
        className
      )}
    >
      <Globe size={14} className="shrink-0 text-blue-600" strokeWidth={2} aria-hidden />
      <span className="min-w-0 truncate">{ws.label}</span>
    </a>
  );
}

/** Tags listing (passions + besoins structurés), style unifié, max 3 + « +X » par groupe. */
function ProfileCardTagsBlock({
  profile: p,
  urgentAuthorIds,
}: {
  profile: UserProfile;
  urgentAuthorIds: ReadonlySet<string>;
}) {
  const { lang, t } = useLanguage();
  const [expandPassions, setExpandPassions] = useState(false);
  const [expandNeeds, setExpandNeeds] = useState(false);

  const passionIds = sanitizePassionIds(p.passionIds);
  const needIds = sanitizeHighlightedNeeds(p.highlightedNeeds).filter((id) =>
    NEED_OPTION_VALUE_SET.has(id)
  );

  const isNew =
    p.createdAt.toMillis() > Date.now() - PROFILE_CARD_NEW_MS && p.isValidated !== false;
  const isUrgentAuthor = urgentAuthorIds.has(p.uid);

  if (passionIds.length === 0 && needIds.length === 0 && !isNew && !isUrgentAuthor) {
    return null;
  }

  const tagPassion =
    'inline-flex max-w-full items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600';
  const tagNeed =
    'inline-flex max-w-full items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-500';
  const tagMore =
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-slate-500 bg-slate-100 transition-colors hover:bg-slate-200';
  const tagNew =
    'inline-flex items-center rounded-full border border-blue-200 bg-blue-100 px-3 py-0.5 text-xs font-semibold text-blue-700';
  const tagUrgent =
    'inline-flex items-center rounded-full border border-amber-200 bg-amber-100 px-3 py-0.5 text-xs font-semibold text-amber-800';

  const renderGroup = (
    ids: string[],
    getLabel: (id: string) => string,
    expanded: boolean,
    setExpanded: (v: boolean) => void,
    Icon: typeof Briefcase,
    tagClass: string
  ) => {
    if (ids.length === 0) return null;
    const shown = expanded ? ids : ids.slice(0, PROFILE_CARD_TAG_GROUP_LIMIT);
    const extra = ids.length - shown.length;
    return (
      <div className="flex flex-wrap items-start gap-x-1.5 gap-y-1">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.75} aria-hidden />
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-1">
          {shown.map((id) => (
            <span key={id} className={cn(tagClass, 'max-w-full')}>
              <span className="line-clamp-2 break-words">{getLabel(id)}</span>
            </span>
          ))}
          {extra > 0 && !expanded && (
            <button
              type="button"
              className={tagMore}
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(true);
              }}
            >
              {t('tagsMore').replace(/\{\{count\}\}/g, String(extra))}
            </button>
          )}
          {expanded && ids.length > PROFILE_CARD_TAG_GROUP_LIMIT && (
            <button
              type="button"
              className="text-xs font-medium text-slate-500 underline-offset-2 hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(false);
              }}
            >
              {t('tagsCollapse')}
            </button>
          )}
        </div>
      </div>
    );
  };

  const hasStatus = isNew || isUrgentAuthor;
  const hasTagsBelow = passionIds.length > 0 || needIds.length > 0;

  return (
    <div className="mb-1 mt-1 flex flex-col gap-2">
      {hasStatus && (
        <div
          className={cn(
            'flex flex-wrap gap-1.5',
            hasTagsBelow && 'border-b border-slate-100 pb-2'
          )}
        >
          {isNew && <span className={tagNew}>{t('tagNewMember')}</span>}
          {isUrgentAuthor && <span className={tagUrgent}>{t('tagUrgentNeed')}</span>}
        </div>
      )}
      {hasTagsBelow && (
        <div className={cn('flex flex-col gap-2', hasStatus && 'pt-0.5')}>
          {renderGroup(
            passionIds,
            (id) => getPassionLabel(id, lang),
            expandPassions,
            setExpandPassions,
            Briefcase,
            tagPassion
          )}
          {renderGroup(
            needIds,
            (id) => needOptionLabel(id, lang),
            expandNeeds,
            setExpandNeeds,
            Target,
            tagNeed
          )}
        </div>
      )}
    </div>
  );
}

type ProfileCardVariant = 'default' | 'company' | 'activity';

const ProfileCard = ({
  p,
  isOwn = false,
  onEdit,
  onDelete,
  onSelect,
  user,
  profile,
  variant = 'default',
  urgentAuthorIds = EMPTY_URGENT_AUTHOR_IDS,
  guestDirectoryTeaser = false,
  onGuestJoin,
}: {
  p: UserProfile;
  isOwn?: boolean;
  onEdit?: (p: UserProfile) => void;
  onDelete?: (uid: string) => void;
  onSelect: (p: UserProfile) => void;
  user: any;
  profile: UserProfile | null;
  variant?: ProfileCardVariant;
  urgentAuthorIds?: ReadonlySet<string>;
  /** Aperçu visiteur : bio courte + zone basse masquée par CTA */
  guestDirectoryTeaser?: boolean;
  onGuestJoin?: () => void;
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

  const mobileSummaryLine = [
    p.city,
    p.activityCategory ? activityCategoryLabel(p.activityCategory, lang) : '',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      key={p.uid}
      id={`profile-card-${p.uid}`}
      onClick={() => onSelect(p)}
      className={cn(
        'relative flex min-h-0 cursor-pointer flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow group hover:shadow-md sm:p-5',
        guestDirectoryTeaser ? 'h-auto' : 'h-full'
      )}
    >
      <div className="mb-2 flex shrink-0 justify-between items-start gap-2">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="relative shrink-0">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-stone-200">
              <ProfileAvatar photoURL={p.photoURL} fullName={p.fullName} className="h-full w-full" iconSize={24} />
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
                {!guestDirectoryTeaser ? (
                  <ProfileWebsiteInlineLink
                    website={p.website}
                    className="mb-1 w-full text-xs sm:text-sm"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : null}
                <p className="text-sm text-stone-600 font-medium flex items-center gap-1.5 flex-wrap">
                  <UserIcon size={14} className="text-stone-400 shrink-0" />
                  <span className="truncate">{p.fullName}</span>
                </p>
                {mobileSummaryLine ? (
                  <p className="mt-0.5 truncate text-xs text-stone-500 sm:hidden">{mobileSummaryLine}</p>
                ) : null}
                {p.positionCategory ? (
                  <div className="mt-1 hidden items-start gap-1.5 text-xs text-stone-500 sm:flex">
                    <UserCog size={12} className="mt-0.5 shrink-0 text-stone-400" />
                    <span className="line-clamp-2 break-words leading-snug">
                      {workFunctionLabel(p.positionCategory, lang)}
                    </span>
                  </div>
                ) : null}
                <div className="mt-1 hidden items-start gap-1.5 text-xs text-stone-500 sm:flex">
                  <MapPin size={12} className="shrink-0 mt-0.5 text-stone-400" />
                  <span className="min-w-0 flex-1 leading-snug line-clamp-2 break-words">
                    {[p.city, p.neighborhood, p.state || 'Jalisco'].filter(Boolean).join(', ')}
                  </span>
                </div>
                <div className="mt-0.5 hidden items-start gap-1.5 text-xs text-stone-500 sm:flex">
                  <Briefcase size={12} className="shrink-0 mt-0.5 text-stone-400" />
                  <span className="min-w-0 flex-1 leading-snug line-clamp-2 break-words">
                    {p.activityCategory ? activityCategoryLabel(p.activityCategory, lang) : '—'}
                  </span>
                </div>
                {p.bio?.trim() ? (
                  guestDirectoryTeaser ? (
                    <p className="mt-1.5 text-sm leading-snug text-slate-600 line-clamp-1">{p.bio.trim()}</p>
                  ) : (
                    <ProfileCardBio text={p.bio} t={t} />
                  )
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
                      : pickLang('Secteur non renseigné', 'Sector no indicado', 'Sector not specified', lang)}
                  </h3>
                </div>
                <p className="text-sm font-semibold text-stone-800 truncate">{p.companyName}</p>
                {!guestDirectoryTeaser ? (
                  <ProfileWebsiteInlineLink
                    website={p.website}
                    className="mt-0.5 w-full text-xs sm:text-sm"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : null}
                <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-stone-500">
                  <span className="truncate">{p.fullName}</span>
                </p>
                {p.city ? (
                  <p className="mt-0.5 truncate text-[11px] text-stone-500 sm:hidden">{p.city}</p>
                ) : null}
                {p.positionCategory ? (
                  <div className="mt-1 hidden items-start gap-1.5 text-[11px] text-stone-500 sm:flex">
                    <UserCog size={11} className="mt-0.5 shrink-0 text-stone-400" />
                    <span className="line-clamp-2 leading-snug break-words">
                      {workFunctionLabel(p.positionCategory, lang)}
                    </span>
                  </div>
                ) : null}
                <div className="mt-1 hidden items-start gap-1.5 text-[11px] text-stone-500 sm:flex">
                  <MapPin size={11} className="shrink-0 mt-0.5 text-stone-400" />
                  <span className="min-w-0 flex-1 leading-snug line-clamp-2 break-words">
                    {[p.city, p.neighborhood, p.state || 'Jalisco'].filter(Boolean).join(', ')}
                  </span>
                </div>
                {p.bio?.trim() ? (
                  guestDirectoryTeaser ? (
                    <p className="mt-1.5 text-sm leading-snug text-slate-600 line-clamp-1">{p.bio.trim()}</p>
                  ) : (
                    <ProfileCardBio text={p.bio} t={t} />
                  )
                ) : null}
              </>
            )}
            {variant === 'default' && (
              <>
                <h3 className="font-bold text-stone-900 group-hover:text-stone-700 transition-colors leading-tight line-clamp-2 break-words">
                  {p.fullName}
                </h3>
                <p className="text-xs text-stone-500 font-medium truncate mt-0.5">{p.companyName}</p>
                {!guestDirectoryTeaser ? (
                  <ProfileWebsiteInlineLink
                    website={p.website}
                    className="mt-0.5 w-full text-[11px] sm:text-xs"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : null}
                {mobileSummaryLine ? (
                  <p className="mt-0.5 truncate text-xs text-stone-500 sm:hidden">{mobileSummaryLine}</p>
                ) : null}
                {p.positionCategory ? (
                  <div className="mt-1 hidden items-start gap-1.5 text-xs text-stone-600 sm:flex">
                    <UserCog size={12} className="mt-0.5 shrink-0 text-stone-400" />
                    <span className="line-clamp-2 break-words leading-snug">
                      {workFunctionLabel(p.positionCategory, lang)}
                    </span>
                  </div>
                ) : null}
                <div className="mt-1 hidden items-start gap-1.5 text-xs text-stone-500 sm:flex">
                  <MapPin size={12} className="shrink-0 mt-0.5 text-stone-400" />
                  <span className="min-w-0 flex-1 leading-snug line-clamp-2 break-words">
                    {[p.city, p.neighborhood, p.state || 'Jalisco'].filter(Boolean).join(', ')}
                  </span>
                </div>
                <div className="mt-0.5 hidden items-start gap-1.5 text-xs text-stone-500 sm:flex">
                  <Briefcase size={12} className="shrink-0 mt-0.5 text-stone-400" />
                  <span className="min-w-0 flex-1 leading-snug line-clamp-2 break-words">
                    {p.activityCategory ? activityCategoryLabel(p.activityCategory, lang) : '—'}
                  </span>
                </div>
                {p.bio?.trim() ? (
                  guestDirectoryTeaser ? (
                    <p className="mt-1.5 text-sm leading-snug text-slate-600 line-clamp-1">{p.bio.trim()}</p>
                  ) : (
                    <ProfileCardBio text={p.bio} t={t} />
                  )
                ) : null}
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div
            className={cn(
              'hidden flex-col items-center gap-2 pb-0.5 sm:flex',
              guestDirectoryTeaser && 'sm:hidden'
            )}
          >
            {recCount > 0 && (
              <div
                className="relative mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-700 text-white shadow-sm ring-1 ring-blue-700/20"
                title={
                  pickLang(
                    `${recCount} recommandation(s)`,
                    `${recCount} recomendacion(es)`,
                    `${recCount} recommendation(s)`,
                    lang
                  )
                }
                onClick={(e) => e.stopPropagation()}
              >
                <Star size={16} className="fill-white text-white" strokeWidth={1.5} />
                <span className="absolute -bottom-1.5 left-1/2 min-w-[15px] -translate-x-1/2 rounded-full bg-white px-0.5 py-px text-center text-[8px] font-black leading-tight text-blue-700 shadow-sm ring-1 ring-blue-100">
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

      {guestDirectoryTeaser ? (
        <div className="relative mt-1.5 h-[100px] w-full shrink-0 sm:h-[104px]">
          <div
            className="pointer-events-none absolute inset-0 flex flex-col justify-end space-y-1.5 pb-0.5 opacity-50 blur-sm select-none"
            aria-hidden
          >
            <div className="flex flex-wrap gap-1.5">
              <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-400">······</span>
              <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-xs text-amber-200">······</span>
            </div>
            <div className="h-2.5 w-3/4 max-w-[12rem] rounded bg-slate-100" />
            <div className="h-2.5 w-1/2 max-w-[9rem] rounded bg-slate-100" />
            <div className="h-7 w-full rounded-lg bg-slate-100" />
            <div className="h-7 w-full rounded-lg bg-emerald-50" />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-white/85 px-3 py-2 text-center backdrop-blur-[2px]">
            <div className="flex items-center gap-1.5 text-[11px] font-medium leading-tight text-slate-600 sm:text-xs">
              <Lock className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
              {t('guestOverlayTitle')}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onGuestJoin?.();
              }}
              className="w-full max-w-[16rem] rounded-lg bg-blue-700 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
            >
              {t('guestJoinCta')}
            </button>
          </div>
        </div>
      ) : (
        <>
          <ProfileCardTagsBlock profile={p} urgentAuthorIds={urgentAuthorIds} />

          <div className="mt-auto w-full shrink-0">
            <div className="flex w-full shrink-0 flex-col gap-1.5 border-t border-slate-100 pt-2.5">
              <div className="flex min-h-[2.25rem] w-full items-stretch">
                <ProfileCardEmailContact
                  email={p.email}
                  canView={Boolean(p.isEmailPublic || (user && profile?.isValidated))}
                  t={t}
                />
              </div>
              <div className="flex min-h-[2.25rem] w-full items-stretch">
                {p.whatsapp ? (
                  <ProfileCardWhatsappContactFooter
                    whatsapp={p.whatsapp}
                    canView={Boolean(p.isWhatsappPublic || (user && profile?.isValidated))}
                    t={t}
                  />
                ) : (
                  <div className="min-h-[2.25rem] w-full rounded-lg border border-transparent bg-transparent px-3 py-2" aria-hidden />
                )}
              </div>
            </div>
          </div>
        </>
      )}
      <div
        className="pointer-events-none absolute bottom-2 right-2 z-[1] text-stone-400 sm:hidden"
        aria-hidden
      >
        <Maximize2 size={15} strokeWidth={2} className="opacity-75" />
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
  const { lang, t } = useLanguage();
  return (
    <div className="bg-white rounded-2xl border border-indigo-100 p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-12 -mt-12 blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex items-start justify-between mb-4 relative">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 overflow-hidden rounded-xl border border-indigo-100">
            <ProfileAvatar
              photoURL={p.photoURL}
              fullName={p.fullName}
              className="h-full w-full bg-indigo-50"
              iconSize={24}
            />
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

      <div className="mb-4 text-xs italic leading-relaxed text-stone-600 line-clamp-2 min-h-0 break-words">
        <AiTranslatedFreeText
          lang={lang}
          t={t}
          text={m.reason}
          as="span"
          omitAiDisclaimer
          className="line-clamp-2 break-words"
        />
      </div>

      <div className="space-y-3">
        <button 
          onClick={onToggleHook}
          className="w-full py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all flex items-center justify-center gap-2"
        >
          <MessageSquare size={14} />
          {pickLang("Comment l'aborder ?", '¿Cómo abordarle?', 'How to reach out?', lang)}
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
                <AiTranslatedFreeText lang={lang} t={t} text={m.hook} className="leading-relaxed" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => onShare(p.uid)}
          className="w-full py-2 border border-stone-200 text-stone-600 rounded-xl text-xs font-bold hover:bg-stone-50 transition-all flex items-center justify-center gap-2"
        >
          <Share2 size={14} />
          {pickLang('Voir le profil', 'Ver perfil', 'View profile', lang)}
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
    const intro = pickLang('Bonjour, ', 'Hola, ', 'Hello, ', lang);
    const bits: string[] = [
      pickLang(
        `je mets en avant ces besoins : ${typed}.`,
        `destaco estas necesidades: ${typed}.`,
        `I’m highlighting these needs: ${typed}.`,
        lang
      ),
    ];
    const outro = pickLang(
      'Si vous avez des pistes ou connaissez quelqu’un, contactez-moi ! ',
      'Si tiene pistas o conoce a alguien, ¡escríbame! ',
      'If you have leads or know someone, please reach out! ',
      lang
    );
    setMessage(intro + bits.join(' ') + ' ' + outro + `${window.location.origin}/profil/${profile.uid}`);
  }, [profile.highlightedNeeds, profile.uid, lang]);

  const handleRegenerate = async () => {
    setIsGenerating(true);
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const apiKey = getGeminiApiKey();
      if (!apiKey) throw new Error('missing-gemini-api-key');
      const ai = new GoogleGenAI({ apiKey });
      const needsForAi = formatHighlightedNeedsForText(profile.highlightedNeeds, lang) || '—';
      const prompt = pickLang(
        `Reformule de manière professionnelle et engageante pour un partage LinkedIn/WhatsApp. Besoins structurés (tags): "${needsForAi}". Message court (max 200 caractères), sans guillemets autour du résultat.`,
        `Reformula de forma profesional y atractiva para compartir en LinkedIn/WhatsApp. Necesidades estructuradas (etiquetas): "${needsForAi}". Mensaje breve (máx. 200 caracteres), sin comillas alrededor del resultado.`,
        `Rephrase in a professional, engaging way for LinkedIn/WhatsApp sharing. Structured needs (tags): "${needsForAi}". Short message (max 200 characters), no quotes around the result.`,
        lang
      );
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      const text = response.text || '';
      const footer = pickLang(
        `\n\nMon profil : ${window.location.origin}/profil/${profile.uid}`,
        `\n\nMi perfil: ${window.location.origin}/profil/${profile.uid}`,
        `\n\nMy profile: ${window.location.origin}/profil/${profile.uid}`,
        lang
      );
      setMessage(`${text}${footer}`);
    } catch (error) {
      console.error('Gemini error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    alert(pickLang('Copié !', '¡Copiado!', 'Copied!', lang));
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
            {pickLang('Partager mes besoins', 'Compartir mis necesidades', 'Share my needs', lang)}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-full transition-colors">
            <Plus className="rotate-45 text-stone-500" size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-2">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">
              {pickLang('Aperçu du besoin', 'Vista previa de la necesidad', 'Need preview', lang)}
            </p>
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
              {pickLang('Message personnalisé', 'Mensaje personalizado', 'Custom message', lang)}
              <button 
                onClick={handleRegenerate}
                disabled={
                  isGenerating ||
                  !formatHighlightedNeedsForText(profile.highlightedNeeds, lang)
                }
                className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-bold disabled:opacity-50"
              >
                <RefreshCw size={12} className={isGenerating ? "animate-spin" : ""} />
                {pickLang("Régénérer avec l'IA", 'Regenerar con IA', 'Regenerate with AI', lang)}
              </button>
            </label>
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full h-32 p-4 bg-stone-50 border border-stone-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
              placeholder={pickLang('Votre message ici...', 'Su mensaje aquí...', 'Your message here...', lang)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 py-3 bg-stone-100 text-stone-700 rounded-2xl font-bold hover:bg-stone-200 transition-all"
            >
              <Copy size={18} />
              {pickLang('Copier', 'Copiar', 'Copy', lang)}
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
  const tp = t;

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

      <div className="mx-auto max-w-4xl px-4 pt-8 sm:px-6 lg:px-8">
        <button onClick={() => navigate('/')} className="mb-6 flex items-center gap-2 text-stone-500 hover:text-stone-900 font-bold transition-colors">
          <ArrowLeft size={20} />
          {pickLang("Retour à l'accueil", 'Volver al inicio', 'Back to home', lang)}
        </button>

        <div className="bg-white rounded-[2.5rem] shadow-xl border border-stone-200 overflow-hidden">
          <div className="h-48 bg-gradient-to-r from-indigo-600 to-violet-600 relative">
            <div className="absolute -bottom-16 left-4 p-2 bg-white rounded-3xl shadow-lg sm:left-8">
              <div className="h-32 w-32 overflow-hidden rounded-2xl border-4 border-white bg-stone-100">
                <ProfileAvatar
                  photoURL={profile.photoURL}
                  fullName={profile.fullName}
                  className="h-full w-full"
                  initialsClassName="text-2xl font-bold text-stone-400 sm:text-3xl"
                  iconSize={48}
                />
              </div>
            </div>
            <button 
              onClick={handleShare}
              className="absolute right-4 top-4 rounded-2xl border border-white/30 bg-white/20 p-3 text-white shadow-lg backdrop-blur-md transition-all hover:bg-white/30 sm:right-6 sm:top-6"
            >
              <Share2 size={20} />
            </button>
          </div>

          <div className="px-4 pb-8 pt-20 sm:px-6 sm:pb-10 md:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div>
                <div className="mb-2">
                  <h1 className="inline-flex max-w-full flex-wrap items-center gap-2 text-4xl font-black tracking-tight text-stone-900">
                    <span className="min-w-0 break-words">{profile.fullName}</span>
                    {profile.linkedin?.trim() ? (
                      <a
                        href={
                          profile.linkedin.trim().startsWith('http')
                            ? profile.linkedin.trim()
                            : `https://${profile.linkedin.trim()}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-[#0A66C2] transition-opacity hover:opacity-80 focus:outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-[#0A66C2] focus-visible:ring-offset-2"
                        aria-label="LinkedIn"
                      >
                        <Linkedin className="size-[0.82em]" strokeWidth={2} aria-hidden />
                      </a>
                    ) : null}
                  </h1>
                </div>
                <p className="text-xl text-stone-500 font-medium flex items-center gap-2">
                  <Building2 size={20} className="text-stone-400" />
                  {profile.companyName}
                </p>
                <ProfileWebsiteInlineLink website={profile.website} className="mt-1 w-full max-w-xl text-base" />
                {profile.positionCategory && (
                  <p className="text-base text-stone-600 mt-2 flex items-center gap-2">
                    <UserCog size={18} className="text-stone-400 shrink-0" />
                    {workFunctionLabel(profile.positionCategory, lang)}
                  </p>
                )}
              </div>

              {currentUser && (
                <div className="flex w-full max-w-xl flex-col gap-2 sm:max-w-2xl sm:flex-row sm:items-stretch sm:gap-3">
                  <div className="min-w-0 flex-1">
                    <ProfileCardEmailContact
                      email={profile.email}
                      canView={Boolean(
                        profile.isEmailPublic || (currentUser && currentProfile?.isValidated)
                      )}
                      t={t}
                    />
                  </div>
                  {profile.whatsapp ? (
                    <div className="min-w-0 flex-1">
                      <ProfileCardWhatsappContactFooter
                        whatsapp={profile.whatsapp}
                        canView={Boolean(
                          profile.isWhatsappPublic || (currentUser && currentProfile?.isValidated)
                        )}
                        t={t}
                      />
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-8">
                <section>
                  <h2 className="text-xs font-black text-stone-400 uppercase tracking-[0.2em] mb-4">{tp('companyDescription')}</h2>
                  {profile.bio?.trim() ? (
                    <AiTranslatedFreeText
                      lang={lang}
                      t={t}
                      text={profile.bio}
                      className="text-stone-700 leading-relaxed text-lg"
                      whitespace="pre-wrap"
                    />
                  ) : (
                    <p className="text-stone-700 leading-relaxed text-lg whitespace-pre-wrap">{tp('noCompanyDescription')}</p>
                  )}
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
                      {pickLang('Voir le besoin', 'Ver la necesidad', 'View need', lang)}
                      <ChevronRight size={16} />
                    </button>
                  )}
                </section>

                {profile.pitchVideoUrl && (
                  <section>
                    <h2 className="text-xs font-black text-stone-400 uppercase tracking-[0.2em] mb-4">
                      {pickLang('Pitch Vidéo', 'Video pitch', 'Video pitch', lang)}
                    </h2>
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
                              alert(
                                pickLang(
                                  'Le pitch est limité à 60 secondes.',
                                  'El pitch está limitado a 60 segundos.',
                                  'The pitch is limited to 60 seconds.',
                                  lang
                                )
                              );
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
                      {recs.length}{' '}
                      {pickLang('Recommandations', 'Recomendaciones', 'Recommendations', lang)}
                    </h2>
                    {currentUser && !hasAlreadyRecommended && currentUser.uid !== profileId && (
                      <button 
                        onClick={() => setShowRecModal(true)}
                        className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                      >
                        <Plus size={16} />
                        {pickLang('Je recommande', 'Yo recomiendo', 'I recommend', lang)}
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
                              {new Date(r.createdAt).toLocaleDateString(uiLocale(lang))}
                            </p>
                          </div>
                        </div>
                        <AiTranslatedFreeText
                          lang={lang}
                          t={t}
                          text={r.text}
                          className="text-stone-600 text-sm leading-relaxed italic"
                        />
                      </div>
                    ))}
                    {recs.length === 0 && (
                      <p className="text-center text-stone-400 py-8 italic">
                        {pickLang(
                          'Aucune recommandation pour le moment.',
                          'No hay recomendaciones por ahora.',
                          'No recommendations yet.',
                          lang
                        )}
                      </p>
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
                    t={t}
                    canRevealPrivateWhatsApp={!!currentUser}
                  />
                )}
                <div className="bg-stone-50 p-6 rounded-3xl border border-stone-200">
                  <h2 className="text-xs font-black text-stone-400 uppercase tracking-[0.2em] mb-4">{tp('details')}</h2>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600">
                        <Activity size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">{tp('activityCategory')}</p>
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
                  <div className="space-y-2">
                    <ProfileCardEmailContact
                      email={profile.email}
                      canView={Boolean(
                        profile.isEmailPublic || (currentUser && currentProfile?.isValidated)
                      )}
                      t={t}
                    />
                    {profile.whatsapp ? (
                      <ProfileCardWhatsappContactFooter
                        whatsapp={profile.whatsapp}
                        canView={Boolean(
                          profile.isWhatsappPublic || (currentUser && currentProfile?.isValidated)
                        )}
                        t={t}
                      />
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
            <h3 className="text-xl font-bold text-stone-900 mb-4">
              {pickLang('Recommander', 'Recomendar', 'Recommend', lang)} {profile.fullName}
            </h3>
            <textarea 
              value={recText}
              onChange={(e) => setRecText(e.target.value)}
              maxLength={200}
              className="w-full h-32 p-4 bg-stone-50 border border-stone-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none mb-4"
              placeholder={pickLang(
                'Pourquoi recommandez-vous ce membre ? (max 200 caractères)',
                '¿Por qué recomiendas a este miembro? (máx. 200 caracteres)',
                'Why do you recommend this member? (max 200 characters)',
                lang
              )}
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setShowRecModal(false)}
                className="flex-1 py-3 bg-stone-100 text-stone-600 rounded-2xl font-bold hover:bg-stone-200 transition-all"
              >
                {t('cancel')}
              </button>
              <button 
                onClick={handleAddRec}
                disabled={!recText.trim()}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
              >
                {pickLang('Publier', 'Publicar', 'Publish', lang)}
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

      <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-6 lg:px-8">
        <button onClick={() => navigate('/')} className="mb-6 flex items-center gap-2 text-stone-500 hover:text-stone-900 font-bold transition-colors">
          <ArrowLeft size={20} />
          {pickLang("Retour à l'accueil", 'Volver al inicio', 'Back to home', lang)}
        </button>

        <div className="bg-white rounded-[2.5rem] shadow-xl border border-stone-200 overflow-hidden mb-8">
          <div className="p-4 sm:p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-16 w-16 overflow-hidden rounded-2xl border border-stone-200 bg-stone-100">
                <ProfileAvatar
                  photoURL={profile.photoURL}
                  fullName={profile.fullName}
                  className="h-full w-full"
                  initialsClassName="text-lg font-bold text-stone-400"
                  iconSize={32}
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-stone-900">{profile.fullName}</h1>
                <p className="text-stone-500 font-medium">{profile.companyName}</p>
              </div>
              {urgentPost && (
                <div className="ml-auto px-4 py-2 bg-red-100 text-red-700 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-sm">
                  <Zap size={14} fill="currentColor" />
                  {pickLang('Urgent', 'Urgente', 'Urgent', lang)}
                </div>
              )}
            </div>

            <div className="bg-stone-50 p-8 rounded-[2rem] border border-stone-200 mb-8">
              <h2 className="text-xs font-black text-stone-400 uppercase tracking-[0.2em] mb-4">
                {pickLang('Description du besoin', 'Descripción de la necesidad', 'Need description', lang)}
              </h2>
              <div className="text-xl text-stone-800 font-bold leading-tight italic">
                {urgentPost?.text ? (
                  <AiTranslatedFreeText lang={lang} t={t} text={urgentPost.text} className="font-bold italic" />
                ) : (
                  <span>
                    {formatHighlightedNeedsForText(profile.highlightedNeeds, lang) ||
                      pickLang('Aucun besoin spécifié.', 'Ninguna necesidad especificada.', 'No need specified.', lang)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-xl shadow-sm text-indigo-600">
                  <UserIcon size={20} />
                </div>
                <p className="text-sm font-bold text-stone-700">
                  {pickLang('Voir le profil complet', 'Ver perfil completo', 'View full profile', lang)}
                </p>
              </div>
              <button 
                onClick={() => navigate(`/profil/${profile.uid}`)}
                className="px-6 py-2 bg-white text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-all border border-indigo-200 shadow-sm"
              >
                {pickLang('Ouvrir', 'Abrir', 'Open', lang)}
              </button>
            </div>
          </div>
        </div>

        <section className="bg-white rounded-[2.5rem] shadow-xl border border-stone-200 overflow-hidden">
          <div className="p-8 border-b border-stone-100">
            <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
              <MessageSquare className="text-indigo-600" size={24} />
              {comments.length}{' '}
              {pickLang('Commentaires', 'Comentarios', 'Comments', lang)}
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
                        {new Date(c.createdAt).toLocaleDateString(uiLocale(lang))}
                      </p>
                    </div>
                    <AiTranslatedFreeText lang={lang} t={t} text={c.text} className="text-stone-700 text-sm leading-relaxed" />
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-center text-stone-400 py-8 italic">
                  {pickLang(
                    'Soyez le premier à commenter ce besoin.',
                    'Sé el primero en comentar esta necesidad.',
                    'Be the first to comment on this need.',
                    lang
                  )}
                </p>
              )}
            </div>

            {currentUser && (
              <div className="pt-6 border-t border-stone-100">
                <div className="flex gap-3">
                  <textarea 
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="flex-1 p-4 bg-stone-50 border border-stone-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none h-24"
                    placeholder={pickLang(
                      'Ajouter un commentaire...',
                      'Añadir un comentario...',
                      'Add a comment...',
                      lang
                    )}
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
  const profileUidSet = useMemo(() => new Set(allProfiles.map((p) => p.uid)), [allProfiles]);
  const [isEditing, setIsEditing] = useState(false);
  const [isShareNeedsModalOpen, setIsShareNeedsModalOpen] = useState(false);
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  /** Champs genre / nationalité / délégations (collection `user_admin_private`). */
  const [formAdminPrivate, setFormAdminPrivate] = useState<UserAdminPrivateDoc | null>(null);
  const [formAdminPrivateReady, setFormAdminPrivateReady] = useState(false);
  const [adminModalPrivate, setAdminModalPrivate] = useState<UserAdminPrivateDoc | null>(null);
  const [adminModalPrivateLoading, setAdminModalPrivateLoading] = useState(false);
  const [pendingPrivateByUid, setPendingPrivateByUid] = useState<Record<string, UserAdminPrivateDoc>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterLocation, setFilterLocation] = useState<LocationFilterKey>('');
  const [filterProfileType, setFilterProfileType] = useState<ProfileTypeFilterKey>('');
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLinkedInModalOpen, setIsLinkedInModalOpen] = useState(false);
  const directoryMainRef = useRef<HTMLDivElement>(null);
  const [membersSortRecent, setMembersSortRecent] = useState(false);
  const [showValidationPanel, setShowValidationPanel] = useState(false);
  const [showAuthLeadsPanel, setShowAuthLeadsPanel] = useState(false);
  const [authLeads, setAuthLeads] = useState<AuthLeadDoc[]>([]);
  const [showOpportunitiesModerationPanel, setShowOpportunitiesModerationPanel] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<
    'companies' | 'members' | 'activities' | 'radar' | 'dashboard'
  >('members');
  /** Masque « Nouveaux membres » et « Opportunités » après interaction avec les onglets du listing (remonte le bloc principal). */
  const [directoryDiscoveryStripsHidden, setDirectoryDiscoveryStripsHidden] = useState(false);
  const [matches, setMatches] = useState<MatchSuggestion[]>([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchBlockReason, setMatchBlockReason] = useState<AiMatchBlockReason>(null);
  const [aiRecResolved, setAiRecResolved] = useState(false);
  const [urgentPublicDocs, setUrgentPublicDocs] = useState<
    Array<{ id: string; data: Record<string, unknown> }>
  >([]);
  const [urgentPrivateById, setUrgentPrivateById] = useState<Record<string, UrgentPostPrivateDoc>>({});
  const [highlightedNeedFilter, setHighlightedNeedFilter] = useState('');
  const [passionIdFilter, setPassionIdFilter] = useState('');
  const [highlightedNeedsDraft, setHighlightedNeedsDraft] = useState<string[]>([]);
  const [passionIdsDraft, setPassionIdsDraft] = useState<string[]>([]);
  const [workingLanguagesDraft, setWorkingLanguagesDraft] = useState<string[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showUrgentPostModal, setShowUrgentPostModal] = useState(false);
  const [expandedHookId, setExpandedHookId] = useState<string | null>(null);
  const [authProviderBusy, setAuthProviderBusy] = useState<SocialAuthProvider | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showInviteNetworkModal, setShowInviteNetworkModal] = useState(false);
  const [profileSaveBusy, setProfileSaveBusy] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);
  const [profileReminderDismissed, setProfileReminderDismissed] = useState(false);
  const [optimizationBusy, setOptimizationBusy] = useState(false);
  const [optimizationError, setOptimizationError] = useState<string | null>(null);
  const [profileCoachLine, setProfileCoachLine] = useState('');
  const [profileCoachSource, setProfileCoachSource] = useState<'local' | 'ai' | null>(null);
  const [profileCoachLoading, setProfileCoachLoading] = useState(false);

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
    const en = {
      unauthorizedDomain: `This domain (${host}) is not authorized in Firebase Auth. Add it under Authentication > Settings > Authorized domains.`,
      providerDisabled:
        "This provider (Google, Microsoft, or Apple) is not enabled in Firebase Auth > Sign-in method.",
      popupClosed: "The sign-in window was closed before finishing. Please try again.",
      generic: "Sign-in failed. Check Firebase Auth and that the provider is enabled."
    };
    const msg = lang === 'fr' ? fr : lang === 'es' ? es : en;

    if (code === 'auth/unauthorized-domain') return msg.unauthorizedDomain;
    if (code === 'auth/operation-not-allowed') return msg.providerDisabled;
    if (code === 'auth/popup-closed-by-user') return msg.popupClosed;
    if (code === 'auth/popup-timeout') {
      return pickLang(
        'La popup Google prend trop de temps. Redirection automatique en cours…',
        'La ventana de Google tarda demasiado. Redirección automática en curso…',
        'Google popup is taking too long. Automatic redirect in progress…',
        lang
      );
    }
    return msg.generic;
  };

  const pendingProfiles = useMemo(() => {
    return allProfiles.filter(p => p.isValidated === false);
  }, [allProfiles]);

  const pendingUidsKey = useMemo(
    () => pendingProfiles.map((p) => p.uid).sort().join(','),
    [pendingProfiles]
  );

  const oauthLeadsWithoutProfileCount = useMemo(
    () => authLeads.filter((l) => !profileUidSet.has(l.uid)).length,
    [authLeads, profileUidSet]
  );

  useEffect(() => {
    if (!isEditing || !user) {
      setFormAdminPrivate(null);
      setFormAdminPrivateReady(false);
      return;
    }
    const uid = editingProfile?.uid ?? profile?.uid;
    if (!uid) {
      setFormAdminPrivate(null);
      setFormAdminPrivateReady(false);
      return;
    }
    setFormAdminPrivateReady(false);
    const legacy = editingProfile ?? profile;
    let cancelled = false;
    loadUserAdminPrivate(uid, legacy)
      .then((d) => {
        if (!cancelled) {
          setFormAdminPrivate(d);
          setFormAdminPrivateReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFormAdminPrivate({});
          setFormAdminPrivateReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isEditing, editingProfile?.uid, profile?.uid, user]);

  useEffect(() => {
    if (!selectedProfile || profile?.role !== 'admin') {
      setAdminModalPrivate(null);
      setAdminModalPrivateLoading(false);
      return;
    }
    setAdminModalPrivateLoading(true);
    const uid = selectedProfile.uid;
    let cancelled = false;
    loadUserAdminPrivate(uid, selectedProfile)
      .then((d) => {
        if (!cancelled) {
          setAdminModalPrivate(d);
          setAdminModalPrivateLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAdminModalPrivate({});
          setAdminModalPrivateLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedProfile?.uid, profile?.role]);

  useEffect(() => {
    if (!showValidationPanel || profile?.role !== 'admin' || pendingProfiles.length === 0) {
      setPendingPrivateByUid({});
      return;
    }
    let cancelled = false;
    (async () => {
      const map: Record<string, UserAdminPrivateDoc> = {};
      await Promise.all(
        pendingProfiles.map(async (p) => {
          const d = await loadUserAdminPrivate(p.uid, p);
          map[p.uid] = d;
        })
      );
      if (!cancelled) setPendingPrivateByUid(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [showValidationPanel, profile?.role, pendingUidsKey, pendingProfiles]);

  useEffect(() => {
    setProfileReminderDismissed(false);
  }, [user?.uid]);

  useEffect(() => {
    if (!isEditing) return;
    const src = editingProfile ?? profile;
    if (!src) return;
    setHighlightedNeedsDraft(sanitizeHighlightedNeeds(src.highlightedNeeds));
    setPassionIdsDraft(sanitizePassionIds(src.passionIds));
    setWorkingLanguagesDraft(sanitizeWorkingLanguageCodes(src.workingLanguageCodes));
  }, [isEditing, editingProfile?.uid, profile?.uid]);

  const toggleWorkingLanguageDraft = (code: string) => {
    setWorkingLanguagesDraft((prev) => {
      if (prev.includes(code)) return prev.filter((x) => x !== code);
      if (prev.length >= 3) return prev;
      return [...prev, code];
    });
  };

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

  const urgentPosts = useMemo(
    () =>
      urgentPublicDocs.map(({ id, data }) =>
        mergeUrgentPostFromFirestore(id, data, urgentPrivateById[id] ?? null)
      ),
    [urgentPublicDocs, urgentPrivateById]
  );

  const urgentPostsListed = useMemo(
    () => urgentPosts.filter(isUrgentPostListedForEveryone),
    [urgentPosts]
  );

  const pendingUrgentForAdmin = useMemo(
    () =>
      profile?.role === 'admin'
        ? urgentPosts.filter(isUrgentPostPendingModeration)
        : [],
    [urgentPosts, profile?.role]
  );

  const urgentAuthorIdSet = useMemo(() => {
    const s = new Set<string>();
    urgentPostsListed.forEach((post) => {
      if (post.authorId) s.add(post.authorId);
    });
    return s;
  }, [urgentPostsListed]);

  const profileUpdateBanner = useMemo(() => {
    if (!profile) {
      return { show: false, mandatory: false, ai: false };
    }
    const pubOk = profileMeetsPublicationRequirements(profile);
    const readiness = getProfileAiRecommendationReadiness(profile);
    return {
      show: !pubOk || readiness < AI_OPTIMIZATION_READINESS_TARGET,
      mandatory: !pubOk,
      ai: pubOk && readiness < AI_OPTIMIZATION_READINESS_TARGET,
    };
  }, [profile]);

  useEffect(() => {
    if (!profile) {
      setProfileCoachLine('');
      setProfileCoachSource(null);
      setProfileCoachLoading(false);
      return;
    }

    const fp = profileCoachFingerprint(profile);
    const cacheKey = `profile_coach_ai_v2_${profile.uid}_${lang}`;

    if (isEditing) {
      setProfileCoachLine(formatLocalProfileCoachLine(profile, t));
      setProfileCoachSource('local');
      setProfileCoachLoading(false);
      return;
    }

    try {
      const raw = sessionStorage.getItem(cacheKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { text?: string; fp?: string };
        if (parsed?.text && parsed?.fp === fp) {
          setProfileCoachLine(normalizeAiCoachToSingleTip(parsed.text));
          setProfileCoachSource('ai');
          setProfileCoachLoading(false);
          return;
        }
      }
    } catch {
      sessionStorage.removeItem(cacheKey);
    }

    const local = formatLocalProfileCoachLine(profile, t);
    setProfileCoachLine(local);
    setProfileCoachSource('local');

    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      setProfileCoachLoading(false);
      return;
    }

    let cancelled = false;
    setProfileCoachLoading(true);
    fetchAiProfileCoachLine(apiKey, profile, lang)
      .then((text) => {
        if (cancelled || !text) return;
        setProfileCoachLine(text);
        setProfileCoachSource('ai');
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({ text, fp }));
        } catch {
          /* ignore */
        }
      })
      .catch(() => {
        /* garder le message local */
      })
      .finally(() => {
        if (!cancelled) setProfileCoachLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [profile, isEditing, lang, t]);

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
        try {
          sessionStorage.removeItem('oauth_redirect_pending');
        } catch {
          /* ignore */
        }
      }
      if (u) {
        void upsertAuthLeadFromFirebaseUser(db, u).catch((err) => {
          console.warn('[auth_leads]', err);
        });
        const docRef = doc(db, 'users', u.uid);
        const docSnap = await getDoc(docRef);
        
        // Update lastSeen
        await updateDoc(docRef, { lastSeen: Date.now() }).catch(() => {
          // If update fails, it might be because the doc doesn't exist yet
        });

        if (docSnap.exists()) {
          const loadedProfile = docSnap.data() as UserProfile;
          setProfile(
            isAdminEmail(u.email)
              ? ({ ...loadedProfile, role: 'admin' } as UserProfile)
              : loadedProfile
          );
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
      setUrgentPublicDocs(snapshot.docs.map((d) => ({ id: d.id, data: d.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'urgent_posts'));

    return () => {
      unsubscribe();
      unsubscribeProfiles();
      unsubscribeUrgent();
    };
  }, []);

  useEffect(() => {
    if (profile?.role !== 'admin') {
      setAuthLeads([]);
      return;
    }
    const q = query(
      collection(db, AUTH_LEADS_COLLECTION),
      orderBy('lastConnectedAt', 'desc'),
      limit(400)
    );
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        setAuthLeads(snapshot.docs.map((d) => d.data() as AuthLeadDoc));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, AUTH_LEADS_COLLECTION)
    );
    return () => unsub();
  }, [profile?.role]);

  useEffect(() => {
    if (!user) {
      setUrgentPrivateById({});
      return;
    }
    const unsub = onSnapshot(
      collection(db, URGENT_POST_PRIVATE_COLLECTION),
      (snapshot) => {
        const m: Record<string, UrgentPostPrivateDoc> = {};
        snapshot.docs.forEach((d) => {
          m[d.id] = d.data() as UrgentPostPrivateDoc;
        });
        setUrgentPrivateById(m);
      },
      (error) =>
        handleFirestoreError(error, OperationType.LIST, URGENT_POST_PRIVATE_COLLECTION)
    );
    return () => unsub();
  }, [user?.uid]);

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
    setPersistence(auth, browserLocalPersistence).catch((error) => {
      console.warn('Failed to set auth persistence', error);
    });

    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          setUser(result.user);
          setAuthError(null);
          try {
            sessionStorage.removeItem('oauth_redirect_pending');
          } catch {
            /* ignore */
          }
          return;
        }
        const pendingProvider = (() => {
          try {
            return sessionStorage.getItem('oauth_redirect_pending');
          } catch {
            return null;
          }
        })();
        if (pendingProvider) {
          setAuthError(
            pickLang(
              "Retour Google reçu sans session. Vérifiez les cookies navigateur (autoriser cookies tiers / suivi inter-sites), puis réessayez.",
              "Se recibió el retorno de Google pero sin sesión. Revisa cookies del navegador (permitir cookies de terceros / seguimiento entre sitios) y vuelve a intentar.",
              "Google redirect returned but no session was created. Check browser cookies (allow third-party / cross-site tracking) and try again.",
              lang
            )
          );
          try {
            sessionStorage.removeItem('oauth_redirect_pending');
          } catch {
            /* ignore */
          }
        }
      })
      .catch((error) => {
        const code = (error as { code?: string })?.code ?? '';
        if (!code || code === 'auth/popup-closed-by-user') return;
        setAuthError(`${getAuthErrorMessage(code)}${code ? ` (code: ${code})` : ''}`);
      });
  }, []);

  useEffect(() => {
    if (viewMode === 'dashboard' && profile?.role !== 'admin') {
      setViewMode('members');
    }
  }, [viewMode, profile?.role]);

  const handleSocialLogin = async (which: SocialAuthProvider) => {
    const provider = buildAuthProvider(which);
    setAuthProviderBusy(which);
    setAuthError(null);
    try {
      // In Cursor/Electron, popup auth can stall on passkey prompts.
      // Prefer redirect there; otherwise keep popup first and fallback to redirect.
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
      const shouldPreferRedirect = /Electron|Cursor/i.test(ua);
      try {
        sessionStorage.setItem('oauth_redirect_pending', which);
      } catch {
        /* ignore */
      }

      if (shouldPreferRedirect) {
        await signInWithRedirect(auth, provider);
        return;
      }

      const popupWithTimeout = Promise.race([
        signInWithPopup(auth, provider),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject({ code: 'auth/popup-timeout' }), 12000)
        ),
      ]);
      await popupWithTimeout;
      try {
        sessionStorage.removeItem('oauth_redirect_pending');
      } catch {
        /* ignore */
      }
    } catch (error) {
      console.error('Login failed', error);
      const firebaseCode = (error as { code?: string })?.code ?? '';
      const shouldFallbackToRedirect = [
        'auth/popup-blocked',
        'auth/popup-closed-by-user',
        'auth/cancelled-popup-request',
        'auth/operation-not-supported-in-this-environment',
        'auth/popup-timeout',
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
    const ecRaw = getTrimmed('employeeCount');
    let employeeCountVal: EmployeeCountRange | undefined;
    if (ecRaw === '') {
      employeeCountVal = undefined;
    } else if (isEmployeeCountRange(ecRaw)) {
      employeeCountVal = ecRaw;
    } else {
      setProfileSaveError(
        pickLang(
          "La fourchette « Nombre d'employés » sélectionnée est invalide.",
          'El rango de « Número de empleados » seleccionado no es válido.',
          'The selected employee count range is invalid.',
          lang
        )
      );
      setProfileSaveBusy(false);
      return;
    }

    const baseProfileProbe = isSelf ? profile : editingProfile;
    const computedCompanySizeProbe: UserProfile['companySize'] | undefined = employeeCountVal
      ? companySizeFromEmployeeRange(employeeCountVal)
      : baseProfileProbe?.companySize;

    const targetSectorListProbe =
      (formData.get('targetSectors') as string)?.split(',').map((s) => s.trim()).filter(Boolean) || [];

    const publicationProbe: Partial<UserProfile> = {
      fullName: getTrimmed('fullName'),
      companyName: getTrimmed('companyName'),
      email: getTrimmed('email'),
      activityCategory: getTrimmed('activityCategory'),
      positionCategory: getTrimmed('positionCategory'),
      city: getTrimmed('city'),
      website: getTrimmed('website'),
      whatsapp: getTrimmed('whatsapp'),
      bio: getTrimmed('bio'),
      employeeCount: employeeCountVal,
      companySize: computedCompanySizeProbe,
      highlightedNeeds: highlightedNeedsDraft,
      passionIds: passionIdsDraft,
      targetSectors: targetSectorListProbe,
    };

    if (!profileMeetsPublicationRequirements(publicationProbe)) {
      setProfileSaveError(
        pickLang(
          'Pour une fiche publiable et validable par l’admin, remplissez tous les champs marqués d’une astérisque (*), dont la bio (au moins 15 caractères), la fourchette d’employés, au moins un besoin mis en avant, et au moins une passion ou des mots-clés secteur.',
          'Para un perfil publicable y validable por el admin, completa los campos marcados con asterisco (*), incluida la bio (mín. 15 caracteres), el rango de empleados, al menos una necesidad destacada, y al menos una pasión o palabras clave de sector.',
          'To publish and get admin validation, complete every field marked with an asterisk (*), including your bio (min. 15 characters), employee range, at least one highlighted need, and at least one interest or sector keywords.',
          lang
        )
      );
      setProfileSaveBusy(false);
      return;
    }

    const posVal = getTrimmed('positionCategory');
    if (posVal && !(WORK_FUNCTION_OPTIONS as readonly string[]).includes(posVal)) {
      setProfileSaveError(
        pickLang(
          "La fonction dans l'entreprise selectionnee est invalide.",
          'La funcion en la empresa seleccionada no es valida.',
          'The selected role in the company is invalid.',
          lang
        )
      );
      setProfileSaveBusy(false);
      return;
    }

    const genderRaw = getTrimmed('genderStat');
    let genderStat: GenderStat | undefined;
    if (genderRaw === '') {
      genderStat = undefined;
    } else if ((GENDER_STAT_VALUES as readonly string[]).includes(genderRaw)) {
      genderStat = genderRaw as GenderStat;
    } else {
      setProfileSaveError(
        pickLang(
          'La valeur « Genre » sélectionnée est invalide.',
          'El valor de « Género » seleccionado no es válido.',
          'The selected gender value is invalid.',
          lang
        )
      );
      setProfileSaveBusy(false);
      return;
    }

    const nationalityRaw = getTrimmed('nationality');
    let nationality: string | undefined;
    if (nationalityRaw === '') {
      nationality = undefined;
    } else if (NATIONALITY_OPTIONS.some((o) => o.code === nationalityRaw)) {
      nationality = nationalityRaw;
    } else {
      setProfileSaveError(
        pickLang(
          'La nationalité sélectionnée est invalide.',
          'La nacionalidad seleccionada no es válida.',
          'The selected nationality is invalid.',
          lang
        )
      );
      setProfileSaveBusy(false);
      return;
    }

    const COMMUNITY_COMPANY_KINDS: readonly CommunityCompanyKind[] = [
      'startup',
      'pme',
      'corporate',
      'independent',
    ];
    const COMMUNITY_MEMBER_STATUSES: readonly CommunityMemberStatus[] = [
      'freelance',
      'employee',
      'owner',
    ];

    const cckRaw = getTrimmed('communityCompanyKind');
    let communityCompanyKind: CommunityCompanyKind | ReturnType<typeof deleteField>;
    if (cckRaw === '') {
      communityCompanyKind = deleteField();
    } else if ((COMMUNITY_COMPANY_KINDS as readonly string[]).includes(cckRaw)) {
      communityCompanyKind = cckRaw as CommunityCompanyKind;
    } else {
      setProfileSaveError(
        pickLang(
          'La taille d’entreprise (tableau de bord) sélectionnée est invalide.',
          'El tamaño de empresa (panel) seleccionado no es válido.',
          'The selected company size (dashboard) is invalid.',
          lang
        )
      );
      setProfileSaveBusy(false);
      return;
    }

    const cmsRaw = getTrimmed('communityMemberStatus');
    let communityMemberStatus: CommunityMemberStatus | ReturnType<typeof deleteField>;
    if (cmsRaw === '') {
      communityMemberStatus = deleteField();
    } else if ((COMMUNITY_MEMBER_STATUSES as readonly string[]).includes(cmsRaw)) {
      communityMemberStatus = cmsRaw as CommunityMemberStatus;
    } else {
      setProfileSaveError(
        pickLang(
          'Le statut professionnel (tableau de bord) sélectionné est invalide.',
          'El estatus profesional (panel) seleccionado no es válido.',
          'The selected professional status (dashboard) is invalid.',
          lang
        )
      );
      setProfileSaveBusy(false);
      return;
    }

    const tcsRaw = getTrimmed('typicalClientSize');
    let typicalClientSize: TypicalClientSize | ReturnType<typeof deleteField>;
    if (tcsRaw === '') {
      typicalClientSize = deleteField();
    } else if ((TYPICAL_CLIENT_SIZE_VALUES as readonly string[]).includes(tcsRaw)) {
      typicalClientSize = tcsRaw as TypicalClientSize;
    } else {
      setProfileSaveError(
        pickLang(
          'La taille de clients habituels sélectionnée est invalide.',
          'El tamaño habitual de clientes seleccionado no es válido.',
          'The selected typical client size is invalid.',
          lang
        )
      );
      setProfileSaveBusy(false);
      return;
    }

    const baseProfile = isSelf ? profile : editingProfile;
    const computedCompanySize: UserProfile['companySize'] = employeeCountVal
      ? companySizeFromEmployeeRange(employeeCountVal)
      : (baseProfile?.companySize ?? 'solo');

    const newProfile = {
      uid: targetUid,
      fullName: getTrimmed('fullName'),
      companyName: getTrimmed('companyName'),
      creationYear: optionalNumber('creationYear'),
      city: optionalString('city'),
      state: optionalString('state'),
      neighborhood: optionalString('neighborhood'),
      country: (() => {
        const v = getTrimmed('country');
        return v === '' ? deleteField() : v;
      })(),
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
      contactPreferenceCta: (() => {
        const v = getTrimmed('contactPreferenceCta');
        return v === '' ? deleteField() : v;
      })(),
      workingLanguageCodes: sanitizeWorkingLanguageCodes(workingLanguagesDraft),
      typicalClientSize,
      openToMentoring: formData.get('openToMentoring') === 'on',
      openToTalks: formData.get('openToTalks') === 'on',
      openToEvents: formData.get('openToEvents') === 'on',
      companySize: computedCompanySize,
      accountType: ((isSelf ? profile?.accountType : editingProfile?.accountType) ?? 'local') as 'local' | 'foreign',
      role: targetUid === user.uid && isAdminEmail(user.email)
        ? 'admin'
        : (editingProfile?.role || profile?.role || 'user') as Role,
      createdAt: (isSelf ? profile?.createdAt : editingProfile?.createdAt) || Timestamp.now(),
      isValidated: isSelf ? (profile?.isValidated ?? false) : (editingProfile?.isValidated ?? true),
      communityYearsInGdl: deleteField(),
      communityCompanyKind,
      communityMemberStatus,
    } as Record<string, unknown>;
    const sanitizedProfile = Object.fromEntries(
      Object.entries(newProfile).filter(([, value]) => value !== undefined)
    );

    const delegationFlag = formData.get('acceptsDelegationVisits') === 'on';
    const openToEventSponsoring =
      formAdminPrivateReady && formData.get('openToEventSponsoring') === 'on';

    try {
      await setDoc(doc(db, 'users', targetUid), sanitizedProfile as Partial<UserProfile>, {
        merge: true,
      });
      await saveUserAdminPrivate(targetUid, {
        genderStat,
        nationality,
        acceptsDelegationVisits: delegationFlag,
        openToEventSponsoring: formAdminPrivateReady ? openToEventSponsoring : undefined,
      });
      if (isSelf) {
        const fresh = await getDoc(doc(db, 'users', targetUid));
        if (fresh.exists()) setProfile(fresh.data() as UserProfile);
        setFormAdminPrivate((prev) => ({
          ...(prev ?? {}),
          genderStat,
          nationality,
          acceptsDelegationVisits: delegationFlag,
          ...(formAdminPrivateReady ? { openToEventSponsoring } : {}),
        }));
      }
      setIsEditing(false);
      setEditingProfile(null);
    } catch (error) {
      console.error('Profile save failed', error);
      const code = (error as { code?: string })?.code || '';
      if (code === 'permission-denied') {
        setProfileSaveError(
          pickLang(
            "Enregistrement refusé par Firestore (permission-denied). Vérifie les règles des collections « users » et « user_admin_private », et qu’elles sont publiées sur la bonne base Firestore (y compris base nommée, pas seulement « default »).",
            "Guardado rechazado por Firestore (permission-denied). Revisa las reglas de « users » y « user_admin_private » y que estén publicadas en la base correcta (incl. bases con nombre, no solo « default »).",
            "Save denied by Firestore (permission-denied). Check rules for “users” and “user_admin_private”, and that they are published on the correct database (including named DBs, not only “default”).",
            lang
          )
        );
      } else {
        setProfileSaveError(
          pickLang(
            `Impossible d'enregistrer le profil.${code ? ` (code: ${code})` : ''}`,
            `No se pudo guardar el perfil.${code ? ` (code: ${code})` : ''}`,
            `Could not save the profile.${code ? ` (code: ${code})` : ''}`,
            lang
          )
        );
      }
      return;
    } finally {
      setProfileSaveBusy(false);
    }
  };

  const handleDeleteProfile = async (uid: string) => {
    try {
      await deleteDoc(doc(db, USER_ADMIN_PRIVATE_COLLECTION, uid)).catch(() => {});
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

    const data = await Promise.all(
      allProfiles.map(async (p) => {
        const priv = await loadUserAdminPrivate(p.uid, p);
        return {
          ...p,
          ...priv,
          createdAt: p.createdAt.toDate().toISOString(),
        };
      })
    );
    
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
      const matchesLocation = profileMatchesLocationFilter(p, filterLocation);

      return matchesSearch && matchesCategory && matchesLocation;
    });
  }, [allProfiles, searchTerm, filterCategory, filterLocation, profile]);

  const distinctSectorCount = useMemo(() => {
    const s = new Set<string>();
    allProfiles.forEach((p) => {
      if (profile?.role !== 'admin' && p.isValidated === false) return;
      const c = (p.activityCategory || '').trim();
      if (c) s.add(c);
    });
    return s.size;
  }, [allProfiles, profile]);

  const showDirectoryClearFilters = useMemo(() => {
    return (
      searchTerm.trim() !== '' ||
      filterCategory !== '' ||
      filterLocation !== '' ||
      filterProfileType !== ''
    );
  }, [searchTerm, filterCategory, filterLocation, filterProfileType]);

  const showDiscoveryStrips = !showDirectoryClearFilters && !directoryDiscoveryStripsHidden;
  const isAdminDashboard = viewMode === 'dashboard' && profile?.role === 'admin';

  const directoryViewTabs = useMemo(
    () =>
      [
        { id: 'companies' as const, icon: Building2, label: t('companies') },
        { id: 'members' as const, icon: Users, label: t('members') },
        { id: 'activities' as const, icon: Briefcase, label: t('activities') },
        { id: 'radar' as const, icon: Activity, label: t('directoryTabRadar') },
        ...(profile?.role === 'admin'
          ? [{ id: 'dashboard' as const, icon: LayoutDashboard, label: t('dashboardTab') }]
          : []),
      ] as const,
    [t, profile?.role]
  );

  const clearDirectoryFilters = useCallback(() => {
    setSearchTerm('');
    setFilterCategory('');
    setFilterLocation('');
    setFilterProfileType('');
    setViewMode('members');
  }, []);

  const scrollDirectoryIntoView = useCallback(() => {
    requestAnimationFrame(() =>
      directoryMainRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    );
  }, []);

  const handleFilterProfileTypeChange = useCallback((v: ProfileTypeFilterKey) => {
    setFilterProfileType(v);
    if (v === 'company') setViewMode('companies');
    else if (v === 'member') setViewMode('members');
  }, []);

  const handleRandomProfile = useCallback(() => {
    if (filteredProfiles.length === 0) return;
    const pick = filteredProfiles[Math.floor(Math.random() * filteredProfiles.length)];
    if (viewMode !== 'companies' && viewMode !== 'members') {
      setViewMode(filterProfileType === 'company' ? 'companies' : 'members');
    }
    setSelectedProfile(pick);
  }, [filteredProfiles, filterProfileType, viewMode]);

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
      const locale = sortLocale(lang);
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
    const locale = sortLocale(lang);
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

  const viewerIsAdmin = profile?.role === 'admin';
  const guestDirectoryRestricted = useMemo(
    () => isGuestDirectoryRestricted(user, profile, Boolean(viewerIsAdmin)),
    [user, profile, viewerIsAdmin]
  );

  const onGuestDirectoryJoin = useCallback(() => {
    setAuthError(null);
    if (!user) {
      setShowAuthModal(true);
    } else {
      setShowOnboarding(true);
    }
  }, [user]);

  const companiesDirectoryList = useMemo(() => {
    if (!guestDirectoryRestricted) return profilesSortedForCompanies;
    return profilesSortedForCompanies.slice(0, GUEST_DIRECTORY_PREVIEW_LIMIT);
  }, [guestDirectoryRestricted, profilesSortedForCompanies]);

  const companiesDirectoryHiddenCount = guestDirectoryRestricted
    ? Math.max(0, profilesSortedForCompanies.length - GUEST_DIRECTORY_PREVIEW_LIMIT)
    : 0;

  const membersDirectoryList = useMemo(() => {
    if (!guestDirectoryRestricted) return membersDisplayList;
    return membersDisplayList.slice(0, GUEST_DIRECTORY_PREVIEW_LIMIT);
  }, [guestDirectoryRestricted, membersDisplayList]);

  const membersDirectoryHiddenCount = guestDirectoryRestricted
    ? Math.max(0, membersDisplayList.length - GUEST_DIRECTORY_PREVIEW_LIMIT)
    : 0;

  const activitiesDirectoryList = useMemo(() => {
    if (!guestDirectoryRestricted) return profilesSortedForActivities;
    return profilesSortedForActivities.slice(0, GUEST_DIRECTORY_PREVIEW_LIMIT);
  }, [guestDirectoryRestricted, profilesSortedForActivities]);

  const activitiesDirectoryHiddenCount = guestDirectoryRestricted
    ? Math.max(0, profilesSortedForActivities.length - GUEST_DIRECTORY_PREVIEW_LIMIT)
    : 0;

  const handleValidateProfile = async (uid: string, isValid: boolean) => {
    try {
      await setDoc(doc(db, 'users', uid), { isValidated: isValid }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
    }
  };

  const handlePublishUrgentPost = async (postId: string) => {
    if (profile?.role !== 'admin') return;
    try {
      await updateDoc(doc(db, 'urgent_posts', postId), { isPublished: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `urgent_posts/${postId}`);
    }
  };

  const handleRejectUrgentPost = async (postId: string) => {
    if (profile?.role !== 'admin') return;
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'urgent_posts', postId));
      batch.delete(doc(db, URGENT_POST_PRIVATE_COLLECTION, postId));
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `urgent_posts/${postId}`);
    }
  };

  const openOpportunityProfile = useCallback(
    (post: UrgentPost) => {
      if (!user || !post.authorId) return;
      const author = allProfiles.find((ap) => ap.uid === post.authorId);
      if (author) setSelectedProfile(author);
    },
    [user, allProfiles]
  );

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
          pickLang(
            'La cle Gemini est absente. Ajoute VITE_GEMINI_API_KEY dans .env.local puis redemarre le serveur.',
            'Falta la clave Gemini. Agrega VITE_GEMINI_API_KEY en .env.local y reinicia el servidor.',
            'The Gemini API key is missing. Add VITE_GEMINI_API_KEY to .env.local and restart the dev server.',
            lang
          )
        );
        return;
      }
      setOptimizationError(
        pickLang(
          `Impossible de generer les suggestions IA pour ce profil.${code ? ` (code: ${code})` : ''}`,
          `No se pudieron generar sugerencias IA para este perfil.${code ? ` (code: ${code})` : ''}`,
          `Could not generate AI suggestions for this profile.${code ? ` (code: ${code})` : ''}`,
          lang
        )
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-stone-400 animate-pulse font-medium">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-w-0 bg-slate-50 text-slate-900 font-sans selection:bg-slate-200">
      <AppHeader
        title={t('title')}
        subtitle={t('subtitle')}
        homeAriaLabel={pickLang("Retour à l'accueil", 'Volver al inicio', 'Back to home', lang)}
        onHomeClick={(e) => {
          e.preventDefault();
          window.location.assign('/');
        }}
        lang={lang}
        onLangChange={setLang}
        guestMobileFullWidthCta={!user}
        trailing={
          user ? (
            <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
              {profile?.role === 'admin' && (
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowValidationPanel(true)}
                    className="relative flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-200"
                  >
                    <Users size={16} />
                    <span className="hidden sm:inline">{t('newProfiles')}</span>
                    {pendingProfiles.length > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 text-[10px] font-bold text-white">
                        {pendingProfiles.length}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAuthLeadsPanel(true)}
                    className="relative flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-900 transition-colors hover:bg-blue-100"
                    title={t('adminOAuthLeadsTitle')}
                  >
                    <LogIn size={16} />
                    <span className="hidden sm:inline">{t('adminOAuthLeadsTitle')}</span>
                    {oauthLeadsWithoutProfileCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-blue-700 px-1 text-[10px] font-bold text-white">
                        {oauthLeadsWithoutProfileCount > 99 ? '99+' : oauthLeadsWithoutProfileCount}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOpportunitiesModerationPanel(true)}
                    className="relative flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900 transition-colors hover:bg-amber-100"
                  >
                    <Zap size={16} />
                    <span className="hidden sm:inline">{t('opportunitiesModerationTitle')}</span>
                    {pendingUrgentForAdmin.length > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-amber-600 px-1 text-[10px] font-bold text-white">
                        {pendingUrgentForAdmin.length}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={exportToExcel}
                    className="hidden items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 transition-colors hover:bg-emerald-100 sm:flex"
                  >
                    <Download size={16} />
                    {t('exportData')}
                  </button>
                </div>
              )}
              <div className="hidden h-8 w-px bg-slate-200 sm:block" aria-hidden />
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-red-600"
                title={t('logout')}
              >
                <LogOut size={18} />
              </button>
              <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-slate-200">
                <ProfileAvatar
                  photoURL={user.photoURL}
                  fullName={user.displayName || user.email || ''}
                  className="h-full w-full"
                  initialsClassName="text-[10px] font-bold text-slate-600"
                  iconSize={16}
                />
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setAuthError(null);
                setShowAuthModal(true);
              }}
              disabled={authProviderBusy !== null}
              className={cn(
                'w-full border-0 px-3 py-2 text-center text-[11px] font-semibold leading-tight text-white transition-colors',
                'rounded-none bg-transparent hover:bg-blue-800/35 active:bg-blue-900/40',
                'disabled:cursor-not-allowed disabled:opacity-60',
                'sm:rounded-lg sm:bg-blue-700 sm:px-4 sm:py-2 sm:text-sm sm:leading-normal sm:shadow-sm sm:hover:bg-blue-800 sm:active:scale-[0.98]'
              )}
            >
              {authProviderBusy !== null ? (
                pickLang('Connexion...', 'Conectando...', 'Signing in...', lang)
              ) : (
                <>
                  <span className="sm:hidden">{t('loginMobile')}</span>
                  <span className="hidden sm:inline">{t('login')}</span>
                </>
              )}
            </button>
          )
        }
      />

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
          <div className={pageSectionPad}>
            <section className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden relative">
              {profile &&
                !profileReminderDismissed &&
                profileUpdateBanner.show && (
                  <div className="border-b border-amber-200/80 bg-amber-50/95 px-4 py-3 sm:px-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      <div className="min-w-0 space-y-2 text-sm leading-snug text-amber-950">
                        {profileUpdateBanner.mandatory ? (
                          <p className="font-medium">{t('profileBannerMandatory')}</p>
                        ) : null}
                        {profileUpdateBanner.ai ? <p>{t('profileBannerAi')}</p> : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => setProfileReminderDismissed(true)}
                        className="shrink-0 self-start rounded-lg border border-amber-300/80 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100/80"
                      >
                        {t('profileBannerDismiss')}
                      </button>
                    </div>
                  </div>
                )}
              <div 
                className="flex items-center justify-between gap-3 p-4 cursor-pointer hover:bg-stone-50 transition-colors"
                onClick={() => setIsProfileExpanded(!isProfileExpanded)}
              >
                <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-600 sm:mt-0">
                    <UserIcon size={16} />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <h2 className="text-lg font-semibold tracking-tight">{t('myProfile')}</h2>
                    {profile ? (
                      <div className="flex items-start gap-2">
                        {profileCoachSource === 'ai' ? (
                          <Sparkles
                            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-600"
                            aria-hidden
                          />
                        ) : null}
                        {profileCoachLoading && profileCoachSource !== 'ai' ? (
                          <RefreshCw
                            className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-stone-400"
                            aria-hidden
                          />
                        ) : null}
                        <p className="min-w-0 flex-1 text-xs leading-relaxed text-stone-500 sm:text-sm break-words">
                          {profileCoachLine}
                        </p>
                      </div>
                    ) : null}
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
                  <div className="border-t border-stone-100 p-4 pt-0 sm:p-6 sm:pt-0">
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
                          {pickLang(
                            'Suggestions IA disponibles pour optimiser votre profil avant validation.',
                            'Sugerencias IA disponibles para optimizar tu perfil antes de la validación.',
                            'AI suggestions are available to improve your profile before validation.',
                            lang
                          )}
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
                            {pickLang(
                              'Appliquer les suggestions IA',
                              'Aplicar sugerencias IA',
                              'Apply AI suggestions',
                              lang
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="mt-6">
                      {isEditing ? (
                        <form onSubmit={handleSaveProfile} className="space-y-6">
                          <p className="rounded-lg border border-stone-200 bg-stone-50/90 px-3 py-2 text-xs leading-relaxed text-stone-600">
                            {t('profileFormRequiredLegend')}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-4">
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                                  {t('fullName')}
                                  <span className="text-red-500 font-semibold" aria-hidden>
                                    {' *'}
                                  </span>
                                </label>
                                <input name="fullName" defaultValue={editingProfile?.fullName || profile?.fullName} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-900 outline-none transition-all" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                                  {t('companyName')}
                                  <span className="text-red-500 font-semibold" aria-hidden>
                                    {' *'}
                                  </span>
                                </label>
                                <input name="companyName" defaultValue={editingProfile?.companyName || profile?.companyName} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-900 outline-none transition-all" />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{t('creationYear')}</label>
                                  <input type="number" name="creationYear" defaultValue={editingProfile?.creationYear || profile?.creationYear} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-900 outline-none transition-all" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                                    {t('employeeCount')}
                                    <span className="text-red-500 font-semibold" aria-hidden>
                                      {' *'}
                                    </span>
                                  </label>
                                  <select
                                    name="employeeCount"
                                    defaultValue={employeeCountToSelectDefault(
                                      editingProfile?.employeeCount ?? profile?.employeeCount
                                    )}
                                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-900 outline-none transition-all"
                                  >
                                    <option value="">
                                      {pickLang(
                                        '— Choisir une fourchette —',
                                        '— Elegir un rango —',
                                        '— Choose a range —',
                                        lang
                                      )}
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
                                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                                  {t('city')}
                                  <span className="text-red-500 font-semibold" aria-hidden>
                                    {' *'}
                                  </span>
                                </label>
                                <select name="city" defaultValue={editingProfile?.city || profile?.city} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-900 outline-none transition-all">
                                  {CITIES.map((c) => (
                                    <option key={c} value={c}>
                                      {cityOptionLabel(c, lang)}
                                    </option>
                                  ))}
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
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{t('country')}</label>
                                <p className="text-[10px] leading-snug text-stone-400">
                                  {pickLang(
                                    'Laissez vide pour afficher « Mexique » par défaut sur la fiche.',
                                    'Déjelo vacío para mostrar « México » por defecto en la ficha.',
                                    'Leave empty to show “Mexico” by default on the profile.',
                                    lang
                                  )}
                                </p>
                                <input
                                  name="country"
                                  defaultValue={
                                    editingProfile?.country?.trim() ||
                                    profile?.country?.trim() ||
                                    ''
                                  }
                                  placeholder={pickLang('Mexique', 'México', 'Mexico', lang)}
                                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-900 outline-none transition-all"
                                />
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                                  {t('activityCategory')}
                                  <span className="text-red-500 font-semibold" aria-hidden>
                                    {' *'}
                                  </span>
                                </label>
                                <select name="activityCategory" defaultValue={editingProfile?.activityCategory || profile?.activityCategory} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-900 outline-none transition-all">
                                  {ACTIVITY_CATEGORIES.map((c) => (
                                    <option key={c} value={c}>
                                      {activityCategoryLabel(c, lang)}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                                  {t('email')}
                                  <span className="text-red-500 font-semibold" aria-hidden>
                                    {' *'}
                                  </span>
                                </label>
                                <input type="email" name="email" defaultValue={editingProfile?.email || profile?.email || user.email || ''} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-900 outline-none transition-all" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                                  {t('website')}
                                  <span className="text-red-500 font-semibold" aria-hidden>
                                    {' *'}
                                  </span>
                                </label>
                                <input name="website" defaultValue={editingProfile?.website || profile?.website} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-900 outline-none transition-all" />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1 max-w-2xl">
                            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                              {t('workFunction')}
                              <span className="text-red-500 font-semibold" aria-hidden>
                                {' *'}
                              </span>
                            </label>
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
                              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                                {t('whatsapp')}
                                <span className="text-red-500 font-semibold" aria-hidden>
                                  {' *'}
                                </span>
                              </label>
                              <input name="whatsapp" defaultValue={editingProfile?.whatsapp || profile?.whatsapp} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-900 outline-none transition-all" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{t('arrivalYear')}</label>
                              <p className="text-[10px] text-stone-400 leading-snug">
                                {pickLang(
                                  'Sert au tableau de bord pour estimer l’ancienneté sur la région (à partir de l’année d’arrivée au Mexique).',
                                  'Alimenta el panel para estimar la antigüedad en la región (año de llegada a México).',
                                  'Feeds the dashboard seniority estimate from your year of arrival in Mexico.',
                                  lang
                                )}
                              </p>
                              <input type="number" name="arrivalYear" defaultValue={editingProfile?.arrivalYear || profile?.arrivalYear} className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-900 outline-none transition-all" />
                            </div>
                          </div>

                          <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 md:p-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-stone-600">
                                  {pickLang('Type d’entreprise (analytics)', 'Tipo de empresa (analytics)', 'Company type (analytics)', lang)}
                                </label>
                                <select
                                  name="communityCompanyKind"
                                  defaultValue={
                                    editingProfile?.communityCompanyKind ??
                                    profile?.communityCompanyKind ??
                                    ''
                                  }
                                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                >
                                  <option value="">
                                    {pickLang('— Auto (depuis effectifs) —', '— Auto (desde plantilla) —', '— Auto (from headcount) —', lang)}
                                  </option>
                                  <option value="startup">Startup</option>
                                  <option value="pme">PME / SME</option>
                                  <option value="corporate">Corporate</option>
                                  <option value="independent">{pickLang('Indépendant', 'Independiente', 'Independent', lang)}</option>
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-stone-600">
                                  {pickLang('Statut pro (analytics)', 'Estatus profesional (analytics)', 'Professional status (analytics)', lang)}
                                </label>
                                <select
                                  name="communityMemberStatus"
                                  defaultValue={
                                    editingProfile?.communityMemberStatus ??
                                    profile?.communityMemberStatus ??
                                    ''
                                  }
                                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                >
                                  <option value="">
                                    {pickLang('— Auto (depuis fonction) —', '— Auto (desde función) —', '— Auto (from role) —', lang)}
                                  </option>
                                  <option value="freelance">Freelance</option>
                                  <option value="employee">{pickLang('Salarié', 'Asalariado', 'Employee', lang)}</option>
                                  <option value="owner">{pickLang('Dirigeant / fondateur', 'Director / fundador', 'Owner / founder', lang)}</option>
                                </select>
                              </div>
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
                            <div className="space-y-1 md:col-span-2">
                              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{t('photoURL')}</label>
                              <p className="text-[10px] text-stone-400 leading-snug">{t('photoUrlHint')}</p>
                              <input
                                name="photoURL"
                                id="profile-photo-url-input"
                                defaultValue={editingProfile?.photoURL || profile?.photoURL}
                                placeholder="https://media.licdn.com/..."
                                className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 outline-none transition-all focus:ring-2 focus:ring-stone-900"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                              Bio / Description
                              <span className="text-red-500 font-semibold" aria-hidden>
                                {' *'}
                              </span>
                            </label>
                            <p className="text-[10px] text-stone-400 leading-snug">
                              {pickLang(
                                'Minimum 15 caractères pour la validation de la fiche.',
                                'Mínimo 15 caracteres para validar la ficha.',
                                'At least 15 characters are required to validate your profile.',
                                lang
                              )}
                            </p>
                            <textarea name="bio" defaultValue={editingProfile?.bio || profile?.bio} placeholder="Décrivez votre activité ou votre parcours..." className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-900 outline-none transition-all min-h-[6rem]" />
                          </div>

                          <IceBreakerInterests
                            lang={lang}
                            value={passionIdsDraft}
                            onChange={(ids) => setPassionIdsDraft(sanitizePassionIds(ids))}
                            markRequired
                          />

                          <section className="space-y-4 rounded-xl border border-stone-200 bg-white p-4 md:p-5">
                            <h3 className="text-base font-semibold text-stone-900">
                              {t('contactPrefsTitle')}
                            </h3>
                            <div className="space-y-1">
                              <label
                                htmlFor="contactPreferenceCta"
                                className="block text-xs font-semibold uppercase tracking-wider text-stone-500"
                              >
                                {t('contactPrefsCtaLabel')}
                              </label>
                              <p className="text-[10px] text-stone-400 leading-relaxed">{t('contactPrefsCtaHint')}</p>
                              <input
                                id="contactPreferenceCta"
                                name="contactPreferenceCta"
                                type="text"
                                defaultValue={
                                  (editingProfile?.contactPreferenceCta ?? profile?.contactPreferenceCta) || ''
                                }
                                placeholder={t('contactPrefsCtaPlaceholder')}
                                className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
                              />
                            </div>
                            <div className="space-y-1">
                              <span className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
                                {t('contactPrefsWorkingLangLabel')}
                              </span>
                              <p className="text-[10px] text-stone-400 leading-relaxed">{t('contactPrefsWorkingLangHint')}</p>
                              <p className="text-xs font-bold text-indigo-600 mt-2">
                                {workingLanguagesDraft.length}/3
                              </p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {WORKING_LANGUAGE_OPTIONS.map((opt) => {
                                  const selected = workingLanguagesDraft.includes(opt.code);
                                  const disabled = !selected && workingLanguagesDraft.length >= 3;
                                  return (
                                    <button
                                      key={opt.code}
                                      type="button"
                                      onClick={() => toggleWorkingLanguageDraft(opt.code)}
                                      disabled={disabled}
                                      className={cn(
                                        'rounded-lg border px-2.5 py-1.5 text-left text-xs font-medium transition-all',
                                        selected
                                          ? 'border-indigo-500 bg-indigo-600 text-white shadow-sm'
                                          : 'border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-300',
                                        disabled && !selected && 'cursor-not-allowed opacity-40 hover:border-stone-200'
                                      )}
                                    >
                                      {opt.label[lang]}
                                    </button>
                                  );
                                })}
                              </div>
                              <p className="text-[10px] text-stone-400 mt-1">{t('contactPrefsWorkingLangTip')}</p>
                            </div>
                            <div className="space-y-1">
                              <label
                                htmlFor="targetSectors-contact"
                                className="block text-xs font-semibold uppercase tracking-wider text-stone-500"
                              >
                                {t('targetSectors')}
                                <span className="text-red-500 font-semibold" aria-hidden>
                                  {' *'}
                                </span>
                              </label>
                              <p className="text-[10px] text-stone-400 leading-relaxed">{t('needKeywordsHint')}</p>
                              <p className="text-[10px] text-stone-500 leading-relaxed">
                                {pickLang(
                                  '* Requis si vous n’avez pas sélectionné au moins une passion ci-dessus.',
                                  '* Obligatorio si no elegiste al menos una pasión arriba.',
                                  '* Required if you did not pick at least one interest above.',
                                  lang
                                )}
                              </p>
                              <input
                                id="targetSectors-contact"
                                name="targetSectors"
                                defaultValue={(editingProfile?.targetSectors || profile?.targetSectors || []).join(', ')}
                                placeholder={t('needKeywordsPlaceholder')}
                                className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
                              />
                            </div>
                            <div className="space-y-1">
                              <label
                                htmlFor="typicalClientSize"
                                className="block text-xs font-semibold uppercase tracking-wider text-stone-500"
                              >
                                {t('contactPrefsClientSizeLabel')}
                              </label>
                              <p className="text-[10px] text-stone-400 leading-relaxed">{t('contactPrefsClientSizeHint')}</p>
                              <select
                                id="typicalClientSize"
                                name="typicalClientSize"
                                defaultValue={
                                  (editingProfile?.typicalClientSize ?? profile?.typicalClientSize) || ''
                                }
                                className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
                              >
                                <option value="">{t('contactPrefsClientSizeEmpty')}</option>
                                {(TYPICAL_CLIENT_SIZE_VALUES as readonly TypicalClientSize[]).map((v) => (
                                  <option key={v} value={v}>
                                    {typicalClientSizeLabel(v, lang)}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-1">
                              <span className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
                                {t('contactPrefsOpenToLabel')}
                              </span>
                              <p className="text-[10px] text-stone-400 leading-relaxed">{t('contactPrefsOpenToHint')}</p>
                              <div className="mt-2 space-y-2">
                                <label className="flex cursor-pointer items-start gap-3 rounded-lg p-1 hover:bg-stone-50">
                                  <input
                                    type="checkbox"
                                    name="openToMentoring"
                                    defaultChecked={
                                      (editingProfile?.openToMentoring ?? profile?.openToMentoring) === true
                                    }
                                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                                  />
                                  <span className="text-sm text-stone-700">{t('contactPrefsOpenMentoring')}</span>
                                </label>
                                <label className="flex cursor-pointer items-start gap-3 rounded-lg p-1 hover:bg-stone-50">
                                  <input
                                    type="checkbox"
                                    name="openToTalks"
                                    defaultChecked={
                                      (editingProfile?.openToTalks ?? profile?.openToTalks) === true
                                    }
                                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                                  />
                                  <span className="text-sm text-stone-700">{t('contactPrefsOpenTalks')}</span>
                                </label>
                                <label className="flex cursor-pointer items-start gap-3 rounded-lg p-1 hover:bg-stone-50">
                                  <input
                                    type="checkbox"
                                    name="openToEvents"
                                    defaultChecked={
                                      (editingProfile?.openToEvents ?? profile?.openToEvents) === true
                                    }
                                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                                  />
                                  <span className="text-sm text-stone-700">{t('contactPrefsOpenEvents')}</span>
                                </label>
                                {formAdminPrivateReady && formAdminPrivate !== null && (
                                  <label className="flex cursor-pointer items-start gap-3 rounded-lg p-1 hover:bg-stone-50">
                                    <input
                                      type="checkbox"
                                      name="openToEventSponsoring"
                                      defaultChecked={formAdminPrivate.openToEventSponsoring === true}
                                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                                    />
                                    <span className="min-w-0">
                                      <span className="block text-sm text-stone-700">
                                        {t('contactPrefsOpenEventSponsoring')}
                                      </span>
                                      <span className="mt-0.5 block text-[10px] text-stone-400 leading-snug">
                                        {t('contactPrefsOpenEventSponsoringPrivateHint')}
                                      </span>
                                    </span>
                                  </label>
                                )}
                              </div>
                            </div>
                          </section>

                          <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-4 md:p-5 space-y-4">
                            <div>
                              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
                                {t('highlightedNeedsTitle')}
                                <span className="text-red-500 font-semibold" aria-hidden>
                                  {' *'}
                                </span>
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
                          </div>

                          {formAdminPrivateReady && formAdminPrivate !== null && (
                            <div
                              key={`admin-priv-${editingProfile?.uid ?? profile?.uid}`}
                              className="rounded-xl border border-violet-200/70 bg-violet-50/50 p-4 md:p-5 space-y-4"
                            >
                              <div>
                                <p className="text-xs font-bold text-violet-950">{t('statsOnlySectionTitle')}</p>
                                <p className="text-[10px] text-violet-900/80 mt-1 leading-relaxed">{t('statsOnlySectionHint')}</p>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                                    {t('genderStatLabel')}
                                  </label>
                                  <p className="text-[10px] text-stone-400 leading-snug">{t('genderStatHint')}</p>
                                  <select
                                    name="genderStat"
                                    defaultValue={formAdminPrivate.genderStat ?? ''}
                                    className="mt-1 w-full px-3 py-2 bg-white border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-900 outline-none transition-all text-sm"
                                  >
                                    <option value="">{t('genderStatSelectPlaceholder')}</option>
                                    <option value="male">{t('genderStatMale')}</option>
                                    <option value="female">{t('genderStatFemale')}</option>
                                    <option value="other">{t('genderStatOther')}</option>
                                    <option value="prefer_not_say">{t('genderStatPreferNotSay')}</option>
                                  </select>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                                    {t('nationalityLabel')}
                                  </label>
                                  <p className="text-[10px] text-stone-400 leading-snug">{t('nationalityHint')}</p>
                                  <select
                                    name="nationality"
                                    defaultValue={formAdminPrivate.nationality ?? ''}
                                    className="mt-1 w-full px-3 py-2 bg-white border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-900 outline-none transition-all text-sm"
                                  >
                                    <option value="">{t('nationalitySelectPlaceholder')}</option>
                                    {NATIONALITY_OPTIONS.map((o) => (
                                      <option key={o.code} value={o.code}>
                                        {nationalityLabel(o.code, lang)}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              <label className="flex items-start gap-3 cursor-pointer group rounded-lg p-2 -m-2 hover:bg-white/60 transition-colors">
                                <input
                                  type="checkbox"
                                  name="acceptsDelegationVisits"
                                  defaultChecked={formAdminPrivate.acceptsDelegationVisits === true}
                                  className="mt-1 w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900 shrink-0"
                                />
                                <span className="min-w-0">
                                  <span className="block text-sm text-stone-700 group-hover:text-stone-900">
                                    {t('acceptsDelegationVisitsLabel')}
                                  </span>
                                  <span className="block text-[10px] text-stone-500 mt-0.5">
                                    {t('acceptsDelegationVisitsHint')}
                                  </span>
                                </span>
                              </label>
                            </div>
                          )}

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
                              {profileSaveBusy
                                ? pickLang('Enregistrement...', 'Guardando...', 'Saving...', lang)
                                : t('save')}
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
                            <div className="h-16 w-16 overflow-hidden rounded-2xl bg-stone-100">
                              <ProfileAvatar
                                photoURL={profile.photoURL}
                                fullName={profile.fullName}
                                className="h-full w-full"
                                initialsClassName="text-sm font-bold text-stone-500"
                                iconSize={32}
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-lg leading-tight">{profile.fullName}</h3>
                              </div>
                              <p className="text-stone-500 text-sm">{profile.companyName}</p>
                              {profile.linkedin && (
                                <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-blue-700 transition-colors mt-1 inline-block">
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
                                  {profile.arrivalYear
                                    ? `${profile.arrivalYear} (${new Date().getFullYear() - profile.arrivalYear} ${pickLang('ans', 'años', 'years', lang)})`
                                    : '-'}
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
                                  title={pickLang('Partager mes besoins', 'Compartir mis necesidades', 'Share my needs', lang)}
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
                            <AiTranslatedFreeText
                              lang={lang}
                              t={t}
                              text={profile.bio}
                              className="text-sm text-stone-600 leading-relaxed"
                              whitespace="pre-wrap"
                            />
                            {sanitizeHighlightedNeeds(profile.highlightedNeeds).length > 0 && (
                              <button 
                                onClick={() => setIsShareNeedsModalOpen(true)}
                                className="mt-4 flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                              >
                                <Share2 size={14} />
                                {pickLang('Partager mes besoins', 'Compartir mis necesidades', 'Share my needs', lang)}
                              </button>
                            )}
                          </div>
                        )}
                        {(() => {
                          const wl = sanitizeWorkingLanguageCodes(profile.workingLanguageCodes);
                          const hasPrefs =
                            (profile.contactPreferenceCta?.trim() ?? '') !== '' ||
                            wl.length > 0 ||
                            !!profile.typicalClientSize ||
                            profile.openToMentoring ||
                            profile.openToTalks ||
                            profile.openToEvents;
                          if (!hasPrefs) return null;
                          return (
                            <div className="mt-6 space-y-3 border-t border-stone-100 pt-6">
                              <p className="text-xs font-black uppercase tracking-widest text-stone-400">
                                {t('contactPrefsTitle')}
                              </p>
                              {profile.contactPreferenceCta?.trim() ? (
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                                    {t('contactPrefsCtaLabel')}
                                  </p>
                                  <AiTranslatedFreeText
                                    lang={lang}
                                    t={t}
                                    text={profile.contactPreferenceCta.trim()}
                                    className="mt-1 text-sm text-stone-600"
                                  />
                                </div>
                              ) : null}
                              {wl.length > 0 ? (
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                                    {t('contactPrefsWorkingLangLabel')}
                                  </p>
                                  <p className="mt-1 text-sm text-stone-600">
                                    {wl.map((c) => workingLanguageLabel(c, lang)).join(', ')}
                                  </p>
                                </div>
                              ) : null}
                              {profile.typicalClientSize ? (
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                                    {t('contactPrefsClientSizeLabel')}
                                  </p>
                                  <p className="mt-1 text-sm text-stone-600">
                                    {typicalClientSizeLabel(profile.typicalClientSize, lang)}
                                  </p>
                                </div>
                              ) : null}
                              {(profile.openToMentoring ||
                                profile.openToTalks ||
                                profile.openToEvents) && (
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                                    {t('contactPrefsOpenToLabel')}
                                  </p>
                                  <ul className="mt-1 list-inside list-disc text-sm text-stone-600">
                                    {profile.openToMentoring ? (
                                      <li>{t('contactPrefsOpenMentoring')}</li>
                                    ) : null}
                                    {profile.openToTalks ? <li>{t('contactPrefsOpenTalks')}</li> : null}
                                    {profile.openToEvents ? <li>{t('contactPrefsOpenEvents')}</li> : null}
                                  </ul>
                                </div>
                              )}
                            </div>
                          );
                        })()}
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

      <main
        className={cn(pageMainPad, isAdminDashboard ? 'max-w-none' : 'max-w-7xl')}
      >
        <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8 lg:items-stretch">
          {/* Ligne 1 (desktop) : Bienvenue | Hero — même hauteur de ligne */}
          {!user && !isAdminDashboard && (
            <>
              <div className="order-1 h-full min-h-0 min-w-0 lg:order-none lg:col-span-4">
                <WelcomeContextCard
                  title={t('welcome')}
                  body={t('welcomeIntro')}
                  className="h-full"
                  collapsibleOnMobile
                  mobileShowIntroLabel={t('welcomeIntroShow')}
                  mobileHideIntroLabel={t('welcomeIntroHide')}
                />
              </div>
              <div className="order-2 h-full min-h-0 min-w-0 lg:order-none lg:col-span-8">
                <HeroSection
                  copy={h}
                  authBusy={authProviderBusy !== null}
                  onCreateProfile={() => {
                    setAuthError(null);
                    setShowAuthModal(true);
                  }}
                  onExploreMembers={() => {
                    setDirectoryDiscoveryStripsHidden(true);
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

          {/* Connecté : Bienvenue | Nouveaux membres — même hauteur de ligne (pas de hero) */}
          {user && showDiscoveryStrips && !isAdminDashboard && (
            <>
              <div className="order-1 h-full min-h-0 min-w-0 lg:order-none lg:col-span-4">
                <WelcomeContextCard
                  title={t('welcome')}
                  body={t('welcomeIntro')}
                  className="h-full w-full"
                  collapsibleOnMobile
                  mobileShowIntroLabel={t('welcomeIntroShow')}
                  mobileHideIntroLabel={t('welcomeIntroHide')}
                />
              </div>
              <div className="order-2 h-full min-h-0 w-full min-w-0 lg:order-none lg:col-span-8">
                <NewMembersStrip
                  copy={h}
                  lang={lang}
                  profiles={stats.newThisWeekProfiles}
                  totalNewThisWeek={stats.newThisWeekCount}
                  className="w-full min-h-0"
                  onOpenProfile={(p) => setSelectedProfile(p)}
                  onSeeAll={() => {
                    setDirectoryDiscoveryStripsHidden(true);
                    setViewMode('members');
                    setMembersSortRecent(true);
                    requestAnimationFrame(() =>
                      directoryMainRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    );
                  }}
                />
              </div>
            </>
          )}

          {/* Mobile : fun fact entre le hero (ou bandeau connecté) et recherche / onglets */}
          {(!user || (user && showDiscoveryStrips)) &&
            !(viewMode === 'dashboard' && profile?.role === 'admin') && (
            <div className="order-3 min-w-0 w-full sm:hidden">
              <HomeFunFactStrip
                lang={lang}
                collapsibleOnMobile
                mobileShowLabel={t('funFactIntroShow')}
                mobileHideLabel={t('funFactIntroHide')}
              />
            </div>
          )}

          {/* Colonne gauche — recherche (+ opportunités si connecté), stats */}
          <div
            className={cn(
              'order-4 min-w-0 w-full space-y-6 lg:order-none lg:col-span-4 lg:self-start',
              isAdminDashboard && 'hidden'
            )}
          >
            {user && !showDiscoveryStrips && (
              <div className="h-fit shrink-0">
                <WelcomeContextCard
                  title={t('welcome')}
                  body={t('welcomeIntro')}
                  className="w-full"
                  collapsibleOnMobile
                  mobileShowIntroLabel={t('welcomeIntroShow')}
                  mobileHideIntroLabel={t('welcomeIntroHide')}
                />
              </div>
            )}
            {viewMode === 'activities' ? (
              <div
                className={cn(
                  'min-w-0 rounded-xl border border-slate-200 bg-slate-50/95 shadow-sm',
                  cardPad
                )}
              >
                <DirectoryRandomProfileButton
                  t={t}
                  onRandomProfile={handleRandomProfile}
                  randomDisabled={filteredProfiles.length === 0}
                />
              </div>
            ) : (
              <SearchBlock
                lang={lang}
                t={t}
                searchTerm={searchTerm}
                onSearchTermChange={setSearchTerm}
                filterCategory={filterCategory}
                onFilterCategoryChange={setFilterCategory}
                filterProfileType={filterProfileType}
                onFilterProfileTypeChange={handleFilterProfileTypeChange}
                filterLocation={filterLocation}
                onFilterLocationChange={setFilterLocation}
                onSearchSubmit={scrollDirectoryIntoView}
                onClearFilters={clearDirectoryFilters}
                onRandomProfile={handleRandomProfile}
                randomDisabled={filteredProfiles.length === 0}
                showClearFilters={showDirectoryClearFilters}
              />
            )}

            <div
              className={cn(
                (!user || showDiscoveryStrips) && 'hidden sm:block',
                viewMode === 'dashboard' && profile?.role === 'admin' && 'hidden'
              )}
            >
              <HomeFunFactStrip lang={lang} />
            </div>

            {!user && showDiscoveryStrips && urgentPostsListed.length === 0 && (
              <OpportunitiesSection
                copy={h}
                t={t}
                lang={lang}
                posts={urgentPostsListed}
                allProfiles={allProfiles}
                user={user}
                compactLayout
                onSeeAll={() => {
                  setDirectoryDiscoveryStripsHidden(true);
                  setViewMode('radar');
                  requestAnimationFrame(() =>
                    directoryMainRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  );
                }}
                onPost={() => setShowUrgentPostModal(true)}
                onCreateProfile={() => {
                  setAuthError(null);
                  setShowAuthModal(true);
                }}
                onOpenPost={openOpportunityProfile}
              />
            )}

            {user && showDiscoveryStrips && (
              <OpportunitiesSection
                copy={h}
                t={t}
                lang={lang}
                posts={urgentPostsListed}
                allProfiles={allProfiles}
                user={user}
                compactLayout
                onSeeAll={() => {
                  setDirectoryDiscoveryStripsHidden(true);
                  setViewMode('radar');
                  requestAnimationFrame(() =>
                    directoryMainRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  );
                }}
                onPost={() => setShowUrgentPostModal(true)}
                onCreateProfile={() => {
                  setAuthError(null);
                  setShowAuthModal(true);
                }}
                onOpenPost={openOpportunityProfile}
              />
            )}

            {/* [MEMBERS-COUNT] Bloc lancement / compteur dynamique */}
            <MembersCountBlock
              t={t}
              memberCount={stats.total}
              sectorCount={distinctSectorCount}
              opportunitiesCount={urgentPostsListed.length}
              threshold={MEMBERS_THRESHOLD}
              registeredWithProfile={!!user && !!profile}
              onOpenInvite={() => setShowInviteNetworkModal(true)}
              onCreateProfile={() => {
                setAuthError(null);
                setShowAuthModal(true);
              }}
            />
          </div>

          {/* Colonne droite — invités : nouveaux membres + opportunités ; connecté : recommandations, onglets, listes */}
          <div
            ref={directoryMainRef}
            id="directory-main"
            className={cn(
              'order-5 min-w-0 w-full scroll-mt-24 space-y-6 lg:order-none',
              isAdminDashboard ? 'lg:col-span-12' : 'lg:col-span-8'
            )}
          >
            {/* Bandeaux découverte : visiteurs uniquement (connectés : ligne du haut + colonne gauche) */}
            {!user && showDiscoveryStrips && (
              <>
                <NewMembersStrip
                  copy={h}
                  lang={lang}
                  profiles={stats.newThisWeekProfiles}
                  totalNewThisWeek={stats.newThisWeekCount}
                  onOpenProfile={(p) => setSelectedProfile(p)}
                  onSeeAll={() => {
                    setDirectoryDiscoveryStripsHidden(true);
                    setViewMode('members');
                    setMembersSortRecent(true);
                    requestAnimationFrame(() =>
                      directoryMainRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    );
                  }}
                />

                {urgentPostsListed.length > 0 && (
                  <OpportunitiesSection
                    copy={h}
                    t={t}
                    lang={lang}
                    posts={urgentPostsListed}
                    allProfiles={allProfiles}
                    user={user}
                    onSeeAll={() => {
                      setDirectoryDiscoveryStripsHidden(true);
                      setViewMode('radar');
                      requestAnimationFrame(() =>
                        directoryMainRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      );
                    }}
                    onPost={() => setShowUrgentPostModal(true)}
                    onCreateProfile={() => {
                      setAuthError(null);
                      setShowAuthModal(true);
                    }}
                    onOpenPost={openOpportunityProfile}
                  />
                )}
              </>
            )}

            {/* Recommendations Section */}
            {user && profile && !isAdminDashboard && (
              <section className="min-w-0 space-y-4">
                <div className="flex min-w-0 items-center gap-2">
                  <Trophy className="h-5 w-5 shrink-0 text-indigo-500" />
                  <h2 className="min-w-0 text-lg font-bold leading-snug text-stone-900 break-words">
                    {t('recommendedForYou')}
                  </h2>
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

            {/* View Mode Tabs — seule barre d’onglets, collée au listing ; sticky sous le header (z-50) */}
            <div className="sticky top-24 z-40 min-w-0 bg-slate-50 py-2 sm:top-16">
              <DirectoryTabBar
                tabs={directoryViewTabs.map((tab) => ({
                  id: tab.id,
                  label: tab.label,
                  icon: <tab.icon size={16} aria-hidden />,
                }))}
                activeTab={viewMode}
                onTabChange={(id) => {
                  setDirectoryDiscoveryStripsHidden(true);
                  setViewMode(
                    id as 'companies' | 'members' | 'activities' | 'radar' | 'dashboard'
                  );
                }}
              />
            </div>

            {/* Main Content Area based on viewMode */}
            <div className="space-y-6">
              {viewMode === 'companies' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                  {companiesDirectoryList.map((p) => (
                    <React.Fragment key={p.uid}>
                      <ProfileCard 
                        variant="company"
                        p={p} 
                        onSelect={setSelectedProfile}
                        onEdit={startEditing}
                        onDelete={setProfileToDelete}
                        user={user}
                        profile={profile}
                        urgentAuthorIds={urgentAuthorIdSet}
                        guestDirectoryTeaser={guestDirectoryRestricted}
                        onGuestJoin={onGuestDirectoryJoin}
                      />
                    </React.Fragment>
                  ))}
                  {guestDirectoryRestricted && companiesDirectoryHiddenCount > 0 && (
                    <GuestDirectoryInterstitial
                      hiddenCount={companiesDirectoryHiddenCount}
                      onJoin={onGuestDirectoryJoin}
                      t={t}
                      className="md:col-span-2"
                    />
                  )}
                </div>
              )}

              {viewMode === 'members' && (
                <div className="space-y-6">
                  {membersSortRecent && (
                    <div className="flex flex-col gap-2 rounded-2xl border border-blue-100 bg-blue-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="min-w-0 text-sm font-medium leading-snug text-blue-950 break-words hyphens-auto">
                        {h.membersSortBanner}
                      </p>
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
                    <div className="flex flex-col gap-3 rounded-2xl border border-violet-100 bg-violet-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3 sm:items-center">
                        <Target className="h-5 w-5 shrink-0 text-violet-600" />
                        <p className="min-w-0 text-sm font-medium leading-snug text-violet-900">
                          {t('filterByTypedNeed')}{' '}
                          <span className="font-bold">{needOptionLabel(highlightedNeedFilter, lang)}</span>
                        </p>
                      </div>
                      <button 
                        onClick={() => setHighlightedNeedFilter('')}
                        className="shrink-0 self-start text-xs font-bold text-violet-700 underline hover:text-violet-900 sm:self-center"
                      >
                        {pickLang('Effacer le filtre', 'Quitar filtro', 'Clear filter', lang)}
                      </button>
                    </div>
                  )}
                  {passionIdFilter && (
                    <div className="flex flex-col gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3 sm:items-center">
                        <span className="text-xl shrink-0" aria-hidden>
                          {getPassionEmoji(passionIdFilter)}
                        </span>
                        <p className="min-w-0 text-sm font-medium leading-snug text-rose-900">
                          {t('filterByPassion')}{' '}
                          <span className="font-bold break-words">{getPassionLabel(passionIdFilter, lang)}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPassionIdFilter('')}
                        className="shrink-0 self-start text-xs font-bold text-rose-700 underline hover:text-rose-900 sm:self-center"
                      >
                        {pickLang('Effacer le filtre', 'Quitar filtro', 'Clear filter', lang)}
                      </button>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                    {membersDirectoryList.map((p) => (
                      <React.Fragment key={p.uid}>
                        <ProfileCard 
                          p={p} 
                          onSelect={setSelectedProfile}
                          onEdit={startEditing}
                          onDelete={setProfileToDelete}
                          user={user}
                          profile={profile}
                          urgentAuthorIds={urgentAuthorIdSet}
                          guestDirectoryTeaser={guestDirectoryRestricted}
                          onGuestJoin={onGuestDirectoryJoin}
                        />
                      </React.Fragment>
                    ))}
                  </div>
                  {guestDirectoryRestricted && membersDirectoryHiddenCount > 0 && (
                    <GuestDirectoryInterstitial
                      hiddenCount={membersDirectoryHiddenCount}
                      onJoin={onGuestDirectoryJoin}
                      t={t}
                    />
                  )}
                </div>
              )}

              {viewMode === 'activities' && (
                <div className="space-y-6">
                  <SearchBlock
                    lang={lang}
                    t={t}
                    searchTerm={searchTerm}
                    onSearchTermChange={setSearchTerm}
                    filterCategory={filterCategory}
                    onFilterCategoryChange={setFilterCategory}
                    filterProfileType={filterProfileType}
                    onFilterProfileTypeChange={handleFilterProfileTypeChange}
                    filterLocation={filterLocation}
                    onFilterLocationChange={setFilterLocation}
                    onSearchSubmit={scrollDirectoryIntoView}
                    onClearFilters={clearDirectoryFilters}
                    onRandomProfile={handleRandomProfile}
                    randomDisabled={filteredProfiles.length === 0}
                    showClearFilters={showDirectoryClearFilters}
                    hideRandomButton
                  />
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
                              'rounded-full border px-3 py-1.5 text-[11px] font-bold transition-all',
                              filterCategory === cat
                                ? 'border-stone-900 bg-stone-900 text-white shadow-sm'
                                : 'border-stone-200 bg-stone-50 text-stone-600 hover:border-stone-300 hover:bg-stone-100'
                            )}
                          >
                            {activityCategoryLabel(cat, lang)}
                            <span className="ml-1 font-medium opacity-70">· {count}</span>
                          </button>
                        ))}
                    </div>
                  )}
                  {profilesSortedForActivities.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-stone-200 bg-white py-16 text-center">
                      <Briefcase size={40} className="mx-auto mb-3 text-stone-200" />
                      <p className="px-4 text-sm font-medium text-stone-500">
                        {pickLang(
                          'Aucun profil pour ce secteur. Essayez « Toutes les industries » ou un autre secteur.',
                          'No hay perfiles para este sector. Prueba « Todas las industrias » u otro sector.',
                          'No profiles for this sector. Try “All industries” or another sector.',
                          lang
                        )}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
                        {activitiesDirectoryList.map((p) => (
                          <React.Fragment key={p.uid}>
                            <ProfileCard
                              variant="activity"
                              p={p}
                              onSelect={setSelectedProfile}
                              onEdit={startEditing}
                              onDelete={setProfileToDelete}
                              user={user}
                              profile={profile}
                              urgentAuthorIds={urgentAuthorIdSet}
                              guestDirectoryTeaser={guestDirectoryRestricted}
                              onGuestJoin={onGuestDirectoryJoin}
                            />
                          </React.Fragment>
                        ))}
                      </div>
                      {guestDirectoryRestricted && activitiesDirectoryHiddenCount > 0 && (
                        <GuestDirectoryInterstitial
                          hiddenCount={activitiesDirectoryHiddenCount}
                          onJoin={onGuestDirectoryJoin}
                          t={t}
                        />
                      )}
                    </>
                  )}
                </div>
              )}

              {viewMode === 'radar' && (
                <NetworkRadarSection
                  lang={lang}
                  t={t}
                  allProfiles={allProfiles}
                  urgentPosts={urgentPostsListed}
                  viewerProfile={profile}
                  user={user}
                  copy={h}
                  activityCategoryLabel={activityCategoryLabel}
                  needOptionLabel={needOptionLabel}
                  getPassionEmoji={getPassionEmoji}
                  getPassionLabel={getPassionLabel}
                  onNeedClick={(needId) => {
                    setViewMode('members');
                    setPassionIdFilter('');
                    setHighlightedNeedFilter(needId);
                  }}
                  onPassionClick={(passionId) => {
                    setViewMode('members');
                    setHighlightedNeedFilter('');
                    setPassionIdFilter(passionId);
                  }}
                  onOpportunityClick={openOpportunityProfile}
                  onPostOpportunity={() => setShowUrgentPostModal(true)}
                  onCreateProfile={() => {
                    setAuthError(null);
                    setShowAuthModal(true);
                  }}
                  registeredWithProfile={!!user && !!profile}
                  onUnlockRadar={() => {
                    setAuthError(null);
                    if (!user) {
                      setShowAuthModal(true);
                    } else {
                      setShowOnboarding(true);
                    }
                  }}
                />
              )}

              {viewMode === 'dashboard' && profile?.role === 'admin' && (
                <DashboardPage
                  lang={lang}
                  t={t}
                  registeredWithProfile={!!user && !!profile}
                  onUnlockRadar={() => {
                    setAuthError(null);
                    if (!user) {
                      setShowAuthModal(true);
                    } else {
                      setShowOnboarding(true);
                    }
                  }}
                  user={user}
                />
              )}

            {filteredProfiles.length === 0 &&
              (viewMode === 'companies' ||
                viewMode === 'members' ||
                viewMode === 'activities') && (
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
                  <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-3xl bg-stone-100">
                    <ProfileAvatar
                      photoURL={selectedProfile.photoURL}
                      fullName={selectedProfile.fullName}
                      className="h-full w-full"
                      initialsClassName="text-xl font-bold text-stone-400 sm:text-2xl"
                      iconSize={48}
                    />
                  </div>
                  <div className="min-w-0 flex-1 pt-2 pr-10 sm:pr-12">
                    <h2 className="mb-1 inline-flex max-w-full flex-wrap items-center gap-2 text-3xl font-bold tracking-tight text-stone-900">
                      <span className="min-w-0 break-words">{selectedProfile.fullName}</span>
                      {selectedProfile.linkedin?.trim() ? (
                        <a
                          href={
                            selectedProfile.linkedin.trim().startsWith('http')
                              ? selectedProfile.linkedin.trim()
                              : `https://${selectedProfile.linkedin.trim()}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 text-[#0A66C2] transition-opacity hover:opacity-80 focus:outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-[#0A66C2] focus-visible:ring-offset-2"
                          aria-label="LinkedIn"
                        >
                          <Linkedin className="size-[0.82em]" strokeWidth={2} aria-hidden />
                        </a>
                      ) : null}
                    </h2>
                    <p className="text-xl font-medium text-stone-500">{selectedProfile.companyName}</p>
                    <ProfileWebsiteInlineLink
                      website={selectedProfile.website}
                      className="mt-1 w-full text-sm"
                      onClick={(e) => e.stopPropagation()}
                    />
                    {selectedProfile.positionCategory && (
                      <p className="mt-2 flex items-center gap-2 text-sm text-stone-600">
                        <UserCog size={16} className="shrink-0 text-stone-400" />
                        {workFunctionLabel(selectedProfile.positionCategory, lang)}
                      </p>
                    )}
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
                          {optimizationBusy
                            ? pickLang('Analyse IA...', 'Analizando IA...', 'AI analysis...', lang)
                            : pickLang('Analyser avec IA', 'Analizar con IA', 'Analyze with AI', lang)}
                        </button>
                      </div>
                    )}
                    {profile?.role === 'admin' && selectedProfile.isValidated === false && selectedProfile.optimizationSuggestion && (
                      <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl space-y-3">
                        <p className="text-xs font-bold text-indigo-900">
                          {pickLang(
                            'Resume des optimisations proposees:',
                            'Resumen de optimizaciones propuestas:',
                            'Summary of suggested improvements:',
                            lang
                          )}
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
                          {pickLang(
                            'Envoyer ces suggestions par email',
                            'Enviar estas sugerencias por correo',
                            'Email these suggestions',
                            lang
                          )}
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
                        {selectedProfile.bio?.trim() ? (
                          <AiTranslatedFreeText
                            lang={lang}
                            t={t}
                            text={selectedProfile.bio}
                            className="text-sm text-stone-600 leading-relaxed"
                            whitespace="pre-wrap"
                          />
                        ) : (
                          <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">
                            {t('noCompanyDescription')}
                          </p>
                        )}
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
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-x-8">
                        <div className="min-w-0 space-y-3">
                          <div className="flex items-center gap-4 group">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-50 text-stone-400 transition-colors group-hover:bg-stone-100">
                              <MapPin size={18} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{t('city')}</p>
                              <p className="text-sm font-medium text-stone-900">{selectedProfile.city}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 group">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-50 text-stone-400 transition-colors group-hover:bg-stone-100">
                              <MapPin size={18} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{t('neighborhood')}</p>
                              <p className="text-sm font-medium text-stone-900">{selectedProfile.neighborhood || '—'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="min-w-0 space-y-3">
                          <div className="flex items-center gap-4 group">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-50 text-stone-400 transition-colors group-hover:bg-stone-100">
                              <MapPin size={18} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{t('state')}</p>
                              <p className="text-sm font-medium text-stone-900">{selectedProfile.state || 'Jalisco'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 group">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-50 text-stone-400 transition-colors group-hover:bg-stone-100">
                              <MapPin size={18} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{t('country')}</p>
                              <p className="text-sm font-medium text-stone-900">
                                {selectedProfile.country?.trim() ||
                                  pickLang('Mexique', 'México', 'Mexico', lang)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                  </div>

                  <div className="border-t border-stone-200 pt-6 md:border-t-0 md:border-l md:border-stone-200 md:pt-0 md:pl-8">
                      <h3 className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-black mb-2">
                        {pickLang('Contact', 'Contacto', 'Contact', lang)}
                      </h3>
                      <div className="space-y-2">
                        <ProfileCardEmailContact
                          email={selectedProfile.email}
                          canView={Boolean(
                            selectedProfile.isEmailPublic || (user && profile?.isValidated)
                          )}
                          t={t}
                        />
                        {selectedProfile.whatsapp ? (
                          <ProfileCardWhatsappContactFooter
                            whatsapp={selectedProfile.whatsapp}
                            canView={Boolean(
                              selectedProfile.isWhatsappPublic || (user && profile?.isValidated)
                            )}
                            t={t}
                          />
                        ) : null}
                      </div>
                  </div>
                </div>
                </div>

                {profile?.role === 'admin' && (
                  <div
                    className="mt-6 rounded-xl border border-amber-200 bg-amber-50/90 p-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-900 mb-3">
                      {t('adminInternalDataTitle')}
                    </p>
                    {adminModalPrivateLoading ? (
                      <p className="text-sm text-stone-500">
                        {pickLang('Chargement…', 'Cargando…', 'Loading…', lang)}
                      </p>
                    ) : (
                      <dl className="space-y-2 text-sm text-stone-800">
                        <div className="flex flex-wrap justify-between gap-2">
                          <dt className="text-stone-500 shrink-0">{t('adminFieldGender')}</dt>
                          <dd className="font-medium text-right">
                            {adminModalPrivate?.genderStat === 'male'
                              ? t('genderStatMale')
                              : adminModalPrivate?.genderStat === 'female'
                                ? t('genderStatFemale')
                                : adminModalPrivate?.genderStat === 'other'
                                  ? t('genderStatOther')
                                  : adminModalPrivate?.genderStat === 'prefer_not_say'
                                    ? t('genderStatPreferNotSay')
                                    : t('adminDelegationUnknown')}
                          </dd>
                        </div>
                        <div className="flex flex-wrap justify-between gap-2">
                          <dt className="text-stone-500 shrink-0">{t('adminFieldNationality')}</dt>
                          <dd className="font-medium text-right">
                            {nationalityLabel(adminModalPrivate?.nationality, lang) || t('adminDelegationUnknown')}
                          </dd>
                        </div>
                        <div className="flex flex-wrap justify-between gap-2">
                          <dt className="text-stone-500 shrink-0">{t('adminFieldDelegation')}</dt>
                          <dd className="font-medium text-right">
                            {adminModalPrivate?.acceptsDelegationVisits === true
                              ? t('adminDelegationYes')
                              : adminModalPrivate?.acceptsDelegationVisits === false
                                ? t('adminDelegationNo')
                                : t('adminDelegationUnknown')}
                          </dd>
                        </div>
                        <div className="flex flex-wrap justify-between gap-2">
                          <dt className="text-stone-500 shrink-0">{t('adminFieldEventSponsoring')}</dt>
                          <dd className="font-medium text-right">
                            {adminModalPrivate?.openToEventSponsoring === true
                              ? t('adminDelegationYes')
                              : adminModalPrivate?.openToEventSponsoring === false
                                ? t('adminDelegationNo')
                                : t('adminDelegationUnknown')}
                          </dd>
                        </div>
                      </dl>
                    )}
                  </div>
                )}

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
                  pendingProfiles.map((p) => {
                    const priv = pendingPrivateByUid[p.uid] ?? legacyAdminFromUserDoc(p);
                    const showPriv =
                      !!priv.genderStat ||
                      !!priv.nationality ||
                      priv.acceptsDelegationVisits !== undefined ||
                      priv.openToEventSponsoring !== undefined;
                    return (
                    <div key={p.uid} className="bg-stone-50 rounded-2xl p-4 border border-stone-100">
                      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white">
                            <ProfileAvatar
                              photoURL={p.photoURL}
                              fullName={p.fullName}
                              className="h-full w-full bg-white"
                              iconSize={24}
                            />
                          </div>
                          <div>
                            <h4 className="font-bold text-stone-900">{p.fullName}</h4>
                            <p className="text-xs text-stone-500">{p.companyName} • {activityCategoryLabel(p.activityCategory, lang)}</p>
                            <p className="text-[10px] text-stone-400 mt-1">{p.email}</p>
                            {showPriv && (
                              <div className="mt-2 space-y-0.5 text-[10px] text-stone-500">
                                {priv.genderStat ? (
                                  <p>
                                    {t('adminFieldGender')}:{' '}
                                    {priv.genderStat === 'male'
                                      ? t('genderStatMale')
                                      : priv.genderStat === 'female'
                                        ? t('genderStatFemale')
                                        : priv.genderStat === 'other'
                                          ? t('genderStatOther')
                                          : t('genderStatPreferNotSay')}
                                  </p>
                                ) : null}
                                {priv.nationality ? (
                                  <p>
                                    {t('adminFieldNationality')}: {nationalityLabel(priv.nationality, lang)}
                                  </p>
                                ) : null}
                                {priv.acceptsDelegationVisits !== undefined ? (
                                  <p
                                    className={
                                      priv.acceptsDelegationVisits ? 'font-semibold text-emerald-800' : ''
                                    }
                                  >
                                    {t('adminFieldDelegation')}:{' '}
                                    {priv.acceptsDelegationVisits
                                      ? t('adminDelegationYes')
                                      : t('adminDelegationNo')}
                                  </p>
                                ) : null}
                                {priv.openToEventSponsoring !== undefined ? (
                                  <p
                                    className={
                                      priv.openToEventSponsoring ? 'font-semibold text-emerald-800' : ''
                                    }
                                  >
                                    {t('adminFieldEventSponsoring')}:{' '}
                                    {priv.openToEventSponsoring
                                      ? t('adminDelegationYes')
                                      : t('adminDelegationNo')}
                                  </p>
                                ) : null}
                              </div>
                            )}
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
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAuthLeadsPanel && profile?.role === 'admin' && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAuthLeadsPanel(false)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-stone-100 p-6">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-800">
                    <LogIn size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold leading-tight">{t('adminOAuthLeadsTitle')}</h3>
                    <p className="mt-1 text-xs leading-snug text-stone-500">{t('adminOAuthLeadsSubtitle')}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAuthLeadsPanel(false)}
                  className="shrink-0 rounded-full p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-900"
                >
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-6">
                {authLeads.length === 0 ? (
                  <div className="py-12 text-center">
                    <LogIn size={48} className="mx-auto mb-4 text-stone-100" />
                    <p className="font-medium text-stone-400">{t('adminOAuthLeadsEmpty')}</p>
                  </div>
                ) : (
                  authLeads.map((lead) => {
                    const hasProfile = profileUidSet.has(lead.uid);
                    const last =
                      lead.lastConnectedAt && typeof lead.lastConnectedAt.toDate === 'function'
                        ? lead.lastConnectedAt.toDate().toLocaleString(uiLocale(lang))
                        : '—';
                    const first =
                      lead.firstConnectedAt && typeof lead.firstConnectedAt.toDate === 'function'
                        ? lead.firstConnectedAt.toDate().toLocaleString(uiLocale(lang))
                        : '—';
                    return (
                      <div
                        key={lead.uid}
                        className="rounded-2xl border border-stone-100 bg-stone-50/80 p-4"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="font-semibold text-stone-900">
                              {lead.displayName?.trim() || '—'}
                            </p>
                            <p className="mt-0.5 break-all text-xs text-stone-600">{lead.email || '—'}</p>
                            <p className="mt-2 text-[10px] text-stone-400">
                              <span className="font-medium text-stone-500">{t('adminOAuthLeadsProvider')}:</span>{' '}
                              {lead.primaryProvider || '—'}
                              {lead.emailVerified ? ` · ${t('adminOAuthLeadsEmailVerified')}` : null}
                            </p>
                            <p className="mt-1 text-[10px] text-stone-400">
                              {t('adminOAuthLeadsFirstSeen')}: {first} · {t('adminOAuthLeadsLastSeen')}: {last}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-center text-[10px] font-semibold ${
                                hasProfile
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-900'
                              }`}
                            >
                              {hasProfile ? t('adminOAuthLeadsHasProfile') : t('adminOAuthLeadsNoProfile')}
                            </span>
                            {lead.email ? (
                              <button
                                type="button"
                                onClick={() => {
                                  void navigator.clipboard.writeText(lead.email);
                                  alert(pickLang('Copié !', '¡Copiado!', 'Copied!', lang));
                                }}
                                className="inline-flex items-center justify-center gap-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
                              >
                                <Copy size={12} />
                                Email
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showOpportunitiesModerationPanel && profile?.role === 'admin' && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowOpportunitiesModerationPanel(false)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-stone-100 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{t('opportunitiesModerationTitle')}</h3>
                    <p className="text-xs text-stone-500">
                      {pendingUrgentForAdmin.length}{' '}
                      {t('opportunitiesModerationPendingCount').toLowerCase()}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOpportunitiesModerationPanel(false)}
                  className="rounded-full p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-900"
                >
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto p-6">
                {pendingUrgentForAdmin.length === 0 ? (
                  <div className="py-12 text-center">
                    <Zap size={48} className="mx-auto mb-4 text-stone-100" />
                    <p className="font-medium text-stone-400">{t('opportunitiesModerationEmpty')}</p>
                  </div>
                ) : (
                  pendingUrgentForAdmin.map((post) => (
                    <div
                      key={post.id}
                      className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4"
                    >
                      <AiTranslatedFreeText
                        lang={lang}
                        t={t}
                        text={post.text}
                        className="text-sm font-semibold leading-snug text-stone-900"
                      />
                      <p className="mt-2 text-xs font-medium uppercase tracking-wide text-stone-500">
                        {activityCategoryLabel(post.sector, lang)}
                      </p>
                      <p className="mt-2 text-xs text-stone-600">
                        {post.authorName || '—'}
                        {post.authorCompany ? ` · ${post.authorCompany}` : ''}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handlePublishUrgentPost(post.id)}
                          className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                        >
                          {t('opportunityPublish')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectUrgentPost(post.id)}
                          className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50"
                        >
                          {t('opportunityReject')}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowOpportunitiesModerationPanel(false);
                            openOpportunityProfile(post);
                          }}
                          disabled={!post.authorId}
                          className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {t('details')}
                        </button>
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
                <div>
                  <h3 className="text-xl font-bold text-stone-900">{t('postUrgentNeed')}</h3>
                  <p className="mt-1 text-xs leading-snug text-amber-800">{t('opportunityModerationPendingNote')}</p>
                </div>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!user || !profile) return;
                const formData = new FormData(e.currentTarget);
                const text = formData.get('text') as string;
                const sector = formData.get('sector') as string;
                const createdAt = Date.now();
                const expiresAt = createdAt + (7 * 24 * 60 * 60 * 1000);

                try {
                  const postRef = doc(collection(db, 'urgent_posts'));
                  const batch = writeBatch(db);
                  batch.set(postRef, {
                    text,
                    sector,
                    createdAt,
                    expiresAt,
                    isPublished: false,
                  });
                  batch.set(doc(db, URGENT_POST_PRIVATE_COLLECTION, postRef.id), {
                    authorId: user.uid,
                    authorName: profile.fullName,
                    authorCompany: profile.companyName,
                    authorPhoto: profile.photoURL || '',
                  });
                  await batch.commit();
                  setShowUrgentPostModal(false);
                } catch (error) {
                  handleFirestoreError(error, OperationType.CREATE, 'urgent_posts');
                }
              }} className="space-y-6">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                    {t('bio')}{' '}
                    {pickLang('(max 200 caractères)', '(máx. 200 caracteres)', '(max 200 characters)', lang)}
                  </label>
                  <textarea 
                    name="text" 
                    required 
                    maxLength={200}
                    placeholder={pickLang(
                      'Ex: Cherche distributeur logistique pour Guadalajara...',
                      'Ej.: Busco distribuidor logístico en Guadalajara...',
                      'E.g. Looking for a logistics distributor in Guadalajara...',
                      lang
                    )}
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
                    {pickLang(
                      "Votre annonce sera visible par tous les membres pendant 7 jours. Elle apparaîtra en priorité sur la page d'accueil.",
                      'Tu anuncio será visible para todos los miembros durante 7 días y aparecerá con prioridad en la página de inicio.',
                      'Your post will be visible to all members for 7 days and will appear prominently on the home page.',
                      lang
                    )}
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
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-700">
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
      <InviteNetworkModal
        open={showInviteNetworkModal}
        onClose={() => setShowInviteNetworkModal(false)}
        lang={lang}
        t={t}
      />
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
