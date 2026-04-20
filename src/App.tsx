/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useCallback,
  useRef,
  useSyncExternalStore,
} from 'react';
import { 
  BrowserRouter, 
  Routes, 
  Route, 
  Navigate,
  useParams, 
  useNavigate,
  useLocation,
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
  sendEmailVerification,
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
} from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';
import { auth, db } from './firebase';
import { serverTimestamp } from 'firebase/firestore';
import {
  UserProfile,
  Language,
  Role,
  GENDER_STAT_VALUES,
  type GenderStat,
  type CommunityCompanyKind,
  type CommunityMemberStatus,
  MatchSuggestion,
  Recommendation,
  NeedComment,
  MemberNetworkRequest,
  OptimizationSuggestion,
  EMPLOYEE_COUNT_RANGES,
  type EmployeeCountRange,
  getProfileAiRecommendationReadiness,
  normalizedTargetKeywords,
  parseCommaSeparatedTargetKeywords,
  type AdminEvent,
  type CompanyActivitySlot,
} from './types';
// Heavy pages/sections are lazy-loaded below for faster navigation.
import {
  ACTIVITY_CATEGORIES,
  CITIES,
  cityOptionLabel,
  WORK_FUNCTION_OPTIONS,
  FIRST_50_MEMBER_TARGET,
  AI_REC_MIN_OTHER_MEMBERS,
  isEmployeeCountRange,
  companySizeFromEmployeeRange,
  formatEmployeeCountDisplay,
  employeeCountToSelectDefault,
  activityCategoryLabel,
  workFunctionLabel,
} from './constants';
import { LanguageProvider, useLanguage } from './i18n/LanguageProvider';
import { pickLang, uiLocale, sortLocale, formatProfileLastSeen } from './lib/uiLocale';
import { formatPersonName } from '@/shared/utils/formatPersonName';
import {
  profileMatchesLocationFilter,
  type LocationFilterKey,
  type ProfileTypeFilterKey,
} from './lib/directoryFilters';
import { NATIONALITY_OPTIONS, nationalityLabel } from './lib/nationalityOptions';
import {
  DEFAULT_PHONE_DIAL,
  dialLabelForLang,
  mergePhoneDialLocal,
  splitStoredPhone,
  isKnownPhoneDial,
  phoneDialRowsOrderedForUi,
} from './lib/phoneDialCodes';
import {
  allActivityDescriptionTexts,
  companyActivityNamesJoined,
  denormalizeFirstCompanySlot,
  displayActivityDescriptionForSlot,
  effectiveMemberBio,
  emptyCompanyActivitySlot,
  employeeCountFromSlotField,
  firstSlotActivityDescription,
  normalizeProfileCompanyActivities,
  profileDistinctActivityCategories,
  slotsToFirestoreList,
} from './lib/companyActivities';
import {
  loadUserAdminPrivate,
  saveUserAdminPrivate,
  legacyAdminFromUserDoc,
  USER_ADMIN_PRIVATE_COLLECTION,
  type UserAdminPrivateDoc,
} from './lib/userAdminPrivate';
import { migrateLegacyBioToMemberAndActivity } from './lib/migrateLegacyProfileBio';
import { upsertAuthLeadFromFirebaseUser } from './lib/authLeads';
import {
  clearProfileFormDraft,
  initLastProfileSaveBaselineIfUnset,
  loadProfileFormDraft,
  markProfileSavedOk,
  saveProfileFormDraft,
  shouldRestoreProfileDraft,
} from './lib/profileFormDraftStorage';
import { geocodeAddress } from './utils/geocoding';
import {
  MEMBER_REQUESTS_COLLECTION,
  mapMemberRequestDoc,
} from './lib/memberRequests';
import {
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
  sanitizeWorkingLanguageCodes,
  sanitizeTypicalClientSizes,
  workingLanguageLabel,
} from './lib/contactPreferences';
import {
  profileMeetsPublicationRequirements,
  AI_OPTIMIZATION_READINESS_TARGET,
  PUBLICATION_BIO_MIN_LEN,
} from './lib/profilePublicationRules';
import {
  profileCoachFingerprint,
  collectProfileCoachGapKeys,
  formatLocalProfileCoachLine,
  fetchAiProfileCoachLine,
  normalizeAiCoachToSingleTip,
} from './lib/profileCoach';
import {
  PROFILE_COMPLETION_FOCUS_IDS,
  type ProfileCompletionInput,
  type ProfileCompletionKey,
} from './lib/profileCompletion';
import { getProfileCompletionPercentFromDomain } from './lib/profileCompletionFromDomain';
// Opportunités retirées du produit.
import { getGeminiApiKey } from './lib/geminiEnv';
import IceBreakerInterests from './components/profile/IceBreakerInterests';
import { TypicalClientSizesDropdown } from './components/profile/TypicalClientSizesDropdown';
import ProfileCompletionCard from './components/profile/ProfileCompletionCard';
import HeroSection from './components/home/HeroSection';
import WelcomeContextCard from './components/home/WelcomeContextCard';
import SearchBlock from './components/home/SearchBlock';
import RecommendedForYouSection from './components/home/RecommendedForYouSection';
import { NetworkRequestsSection } from './components/home/NetworkRequestsSection';
import InviteNetworkModal from './components/home/InviteNetworkModal';
import LegalInfoModal from './components/LegalInfoModal';
import ContactFooterModal from './components/ContactFooterModal';
import SpaRouteAnalytics from './components/SpaRouteAnalytics';
import { trackMemberInteraction } from './utils/trackEvent';
import { LEGAL_PRIVACY_PARAGRAPHS, LEGAL_TERMS_PARAGRAPHS } from './legal/footerLegalContent';
import { LegalPage } from './pages/LegalPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import { NewMembersSection } from './components/home/NewMembersSection';
import AiTranslatedFreeText from './components/AiTranslatedFreeText';
import ProfileAvatar from './components/ProfileAvatar';
import ProfileIdentityVisual from './components/profile/ProfileIdentityVisual';
import {
  ProfileCardEmailContact,
  ProfileCardWhatsappContactFooter,
} from './components/profile/ProfileCardUi';
import { Header as AppHeader, LanguageDropdownMobile } from './components/Header';
import SignupInviteCard from './components/home/SignupInviteCard';
import WhyJoinSection from './components/home/WhyJoinSection';
import First50MembersBanner from './components/home/First50MembersBanner';
import HeroSearchSection from './components/home/HeroSearchSection';
import DirectoryTabsSection from './components/home/DirectoryTabsSection';
import OnboardingIntroBanner from './components/home/OnboardingIntroBanner';
import { MemberCard } from './features/network/components/MemberCard';
import { RecommendedMembersSection } from './features/network/components/RecommendedMembersSection';
import { useCurrentCompatibilityMember } from './features/network/hooks/useCurrentCompatibilityMember';
import { userProfileToRecommendedMember } from './features/network/utils/compatibilityFromProfile';
import { NetworkSidebar } from './features/network/components/NetworkSidebar';
import { NetworkToolbar } from './features/network/components/NetworkToolbar';
import { SortPanel } from './features/network/components/SortPanel';
import { SortSelect } from './features/network/components/SortSelect';
import { SavedMembersPanel } from './features/network/components/SavedMembersPanel';
import {
  loadRecommendationPrefs,
  subscribeRecommendationPrefs,
} from './features/network/utils/recommendationPreferences';
import { ProfileSectionHint } from '@/features/profile/components/ProfileSectionHint';
import { ProfileSectionTag } from '@/features/profile/components/ProfileSectionTag';
import { ProfileMatchingSection } from '@/features/profile/components/ProfileMatchingSection';
import { ProfileFieldHint } from '@/features/profile/components/ProfileFieldHint';
import { PROFILE_FIELD_LABELS } from '@/features/profile/utils/profileFieldLabels';
import { PROFILE_FIELD_HELP } from '@/features/profile/utils/profileFieldHelp';
import { ProfileEditFormPatchStyles } from '@/features/profile/ProfileEditFormPatchStyles';
import '@/features/profile/profile-detail.css';
import { ProfileEditorialMemberBioField } from '@/features/profile/components/ProfileEditorialRouteFields';
import {
  memberCardBioBodyClassName,
  memberCardBioTitleAttr,
  memberCardDefaultNameClassName,
  memberCardRootClassName,
} from './features/network/utils/memberCard';
import { memberListingBioSource } from '@/features/network/utils/memberContent';
import { homeLanding } from './copy/homeLanding';
import AffinityScore from './components/AffinityScore';
import { MemberPublicProfile } from './components/profile/MemberPublicProfile';
import {
  profileCardClass,
  profileFieldLabelClass,
  profileNeedPillClass,
  profileNeutralPillClass,
  profileSectionTitleClass,
} from './components/profile/profileSectionStyles';
import { profileMatchesSearchQuery } from './profileSearch';
import { getSignupJoinUrl } from './lib/siteUrls';
import {
  GUEST_DIRECTORY_PREVIEW_LIMIT,
  isGuestDirectoryRestricted,
} from './lib/guestDirectory';
import { GuestDirectoryInterstitial } from './components/guest/GuestDirectoryInterstitial';
import ShareProfileModal from './components/profile/ShareProfileModal';
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
  Lock,
  X,
  Trash2,
  Megaphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './cn';
import {
  cardPad,
  pageInnerFluid,
  pageInnerMax,
  pageMainPad,
  pageSectionPad,
  pageStack,
} from './lib/pageLayout';
import {
  firebaseAuthCodeToTranslationKey,
  firebaseAuthErrorUserMessage,
  getAuthActionCodeSettings,
} from './lib/firebaseAuthUi';
import EmailAuthPanel from './components/EmailAuthPanel';
import { HomePage as MarketingHomePage } from '@/components/home/HomePage';
import { getPrimaryNav } from '@/routes/primaryNav';
import { canAccessRoute, getAppRole } from '@/auth/roleModel';
import { HeroTopActions } from '@/components/hero/HeroTopActions';

/** Même style que la navigation principale (pilules grises / actif noir). */
function primaryNavPillClass(active: boolean) {
  return cn(
    'inline-flex min-h-[40px] min-w-0 max-w-full shrink-0 items-center justify-center rounded-lg px-3 py-2 text-center text-xs font-semibold transition-colors sm:text-sm',
    active ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
  );
}

const loadNetworkRadarSection = () => import('./components/home/NetworkRadarSection');
const loadDashboardPage = () => import('./components/dashboard/DashboardPage');
const loadAdminPage = () => import('@/screens/AdminPage');
const loadAdminEvents = () => import('./components/dashboard/AdminEvents');
const loadPublicEventPage = () => import('./components/events/PublicEventPage');
const loadAdminMemberEventHistory = () => import('./components/admin/AdminMemberEventHistory');
const NetworkRadarSection = React.lazy(loadNetworkRadarSection);
const DashboardPage = React.lazy(loadDashboardPage);
const AdminPageLazy = React.lazy(loadAdminPage);
const AdminEventsLazy = React.lazy(loadAdminEvents);
const PublicEventPageLazy = React.lazy(loadPublicEventPage);
const AdminMemberEventHistoryLazy = React.lazy(loadAdminMemberEventHistory);

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

class SectionErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean; errorText: string }
> {
  // NOTE: TS in this repo doesn't expose React.Component instance members on subclasses.
  // We declare them to keep error reporting without affecting runtime behavior.
  declare props: { fallback: React.ReactNode; children: React.ReactNode };
  declare setState: (s: Partial<{ hasError: boolean; errorText: string }>) => void;
  state: { hasError: boolean; errorText: string } = { hasError: false, errorText: '' };

  static getDerivedStateFromError(): { hasError: boolean; errorText: string } {
    return { hasError: true, errorText: '' };
  }

  componentDidCatch(error: unknown) {
    const msg = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    console.error('Section render error:', error);
    this.setState({ errorText: msg });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="space-y-2">
          {this.props.fallback}
          {this.state.errorText ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-900">
              <span className="font-semibold">Détail erreur:</span> {this.state.errorText}
            </div>
          ) : null}
        </div>
      );
    }
    return this.props.children;
  }
}

interface SocialSignInButtonsProps {
  lang: Language;
  t: (key: string) => string;
  busy: SocialAuthProvider | null;
  /** Désactive Google / Microsoft / Apple (ex. soumission e-mail en cours). */
  oauthDisabled?: boolean;
  onSignIn: (p: SocialAuthProvider) => void;
}

function SocialSignInButtons({ lang, t, busy, oauthDisabled = false, onSignIn }: SocialSignInButtonsProps) {
  const connecting = pickLang('Connexion...', 'Conectando...', 'Signing in...', lang);
  const baseBtn =
    'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none disabled:cursor-not-allowed';

  const stackBtn = `w-full ${baseBtn} py-3 rounded-xl text-sm`;
  const blocked = busy !== null || oauthDisabled;

  return (
    <div className="flex w-full flex-col gap-2">
      <button
        type="button"
        onClick={() => onSignIn('google')}
        disabled={blocked}
        className={`${stackBtn} bg-white text-stone-900 shadow-lg hover:bg-stone-100`}
      >
        <BrandGoogle className="h-5 w-5 shrink-0" />
        {busy === 'google' ? connecting : t('continueGoogle')}
      </button>
      <button
        type="button"
        onClick={() => onSignIn('microsoft')}
        disabled={blocked}
        className={`${stackBtn} bg-[#2F2F2F] text-white hover:bg-[#1f1f1f]`}
      >
        <BrandMicrosoft className="h-5 w-5 shrink-0" />
        {busy === 'microsoft' ? connecting : t('continueMicrosoft')}
      </button>
      <button
        type="button"
        onClick={() => onSignIn('apple')}
        disabled={blocked}
        className={`${stackBtn} bg-black text-white hover:bg-stone-900`}
      >
        <BrandApple className="h-5 w-5 shrink-0" />
        {busy === 'apple' ? connecting : t('continueApple')}
      </button>
    </div>
  );
}

function HeaderSocialLoginButtons({
  lang,
  t,
  busy,
  emailBusy,
  onEmail,
  onSignIn,
}: {
  lang: Language;
  t: (key: string) => string;
  busy: SocialAuthProvider | null;
  emailBusy: boolean;
  onEmail: () => void;
  onSignIn: (p: SocialAuthProvider) => void;
}) {
  const connecting = pickLang('Connexion...', 'Conectando...', 'Signing in...', lang);
  const disabled = busy !== null || emailBusy;
  const btn =
    'inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60';
  return (
    <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
      <button
        type="button"
        onClick={() => onSignIn('google')}
        disabled={disabled}
        className={`${btn} border border-slate-200 bg-white text-slate-900 hover:bg-slate-50`}
        title={t('continueGoogle')}
        aria-label={t('continueGoogle')}
      >
        <BrandGoogle className="h-4 w-4 shrink-0" />
        <span className="hidden sm:inline">{busy === 'google' ? connecting : 'Google'}</span>
      </button>
      <button
        type="button"
        onClick={() => onSignIn('microsoft')}
        disabled={disabled}
        className={`${btn} bg-[#2F2F2F] text-white hover:bg-[#1f1f1f]`}
        title={t('continueMicrosoft')}
        aria-label={t('continueMicrosoft')}
      >
        <BrandMicrosoft className="h-4 w-4 shrink-0" />
        <span className="hidden sm:inline">{busy === 'microsoft' ? connecting : 'Microsoft'}</span>
      </button>
      <button
        type="button"
        onClick={() => onSignIn('apple')}
        disabled={disabled}
        className={`${btn} bg-black text-white hover:bg-stone-900`}
        title={t('continueApple')}
        aria-label={t('continueApple')}
      >
        <BrandApple className="h-4 w-4 shrink-0" />
        <span className="hidden sm:inline">{busy === 'apple' ? connecting : 'Apple'}</span>
      </button>
      <button
        type="button"
        onClick={onEmail}
        disabled={disabled}
        className={`${btn} bg-blue-700 text-white hover:bg-blue-800`}
        title={t('continueEmail')}
        aria-label={t('continueEmail')}
      >
        {emailBusy ? connecting : t('continueEmail')}
      </button>
    </div>
  );
}

const ADMIN_EMAIL = "chinois2001@gmail.com";
const isAdminEmail = (email?: string | null) =>
  (email || '').trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();

/** Profil minimal (sans document `users/{uid}`) : accès admin complet sans créer de fiche annuaire. */
function bootstrapAdminProfileFromAuth(u: User): UserProfile {
  const email = (u.email || '').trim().toLowerCase();
  return {
    uid: u.uid,
    fullName: (u.displayName || '').trim() || 'Admin',
    companyName: '—',
    email: email || '',
    photoURL: u.photoURL || undefined,
    role: 'admin',
    isValidated: true,
    createdAt: Timestamp.now(),
  };
}

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

function buildFirestoreErrorInfo(
  error: unknown,
  operationType: OperationType,
  path: string | null
): FirestoreErrorInfo {
  return {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path,
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = buildFirestoreErrorInfo(error, operationType, path);
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function logFirestoreErrorQuietly(error: unknown, operationType: OperationType, path: string | null) {
  console.error('Firestore Error: ', JSON.stringify(buildFirestoreErrorInfo(error, operationType, path)));
}

type UrgentModerationMutationResult = { success: true } | { success: false; code: string };

function urgentModerationErrorMessage(
  code: string,
  t: (key: string) => string,
  connectedEmail?: string | null,
  lang: Language = 'fr',
  connectedUid?: string | null
): string {
  if (code === 'permission-denied') {
    const base = t('urgentPostErrorPermissionDenied');
    const who =
      connectedEmail && connectedEmail.trim() !== ''
        ? ` — ${pickLang('compte : ', 'cuenta: ', 'signed in as: ', lang)}${connectedEmail.trim()}`
        : '';
    const uidPart =
      connectedUid && connectedUid.trim() !== ''
        ? ` — ${pickLang('UID : ', 'UID: ', 'UID: ', lang)}${connectedUid.trim()}`
        : '';
    const hint = pickLang(
      ' · Vérifiez les règles Firestore (même base que l’app) et que votre compte y est autorisé.',
      ' · Revisa las reglas de Firestore (misma base) y que tu cuenta esté autorizada.',
      ' · Check Firestore rules (same database as the app) and that your account is allowed.',
      lang
    );
    return `${base}${who}${uidPart}${hint}`;
  }
  if (
    code === 'unavailable' ||
    code === 'deadline-exceeded' ||
    code === 'resource-exhausted'
  ) {
    return t('urgentPostErrorNetwork');
  }
  return t('urgentPostSubmitErrorGeneric');
}

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

/** Hydrate l’édition : si ancienne fiche sans `memberBio`, recopie `bio` vers la 1ʳᵉ description d’activité une fois. */
function hydrateCompanyActivitiesDraftFromProfile(src: UserProfile): CompanyActivitySlot[] {
  const normalized = normalizeProfileCompanyActivities(src);
  return normalized.map((slot, i) => {
    if (
      i === 0 &&
      !String(slot.activityDescription ?? '').trim() &&
      String(src.bio ?? '').trim() &&
      !String(src.memberBio ?? '').trim()
    ) {
      return { ...slot, activityDescription: String(src.bio).trim() };
    }
    return slot;
  });
}

/** Listing annuaire : besoins structurés + seul CTA « Voir le profil » (email / WhatsApp sur la fiche). */
function ProfileCardListingFooter({
  p,
  lang,
  t,
}: {
  p: UserProfile;
  lang: Language;
  t: (key: string) => string;
}) {
  const ids = sanitizeHighlightedNeeds(p.highlightedNeeds);
  return (
    <div className="mt-3 flex min-h-0 flex-1 flex-col">
      <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
        {t('profilePublicCurrentNeeds')}
      </p>
      <div className="mt-1.5 min-h-[2rem] flex-1">
        {ids.length === 0 ? (
          <p className="text-xs italic text-stone-400">{t('directoryCardNoStructuredNeeds')}</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {ids.map((id) => (
              <span
                key={id}
                className="inline-flex max-w-full rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-900"
              >
                {needOptionLabel(id, lang)}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="mt-3 border-t border-slate-100 pt-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-blue-700">{t('directoryMemberCardCta')}</span>
          <ChevronRight className="h-4 w-4 shrink-0 text-blue-600" aria-hidden />
        </div>
      </div>
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
  guestDirectoryTeaser = false,
  onGuestJoin,
  viewerIsAdmin = false,
  networkListing = false,
}: {
  p: UserProfile;
  isOwn?: boolean;
  onEdit?: (p: UserProfile) => void;
  onDelete?: (uid: string) => void;
  onSelect: (p: UserProfile) => void;
  user: any;
  profile: UserProfile | null;
  variant?: ProfileCardVariant;
  /** Aperçu visiteur : bio courte + zone basse masquée par CTA */
  guestDirectoryTeaser?: boolean;
  onGuestJoin?: () => void;
  /** Édition / suppression fiches (admin annuaire). */
  viewerIsAdmin?: boolean;
  /** Mise en forme annuaire `/network` (scanabilité, styles `fn-network-*`). */
  networkListing?: boolean;
}) => {
  const { lang, t } = useLanguage();
  // Désactivation volontaire : l’admin ne modifie pas les profils via l’UI (évite incohérences).
  const allowAdminMutations = false;

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      key={p.uid}
      id={`profile-card-${p.uid}`}
      data-testid="member-card"
      onClick={() => onSelect(p)}
      className={cn(
        'relative flex min-h-0 cursor-pointer flex-col rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow group hover:shadow-md',
        guestDirectoryTeaser ? 'h-auto p-3 sm:p-5' : 'h-full p-4 sm:p-5',
        memberCardRootClassName(networkListing)
      )}
    >
      <div
        className={cn(
          'flex shrink-0 items-start justify-between gap-2',
          guestDirectoryTeaser ? 'mb-1.5 sm:mb-2' : 'mb-2'
        )}
      >
        <div className={cn('flex min-w-0 flex-1 items-start', guestDirectoryTeaser ? 'gap-2.5 sm:gap-3' : 'gap-3')}>
          <div
            className={cn(
              'relative shrink-0 overflow-hidden rounded-xl border border-stone-200',
              guestDirectoryTeaser ? 'h-10 w-10 sm:h-12 sm:w-12' : 'h-12 w-12'
            )}
          >
            {guestDirectoryTeaser ? (
              <>
                <div
                  className="pointer-events-none h-full w-full scale-125 select-none blur-md opacity-70"
                  aria-hidden
                >
                  <ProfileAvatar
                    photoURL={p.photoURL}
                    fullName={p.fullName}
                    className="h-full w-full"
                    iconSize={20}
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-stone-100/35">
                  <Lock className="h-4 w-4 text-stone-500" strokeWidth={2} aria-hidden />
                </div>
              </>
            ) : (
              <>
                <ProfileAvatar photoURL={p.photoURL} fullName={p.fullName} className="h-full w-full" iconSize={24} />
              </>
            )}
          </div>
          <div className="min-w-0 flex-1">
            {guestDirectoryTeaser && variant === 'company' && (
              <>
                <div className="mb-0.5 flex items-center gap-1.5 sm:mb-1 sm:gap-2">
                  <Building2 className="h-4 w-4 shrink-0 text-stone-500 sm:h-[18px] sm:w-[18px]" strokeWidth={1.75} />
                  <h3 className="truncate text-base font-bold leading-tight text-stone-900 transition-colors group-hover:text-stone-800 sm:text-lg md:text-xl">
                    {p.companyName}
                  </h3>
                </div>
                <p className="flex flex-wrap items-center gap-1.5 text-[13px] font-medium text-stone-600 sm:text-sm">
                  <UserIcon size={14} className="shrink-0 text-stone-400" />
                  <span className="truncate">{p.fullName}</span>
                </p>
              </>
            )}
            {guestDirectoryTeaser && variant === 'activity' && (
              <>
                <div
                  className="mb-1.5 h-7 max-w-[88%] rounded-lg bg-slate-200/90 blur-[6px] sm:mb-2 sm:h-9 sm:max-w-[90%] sm:blur-[8px]"
                  aria-hidden
                />
                <p className="truncate text-sm font-semibold text-stone-800">{p.companyName}</p>
                <p className="mt-0.5 truncate text-xs text-stone-600">{p.fullName}</p>
              </>
            )}
            {guestDirectoryTeaser && variant === 'default' && (
              <>
                <h3 className="line-clamp-2 break-words text-base font-bold leading-snug text-stone-900 transition-colors group-hover:text-stone-700 sm:text-lg sm:leading-tight">
                  {p.fullName}
                </h3>
                <p className="mt-0.5 truncate text-[11px] font-medium text-stone-500 sm:text-xs">{p.companyName}</p>
              </>
            )}
            {!guestDirectoryTeaser && variant === 'company' && (
              <>
                <div className="mb-0.5 flex items-center gap-2">
                  <Building2 size={18} className="shrink-0 text-stone-500" />
                  <h3 className="truncate text-lg font-bold leading-tight text-stone-900">{p.companyName}</h3>
                </div>
                <p className="truncate text-sm font-medium text-stone-600">{p.fullName}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-stone-500">
                  {(() => {
                    const cats = profileDistinctActivityCategories(p);
                    return cats.length
                      ? cats.map((c) => activityCategoryLabel(c, lang)).join(' · ')
                      : '—';
                  })()}
                </p>
              </>
            )}
            {!guestDirectoryTeaser && variant === 'activity' && (
              <>
                <h3 className="line-clamp-2 break-words text-base font-bold leading-snug text-stone-900">
                  {(() => {
                    const cats = profileDistinctActivityCategories(p);
                    return cats.length
                      ? cats.map((c) => activityCategoryLabel(c, lang)).join(' · ')
                      : pickLang('Secteur non renseigné', 'Sector no indicado', 'Sector not specified', lang);
                  })()}
                </h3>
                <p className="mt-0.5 truncate text-sm font-semibold text-stone-800">{p.companyName}</p>
                <p className="mt-0.5 truncate text-xs text-stone-500">{p.fullName}</p>
              </>
            )}
            {!guestDirectoryTeaser && variant === 'default' && (
              <>
                <h3 className={memberCardDefaultNameClassName(networkListing)}>{p.fullName}</h3>
                <p className="mt-0.5 truncate text-xs font-medium text-stone-600">{p.companyName}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-stone-500">
                  {(() => {
                    const cats = profileDistinctActivityCategories(p);
                    return cats.length
                      ? cats.map((c) => activityCategoryLabel(c, lang)).join(' · ')
                      : '—';
                  })()}
                </p>
              </>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {viewerIsAdmin && allowAdminMutations && (
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

      {!guestDirectoryTeaser ? (
        <div className="mt-1 min-h-0 shrink-0">
          {variant === 'default' && effectiveMemberBio(p).trim() ? (
            <p
              title={memberCardBioTitleAttr(effectiveMemberBio(p), networkListing)}
              className={memberCardBioBodyClassName(networkListing)}
            >
              {effectiveMemberBio(p)}
            </p>
          ) : null}
          {(variant === 'company' || variant === 'activity') && firstSlotActivityDescription(p).trim() ? (
            <p
              title={memberCardBioTitleAttr(firstSlotActivityDescription(p), networkListing)}
              className={memberCardBioBodyClassName(networkListing)}
            >
              {firstSlotActivityDescription(p)}
            </p>
          ) : null}
        </div>
      ) : null}

      {guestDirectoryTeaser ? (
        <div className="mt-1.5 w-full shrink-0 rounded-lg border border-slate-100 bg-slate-50/60 p-2.5 sm:mt-2 sm:rounded-xl sm:border-slate-200 sm:bg-slate-50/40 sm:p-3">
          <div className="mb-2 space-y-1.5 sm:mb-2.5 sm:space-y-2" aria-hidden>
            <div className="flex flex-wrap gap-1.5">
              <span className="h-3.5 w-12 rounded-full bg-slate-200/90 sm:h-4 sm:w-14 sm:bg-slate-100" />
              <span className="h-3.5 w-11 rounded-full bg-amber-100/90 sm:h-4 sm:w-12" />
            </div>
            <div className="h-1.5 w-[92%] rounded bg-slate-200/80 sm:h-2 sm:w-3/4 sm:max-w-[12rem] sm:bg-slate-100" />
            <div className="hidden h-1.5 w-1/2 max-w-[9rem] rounded bg-slate-100 sm:block" />
          </div>
          <p className="mb-2 flex items-start gap-2 text-left text-[11px] font-medium leading-snug text-slate-600 sm:mb-2.5 sm:text-xs">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" strokeWidth={2} aria-hidden />
            <span className="min-w-0">{t('guestOverlayTitle')}</span>
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onGuestJoin?.();
            }}
            className="flex min-h-[44px] w-full items-center justify-center rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800 active:bg-blue-800"
          >
            {t('guestJoinCta')}
          </button>
        </div>
      ) : (
        <ProfileCardListingFooter p={p} lang={lang} t={t} />
      )}
      {!guestDirectoryTeaser ? (
        <div
          className="pointer-events-none absolute bottom-2 right-2 z-[1] text-stone-400 sm:hidden"
          aria-hidden
        >
          <Maximize2 size={15} strokeWidth={2} className="opacity-75" />
        </div>
      ) : null}
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
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-12 -mt-12 blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative mb-4 flex shrink-0 items-start gap-3">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-indigo-100">
          <ProfileAvatar
            photoURL={p.photoURL}
            fullName={p.fullName}
            className="h-full w-full bg-indigo-50"
            iconSize={24}
          />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="line-clamp-2 min-h-[2.5rem] break-words font-bold leading-tight text-stone-900">
            {p.fullName}
          </h4>
          <p className="mt-0.5 min-h-[2.0625rem] text-xs font-medium leading-snug text-stone-500 line-clamp-2 break-words">
            {p.companyName}
          </p>
        </div>
      </div>

      <div className="mb-4 min-h-0 flex-1">
        <div className="min-h-[2.75rem] text-xs italic leading-relaxed text-stone-600 break-words">
          <AiTranslatedFreeText
            lang={lang}
            t={t}
            text={m.reason}
            as="span"
            omitAiDisclaimer
            className="line-clamp-2 break-words"
          />
        </div>
      </div>

      <div className="mt-auto shrink-0 space-y-3">
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

const SHARE_NEEDS_CACHE_PREFIX = 'ai_share_needs_v1:'; // bump to invalidate
const SHARE_NEEDS_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
const shareNeedsInFlight = new Map<string, Promise<string>>();

function readShareNeedsCached(key: string): string | null {
  try {
    const raw = globalThis.localStorage?.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { out: string; ts: number };
    if (!parsed || typeof parsed.out !== 'string' || typeof parsed.ts !== 'number') return null;
    if (!Number.isFinite(parsed.ts) || parsed.ts <= 0) return null;
    if (Date.now() - parsed.ts > SHARE_NEEDS_TTL_MS) {
      globalThis.localStorage?.removeItem(key);
      return null;
    }
    return parsed.out.trim() || null;
  } catch {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      // ignore
    }
    return null;
  }
}

function writeShareNeedsCached(key: string, out: string) {
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify({ out, ts: Date.now() }));
  } catch {
    /* ignore quota/storage errors */
  }
}

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
      const apiKey = getGeminiApiKey();
      if (!apiKey) throw new Error('missing-gemini-api-key');
      const needsForAi = formatHighlightedNeedsForText(profile.highlightedNeeds, lang) || '—';
      const cacheKey = `${SHARE_NEEDS_CACHE_PREFIX}${lang}:${profile.uid}:${needsForAi}`;
      const cached = readShareNeedsCached(cacheKey);
      if (cached) {
        const footer = pickLang(
          `\n\nMon profil : ${window.location.origin}/profil/${profile.uid}`,
          `\n\nMi perfil: ${window.location.origin}/profil/${profile.uid}`,
          `\n\nMy profile: ${window.location.origin}/profil/${profile.uid}`,
          lang
        );
        setMessage(`${cached}${footer}`);
        return;
      }

      const existing = shareNeedsInFlight.get(cacheKey);
      if (existing) {
        const out = await existing;
        const footer = pickLang(
          `\n\nMon profil : ${window.location.origin}/profil/${profile.uid}`,
          `\n\nMi perfil: ${window.location.origin}/profil/${profile.uid}`,
          `\n\nMy profile: ${window.location.origin}/profil/${profile.uid}`,
          lang
        );
        setMessage(`${out}${footer}`);
        return;
      }

      const prompt = pickLang(
        `Reformule de manière professionnelle et engageante pour un partage LinkedIn/WhatsApp. Besoins structurés (tags): "${needsForAi}". Message court (max 200 caractères), sans guillemets autour du résultat.`,
        `Reformula de forma profesional y atractiva para compartir en LinkedIn/WhatsApp. Necesidades estructuradas (etiquetas): "${needsForAi}". Mensaje breve (máx. 200 caracteres), sin comillas alrededor del resultado.`,
        `Rephrase in a professional, engaging way for LinkedIn/WhatsApp sharing. Structured needs (tags): "${needsForAi}". Short message (max 200 characters), no quotes around the result.`,
        lang
      );
      const task = (async () => {
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
        });
        const text = (response.text || '').trim();
        if (text) writeShareNeedsCached(cacheKey, text);
        return text;
      })().finally(() => {
        shareNeedsInFlight.delete(cacheKey);
      });
      shareNeedsInFlight.set(cacheKey, task);

      const text = await task;
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const navigate = useNavigate();
  const displayName = formatPersonName(profile?.fullName);

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
  }, [profileId]);

  const handleShare = () => {
    if (profile && navigator.share) {
      navigator.share({
        title: `Profil de ${displayName || profile.fullName}`,
        text: effectiveMemberBio(profile) || firstSlotActivityDescription(profile) || '',
        url: window.location.href
      });
    }
  };


  if (loading) return <div className="min-h-screen flex items-center justify-center bg-stone-50"><RefreshCw className="animate-spin text-indigo-600" /></div>;
  if (!profile) return <div className="min-h-screen flex items-center justify-center bg-stone-50">{t('profileNotFound')}</div>;

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-stone-50 px-4 py-10">
        <Helmet>
          <title>{displayName || profile.fullName} | Community Hub</title>
        </Helmet>
        <div className="mx-auto max-w-lg">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mb-6 flex items-center gap-2 font-bold text-stone-500 transition-colors hover:text-stone-900"
          >
            <ArrowLeft size={20} />
            {pickLang("Retour à l'accueil", 'Volver al inicio', 'Back to home', lang)}
          </button>
          <div className="rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-xl">
            <h1 className="text-2xl font-bold text-stone-900 break-words">{displayName || profile.fullName}</h1>
            <p className="mt-2 text-lg text-stone-600">{profile.companyName}</p>
            <div className="relative mt-8 min-h-[200px] overflow-hidden rounded-2xl border border-stone-100 bg-stone-50">
              <div className="pointer-events-none select-none p-6 blur-lg opacity-60" aria-hidden>
                <p className="text-sm text-stone-400">
                  {effectiveMemberBio(profile) || firstSlotActivityDescription(profile) || '…'}
                </p>
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/90 px-4 backdrop-blur-sm">
                <Lock className="h-8 w-8 text-stone-400" strokeWidth={2} aria-hidden />
                <p className="text-sm font-medium text-stone-700">{t('guestOverlayTitle')}</p>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
                >
                  {t('guestJoinCta')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tp = t;

  return (
    <div className="profile-detail-page min-h-screen bg-stone-50 pb-20">
      <Helmet>
        <title>{displayName || profile.fullName} | Community Hub</title>
        <meta property="og:title" content={`Profil de ${displayName || profile.fullName}`} />
        <meta
          property="og:description"
          content={(
            [
              effectiveMemberBio(profile),
              firstSlotActivityDescription(profile),
              formatHighlightedNeedsForText(profile.highlightedNeeds, lang),
            ]
              .filter(Boolean)
              .join(' — ') || ''
          ).substring(0, 150)}
        />
        {profile.photoURL && <meta property="og:image" content={profile.photoURL} />}
      </Helmet>

      <div className="profile-detail-shell">
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center gap-2 font-bold text-stone-500 transition-colors hover:text-stone-900"
        >
          <ArrowLeft size={20} />
          {pickLang("Retour à l'accueil", 'Volver al inicio', 'Back to home', lang)}
        </button>

        <div className="profile-detail-grid">
          <main className="profile-main">
            <header className="profile-hero">
              <div className="profile-hero__top">
                <div className="profile-hero__identity">
                  <div className="profile-hero__avatar">
                    <ProfileAvatar
                      photoURL={profile.photoURL}
                      fullName={displayName || profile.fullName}
                      className="h-full w-full"
                      initialsClassName="text-2xl font-bold text-stone-400"
                      iconSize={40}
                    />
                  </div>
                  <div className="min-w-0">
                    <h1 className="profile-hero__name">{displayName || profile.fullName}</h1>
                    <p className="profile-hero__company">
                      {companyActivityNamesJoined(profile) || profile.companyName || '—'}
                    </p>
                    <p className="profile-hero__meta">
                      {[profile.positionCategory ? workFunctionLabel(profile.positionCategory, lang) : '', profile.city]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    {(() => {
                      const cats = profileDistinctActivityCategories(profile);
                      const first = cats[0];
                      return first ? (
                        <span className="profile-hero__sector">{activityCategoryLabel(first, lang)}</span>
                      ) : null;
                    })()}
                  </div>
                </div>

                <div className="profile-hero__actions">
                  <a
                    className="profile-action profile-action--ghost"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleShare();
                    }}
                  >
                    {pickLang('Partager', 'Compartir', 'Share', lang)}
                  </a>
                  {profile.email && (profile.isEmailPublic || (currentUser && currentProfile?.isValidated)) ? (
                    <a
                      className="profile-action profile-action--secondary"
                      href={`mailto:${profile.email}`}
                    >
                      {t('cardContactByEmail')}
                    </a>
                  ) : null}
                  {profile.whatsapp && (profile.isWhatsappPublic || (currentUser && currentProfile?.isValidated)) ? (
                    <a
                      className="profile-action profile-action--primary"
                      href={`https://wa.me/${profile.whatsapp.replace(/\\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('cardContactByWhatsapp')}
                    </a>
                  ) : null}
                </div>
              </div>
            </header>

            {currentProfile?.role === 'admin' ? (
              <div className="profile-card profile-card--soft profile-card--full">
                <p className="profile-card__text">
                  <span className="font-semibold text-slate-900">{t('adminLastSeenLabel')}</span>
                  {': '}
                  {formatProfileLastSeen(profile.lastSeen, lang) ?? t('adminLastSeenUnknown')}
                </p>
              </div>
            ) : null}

            <div className="profile-main-grid">
              {profile.networkGoal?.trim() ? (
                <section className="profile-card">
                  <p className="profile-card__label">{t('profileNetworkGoalLabel')}</p>
                  <p className="profile-card__text">{profile.networkGoal}</p>
                </section>
              ) : (
                <section className="profile-card profile-card--soft">
                  <p className="profile-card__label">{t('profileNetworkGoalLabel')}</p>
                  <p className="profile-card__text">{pickLang('—', '—', '—', lang)}</p>
                </section>
              )}

              <section className="profile-card">
                <p className="profile-card__label">{t('profilePublicCurrentNeeds')}</p>
                <div className="profile-chip-list">
                  {sanitizeHighlightedNeeds(profile.highlightedNeeds).length > 0 ? (
                    sanitizeHighlightedNeeds(profile.highlightedNeeds).map((id) => (
                      <span key={id} className="profile-chip">
                        {needOptionLabel(id, lang)}
                      </span>
                    ))
                  ) : (
                    <span className="profile-chip">{pickLang('—', '—', '—', lang)}</span>
                  )}
                </div>
                {sanitizeHighlightedNeeds(profile.highlightedNeeds).length > 0 ? (
                  <a className="profile-link-inline" href={`/besoin/${encodeURIComponent(profile.uid)}`}>
                    {pickLang('Voir le besoin', 'Ver la necesidad', 'View need', lang)} <ChevronRight size={16} />
                  </a>
                ) : null}
              </section>
            </div>

            <div className="profile-section-stack">
              {profile.helpNewcomers?.trim() ? (
                <section className="profile-card profile-card--full">
                  <p className="profile-card__label">{t('profileHelpNewcomersLabel')}</p>
                  <div className="profile-richtext">
                    <p className="profile-card__text whitespace-pre-wrap">{profile.helpNewcomers}</p>
                  </div>
                </section>
              ) : null}

              {effectiveMemberBio(profile).trim() ? (
                <section className="profile-card profile-card--full">
                  <p className="profile-card__label">{t('memberBio')}</p>
                  <AiTranslatedFreeText
                    lang={lang}
                    t={t}
                    text={effectiveMemberBio(profile)}
                    pretranslatedByLang={
                      profile.memberBio?.trim() ? profile.memberBioTranslations : profile.bioTranslations
                    }
                    className="profile-richtext"
                    whitespace="pre-wrap"
                  />
                </section>
              ) : null}

              {(() => {
                const slots = normalizeProfileCompanyActivities(profile);
                const blocks = slots
                  .map((slot) => {
                    const text = displayActivityDescriptionForSlot(slot);
                    if (!text.trim() || !slot.companyName.trim()) return null;
                    return { slot, text };
                  })
                  .filter(Boolean) as { slot: (typeof slots)[0]; text: string }[];
                if (blocks.length === 0) return null;
                return (
                  <section className="profile-card profile-card--full">
                    <p className="profile-card__label">{t('profileFormActivityDescriptionLabel')}</p>
                    <div className="profile-list">
                      {blocks.map(({ slot, text }) => (
                        <div key={slot.id} className="profile-card profile-card--soft">
                          <p className="profile-card__label">{slot.companyName.trim()}</p>
                          <AiTranslatedFreeText
                            lang={lang}
                            t={t}
                            text={text}
                            className="profile-richtext"
                            whitespace="pre-wrap"
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })()}

              {profile.pitchVideoUrl ? (
                <section className="profile-card profile-card--full">
                  <p className="profile-card__label">
                    {pickLang('Pitch vidéo', 'Video pitch', 'Video pitch', lang)}
                  </p>
                  <div className="aspect-video overflow-hidden rounded-[18px] border border-slate-200 bg-stone-900">
                    <video
                      src={profile.pitchVideoUrl}
                      controls
                      className="h-full w-full object-contain"
                      onPlay={(e) => {
                        const v = e.target as HTMLVideoElement;
                        if (v.duration > 60) {
                          window.setTimeout(() => {
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
              ) : null}
            </div>
          </main>

          <aside className="profile-side">
            <section className="profile-side-card">
              <h2 className="profile-side-card__title">{tp('details')}</h2>
              <div className="profile-detail-items">
                <div className="profile-detail-item">
                  <div className="profile-detail-item__label">{tp('activityCategory')}</div>
                  <div className="profile-detail-item__value">
                    {(() => {
                      const cats = profileDistinctActivityCategories(profile);
                      return cats.length ? activityCategoryLabel(cats[0], lang) : '—';
                    })()}
                  </div>
                </div>
                <div className="profile-detail-item">
                  <div className="profile-detail-item__label">
                    {pickLang('Taille', 'Tamaño', 'Size', lang)}
                  </div>
                  <div className="profile-detail-item__value">
                    {profile.companySize ? `${profile.companySize} ${pickLang('employés', 'empleados', 'employees', lang)}` : '—'}
                  </div>
                </div>
                <div className="profile-detail-item">
                  <div className="profile-detail-item__label">{pickLang('Ville', 'Ciudad', 'City', lang)}</div>
                  <div className="profile-detail-item__value">{profile.city?.trim() || '—'}</div>
                </div>
              </div>
            </section>

            <section className="profile-side-card">
              <h2 className="profile-side-card__title">{tp('contactLinks')}</h2>
              <div className="profile-contact-stack">
                <ProfileCardEmailContact
                  email={profile.email}
                  canView={Boolean(profile.isEmailPublic || (currentUser && currentProfile?.isValidated))}
                  t={t}
                  trackProfile={
                    currentUser
                      ? {
                          profileId: profile.uid,
                          profileName: profile.fullName || profile.companyName || profile.uid,
                        }
                      : undefined
                  }
                />
                {profile.whatsapp ? (
                  <ProfileCardWhatsappContactFooter
                    whatsapp={profile.whatsapp}
                    canView={Boolean(profile.isWhatsappPublic || (currentUser && currentProfile?.isValidated))}
                    t={t}
                    trackProfile={
                      currentUser
                        ? {
                            profileId: profile.uid,
                            profileName: profile.fullName || profile.companyName || profile.uid,
                          }
                        : undefined
                    }
                  />
                ) : null}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
};

const NeedPage = () => {
  const { lang, t } = useLanguage();
  const { needId } = useParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<NeedComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const navigate = useNavigate();
  const displayName = formatPersonName(profile?.fullName);

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
    if (!needId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const docSnap = await getDoc(doc(db, 'users', needId));
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
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

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-stone-50 px-4 py-10">
        <Helmet>
          <title>
            {pickLang('Besoin — aperçu', 'Necesidad — vista previa', 'Need — preview', lang)}
          </title>
        </Helmet>
        <div className="mx-auto max-w-lg">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mb-6 flex items-center gap-2 font-bold text-stone-500 transition-colors hover:text-stone-900"
          >
            <ArrowLeft size={20} />
            {pickLang("Retour à l'accueil", 'Volver al inicio', 'Back to home', lang)}
          </button>
          <div className="rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-xl">
            <h1 className="text-2xl font-bold text-stone-900 break-words">{profile.fullName}</h1>
            <p className="mt-2 text-lg text-stone-600">{profile.companyName}</p>
            <div className="relative mt-8 min-h-[180px] overflow-hidden rounded-2xl border border-stone-100 bg-stone-50">
              <div className="pointer-events-none select-none p-6 blur-lg opacity-50" aria-hidden>
                <p className="text-sm text-stone-400">
                  {formatHighlightedNeedsForText(profile.highlightedNeeds, lang) || '…'}
                </p>
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/90 px-4 backdrop-blur-sm">
                <Lock className="h-8 w-8 text-stone-400" strokeWidth={2} aria-hidden />
                <p className="text-sm font-medium text-stone-700">{t('guestOverlayTitle')}</p>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
                >
                  {t('guestJoinCta')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      <Helmet>
        <title>Besoin de {displayName || profile.fullName} | Community Hub</title>
        <meta property="og:title" content={`Besoin de ${displayName || profile.fullName}`} />
        <meta
          property="og:description"
          content={
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
                  fullName={displayName || profile.fullName}
                  className="h-full w-full"
                  initialsClassName="text-lg font-bold text-stone-400"
                  iconSize={32}
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-stone-900">{displayName || profile.fullName}</h1>
                <p className="text-stone-500 font-medium">{profile.companyName}</p>
              </div>
              {/* Opportunités retirées du produit */}
            </div>

            <div className="bg-stone-50 p-8 rounded-[2rem] border border-stone-200 mb-8">
              <h2 className="text-xs font-black text-stone-400 uppercase tracking-[0.2em] mb-4">
                {pickLang('Description du besoin', 'Descripción de la necesidad', 'Need description', lang)}
              </h2>
              <div className="text-xl text-stone-800 font-bold leading-tight italic">
                <span>
                  {formatHighlightedNeedsForText(profile.highlightedNeeds, lang) ||
                    pickLang('Aucun besoin spécifié.', 'Ninguna necesidad especificada.', 'No need specified.', lang)}
                </span>
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
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
                    <ProfileAvatar
                      photoURL={c.authorPhoto}
                      fullName={c.authorName}
                      className="h-full w-full bg-stone-100"
                      iconSize={20}
                    />
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

type MainAppProps = {
  initialViewMode?: 'companies' | 'members' | 'activities' | 'radar' | 'dashboard';
};

type MembersSortMode = 'default' | 'recent' | 'alphabetical';

function parseMembersSortFromSearch(search: string): MembersSortMode {
  const s = new URLSearchParams(search).get('sort');
  if (s === 'alpha' || s === 'alphabetical') return 'alphabetical';
  if (s === 'default') return 'default';
  return 'recent';
}

const MainApp = ({ initialViewMode = 'members' }: MainAppProps) => {
  const { lang, setLang, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const h = homeLanding(lang);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  /** Admin: a-t-on une vraie fiche `users/{uid}` ? (sinon, profil bootstrap en mémoire) */
  const [adminUserDocExists, setAdminUserDocExists] = useState(false);
  /** Admin: l’admin a explicitement choisi de créer sa propre fiche. */
  const [adminSelfProfileOptIn, setAdminSelfProfileOptIn] = useState(false);
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);
  const networkCompatibilityCurrentUser = useCurrentCompatibilityMember({ profile });
  const showEmailVerifyBanner = useMemo(
    () =>
      Boolean(
        user &&
          !user.emailVerified &&
          user.providerData.some((p) => p.providerId === 'password')
      ),
    [user]
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isShareNeedsModalOpen, setIsShareNeedsModalOpen] = useState(false);
  const [isShareProfileModalOpen, setIsShareProfileModalOpen] = useState(false);
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
  const lastProfileViewLoggedRef = useRef<string | null>(null);
  const [loading, setLoading] = useState(true);
  /** URL photo profil (formulaire édition) — synchronisée avec le champ masqué `photoURL` à l’enregistrement. */
  const [profilePhotoUrlDraft, setProfilePhotoUrlDraft] = useState('');
  const directoryMainRef = useRef<HTMLDivElement>(null);
  const membersDirectoryGridRef = useRef<HTMLDivElement>(null);
  const [membersSortMode, setMembersSortMode] = useState<MembersSortMode>('default');
  const [showSavedMembersOnly, setShowSavedMembersOnly] = useState(false);
  const [showValidationPanel, setShowValidationPanel] = useState(false);
  const [memberRequests, setMemberRequests] = useState<MemberNetworkRequest[]>([]);
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<
    'companies' | 'members' | 'activities' | 'radar' | 'dashboard'
  >(initialViewMode);
  const [dashboardInitialAdminTab, setDashboardInitialAdminTab] = useState<
    'overview' | 'profiles' | 'site' | 'events'
  >('overview');
  const isSignupLandingRoute = useMemo(
    () =>
      location.pathname === '/inscription' ||
      location.pathname === '/rejoindre' ||
      location.pathname === '/join',
    [location.pathname]
  );
  const isSignupMinimal = isSignupLandingRoute && !user;
  const signupAuthOpenedRef = useRef(false);

  const isPublicEventRoute = location.pathname.startsWith('/e/');
  /** Politique / CGU courtes : même coquille que le reste du site (`AppHeader` + pied de page). */
  const shortLegalPage = useMemo((): null | 'privacy' | 'terms' => {
    const p = location.pathname;
    if (p === '/privacy' || p === '/confidentialite') return 'privacy';
    if (p === '/terms' || p === '/conditions' || p === '/terms-of-service') return 'terms';
    return null;
  }, [location.pathname]);
  const publicEventSlug = useMemo(() => {
    if (!location.pathname.startsWith('/e/')) return '';
    return decodeURIComponent(location.pathname.replace(/^\/e\//, '')).trim();
  }, [location.pathname]);
  const [publicEvent, setPublicEvent] = useState<AdminEvent | null>(null);
  const [publicEventLoading, setPublicEventLoading] = useState(false);
  const [publicEventError, setPublicEventError] = useState<string | null>(null);
  const [showRsvpModal, setShowRsvpModal] = useState(false);
  const [rsvpDoneForEventId, setRsvpDoneForEventId] = useState<string | null>(null);
  const [rsvpCheckDoneForEventId, setRsvpCheckDoneForEventId] = useState<string | null>(null);
  const [rsvpBusy, setRsvpBusy] = useState(false);
  const [rsvpError, setRsvpError] = useState<string | null>(null);
  const [pendingRsvpStatus, setPendingRsvpStatus] = useState<'present' | 'declined' | null>(null);
  const [upcomingInviteEvent, setUpcomingInviteEvent] = useState<null | { event: AdminEvent; status: 'invited' | 'present' | 'declined' }>(
    null
  );
  const [upcomingInviteLoading, setUpcomingInviteLoading] = useState(false);
  /** Masque « Nouveaux membres » et « Opportunités » après interaction avec les onglets du listing (remonte le bloc principal). */
  const [directoryDiscoveryStripsHidden, setDirectoryDiscoveryStripsHidden] = useState(false);
  const [matches, setMatches] = useState<MatchSuggestion[]>([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchBlockReason, setMatchBlockReason] = useState<AiMatchBlockReason>(null);
  const [aiRecResolved, setAiRecResolved] = useState(false);
  const [highlightedNeedFilter, setHighlightedNeedFilter] = useState('');
  const [passionIdFilter, setPassionIdFilter] = useState('');
  const [highlightedNeedsDraft, setHighlightedNeedsDraft] = useState<string[]>([]);
  const [passionIdsDraft, setPassionIdsDraft] = useState<string[]>([]);
  const [workingLanguagesDraft, setWorkingLanguagesDraft] = useState<string[]>([]);
  const profileWhatsappSplit = useMemo(
    () => splitStoredPhone(editingProfile?.whatsapp ?? profile?.whatsapp),
    [editingProfile?.whatsapp, profile?.whatsapp]
  );
  const profileWhatsappDialDefault = isKnownPhoneDial(profileWhatsappSplit.dial)
    ? profileWhatsappSplit.dial
    : DEFAULT_PHONE_DIAL;
  const profileWhatsappLocalDefault = isKnownPhoneDial(profileWhatsappSplit.dial)
    ? profileWhatsappSplit.local
    : (editingProfile?.whatsapp ?? profile?.whatsapp ?? '').replace(/\s/g, '');
  const [companyActivitiesDraft, setCompanyActivitiesDraft] = useState<CompanyActivitySlot[]>([]);
  const [companyActivityEditCollapsed, setCompanyActivityEditCollapsed] = useState<Record<string, boolean>>(
    {}
  );
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [expandedHookId, setExpandedHookId] = useState<string | null>(null);
  const [authProviderBusy, setAuthProviderBusy] = useState<SocialAuthProvider | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmailBusy, setAuthEmailBusy] = useState(false);
  const [authModalResetKey, setAuthModalResetKey] = useState(0);
  const [emailVerifyNotice, setEmailVerifyNotice] = useState<string | null>(null);
  const [emailVerifySending, setEmailVerifySending] = useState(false);
  const [showInviteNetworkModal, setShowInviteNetworkModal] = useState(false);
  const [memberRequestModalNonce, setMemberRequestModalNonce] = useState(0);
  const [footerLegalModal, setFooterLegalModal] = useState<null | 'privacy' | 'terms'>(null);
  const [footerContactOpen, setFooterContactOpen] = useState(false);
  const [profileSaveBusy, setProfileSaveBusy] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState<string | null>(null);
  const [profileVisibilityBandHidden, setProfileVisibilityBandHidden] = useState(() => {
    try {
      return window.sessionStorage.getItem('fn_profile_visibility_band_hidden') === '1';
    } catch {
      return false;
    }
  });
  const [optimizationBusy, setOptimizationBusy] = useState(false);
  const [optimizationError, setOptimizationError] = useState<string | null>(null);
  const [profileCoachLine, setProfileCoachLine] = useState('');
  const [profileCoachSource, setProfileCoachSource] = useState<'local' | 'ai' | null>(null);
  const [profileCoachLoading, setProfileCoachLoading] = useState(false);
  const authInitPromiseRef = useRef<Promise<void> | null>(null);
  /** Évite double clic / requêtes OAuth concurrentes (souvent `auth/cancelled-popup-request`). */
  const socialOAuthLockRef = useRef(false);
  const profileFormLayoutRef = useRef<HTMLDivElement | null>(null);
  const directoryProfileFormRef = useRef<HTMLFormElement | null>(null);
  /** Évite de remonter le formulaire en boucle après restauration du brouillon. */
  const profileDraftRestoreNonceRef = useRef<string>('');
  const [profileFormDraftOverrides, setProfileFormDraftOverrides] = useState<{
    texts: Record<string, string>;
    checks: Record<string, boolean>;
  } | null>(null);
  const [profileFormRemountKey, setProfileFormRemountKey] = useState(0);

  /** Admin annuaire : rôle sur la fiche OU e-mail admin (ex. sans doc Firestore). */
  const viewerIsAdmin = profile?.role === 'admin' || isAdminEmail(user?.email);
  /** Édition d’une fiche membre distincte du compte connecté (ne doit pas s’afficher comme « Mon profil »). */
  const editingSomeoneElse = Boolean(
    user && editingProfile && editingProfile.uid !== user.uid
  );
  /**
   * Admin sans fiche : on masque le panneau par défaut.
   * Exceptions :
   * - l’admin édite une fiche membre (`editingSomeoneElse`)
   * - l’admin a déjà une vraie fiche (`adminUserDocExists`)
   * - l’admin a explicitement cliqué “Créer mon profil” (`adminSelfProfileOptIn`)
   * - non-admin : toujours afficher
   */
  const showAdminSelfProfilePanel = Boolean(
    !isAdminEmail(user?.email) || editingSomeoneElse || adminUserDocExists || adminSelfProfileOptIn
  );

  useEffect(() => {
    if (!profileSaveSuccess) return;
    const timer = globalThis.setTimeout(() => setProfileSaveSuccess(null), 8000);
    return () => globalThis.clearTimeout(timer);
  }, [profileSaveSuccess]);

  useEffect(() => {
    if (!emailVerifyNotice) return;
    const id = window.setTimeout(() => setEmailVerifyNotice(null), 6000);
    return () => window.clearTimeout(id);
  }, [emailVerifyNotice]);

  useEffect(() => {
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    let timeoutId: number | null = null;
    let idleId: number | null = null;
    const preload = () => {
      // Prefetch chunks likely needed next, without blocking first paint.
      void loadNetworkRadarSection();
      if (viewerIsAdmin) {
        void loadDashboardPage();
        void import('xlsx');
      }
    };
    if (typeof w.requestIdleCallback === 'function') {
      idleId = w.requestIdleCallback(preload, { timeout: 1200 });
      return () => {
        if (idleId !== null && typeof w.cancelIdleCallback === 'function') {
          w.cancelIdleCallback(idleId);
        }
      };
    }
    timeoutId = window.setTimeout(preload, 900);
    return () => {
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [viewerIsAdmin]);

  const isHomeRoute = location.pathname === '/';
  const isDashboardRoute = location.pathname === '/dashboard';
  const isNetworkRoute = location.pathname === '/network';
  const isRequestsRoute = location.pathname === '/requests';
  const isRadarRoute = location.pathname === '/radar';
  const isAdminRoute = location.pathname === '/admin' || location.pathname.startsWith('/admin/');
  const isEditProfileRoute = location.pathname === '/profile/edit';
  /** Libellés / aides FR raccourcis (patch UX) uniquement sur /profile/edit. */
  const profileEditFrUx = isEditProfileRoute && lang === 'fr';
  const isMembersDirectoryRoute = location.pathname === '/membres' || isNetworkRoute;
  const pathnameNorm = location.pathname.replace(/\/$/, '') || '/';
  const isEventsAdminRoute = pathnameNorm === '/evenements';

  useEffect(() => {
    if (!isNetworkRoute) setShowSavedMembersOnly(false);
  }, [isNetworkRoute]);

  const role = getAppRole({ user, profile, viewerIsAdmin });

  useEffect(() => {
    // Route guards are driven by the central role model.
    // Wait for the app to finish its initial auth/profile load, otherwise we can create
    // confusing transient redirects (especially around admin detection).
    if (loading) return;
    if (canAccessRoute(role, location.pathname)) return;
    if (role === 'guest') {
      // Avoid referencing `openAuthModal` here: it's declared later in this file (TDZ risk).
      setAuthError(null);
      setAuthModalResetKey((k) => k + 1);
      setShowAuthModal(true);
      navigate('/', { replace: true });
      return;
    }
    // Logged-in non-admin trying to access admin space.
    navigate('/dashboard', { replace: true });
  }, [loading, location.pathname, navigate, role]);

  useEffect(() => {
    // "Mon profil" should open the full editor directly.
    if (loading) return;
    if (!isEditProfileRoute) return;
    if (!user) return;
    setIsProfileExpanded(true);
    setIsEditing(true);
    window.requestAnimationFrame(() => {
      profileFormLayoutRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [loading, isEditProfileRoute, user]);

  useLayoutEffect(() => {
    if (location.pathname === '/membres' || location.pathname === '/network') {
      setViewMode('members');
      setDirectoryDiscoveryStripsHidden(true);
      setMembersSortMode(parseMembersSortFromSearch(location.search));
    } else if (location.pathname === '/dashboard') {
      setViewMode('dashboard');
      setDirectoryDiscoveryStripsHidden(true);
    } else if (location.pathname === '/radar') {
      setViewMode('radar');
      setDirectoryDiscoveryStripsHidden(true);
    } else if (location.pathname === '/requests') {
      setViewMode('members');
      setDirectoryDiscoveryStripsHidden(true);
    } else {
      setMembersSortMode('default');
    }
  }, [location.pathname, location.search]);

  useLayoutEffect(() => {
    const p = location.pathname.replace(/\/$/, '') || '/';
    if (p === '/evenements') {
      setViewMode('dashboard');
      setDirectoryDiscoveryStripsHidden(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!isPublicEventRoute) {
      setPublicEvent(null);
      setPublicEventError(null);
      setPublicEventLoading(false);
      setShowRsvpModal(false);
      setRsvpError(null);
      setRsvpDoneForEventId(null);
      setRsvpCheckDoneForEventId(null);
      setPendingRsvpStatus(null);
      return;
    }
    if (!publicEventSlug) return;
    let cancelled = false;
    setPublicEventLoading(true);
    setPublicEventError(null);
    (async () => {
      try {
        const q = query(
          collection(db, 'events'),
          where('slug', '==', publicEventSlug),
          where('status', '==', 'published'),
          limit(1)
        );
        const snap = await getDocs(q);
        const docSnap = snap.docs[0];
        const row = docSnap ? ({ id: docSnap.id, ...(docSnap.data() as Record<string, unknown>) } as AdminEvent) : null;
        if (!cancelled) setPublicEvent(row);
      } catch (e) {
        if (!cancelled) setPublicEventError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setPublicEventLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isPublicEventRoute, publicEventSlug]);

  useEffect(() => {
    let cancelled = false;
    async function loadUpcomingInvite() {
      if (!user?.uid) {
        setUpcomingInviteEvent(null);
        return;
      }
      setUpcomingInviteLoading(true);
      try {
        const partsSnap = await getDocs(
          query(collection(db, 'event_participations'), where('uid', '==', user.uid), limit(40))
        );
        const byEvent = new Map<string, { eventId: string; status: 'invited' | 'present' | 'declined' }>();
        partsSnap.docs.forEach((d) => {
          const data = d.data() as { eventId?: string; status?: string };
          const eventId = String(data.eventId ?? '').trim();
          const st = String(data.status ?? '').trim() as 'invited' | 'present' | 'declined';
          if (!eventId || !['invited', 'present', 'declined'].includes(st)) return;
          const prev = byEvent.get(eventId);
          // Priorité : present/declined > invited
          if (!prev || (prev.status === 'invited' && st !== 'invited')) {
            byEvent.set(eventId, { eventId, status: st });
          }
        });
        const now = Date.now();
        let best: null | { event: AdminEvent; status: 'invited' | 'present' | 'declined' } = null;
        for (const row of byEvent.values()) {
          const evSnap = await getDoc(doc(db, 'events', row.eventId));
          if (!evSnap.exists()) continue;
          const ev = { id: evSnap.id, ...(evSnap.data() as Record<string, unknown>) } as AdminEvent;
          if (String(ev.status ?? '') !== 'published') continue;
          const startsMs =
            (ev.startsAt && typeof (ev.startsAt as any).toMillis === 'function' ? (ev.startsAt as any).toMillis() : 0) || 0;
          if (!startsMs || startsMs < now) continue;
          if (!best) best = { event: ev, status: row.status };
          else {
            const bestMs =
              (best.event.startsAt && typeof (best.event.startsAt as any).toMillis === 'function'
                ? (best.event.startsAt as any).toMillis()
                : 0) || 0;
            if (startsMs < bestMs) best = { event: ev, status: row.status };
          }
        }
        if (!cancelled) setUpcomingInviteEvent(best);
      } catch {
        if (!cancelled) setUpcomingInviteEvent(null);
      } finally {
        if (!cancelled) setUpcomingInviteLoading(false);
      }
    }
    void loadUpcomingInvite();
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  useEffect(() => {
    // Si on a déjà une réponse enregistrée, ne pas re-demander.
    if (!isPublicEventRoute || !publicEvent?.id || !user?.uid) return;
    if (rsvpCheckDoneForEventId === publicEvent.id) return;
    let cancelled = false;
    (async () => {
      try {
        const id = `${publicEvent.id}_${user.uid}`;
        const snap = await getDoc(doc(db, 'event_participations', id));
        if (cancelled) return;
        if (snap.exists()) {
          const data = snap.data() as { status?: string };
          if (data?.status === 'present' || data?.status === 'declined') {
            setRsvpDoneForEventId(publicEvent.id);
            setShowRsvpModal(false);
          }
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setRsvpCheckDoneForEventId(publicEvent.id);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isPublicEventRoute, publicEvent?.id, user?.uid, rsvpCheckDoneForEventId]);

  useEffect(() => {
    if (!isPublicEventRoute) return;
    // Invités WhatsApp : la page /e/:slug est lisible sans compte (formulaire + lien Google Form).
    if (!user) {
      return;
    }
    if (!profile) {
      setIsEditing(true);
      setIsProfileExpanded(true);
      return;
    }
    if (publicEvent && !showRsvpModal && rsvpDoneForEventId !== publicEvent.id) {
      setShowRsvpModal(true);
    }
  }, [isPublicEventRoute, user, profile, publicEvent, showRsvpModal, rsvpDoneForEventId]);

  const getAuthErrorMessage = (code: string) => {
    const host = typeof window !== 'undefined' ? window.location.host : '';
    if (code === 'auth/popup-timeout') {
      return pickLang(
        'La popup Google prend trop de temps. Redirection automatique en cours…',
        'La ventana de Google tarda demasiado. Redirección automática en curso…',
        'Google popup is taking too long. Automatic redirect in progress…',
        lang
      );
    }
    const key = firebaseAuthCodeToTranslationKey(code);
    let msg = t(key);
    if (key === 'authErrUnauthorizedDomain') {
      msg = msg.replace(/\{\{host\}\}/g, host);
    }
    return msg;
  };

  const handleResendEmailVerification = async () => {
    const u = auth.currentUser;
    if (!u || u.emailVerified) return;
    setEmailVerifySending(true);
    setEmailVerifyNotice(null);
    try {
      await sendEmailVerification(u, getAuthActionCodeSettings());
      setEmailVerifyNotice(t('authVerificationSentShort'));
    } catch (err) {
      const host = typeof window !== 'undefined' ? window.location.host : '';
      setEmailVerifyNotice(firebaseAuthErrorUserMessage(err, t, host));
    } finally {
      setEmailVerifySending(false);
    }
  };

  const pendingProfiles = useMemo(() => {
    return allProfiles.filter((p) => p.needsAdminReview === true || p.isValidated === false);
  }, [allProfiles]);

  const pendingUidsKey = useMemo(
    () => pendingProfiles.map((p) => p.uid).sort().join(','),
    [pendingProfiles]
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const base = t('title');
    const n = viewerIsAdmin ? pendingProfiles.length : 0;
    document.title = n > 0 ? `(${n > 99 ? '99+' : n}) ${base}` : base;
  }, [pendingProfiles.length, viewerIsAdmin, t]);

  const aiRecOtherMemberCount = useMemo(
    () =>
      profile?.uid
        ? allProfiles.filter((p) => Boolean(p.uid) && p.uid !== profile.uid).length
        : 0,
    [allProfiles, profile?.uid]
  );
  const aiRecNeedsInviteGate = aiRecOtherMemberCount < AI_REC_MIN_OTHER_MEMBERS;

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
    if (!selectedProfile || !viewerIsAdmin) {
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
  }, [selectedProfile?.uid, viewerIsAdmin]);

  useEffect(() => {
    if (!showValidationPanel || !viewerIsAdmin || pendingProfiles.length === 0) {
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
  }, [showValidationPanel, viewerIsAdmin, pendingUidsKey, pendingProfiles]);

  // Removed legacy "mandatory profile update" banner; no per-session dismiss state needed.

  /**
   * Synchronise les brouillons (besoins / passions / langues) depuis le profil au passage en édition
   * ou quand l’admin ouvre une autre fiche. Ne doit PAS dépendre de `profile?.uid` : sinon, quand le
   * document Firestore arrive après l’ouverture du formulaire, l’effet réécrit les brouillons avec
   * des tableaux vides et annule les sélections de l’utilisateur (validation impossible alors que
   * l’écran semble rempli).
   */
  const publicationDraftsHydratedUidRef = useRef<string | null>(null);
  const companyActivitiesHydratedUidRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isEditing) {
      publicationDraftsHydratedUidRef.current = null;
      return;
    }
    const src = editingProfile ?? profile;
    if (!src) return;
    setHighlightedNeedsDraft(sanitizeHighlightedNeeds(src.highlightedNeeds));
    setPassionIdsDraft(sanitizePassionIds(src.passionIds));
    setWorkingLanguagesDraft(sanitizeWorkingLanguageCodes(src.workingLanguageCodes));
  }, [isEditing, editingProfile?.uid]);

  /** Si le profil charge après l’ouverture du formulaire : hydrate une seule fois par uid sans écraser si l’utilisateur a déjà choisi. */
  useEffect(() => {
    if (!isEditing || editingProfile || !profile) return;
    if (publicationDraftsHydratedUidRef.current === profile.uid) return;
    publicationDraftsHydratedUidRef.current = profile.uid;
    setHighlightedNeedsDraft((prev) =>
      prev.length > 0 ? prev : sanitizeHighlightedNeeds(profile.highlightedNeeds)
    );
    setPassionIdsDraft((prev) =>
      prev.length > 0 ? prev : sanitizePassionIds(profile.passionIds)
    );
    setWorkingLanguagesDraft((prev) =>
      prev.length > 0 ? prev : sanitizeWorkingLanguageCodes(profile.workingLanguageCodes)
    );
  }, [isEditing, editingProfile, profile]);

  useEffect(() => {
    if (!isEditing) {
      companyActivitiesHydratedUidRef.current = null;
      return;
    }
    const src = editingProfile ?? profile;
    if (!src) return;
    setCompanyActivitiesDraft(hydrateCompanyActivitiesDraftFromProfile(src));
    setCompanyActivityEditCollapsed({});
  }, [isEditing, editingProfile?.uid]);

  useEffect(() => {
    if (!isEditing || editingProfile || !profile) return;
    if (companyActivitiesHydratedUidRef.current === profile.uid) return;
    companyActivitiesHydratedUidRef.current = profile.uid;
    setCompanyActivitiesDraft(hydrateCompanyActivitiesDraftFromProfile(profile));
  }, [isEditing, editingProfile, profile]);

  useLayoutEffect(() => {
    if (user?.uid && profile?.createdAt) {
      initLastProfileSaveBaselineIfUnset(user.uid, profile.createdAt.toMillis());
    }
    if (!isEditing || !user || editingSomeoneElse) {
      setProfileFormDraftOverrides(null);
      profileDraftRestoreNonceRef.current = '';
      return;
    }
    const uid = user.uid;
    const draft = loadProfileFormDraft(uid);
    const hasProfile = Boolean(profile);
    if (!draft || !shouldRestoreProfileDraft(draft, uid, hasProfile)) {
      setProfileFormDraftOverrides(null);
      profileDraftRestoreNonceRef.current = '';
      return;
    }
    const nonce = `${uid}:${draft.savedAt}`;
    if (profileDraftRestoreNonceRef.current === nonce) return;
    profileDraftRestoreNonceRef.current = nonce;
    setProfileFormDraftOverrides({ texts: draft.texts, checks: draft.checks });
    setPassionIdsDraft(sanitizePassionIds(draft.passionIds));
    setHighlightedNeedsDraft(sanitizeHighlightedNeeds(draft.highlightedNeeds));
    setWorkingLanguagesDraft(sanitizeWorkingLanguageCodes(draft.workingLanguageCodes));
    setCompanyActivitiesDraft(
      draft.companyActivities.length > 0 ? draft.companyActivities : [emptyCompanyActivitySlot()]
    );
    setCompanyActivityEditCollapsed(draft.companyActivityEditCollapsed || {});
    setProfilePhotoUrlDraft(draft.profilePhotoUrlDraft || '');
    setProfileFormRemountKey((k) => k + 1);
  }, [isEditing, user?.uid, editingSomeoneElse, profile?.uid]);

  useEffect(() => {
    if (!isEditing || !user || editingSomeoneElse) return;
    const uid = user.uid;
    const tick = window.setTimeout(() => {
      const form = directoryProfileFormRef.current;
      if (!form) return;
      const texts: Record<string, string> = {};
      const checks: Record<string, boolean> = {};
      const els = form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
        'input[name], select[name], textarea[name]'
      );
      els.forEach((el) => {
        const name = el.name;
        if (!name) return;
        if (el instanceof HTMLInputElement && el.type === 'checkbox') {
          checks[name] = el.checked;
        } else if (el instanceof HTMLInputElement && el.type === 'radio') {
          if (el.checked) texts[name] = el.value;
        } else {
          texts[name] = el.value;
        }
      });
      saveProfileFormDraft(uid, {
        texts,
        checks,
        passionIds: passionIdsDraft,
        highlightedNeeds: highlightedNeedsDraft,
        workingLanguageCodes: workingLanguagesDraft,
        companyActivities: companyActivitiesDraft,
        companyActivityEditCollapsed,
        profilePhotoUrlDraft,
      });
    }, 800);
    return () => window.clearTimeout(tick);
  }, [
    isEditing,
    user?.uid,
    editingSomeoneElse,
    profileFormRemountKey,
    passionIdsDraft,
    highlightedNeedsDraft,
    workingLanguagesDraft,
    companyActivitiesDraft,
    companyActivityEditCollapsed,
    profilePhotoUrlDraft,
  ]);

  useEffect(() => {
    if (!isEditing) {
      setProfilePhotoUrlDraft('');
      return;
    }
    if (profileFormDraftOverrides) return;
    const src = editingProfile ?? profile;
    if (!src) return;
    setProfilePhotoUrlDraft(String(src.photoURL ?? '').trim());
  }, [isEditing, editingProfile?.uid, profile?.uid, profileFormDraftOverrides]);

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

  const updateCompanyActivitySlot = (id: string, patch: Partial<CompanyActivitySlot>) => {
    setCompanyActivitiesDraft((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
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

  const scrollToProfileCompletionField = useCallback(
    (fieldKey: string) => {
      setIsProfileExpanded(true);
      setIsEditing(true);
      const key = fieldKey as ProfileCompletionKey;
      const firstSlotId = companyActivitiesDraft[0]?.id;
      if (firstSlotId && (key === 'activityDescription' || key === 'companyName')) {
        setCompanyActivityEditCollapsed((prev) => ({ ...prev, [firstSlotId]: false }));
      }
      const domId = PROFILE_COMPLETION_FOCUS_IDS[key];
      const run = () => {
        const el = domId ? document.getElementById(domId) : null;
        if (!el) return;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (
          el instanceof HTMLInputElement ||
          el instanceof HTMLTextAreaElement ||
          el instanceof HTMLSelectElement
        ) {
          el.focus({ preventScroll: true });
        }
      };
      window.requestAnimationFrame(() => {
        window.setTimeout(run, 180);
      });
    },
    [companyActivitiesDraft]
  );

  /** Profil fusionné + brouillons en édition — score complétude aligné sur le formulaire ouvert. */
  const profileCompletionCardSource = useMemo((): ProfileCompletionInput => {
    if (!profile) return null;
    if (!isEditing) {
      return { ...profile, ...(editingProfile ?? {}) };
    }
    // Édition d’un autre membre : ne pas fusionner avec `profile` (sinon l’identité admin est écrasée).
    const identityBase: Partial<UserProfile> = editingSomeoneElse
      ? { ...(editingProfile as UserProfile) }
      : { ...profile, ...(editingProfile ?? {}) };
    return {
      ...identityBase,
      workingLanguageCodes: workingLanguagesDraft,
      passionIds: passionIdsDraft,
      highlightedNeeds: highlightedNeedsDraft,
      companyActivities:
        companyActivitiesDraft.length > 0
          ? companyActivitiesDraft
          : editingSomeoneElse && editingProfile
            ? editingProfile.companyActivities
            : profile.companyActivities,
    };
  }, [
    profile,
    editingProfile,
    editingSomeoneElse,
    isEditing,
    workingLanguagesDraft,
    passionIdsDraft,
    highlightedNeedsDraft,
    companyActivitiesDraft,
  ]);

  const profileCompletionPct = useMemo(() => {
    if (!profileCompletionCardSource) return 0;
    return getProfileCompletionPercentFromDomain(profileCompletionCardSource);
  }, [profileCompletionCardSource]);

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
      const coachSource =
        editingProfile && user && editingProfile.uid !== user.uid ? editingProfile : profile;
      const gaps = collectProfileCoachGapKeys(coachSource);
      setProfileCoachLine(gaps.length ? formatLocalProfileCoachLine(coachSource, t) : '');
      setProfileCoachSource('local');
      setProfileCoachLoading(false);
      return;
    }

    if (collectProfileCoachGapKeys(profile).length === 0) {
      setProfileCoachLine('');
      setProfileCoachSource(null);
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
  }, [profile, isEditing, lang, t, user?.uid, editingProfile?.uid]);

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

        // lastSeen : seulement si la fiche existe, et pas à chaque re-déclenchement auth
        // (évite plusieurs écritures `users/*` qui pourraient déclencher la même notification admin).
        if (docSnap.exists()) {
          const data = docSnap.data() as Record<string, unknown>;
          const raw = data.lastSeen;
          const prevLast = typeof raw === 'number' ? raw : 0;
          const now = Date.now();
          if (now - prevLast >= 120_000) {
            await updateDoc(docRef, { lastSeen: now }).catch(() => {
              /* doc supprimé entre-temps */
            });
          }
        }

        if (docSnap.exists()) {
          let loadedProfile = docSnap.data() as UserProfile;
          try {
            const migrated = await migrateLegacyBioToMemberAndActivity(db, u.uid, loadedProfile);
            if (migrated) loadedProfile = migrated;
          } catch (e) {
            console.warn('[legacy_bio_migration]', e);
          }

          // Admin: ne jamais “prendre” une fiche qui ne correspond pas au compte Auth.
          if (isAdminEmail(u.email)) {
            const loadedUidOk = String(loadedProfile?.uid ?? '').trim() === u.uid;
            const loadedEmailOk =
              String(loadedProfile?.email ?? '')
                .trim()
                .toLowerCase() === String(u.email ?? '').trim().toLowerCase();
            const ok = loadedUidOk && loadedEmailOk;
            setAdminUserDocExists(ok);
            if (ok) {
              setProfile({ ...loadedProfile, role: 'admin' } as UserProfile);
            } else {
              // Doc incohérent : on repasse en admin “sans fiche”.
              setProfile(bootstrapAdminProfileFromAuth(u));
              setShowOnboarding(false);
              setAdminSelfProfileOptIn(false);
            }
          } else {
            setProfile(loadedProfile);
          }
        } else {
          if (isAdminEmail(u.email)) {
            setAdminUserDocExists(false);
            setProfile(bootstrapAdminProfileFromAuth(u));
            setShowOnboarding(false);
            setAdminSelfProfileOptIn(false);
          } else {
            setProfile(null);
            setShowOnboarding(true);
          }
        }
      } else {
        setProfile(null);
        setAdminUserDocExists(false);
        setAdminSelfProfileOptIn(false);
      }
      setLoading(false);
    });

    const profilesQuery = query(collection(db, 'users'), orderBy('fullName', 'asc'));
    const unsubscribeProfiles = onSnapshot(
      profilesQuery,
      (snapshot) => {
        const raw = snapshot.docs.map((d) => {
          const data = d.data() as Partial<UserProfile>;
          const uidFromData = typeof data.uid === 'string' ? data.uid.trim() : '';
          // Robustesse : certaines anciennes fiches peuvent avoir un `uid` manquant / incohérent.
          // On force l’uid sur l’id du document pour stabiliser le rendu (et l’édition admin).
          const uid = uidFromData || d.id;
          return { ...(data as UserProfile), uid } as UserProfile;
        });

        // Déduplication défensive : si la base contient des doublons (ex. 2 docs pour le même uid/email),
        // on ne rend qu’une carte (on garde la plus “récente” selon lastSeen / createdAt).
        const byUid = new Map<string, UserProfile>();
        for (const p of raw) {
          const key = (p.uid || '').trim();
          if (!key) continue;
          const prev = byUid.get(key);
          if (!prev) {
            byUid.set(key, p);
            continue;
          }
          const pLast = typeof p.lastSeen === 'number' ? p.lastSeen : 0;
          const prevLast = typeof prev.lastSeen === 'number' ? prev.lastSeen : 0;
          const pCreated = typeof p.createdAt?.toMillis === 'function' ? p.createdAt.toMillis() : 0;
          const prevCreated =
            typeof prev.createdAt?.toMillis === 'function' ? prev.createdAt.toMillis() : 0;
          if (pLast > prevLast || (pLast === prevLast && pCreated >= prevCreated)) {
            byUid.set(key, p);
          }
        }

        const byEmail = new Map<string, UserProfile>();
        for (const p of byUid.values()) {
          const emailKey = String(p.email ?? '').trim().toLowerCase();
          if (!emailKey) {
            byEmail.set(p.uid, p);
            continue;
          }
          const prev = byEmail.get(emailKey);
          if (!prev) {
            byEmail.set(emailKey, p);
            continue;
          }
          const pLast = typeof p.lastSeen === 'number' ? p.lastSeen : 0;
          const prevLast = typeof prev.lastSeen === 'number' ? prev.lastSeen : 0;
          const pCreated = typeof p.createdAt?.toMillis === 'function' ? p.createdAt.toMillis() : 0;
          const prevCreated =
            typeof prev.createdAt?.toMillis === 'function' ? prev.createdAt.toMillis() : 0;
          if (pLast > prevLast || (pLast === prevLast && pCreated >= prevCreated)) {
            byEmail.set(emailKey, p);
          }
        }

        setAllProfiles(Array.from(byEmail.values()));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'users')
    );

    return () => {
      unsubscribe();
      unsubscribeProfiles();
    };
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, MEMBER_REQUESTS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const now = Date.now();
        const rows = snapshot.docs
          .map((d) => mapMemberRequestDoc(d.id, d.data() as Record<string, unknown>))
          .filter((r) => r.expiresAt > now && r.authorId);
        setMemberRequests(rows);
      },
      (error) =>
        handleFirestoreError(error, OperationType.LIST, MEMBER_REQUESTS_COLLECTION)
    );
    return () => unsub();
  }, []);

  const fetchMatches = useCallback(async (u: UserProfile, profiles: UserProfile[]) => {
    if (!u.uid) return;

    try {
      const readiness = getProfileAiRecommendationReadiness(u);
      const storageKey = `ai_matches_v2_${u.uid}`;
      const persistentKey = `ai_matches_v3_${u.uid}`;
      const PERSIST_TTL_MS = 7 * 24 * 60 * 60 * 1000;

      if (readiness < 0.8) {
        sessionStorage.removeItem(storageKey);
        try {
          localStorage.removeItem(persistentKey);
        } catch {
          // ignore
        }
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

      // Persistent cache (survives refresh). Validate against current uid set.
      try {
        const raw = localStorage.getItem(persistentKey);
        if (raw) {
          const parsed = JSON.parse(raw) as { ts: number; data: MatchSuggestion[] };
          const ts = Number(parsed?.ts ?? 0);
          const data = parsed?.data;
          if (Number.isFinite(ts) && ts > 0 && Date.now() - ts < PERSIST_TTL_MS && Array.isArray(data) && data.length) {
            const validUids = new Set(profiles.map((p) => p.uid).filter(Boolean));
            const filtered = data.filter((m) => validUids.has(m.profileId));
            if (filtered.length > 0) {
              setMatches(filtered);
              setMatchBlockReason(null);
              sessionStorage.setItem(storageKey, JSON.stringify(filtered));
              return;
            }
          }
        }
      } catch {
        try {
          localStorage.removeItem(persistentKey);
        } catch {
          // ignore
        }
      }

      const other = profiles.filter((p) => p.uid !== u.uid).slice(0, 50);
      if (other.length < AI_REC_MIN_OTHER_MEMBERS) {
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
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });
        const fp = u.accountType === 'foreign' ? 'Prioriser Distributeurs/Partenaires locaux.' : '';
        const uKeywords = normalizedTargetKeywords(u).join(',') || 'tous';
        const prompt = `B2B GDL. Membre:${u.fullName}|${u.companyName}|secteur:${u.activityCategory ?? '?'}|fonction:${u.positionCategory ?? '?'}|taille:${u.companySize ?? '?'}|bio:${effectiveMemberBio(u)}|activites:${allActivityDescriptionTexts(u).join(' | ')}|besoins_struct:${(u.highlightedNeeds ?? []).join(',') || 'aucun'}|cibles:${uKeywords}.${fp} Disponibles:${other.map((p) => `${p.uid}|${p.fullName}|${p.companyName}|secteur:${p.activityCategory ?? '?'}|fonction:${p.positionCategory ?? '?'}|taille:${p.companySize ?? '?'}|besoins_struct:${(p.highlightedNeeds ?? []).join(',') || 'aucun'}|cibles:${normalizedTargetKeywords(p).join(',') || '—'}|bio:${effectiveMemberBio(p)}|activites:${allActivityDescriptionTexts(p).join(' | ')}`).join(';')}. Top3 JSON:{"m":[{"id":"uid","t":"Client|Fournisseur|Partenaire|Distributeur|Investisseur","s":8,"r":"raison","h":"accroche"}]}`;
        
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
        try {
          localStorage.setItem(persistentKey, JSON.stringify({ ts: Date.now(), data: result }));
        } catch {
          // ignore
        }
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
    if (!selectedProfile) {
      lastProfileViewLoggedRef.current = null;
      return;
    }
    if (!user) return;
    const id = selectedProfile.uid;
    if (lastProfileViewLoggedRef.current === id) return;
    lastProfileViewLoggedRef.current = id;
    void trackMemberInteraction({
      eventType: 'profile_view',
      targetId: id,
      targetType: 'profile',
      metadata: {
        profileName: (selectedProfile.fullName || selectedProfile.companyName || id).slice(0, 120),
      },
    });
  }, [selectedProfile, user]);

  useEffect(() => {
    // Init auth once (persistence + redirect handling). Keep a promise so sign-in clicks can await it.
    const init = (async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch (error) {
        console.warn('Failed to set auth persistence', error);
      }

      try {
        const result = await getRedirectResult(auth);
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
      } catch (error) {
        const code = (error as { code?: string })?.code ?? '';
        if (!code || code === 'auth/popup-closed-by-user') return;
        setAuthError(`${getAuthErrorMessage(code)}${code ? ` (code: ${code})` : ''}`);
      }
    })();
    authInitPromiseRef.current = init;
  }, []);

  useEffect(() => {
    if (
      !loading &&
      viewMode === 'dashboard' &&
      !(profile?.role === 'admin' || isAdminEmail(user?.email))
    ) {
      setViewMode('members');
    }
  }, [loading, viewMode, profile?.role, user?.email]);

  const handleSocialLogin = async (which: SocialAuthProvider) => {
    if (socialOAuthLockRef.current) return;
    socialOAuthLockRef.current = true;

    const clearOAuthRedirectPending = () => {
      try {
        sessionStorage.removeItem('oauth_redirect_pending');
      } catch {
        /* ignore */
      }
    };

    const provider = buildAuthProvider(which);
    setAuthProviderBusy(which);
    setAuthError(null);

    try {
      // Attendre persistence + getRedirectResult : évite courses au premier clic.
      try {
        await (authInitPromiseRef.current ?? Promise.resolve());
      } catch {
        /* ignore */
      }

      // Cursor/Electron : la popup peut bloquer ; redirection directe.
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
      const shouldPreferRedirect = /Electron|Cursor/i.test(ua);

      if (shouldPreferRedirect) {
        try {
          sessionStorage.setItem('oauth_redirect_pending', which);
        } catch {
          /* ignore */
        }
        await signInWithRedirect(auth, provider);
        return;
      }

      // Ne pas marquer oauth_redirect_pending avant la popup : sinon faux positif si l’utilisateur ferme la fenêtre.
      const popupTimeoutMs = 90_000;
      await Promise.race([
        signInWithPopup(auth, provider),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject({ code: 'auth/popup-timeout' }), popupTimeoutMs)
        ),
      ]);
      clearOAuthRedirectPending();
    } catch (error) {
      console.error('Login failed', error);
      const firebaseCode = (error as { code?: string })?.code ?? '';
      // Ne pas enchaîner une redirection si l’utilisateur a fermé la popup ou si une 2e popup a annulé la 1re (double clic).
      const shouldFallbackToRedirect = [
        'auth/popup-blocked',
        'auth/operation-not-supported-in-this-environment',
        'auth/popup-timeout',
      ].includes(firebaseCode);

      if (shouldFallbackToRedirect) {
        try {
          sessionStorage.setItem('oauth_redirect_pending', which);
        } catch {
          /* ignore */
        }
        try {
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectError) {
          console.error('Redirect login failed', redirectError);
          clearOAuthRedirectPending();
          const redirectCode = (redirectError as { code?: string })?.code ?? '';
          setAuthError(`${getAuthErrorMessage(redirectCode)}${redirectCode ? ` (code: ${redirectCode})` : ''}`);
          return;
        }
      }

      clearOAuthRedirectPending();
      setAuthError(`${getAuthErrorMessage(firebaseCode)}${firebaseCode ? ` (code: ${firebaseCode})` : ''}`);
    } finally {
      socialOAuthLockRef.current = false;
      setAuthProviderBusy(null);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.assign('/');
    } catch (error) {
      console.error('Erreur logout:', error);
    }
  };

  // NOTE: l’édition manuelle de l’URL photo a été retirée de l’UI.

  const openAuthModal = useCallback(() => {
    setAuthError(null);
    setAuthModalResetKey((k) => k + 1);
    setShowAuthModal(true);
  }, []);

  const missingProfileFieldsForEventRsvp = useCallback(
    (p: UserProfile | null | undefined): string[] => {
      if (!p) return [];
      const missing: string[] = [];
      if (!String(p.fullName ?? '').trim()) missing.push(pickLang('Nom complet', 'Nombre completo', 'Full name', lang));
      if (!String(p.email ?? '').trim()) missing.push('Email');
      if (!String(p.whatsapp ?? '').trim()) missing.push(pickLang('WhatsApp / téléphone', 'WhatsApp / teléfono', 'WhatsApp / phone', lang));
      if (!String(p.companyName ?? '').trim()) missing.push(pickLang('Société', 'Empresa', 'Company', lang));
      // Champs existants mais optionnels dans le modèle : on les rend requis pour RSVP.
      if (!String(p.positionCategory ?? '').trim()) missing.push(pickLang('Poste / fonction', 'Puesto / función', 'Job position', lang));
      if (!String(p.activityCategory ?? '').trim()) missing.push(pickLang("Secteur d'activité", 'Sector de actividad', 'Industry', lang));
      return missing;
    },
    [lang]
  );

  const ensureRsvpReady = useCallback(
    (status: 'present' | 'declined') => {
      setPendingRsvpStatus(status);

      if (!user) {
        openAuthModal();
        return false;
      }
      if (!profile) {
        setProfileSaveError(
          pickLang(
            "Pour enregistrer votre participation, créez votre profil (nom, email, WhatsApp/téléphone, société, poste, secteur).",
            'Para registrar tu participación, completa tu perfil (nombre, email, WhatsApp/teléfono, empresa, puesto, sector).',
            'To save your RSVP, please complete your profile (name, email, WhatsApp/phone, company, position, industry).',
            lang
          )
        );
        setIsEditing(true);
        setIsProfileExpanded(true);
        return false;
      }
      const missing = missingProfileFieldsForEventRsvp(profile);
      if (missing.length > 0) {
        setProfileSaveError(
          pickLang(
            `Pour enregistrer votre participation, complétez votre profil : ${missing.join(', ')}.`,
            `Para registrar tu participación, completa tu perfil: ${missing.join(', ')}.`,
            `To save your RSVP, complete your profile: ${missing.join(', ')}.`,
            lang
          )
        );
        setIsEditing(true);
        setIsProfileExpanded(true);
        return false;
      }
      return true;
    },
    [lang, missingProfileFieldsForEventRsvp, openAuthModal, profile, user]
  );

  useEffect(() => {
    if (!isPublicEventRoute || !publicEvent?.id) return;
    if (!pendingRsvpStatus) return;
    if (rsvpBusy) return;
    if (!user || !profile) return;
    const missing = missingProfileFieldsForEventRsvp(profile);
    if (missing.length > 0) return;
    // Profil prêt : enregistrer automatiquement la réponse en attente.
    void submitRsvp(pendingRsvpStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isPublicEventRoute,
    publicEvent?.id,
    pendingRsvpStatus,
    rsvpBusy,
    user,
    profile,
    missingProfileFieldsForEventRsvp,
  ]);

  useEffect(() => {
    if (!isSignupLandingRoute) {
      signupAuthOpenedRef.current = false;
    }
  }, [isSignupLandingRoute]);

  useEffect(() => {
    if (!isSignupMinimal || loading) return;
    if (signupAuthOpenedRef.current) return;
    signupAuthOpenedRef.current = true;
    setAuthError(null);
    setShowAuthModal(true);
  }, [isSignupMinimal, loading]);

  useEffect(() => {
    if (!isSignupLandingRoute || loading) return;
    if (user) {
      navigate('/', { replace: true });
    }
  }, [isSignupLandingRoute, user, loading, navigate]);

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setProfileSaveBusy(true);
    setProfileSaveError(null);
    setProfileSaveSuccess(null);

    const formData = new FormData(e.currentTarget);
    const targetUid = editingProfile?.uid || user.uid;
    const isSelf = targetUid === user.uid;
    // Sécurité produit : désactiver l’édition des profils des autres membres via l’app.
    if (!isSelf) {
      setProfileSaveError(
        pickLang(
          "L’édition des profils des membres par l’administrateur est désactivée.",
          'La edición de perfiles de miembros por el administrador está desactivada.',
          'Admin editing of member profiles is disabled.',
          lang
        )
      );
      setProfileSaveBusy(false);
      return;
    }
    const getTrimmed = (key: string) => String(formData.get(key) || '').trim();
    const optionalString = (key: string) => {
      const v = getTrimmed(key);
      return v.length > 0 ? v : undefined;
    };
    const normalizeProfilePhotoUrl = (url: string) => {
      const trimmed = String(url ?? '').trim();
      if (!trimmed) return '';
      return trimmed.split('#')[0];
    };
    const optionalNumber = (key: string) => {
      const raw = getTrimmed(key);
      if (!raw) return undefined;
      const n = Number(raw);
      return Number.isFinite(n) ? n : undefined;
    };
    let whatsappDialRaw = getTrimmed('whatsappDial');
    if (!isKnownPhoneDial(whatsappDialRaw)) whatsappDialRaw = DEFAULT_PHONE_DIAL;
    const whatsappLocalRaw = String(formData.get('whatsappLocal') ?? '').trim();
    const whatsappMerged = mergePhoneDialLocal(whatsappDialRaw, whatsappLocalRaw);

    const slotsWithName = companyActivitiesDraft.filter((s) => s.companyName.trim());
    if (slotsWithName.length === 0) {
      setProfileSaveError(t('profileFormCompanyActivityMinOne'));
      setProfileSaveBusy(false);
      return;
    }

    const tagAt = (i: number) =>
      pickLang(` — Entreprise ${i + 1}`, ` — Empresa ${i + 1}`, ` — Company ${i + 1}`, lang);

    for (let i = 0; i < slotsWithName.length; i++) {
      const s = slotsWithName[i];
      const tag = slotsWithName.length > 1 ? tagAt(i) : '';
      const web = s.website?.trim() ?? '';
      if (!web || !/^https?:\/\/.+/i.test(web)) {
        setProfileSaveError(
          pickLang(
            `Indiquez une URL de site web valide (https://…)${tag}.`,
            `Indica una URL web válida (https://…)${tag}.`,
            `Enter a valid website URL (https://…)${tag}.`,
            lang
          )
        );
        setProfileSaveBusy(false);
        return;
      }
      if (!s.city?.trim()) {
        setProfileSaveError(
          pickLang(`Choisissez une ville${tag}.`, `Elige una ciudad${tag}.`, `Please choose a city${tag}.`, lang)
        );
        setProfileSaveBusy(false);
        return;
      }
      if (!s.state?.trim()) {
        setProfileSaveError(
          pickLang(`Indiquez l’état / région${tag}.`, `Indica el estado / región${tag}.`, `Please enter state / region${tag}.`, lang)
        );
        setProfileSaveBusy(false);
        return;
      }
      if (!s.country?.trim()) {
        setProfileSaveError(
          pickLang(`Indiquez le pays${tag}.`, `Indica el país${tag}.`, `Please enter the country${tag}.`, lang)
        );
        setProfileSaveBusy(false);
        return;
      }
      if (!s.positionCategory?.trim()) {
        setProfileSaveError(
          pickLang(
            `Choisissez la fonction dans l’entreprise${tag}.`,
            `Elige la función en la empresa${tag}.`,
            `Choose your role in the company${tag}.`,
            lang
          )
        );
        setProfileSaveBusy(false);
        return;
      }
      if (!s.activityCategory?.trim()) {
        setProfileSaveError(
          pickLang(
            `Choisissez un secteur d'activité${tag}.`,
            `Elige un sector de actividad${tag}.`,
            `Choose an activity sector${tag}.`,
            lang
          )
        );
        setProfileSaveBusy(false);
        return;
      }
      const cck = s.communityCompanyKind;
      if (
        !cck ||
        !(
          [
            'startup',
            'pme',
            'corporate',
            'independent',
            'association',
            'nonprofit',
            'club',
          ] as const
        ).includes(cck)
      ) {
        setProfileSaveError(
          pickLang(
            `Choisissez le type d’entreprise${tag}.`,
            `Elige el tipo de empresa${tag}.`,
            `Choose the company type${tag}.`,
            lang
          )
        );
        setProfileSaveBusy(false);
        return;
      }
      const cms = s.communityMemberStatus;
      if (!cms || !(['freelance', 'employee', 'owner', 'volunteer'] as const).includes(cms)) {
        setProfileSaveError(
          pickLang(
            `Choisissez le statut professionnel${tag}.`,
            `Elige el estatus profesional${tag}.`,
            `Choose your professional status${tag}.`,
            lang
          )
        );
        setProfileSaveBusy(false);
        return;
      }
      const actDesc = (s.activityDescription ?? '').trim();
      if (actDesc.length < PUBLICATION_BIO_MIN_LEN) {
        setProfileSaveError(
          pickLang(
            `Rédigez la description d’activité (minimum ${PUBLICATION_BIO_MIN_LEN} caractères)${tag}.`,
            `Escribe la descripción de la actividad (mínimo ${PUBLICATION_BIO_MIN_LEN} caracteres)${tag}.`,
            `Enter the activity description (at least ${PUBLICATION_BIO_MIN_LEN} characters)${tag}.`,
            lang
          )
        );
        setProfileSaveBusy(false);
        return;
      }
    }

    const memberBioTrimmed = getTrimmed('memberBio');
    if (memberBioTrimmed.length < PUBLICATION_BIO_MIN_LEN) {
      setProfileSaveError(
        pickLang(
          `Rédigez votre bio personnelle (minimum ${PUBLICATION_BIO_MIN_LEN} caractères).`,
          `Escribe tu bio personal (mínimo ${PUBLICATION_BIO_MIN_LEN} caracteres).`,
          `Write your personal bio (at least ${PUBLICATION_BIO_MIN_LEN} characters).`,
          lang
        )
      );
      setProfileSaveBusy(false);
      return;
    }

    const firstSlot = slotsWithName[0];
    const employeeCountVal = employeeCountFromSlotField(firstSlot.employeeCount);
    if (firstSlot.employeeCount !== '' && firstSlot.employeeCount != null && employeeCountVal === undefined) {
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

    const targetSectorListProbe = parseCommaSeparatedTargetKeywords(
      formData.get('targetSectors') as string | null
    );

    const publicationProbe: Partial<UserProfile> = {
      fullName: getTrimmed('fullName'),
      companyName: firstSlot.companyName.trim(),
      email: getTrimmed('email'),
      activityCategory: firstSlot.activityCategory?.trim(),
      positionCategory: firstSlot.positionCategory?.trim(),
      city: firstSlot.city?.trim(),
      state: firstSlot.state?.trim(),
      country: firstSlot.country?.trim(),
      communityCompanyKind: firstSlot.communityCompanyKind,
      communityMemberStatus: firstSlot.communityMemberStatus,
      website: firstSlot.website?.trim(),
      whatsapp: whatsappMerged,
      memberBio: memberBioTrimmed,
      companyActivities: slotsWithName,
      employeeCount: employeeCountVal,
      companySize: computedCompanySizeProbe,
      highlightedNeeds: sanitizeHighlightedNeeds(highlightedNeedsDraft),
      passionIds: passionIdsDraft,
      targetSectors: targetSectorListProbe,
    };

    const hasIdentity = !!(
      publicationProbe.fullName?.trim() &&
      publicationProbe.companyName?.trim() &&
      publicationProbe.email?.trim()
    );
    if (!hasIdentity) {
      setProfileSaveError(
        pickLang(
          'Renseignez le nom, la société et l’e-mail.',
          'Completa el nombre, la empresa y el correo.',
          'Please fill in name, company, and email.',
          lang
        )
      );
      setProfileSaveBusy(false);
      return;
    }

    if (!publicationProbe.activityCategory?.trim()) {
      setProfileSaveError(
        pickLang(
          "Choisissez un secteur d'activité.",
          'Elige un sector de actividad.',
          'Please choose an activity sector.',
          lang
        )
      );
      setProfileSaveBusy(false);
      return;
    }

    if (!publicationProbe.city?.trim()) {
      setProfileSaveError(
        pickLang(
          'Choisissez une ville.',
          'Elige una ciudad.',
          'Please choose a city.',
          lang
        )
      );
      setProfileSaveBusy(false);
      return;
    }

    const posVal = firstSlot.positionCategory?.trim() ?? '';
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
      'association',
      'nonprofit',
      'club',
    ];
    const COMMUNITY_MEMBER_STATUSES: readonly CommunityMemberStatus[] = [
      'freelance',
      'employee',
      'owner',
      'volunteer',
    ];

    const cckRaw = firstSlot.communityCompanyKind ?? '';
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

    const cmsRaw = firstSlot.communityMemberStatus ?? '';
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

    const tcsSanitized = sanitizeTypicalClientSizes(firstSlot.typicalClientSizes);
    if (tcsSanitized.length !== (firstSlot.typicalClientSizes ?? []).length) {
      setProfileSaveError(
        pickLang(
          'Les tailles de clients habituels sélectionnées sont invalides (max. 3).',
          'Los tamaños habituales de clientes no son válidos (máx. 3).',
          'The selected typical client sizes are invalid (max. 3).',
          lang
        )
      );
      setProfileSaveBusy(false);
      return;
    }
    const typicalClientSizesField: typeof tcsSanitized | ReturnType<typeof deleteField> =
      tcsSanitized.length > 0 ? tcsSanitized : deleteField();
    const typicalClientSizeLegacy = deleteField();

    const baseProfile = isSelf ? profile : editingProfile;
    const computedCompanySize: UserProfile['companySize'] = employeeCountVal
      ? companySizeFromEmployeeRange(employeeCountVal)
      : (baseProfile?.companySize ?? 'solo');

    const isInitialSelfProfile = isSelf && !profile;
    const nextMemberBio = memberBioTrimmed;
    /** Pas de variantes par langue : le texte saisi est la seule source affichée. */
    const nextMemberBioTranslations: ReturnType<typeof deleteField> = deleteField();
    const helpNewcomersVal = optionalString('helpNewcomers');
    const networkGoalVal = optionalString('networkGoal');

    const companySlotsPayload = slotsToFirestoreList(slotsWithName);
    const photoUrlRaw =
      String(profilePhotoUrlDraft ?? '').trim() || String(formData.get('photoURL') ?? '').trim();
    const photoUrlNormalized = photoUrlRaw ? normalizeProfilePhotoUrl(photoUrlRaw) : undefined;

    const newProfile = {
      uid: targetUid,
      fullName: getTrimmed('fullName'),
      ...denormalizeFirstCompanySlot(slotsWithName[0]),
      companyActivities: companySlotsPayload,
      activityCategory: slotsWithName[0]?.activityCategory?.trim() || undefined,
      email: getTrimmed('email'),
      whatsapp: whatsappMerged || undefined,
      linkedin: optionalString('linkedin'),
      photoURL: photoUrlNormalized,
      employeeCount: employeeCountVal,
      isEmailPublic: formData.get('isEmailPublic') === 'on',
      isWhatsappPublic: formData.get('isWhatsappPublic') === 'on',
      memberBio: nextMemberBio,
      memberBioTranslations: nextMemberBioTranslations,
      bio: deleteField(),
      bioTranslations: deleteField(),
      highlightedNeeds: sanitizeHighlightedNeeds(highlightedNeedsDraft),
      passionIds: sanitizePassionIds(passionIdsDraft),
      targetSectors: parseCommaSeparatedTargetKeywords(formData.get('targetSectors') as string | null),
      helpNewcomers: helpNewcomersVal !== undefined ? helpNewcomersVal : deleteField(),
      networkGoal: networkGoalVal !== undefined ? networkGoalVal : deleteField(),
      contactPreferenceCta: deleteField(),
      contactPreferenceCtaTranslations: deleteField(),
      workingLanguageCodes: sanitizeWorkingLanguageCodes(workingLanguagesDraft),
      typicalClientSizes: typicalClientSizesField,
      typicalClientSize: typicalClientSizeLegacy,
      openToMentoring: formData.get('openToMentoring') === 'on',
      openToTalks: formData.get('openToTalks') === 'on',
      openToEvents: formData.get('openToEvents') === 'on',
      companySize: computedCompanySize,
      accountType: ((isSelf ? profile?.accountType : editingProfile?.accountType) ?? 'local') as 'local' | 'foreign',
      role: targetUid === user.uid && isAdminEmail(user.email)
        ? 'admin'
        : (editingProfile?.role || profile?.role || 'user') as Role,
      createdAt: (isSelf ? profile?.createdAt : editingProfile?.createdAt) || Timestamp.now(),
      isValidated: isSelf ? (profile?.isValidated ?? true) : (editingProfile?.isValidated ?? true),
      needsAdminReview: isInitialSelfProfile
        ? true
        : (isSelf ? (profile?.needsAdminReview ?? false) : (editingProfile?.needsAdminReview ?? false)),
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
      // Geocoding (optionnel) : si aucune coordonnée n’est présente, on géocode une adresse approximative
      // (ville/état/pays + quartier) pour la carte dashboard. Précision arrondie (~100 m).
      try {
        const first = companyActivitiesDraft[0];
        const hasLat = typeof (sanitizedProfile as any).latitude === 'number';
        const hasLng = typeof (sanitizedProfile as any).longitude === 'number';
        if (!hasLat && !hasLng) {
          const neighborhood = String((first as any)?.neighborhood ?? '').trim();
          const district = String((first as any)?.district ?? '').trim();
          const city = String((first as any)?.city ?? '').trim();
          const state = String((first as any)?.state ?? '').trim();
          const country = String((first as any)?.country ?? '').trim();

          // On accepte un niveau “quartier/district” même si on n’a pas toute l’adresse.
          // La fonction `geocodeAddress` ajoute déjà (city, Jalisco, Mexico) comme contexte.
          const addrBits = [neighborhood || district, city || state || country]
            .map((x) => String(x ?? '').trim())
            .filter(Boolean);
          const approx = addrBits.join(', ');

          if (approx) {
            const coords = await geocodeAddress(approx, city || 'Guadalajara');
            if (coords) {
              await updateDoc(doc(db, 'users', targetUid), {
                latitude: coords.lat,
                longitude: coords.lng,
                geocodedAt: serverTimestamp(),
              }).catch(() => {});
            }
          }
        }
      } catch {
        // ignore geocoding failure
      }
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
        clearProfileFormDraft(user.uid);
        markProfileSavedOk(user.uid);
        setProfileFormDraftOverrides(null);
        profileDraftRestoreNonceRef.current = '';
      }
      setProfileSaveSuccess(
        isSelf
          ? pickLang(
              'Profil enregistré. Vous pouvez compléter le reste plus tard pour améliorer votre visibilité.',
              'Perfil guardado. Puedes completar el resto más tarde para mejorar tu visibilidad.',
              'Profile saved. You can complete the rest later to improve your visibility.',
              lang
            )
          : pickLang(
              'Fiche du membre mise à jour.',
              'Ficha del miembro actualizada.',
              "Member's profile was updated.",
              lang
            )
      );
      setIsEditing(false);
      setEditingProfile(null);
      if (isPublicEventRoute && publicEvent) {
        // Si l’utilisateur venait de se créer/compléter un profil pour RSVP, enregistre automatiquement.
        if (pendingRsvpStatus && ensureRsvpReady(pendingRsvpStatus)) {
          void submitRsvp(pendingRsvpStatus);
        } else {
          setShowRsvpModal(true);
        }
      }
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

  const submitRsvp = async (status: 'present' | 'declined') => {
    if (!publicEvent) return;
    const ok = ensureRsvpReady(status);
    if (!ok) {
      setShowRsvpModal(false);
      return;
    }
    if (!user || !profile) return;
    // UX: fermer immédiatement, puis enregistrer (ré-ouvre en cas d’erreur).
    setRsvpDoneForEventId(publicEvent.id);
    setShowRsvpModal(false);
    setRsvpBusy(true);
    setRsvpError(null);
    try {
      const now = Timestamp.now();
      const id = `${publicEvent.id}_${user.uid}`;
      await setDoc(
        doc(db, 'event_participations', id),
        {
          eventId: publicEvent.id,
          uid: user.uid,
          email: String(profile.email ?? user.email ?? '').trim().toLowerCase(),
          fullName: profile.fullName ?? user.displayName ?? null,
          companyName: profile.companyName ?? null,
          status,
          statusSource: 'guest',
          createdAt: now,
          updatedAt: now,
        },
        { merge: true }
      );
      setRsvpError(null);
      setPendingRsvpStatus(null);
      // Après RSVP: rester sur la page (V1). On pourra rediriger vers /membres plus tard.
    } catch (e) {
      setRsvpError(e instanceof Error ? e.message : String(e));
      setRsvpDoneForEventId(null);
      setShowRsvpModal(true);
    } finally {
      setRsvpBusy(false);
    }
  };

  const startRsvpFromPublicPage = useCallback(
    (status: 'present' | 'declined') => {
      if (!publicEvent) return;
      const ok = ensureRsvpReady(status);
      if (!ok) return;
      setRsvpError(null);
      setShowRsvpModal(true);
    },
    [ensureRsvpReady, publicEvent]
  );

  const handleDeleteProfile = async (uid: string) => {
    try {
      await deleteDoc(doc(db, USER_ADMIN_PRIVATE_COLLECTION, uid)).catch(() => {});
      await deleteDoc(doc(db, 'users', uid));
      clearProfileFormDraft(uid);
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
    const XLSX = await import('xlsx');

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
      const matchesCategory =
        filterCategory === '' || profileDistinctActivityCategories(p).includes(filterCategory);
      const matchesLocation = profileMatchesLocationFilter(p, filterLocation);

      return matchesSearch && matchesCategory && matchesLocation;
    });
  }, [allProfiles, searchTerm, filterCategory, filterLocation, profile]);

  const showDirectoryClearFilters = useMemo(() => {
    return (
      searchTerm.trim() !== '' ||
      filterCategory !== '' ||
      filterLocation !== '' ||
      filterProfileType !== ''
    );
  }, [searchTerm, filterCategory, filterLocation, filterProfileType]);

  const showDiscoveryStrips = !showDirectoryClearFilters && !directoryDiscoveryStripsHidden;
  // Admin is a separate product space (`/admin`), not a member dashboard mode.
  const isAdminDashboard = false;

  const directoryViewTabs = useMemo(
    () =>
      [
        { id: 'companies' as const, icon: Building2, label: t('companies') },
        { id: 'members' as const, icon: Users, label: t('members') },
        { id: 'activities' as const, icon: Briefcase, label: t('activities') },
        { id: 'radar' as const, icon: Activity, label: t('directoryTabRadar') },
        ...(viewerIsAdmin
          ? [{ id: 'dashboard' as const, icon: LayoutDashboard, label: t('dashboardTab') }]
          : []),
      ] as const,
    [t, viewerIsAdmin]
  );

  const clearDirectoryFilters = useCallback(() => {
    setSearchTerm('');
    setFilterCategory('');
    setFilterLocation('');
    setFilterProfileType('');
    setViewMode('members');
  }, []);

  const handleCreateMemberRequest = useCallback(async (payload: Record<string, unknown>) => {
    await addDoc(collection(db, MEMBER_REQUESTS_COLLECTION), payload);
  }, []);

  const handleDeleteMemberRequest = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, MEMBER_REQUESTS_COLLECTION, id));
    } catch (error: unknown) {
      handleFirestoreError(
        error,
        OperationType.DELETE,
        `${MEMBER_REQUESTS_COLLECTION}/${id}`
      );
    }
  }, []);

  const scrollDirectoryIntoView = useCallback(() => {
    requestAnimationFrame(() =>
      directoryMainRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    );
  }, []);

  const handleSharePublicProfileLink = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!profile?.uid) return;
      const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/profil/${profile.uid}`;
      const title = pickLang(
        `Profil : ${profile.fullName}`,
        `Perfil: ${profile.fullName}`,
        `Profile: ${profile.fullName}`,
        lang
      );
      try {
        if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
          await navigator.share({ title, url });
          return;
        }
        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(url);
          setProfileSaveSuccess(
            pickLang(
              'Lien du profil copié dans le presse-papiers.',
              'Enlace del perfil copiado al portapapeles.',
              'Profile link copied to clipboard.',
              lang
            )
          );
        }
      } catch {
        /* share annulé ou indisponible */
      }
    },
    [profile, lang]
  );

  const handleFilterProfileTypeChange = useCallback((v: ProfileTypeFilterKey) => {
    setFilterProfileType(v);
    if (v === 'company') setViewMode('companies');
    else if (v === 'member') setViewMode('members');
  }, []);

  const networkSidebarSectorOptions = useMemo(
    () => [
      { value: '', label: t('filterSectorDefault') },
      ...ACTIVITY_CATEGORIES.map((c) => ({
        value: c,
        label: activityCategoryLabel(c, lang),
      })),
    ],
    [lang, t]
  );

  const networkSidebarProfileOptions = useMemo(
    () => [
      { value: '', label: t('filterTypeDefault') },
      { value: 'company', label: t('filterTypeCompany') },
      { value: 'member', label: t('filterTypeMember') },
    ],
    [t]
  );

  const networkSidebarLocationOptions = useMemo(
    () => [
      { value: '', label: t('filterLocationDefault') },
      { value: 'guadalajara', label: t('filterLocationGuadalajara') },
      { value: 'zapopan', label: t('filterLocationZapopan') },
      { value: 'other', label: t('filterLocationOther') },
    ],
    [t]
  );

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
    if (membersSortMode === 'recent') {
      list.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    } else if (membersSortMode === 'alphabetical') {
      const locale = sortLocale(lang);
      list.sort((a, b) => {
        const byName = a.fullName.localeCompare(b.fullName, locale, { sensitivity: 'base' });
        if (byName !== 0) return byName;
        return a.companyName.localeCompare(b.companyName, locale, { sensitivity: 'base' });
      });
    }
    return list;
  }, [membersFiltered, membersSortMode, lang]);

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
      const cats = profileDistinctActivityCategories(p);
      (cats.length > 0 ? cats : ['']).forEach((cat) => {
        if (!cat) return;
        counts.set(cat, (counts.get(cat) || 0) + 1);
      });
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [filteredProfiles]);

  const profilesSortedForActivities = useMemo(() => {
    const rank = new Map<string, number>();
    activityCategoryPopularity.forEach(([cat], i) => rank.set(cat, i));
    const locale = sortLocale(lang);
    return [...filteredProfiles].sort((a, b) => {
      const ca = profileDistinctActivityCategories(a)[0] || '';
      const cb = profileDistinctActivityCategories(b)[0] || '';
      const ra = rank.has(ca) ? rank.get(ca)! : 999;
      const rb = rank.has(cb) ? rank.get(cb)! : 999;
      if (ra !== rb) return ra - rb;
      const byCompany = a.companyName.localeCompare(b.companyName, locale, { sensitivity: 'base' });
      if (byCompany !== 0) return byCompany;
      return a.fullName.localeCompare(b.fullName, locale, { sensitivity: 'base' });
    });
  }, [filteredProfiles, activityCategoryPopularity, lang]);

  const guestDirectoryRestricted = useMemo(
    () => isGuestDirectoryRestricted(user, profile, Boolean(viewerIsAdmin)),
    [user, profile, viewerIsAdmin]
  );

  const onGuestDirectoryJoin = useCallback(() => {
    if (!user) {
      openAuthModal();
    } else {
      setShowOnboarding(true);
    }
  }, [user, openAuthModal]);

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

  const viewerUidForReco = (profile?.uid ?? '').trim();
  const savedMemberUidsKey = useSyncExternalStore(
    subscribeRecommendationPrefs,
    () => loadRecommendationPrefs(viewerUidForReco).savedUids.slice().sort().join('|'),
    () => ''
  );
  const savedMemberUidsSet = useMemo(
    () => new Set(savedMemberUidsKey.split('|').filter(Boolean)),
    [savedMemberUidsKey]
  );
  const savedMembersCount = savedMemberUidsSet.size;

  useEffect(() => {
    if (savedMembersCount === 0) setShowSavedMembersOnly(false);
  }, [savedMembersCount]);

  const membersDirectoryListDisplayed = useMemo(() => {
    if (!isNetworkRoute || !showSavedMembersOnly || !profile?.uid) {
      return membersDirectoryList;
    }
    return membersDirectoryList.filter((p) => savedMemberUidsSet.has(p.uid));
  }, [isNetworkRoute, showSavedMembersOnly, profile?.uid, membersDirectoryList, savedMemberUidsSet]);

  const openSavedMembersDirectoryView = useCallback(() => {
    if (savedMembersCount === 0) return;
    setShowSavedMembersOnly((prev) => !prev);
    window.requestAnimationFrame(() => {
      membersDirectoryGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [savedMembersCount]);

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

  /** Invités : tirage au sort et bouton « au hasard » limités aux fiches visibles (max 4). */
  const guestVisibleProfilesForRandom = useMemo(() => {
    if (!guestDirectoryRestricted) return filteredProfiles;
    if (viewMode === 'companies') return companiesDirectoryList;
    if (viewMode === 'activities') return activitiesDirectoryList;
    return membersDirectoryList;
  }, [
    guestDirectoryRestricted,
    viewMode,
    filteredProfiles,
    companiesDirectoryList,
    activitiesDirectoryList,
    membersDirectoryList,
  ]);

  const handleRandomProfile = useCallback(() => {
    const pool = guestDirectoryRestricted ? guestVisibleProfilesForRandom : filteredProfiles;
    if (pool.length === 0) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (viewMode !== 'companies' && viewMode !== 'members') {
      setViewMode(filterProfileType === 'company' ? 'companies' : 'members');
    }
    setSelectedProfile(pick);
  }, [filteredProfiles, filterProfileType, viewMode, guestDirectoryRestricted, guestVisibleProfilesForRandom]);

  const handleValidateProfile = async (uid: string, isValid: boolean) => {
    try {
      await setDoc(
        doc(db, 'users', uid),
        { isValidated: isValid, needsAdminReview: false },
        { merge: true }
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
    }
  };

  const generateOptimizationSuggestion = async (targetProfile: UserProfile) => {
    setOptimizationBusy(true);
    setOptimizationError(null);
    try {
      const OPT_CACHE_PREFIX = 'ai_opt_suggestion_v1:'; // bump to invalidate
      const OPT_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
      const optCacheKey = `${OPT_CACHE_PREFIX}${targetProfile.uid}`;

      // If we already have a recent suggestion in Firestore data, don't spend tokens again.
      const existing = targetProfile.optimizationSuggestion as any;
      if (
        existing &&
        typeof existing.bioSuggested === 'string' &&
        Array.isArray(existing.summary) &&
        typeof existing.generatedAt === 'number' &&
        Number.isFinite(existing.generatedAt) &&
        Date.now() - existing.generatedAt < OPT_TTL_MS
      ) {
        setOptimizationBusy(false);
        return;
      }

      // Persistent cache (survives refresh). Used as token-saver when user clicks generate again.
      try {
        const raw = localStorage.getItem(optCacheKey);
        if (raw) {
          const parsed = JSON.parse(raw) as { out: OptimizationSuggestion; ts: number };
          const ts = Number(parsed?.ts ?? 0);
          const out = parsed?.out;
          if (
            Number.isFinite(ts) &&
            ts > 0 &&
            Date.now() - ts < OPT_TTL_MS &&
            out &&
            typeof out.bioSuggested === 'string' &&
            Array.isArray(out.summary) &&
            out.summary.length > 0
          ) {
            await setDoc(doc(db, 'users', targetProfile.uid), { optimizationSuggestion: out }, { merge: true });
            setSelectedProfile((prev) =>
              prev && prev.uid === targetProfile.uid ? { ...prev, optimizationSuggestion: out } : prev
            );
            setAllProfiles((prev) => prev.map((p) => (p.uid === targetProfile.uid ? { ...p, optimizationSuggestion: out } : p)));
            setOptimizationBusy(false);
            return;
          }
        }
      } catch {
        try {
          localStorage.removeItem(optCacheKey);
        } catch {
          // ignore
        }
      }

      const apiKey = getGeminiApiKey();
      if (!apiKey) throw new Error('missing-gemini-api-key');
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Tu es expert en profils B2B. Analyse ce profil et propose des optimisations concretes.
Reponds STRICTEMENT en JSON valide:
{"bioSuggested":"...","summary":["...","...","..."]}
Contraintes:
- bioSuggested: 80 a 500 caracteres, presentation PERSONNELLE du membre (pas la description de l'entreprise), ton professionnel, clair et concret.
- summary: 3 a 6 actions courtes et actionnables (dont au besoin l'amelioration des besoins structures listes).
Profil:
Nom: ${targetProfile.fullName}
Societe: ${targetProfile.companyName}
Categorie: ${targetProfile.activityCategory ?? ''}
Fonction dans l'entreprise: ${targetProfile.positionCategory ?? ''}
Bio personnelle actuelle: ${effectiveMemberBio(targetProfile) || '—'}
Description d'activite (1re entreprise): ${firstSlotActivityDescription(targetProfile) || '—'}
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

      try {
        localStorage.setItem(optCacheKey, JSON.stringify({ ts: Date.now(), out: suggestion }));
      } catch {
        // ignore
      }
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
    setSelectedProfile(null);
    setEditingProfile(p);
    setIsEditing(true);
    setIsProfileExpanded(true);
    window.requestAnimationFrame(() => {
      profileFormLayoutRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const formDraftT = profileFormDraftOverrides?.texts;
  const formDraftC = profileFormDraftOverrides?.checks;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-stone-400 animate-pulse font-medium">{t('loading')}</div>
      </div>
    );
  }

  const headerAdminLayout = Boolean(user && viewerIsAdmin && isAdminRoute);
  const languageControlsTopRight = (
    <>
      <div className="sm:hidden">
        <LanguageDropdownMobile lang={lang} onLangChange={setLang} />
      </div>
      <div className="hidden w-[220px] shrink-0 items-center overflow-hidden rounded-full border border-slate-200 divide-x divide-slate-200 bg-white sm:flex">
        {(['fr', 'es', 'en'] as const).map((code) => {
          const isActive = lang === code;
          return (
            <button
              key={code}
              type="button"
              onClick={() => setLang(code)}
              aria-pressed={isActive}
              className={cn(
                'flex-1 px-3 py-2 text-xs font-semibold transition-colors',
                isActive ? 'bg-blue-700 text-white' : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              )}
            >
              {code.toUpperCase()}
            </button>
          );
        })}
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen min-w-0 flex-col bg-slate-50 text-slate-900 font-sans selection:bg-slate-200">
      <AppHeader
        title={t('title')}
        subtitle={t('subtitle')}
        // Admin: show the "new profiles" badge on the dedicated button, not on the logo.
        notificationCount={headerAdminLayout ? 0 : viewerIsAdmin ? pendingProfiles.length : 0}
        homeAriaLabel={t('nav.backHome')}
        onHomeClick={(e) => {
          e.preventDefault();
          window.location.assign('/');
        }}
        lang={lang}
        onLangChange={setLang}
        // Keep login + language controls in the top-right header (like before),
        // rather than pushing guest CTA into a full-width mobile bar.
        guestMobileFullWidthCta={false}
        // Language controls are always top-right to avoid duplicates.
        hideDesktopLanguageSwitch
        topRight={
          headerAdminLayout && user ? (
            <div className="flex shrink-0 items-center gap-2">
              {languageControlsTopRight}
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-red-600"
                title={t('logout')}
              >
                <LogOut size={18} />
              </button>
              <div className="block h-9 w-9 shrink-0 overflow-hidden rounded-full border border-slate-200">
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
            <div className="flex shrink-0 items-center gap-2">{languageControlsTopRight}</div>
          )
        }
        fullWidthRow={
          headerAdminLayout ? (
            <nav
              className="flex w-full min-w-0 flex-wrap items-center gap-2"
              aria-label={pickLang(
                'Navigation du site et outils admin',
                'Navegación del sitio y herramientas admin',
                'Site navigation and admin tools',
                lang
              )}
            >
              <Link
                to="/"
                className={primaryNavPillClass(isHomeRoute)}
              >
                {t('nav.home')}
              </Link>
              <Link
                to="/network"
                className={primaryNavPillClass(isNetworkRoute)}
              >
                {t('nav.network')}
              </Link>
              <Link
                to="/requests"
                className={primaryNavPillClass(isRequestsRoute)}
              >
                {t('nav.requests')}
              </Link>
              <Link
                to="/radar"
                className={primaryNavPillClass(isRadarRoute)}
              >
                {t('nav.radar')}
              </Link>
              <Link
                to="/admin"
                className={primaryNavPillClass(isAdminRoute)}
              >
                {t('nav.admin')}
              </Link>
              <span
                className="mx-0.5 hidden h-6 w-px shrink-0 bg-stone-900/10 sm:inline-block"
                aria-hidden
              />
              <button
                type="button"
                onClick={() => setShowValidationPanel(true)}
                className={cn('relative', primaryNavPillClass(false))}
                title={t('newProfiles')}
              >
                <span className="truncate">{t('newProfiles')}</span>
                {pendingProfiles.length > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-bold text-white">
                    {pendingProfiles.length > 99 ? '99+' : pendingProfiles.length}
                  </span>
                ) : null}
              </button>
              <button type="button" onClick={exportToExcel} className={primaryNavPillClass(false)} title={t('exportData')}>
                <span className="truncate">{t('exportData')}</span>
              </button>
              <Link
                to="/evenements"
                onClick={() => setDashboardInitialAdminTab('events')}
                className={primaryNavPillClass(isEventsAdminRoute)}
                title={pickLang(
                  'Ouvrir la page Événements',
                  'Abrir la página de Eventos',
                  'Open Events page',
                  lang
                )}
              >
                {t('adminTabEvents')}
              </Link>
              {isAdminEmail(user?.email) && !adminUserDocExists ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProfile(null);
                    setEditingProfile(null);
                    setAdminSelfProfileOptIn(true);
                    setIsEditing(true);
                    setIsProfileExpanded(true);
                    window.requestAnimationFrame(() => {
                      profileFormLayoutRef.current?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                      });
                    });
                  }}
                  className={primaryNavPillClass(false)}
                  title={pickLang(
                    "Créer votre fiche annuaire (optionnel)",
                    'Crear tu ficha del directorio (opcional)',
                    'Create your directory profile (optional)',
                    lang
                  )}
                >
                  {pickLang('Créer mon profil', 'Crear mi perfil', 'Create my profile', lang)}
                </button>
              ) : null}
            </nav>
          ) : (
            <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <nav className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto">
                {getPrimaryNav(role).map((item) => {
                  const href = item.href;
                  const active =
                    location.pathname === href || (href !== '/' && location.pathname.startsWith(href));
                  return (
                    <Link key={href} to={href} className={primaryNavPillClass(active)}>
                      {t(item.labelKey)}
                    </Link>
                  );
                })}
              </nav>
              <div className="w-full min-w-0 sm:w-auto sm:max-w-[420px] sm:shrink-0 sm:pl-3 sm:flex sm:justify-end">
                <HeroTopActions
                  currentLocale={lang}
                  isAuthenticated={Boolean(user)}
                  onChangeLocale={setLang}
                  onLogout={handleLogout}
                  onLogin={openAuthModal}
                />
              </div>
            </div>
          )
        }
        trailing={
          user ? (
            headerAdminLayout ? null : (
              <div className="flex items-center justify-end gap-2">
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
            )
          ) : (
            null
          )
        }
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <AnimatePresence>
        {showAuthModal && !user && (
          <div className="fixed inset-0 z-[170] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
              onClick={() => {
                if (authProviderBusy === null && !authEmailBusy) setShowAuthModal(false);
              }}
            />
            <motion.div
              data-testid="auth-modal"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <button
                type="button"
                onClick={() => {
                  if (authProviderBusy === null && !authEmailBusy) setShowAuthModal(false);
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
                  oauthDisabled={authEmailBusy}
                  onSignIn={handleSocialLogin}
                />
              </div>
              <p className="mt-3 text-center text-xs leading-relaxed text-stone-500">
                {t('authGoogleOAuthMention')}{' '}
                <Link
                  to="/privacy"
                  className="font-medium text-stone-600 underline decoration-stone-400 underline-offset-2 hover:text-stone-900"
                >
                  {t('footerPrivacy')}
                </Link>
              </p>
              <EmailAuthPanel
                resetToken={authModalResetKey}
                lang={lang}
                t={t}
                socialBusy={authProviderBusy !== null}
                emailBusy={authEmailBusy}
                setEmailBusy={setAuthEmailBusy}
                onError={(msg) => setAuthError(msg)}
                clearError={() => setAuthError(null)}
              />
              {authError ? (
                <p className="mt-4 text-sm text-red-600 leading-snug">{authError}</p>
              ) : null}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {shortLegalPage ? (
        shortLegalPage === 'privacy' ? <PrivacyPage /> : <TermsPage />
      ) : (
        <>
      {user && !isAdminDashboard && (isDashboardRoute || isEditProfileRoute) && (
        <div className="bg-stone-50 border-b border-stone-200">
          {showEmailVerifyBanner ? (
            <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-sm text-amber-950">
              <p className="font-medium">{t('authVerifyEmailBanner')}</p>
              <div className="mt-2 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={handleResendEmailVerification}
                  disabled={emailVerifySending}
                  className="rounded-lg border border-amber-400 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100 disabled:opacity-60"
                >
                  {emailVerifySending
                    ? pickLang('Envoi…', 'Enviando…', 'Sending…', lang)
                    : t('authResendVerification')}
                </button>
                {emailVerifyNotice ? (
                  <span className="text-xs text-amber-900/90">{emailVerifyNotice}</span>
                ) : null}
              </div>
            </div>
          ) : null}
          {viewerIsAdmin && viewMode !== 'dashboard' && (
            <div className={cn(pageSectionPad, 'pb-0 sm:hidden')}>
              <button
                type="button"
                onClick={() => {
                  setSelectedProfile(null);
                  setShowValidationPanel(false);
                  setDirectoryDiscoveryStripsHidden(true);
                  window.location.assign('/dashboard');
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-800 transition-colors hover:bg-indigo-100"
              >
                <LayoutDashboard size={17} aria-hidden />
                {t('dashboardTab')}
              </button>
            </div>
          )}
          <div className={cn(pageSectionPad, isEditProfileRoute && 'profile-edit-page')}>
            {isEditProfileRoute && (editingProfile?.uid ?? profile?.uid) && !profileVisibilityBandHidden ? (
              <div className="sticky top-24 z-40 mb-4 sm:top-16">
                <div className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur">
                    <div className="p-3 sm:p-4">
                      <ProfileCompletionCard
                        profile={profileCompletionCardSource}
                        t={t}
                        lang={lang}
                        onEditField={scrollToProfileCompletionField}
                        className="border-0 bg-transparent p-0 shadow-none"
                        matchingRecommendationsNote={t('profileFormMatchingRecommendationsNote')}
                        rightActions={
                          <button
                            type="button"
                            disabled={profileSaveBusy}
                            onClick={() => {
                              setIsProfileExpanded(true);
                              setIsEditing(true);
                              window.requestAnimationFrame(() => {
                                profileFormLayoutRef.current?.scrollIntoView({
                                  behavior: 'smooth',
                                  block: 'start',
                                });
                                const form = directoryProfileFormRef.current;
                                if (!form) return;
                                if (typeof (form as any).requestSubmit === 'function') {
                                  (form as any).requestSubmit();
                                  return;
                                }
                                form.dispatchEvent(
                                  new Event('submit', { bubbles: true, cancelable: true })
                                );
                              });
                            }}
                            className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
                          >
                            {profileSaveBusy
                              ? pickLang('Enregistrement...', 'Guardando...', 'Saving...', lang)
                              : 'Enregistrer'}
                          </button>
                        }
                        discreetRightFooter={
                          <button
                            type="button"
                            onClick={() => {
                              setProfileVisibilityBandHidden(true);
                              try {
                                window.sessionStorage.setItem('fn_profile_visibility_band_hidden', '1');
                              } catch {
                                // ignore
                              }
                            }}
                            className="text-[10px] font-normal leading-snug text-slate-400 transition-colors hover:text-slate-600 sm:text-xs"
                          >
                            {pickLang(
                              'Masquer ce bandeau',
                              'Ocultar este banner',
                              'Hide this banner',
                              lang
                            )}
                          </button>
                        }
                      />
                    </div>
                  </div>
              </div>
            ) : null}
            {showAdminSelfProfilePanel ? (
            <section className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden relative">
              <div
                className={cn(
                  'flex items-center justify-between gap-3 p-4 transition-colors',
                  !isEditProfileRoute && 'cursor-pointer hover:bg-stone-50'
                )}
                onClick={
                  isEditProfileRoute
                    ? undefined
                    : () => {
                        if (!isProfileExpanded) {
                          setIsProfileExpanded(true);
                          setIsEditing(true);
                        } else {
                          setIsProfileExpanded(false);
                        }
                      }
                }
              >
                <div
                  className={cn(
                    'flex min-w-0 flex-1 gap-3',
                    isProfileExpanded ? 'items-center' : 'items-start sm:items-center'
                  )}
                >
                  {!isProfileExpanded ? (
                    <div className="mt-0.5 h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-stone-50 sm:mt-0">
                      {profile ? (
                        <ProfileAvatar
                          photoURL={profile.photoURL}
                          fullName={profile.fullName}
                          className="h-full w-full"
                          iconSize={22}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-stone-100 text-stone-500">
                          <UserIcon size={18} aria-hidden />
                        </div>
                      )}
                    </div>
                  ) : null}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold tracking-tight">
                          {editingSomeoneElse && editingProfile
                            ? pickLang(
                                `Fiche membre : ${editingProfile.fullName || editingProfile.email || editingProfile.uid}`,
                                `Ficha del miembro: ${editingProfile.fullName || editingProfile.email || editingProfile.uid}`,
                                `Member profile: ${editingProfile.fullName || editingProfile.email || editingProfile.uid}`,
                                lang
                              )
                            : t('myProfile')}
                        </h2>
                        <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-800">
                          {editingSomeoneElse
                            ? pickLang('Édition admin', 'Edición admin', 'Admin edit', lang)
                            : isAdminEmail(user?.email)
                              ? pickLang('Admin', 'Admin', 'Admin', lang)
                              : pickLang(
                                  `Profil: ${profileCompletionPct}%`,
                                  `Perfil: ${profileCompletionPct}%`,
                                  `Profile: ${profileCompletionPct}%`,
                                  lang
                                )}
                        </span>
                      </div>

                      {isEditProfileRoute &&
                      (editingProfile?.uid ?? profile?.uid) &&
                      profileVisibilityBandHidden ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProfileVisibilityBandHidden(false);
                            try {
                              window.sessionStorage.removeItem('fn_profile_visibility_band_hidden');
                            } catch {
                              // ignore
                            }
                          }}
                          className="inline-flex shrink-0 items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                        >
                          {pickLang(
                            'Afficher la visibilité du profil',
                            'Mostrar visibilidad del perfil',
                            'Show profile visibility',
                            lang
                          )}
                        </button>
                      ) : null}
                    </div>
                    {profile ? (
                      <div className="flex items-start gap-2">
                        {isAdminEmail(user?.email) && editingSomeoneElse && editingProfile ? (
                          <div className="min-w-0 flex-1 space-y-1">
                            <p className="text-[11px] font-medium leading-relaxed text-violet-900 sm:text-xs">
                              {pickLang(
                                'Vous corrigez la fiche d’un autre membre — elle ne remplace pas votre compte administrateur.',
                                'Estás corrigiendo la ficha de otro miembro: no sustituye tu cuenta de administrador.',
                                'You are editing another member’s directory profile — it is not your admin account.',
                                lang
                              )}
                            </p>
                          </div>
                        ) : isAdminEmail(user?.email) ? (
                          <div className="min-w-0 flex-1 space-y-1">
                            <p className="text-[11px] font-medium leading-relaxed text-blue-700 sm:text-xs">
                              {pickLang(
                                'Compte administrateur : accès complet sans fiche annuaire publiée.',
                                'Cuenta de administración: acceso completo sin ficha en el directorio.',
                                'Admin account: full access without a published directory profile.',
                                lang
                              )}
                            </p>
                          </div>
                        ) : (
                          <>
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
                            <div className="min-w-0 flex-1 space-y-1">
                              <p className="text-[11px] font-medium leading-relaxed text-blue-700 sm:text-xs">
                                {pickLang(
                                  profileCompletionPct >= 100
                                    ? 'Bravo, votre profil est complet !'
                                    : `Objectif 100%: complétez votre profil pour gagner en visibilité.`,
                                  profileCompletionPct >= 100
                                    ? 'Excelente, tu perfil está completo.'
                                    : 'Meta 100%: completa tu perfil para ganar visibilidad.',
                                  profileCompletionPct >= 100
                                    ? 'Great, your profile is complete.'
                                    : 'Target 100%: complete your profile to boost visibility.',
                                  lang
                                )}
                              </p>
                              {profileCoachLine.trim() ? (
                                <p className="text-xs leading-relaxed text-stone-500 sm:text-sm break-words">
                                  {profileCoachLine}
                                </p>
                              ) : null}
                            </div>
                          </>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {user && !profile && !isProfileExpanded && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsEditing(true); setIsProfileExpanded(true); }}
                      className="px-4 py-1.5 bg-stone-900 text-white text-xs rounded-lg hover:bg-stone-800 transition-all font-medium"
                    >
                      {t('register')}
                    </button>
                  )}
                  {!isEditProfileRoute ? (
                    <div className="p-2 text-stone-400">
                      {isProfileExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  ) : null}
                </div>
              </div>

              {!isProfileExpanded && user ? (
                <div
                  className="flex flex-wrap gap-2 border-t border-stone-100 px-4 py-3 sm:px-5"
                  onClick={(e) => e.stopPropagation()}
                >
                  {profile?.uid ? (
                    <button
                      type="button"
                      onClick={handleSharePublicProfileLink}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-800 shadow-sm transition-colors hover:bg-stone-50"
                    >
                      <Share2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {t('profileSharePublicCta')}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMemberRequestModalNonce((n) => n + 1);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100"
                  >
                    <Megaphone className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {t('memberRequestsPostCta')}
                  </button>
                  {viewerIsAdmin ? (
                    <Link
                      to="/evenements"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDashboardInitialAdminTab('events');
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-900 transition-colors hover:bg-indigo-100"
                    >
                      <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {t('profileCreateEventCta')}
                    </Link>
                  ) : null}
                </div>
              ) : null}

              {profileSaveSuccess ? (
                <div className="mx-4 mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 sm:mx-6 sm:text-sm">
                  {profileSaveSuccess}
                </div>
              ) : null}

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
                    {profile?.isValidated === false && profile.optimizationSuggestion && (
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
                                memberBio:
                                  profile.optimizationSuggestion?.bioSuggested ||
                                  profile.memberBio ||
                                  profile.bio,
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
                      {profile || isEditing ? (
                        <div
                          ref={profileFormLayoutRef}
                          className="grid gap-6 lg:grid-cols-1 lg:items-start"
                        >
                          <div className="min-w-0 space-y-6">
                            {user &&
                            profileCompletionPct < 100 &&
                            profileCompletionPct <= 50 &&
                            profile?.isValidated !== true &&
                            !editingSomeoneElse &&
                            !isAdminEmail(user.email) ? (
                              <OnboardingIntroBanner t={t} className="w-full" />
                            ) : null}
                            <form
                              ref={directoryProfileFormRef}
                              key={profileFormRemountKey}
                              onSubmit={handleSaveProfile}
                              className={cn('space-y-8', isEditProfileRoute && 'profile-edit-density space-y-6')}
                            >
                          {isEditProfileRoute ? <ProfileEditFormPatchStyles /> : null}
                          {editingProfile && editingProfile.uid !== user.uid ? (
                            <p
                              className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-medium leading-relaxed text-indigo-950"
                              role="status"
                            >
                              {pickLang(
                                `Vous modifiez la fiche de ${editingProfile.fullName || editingProfile.email || editingProfile.uid}. Les changements s’appliquent à son compte annuaire.`,
                                `Estás editando la ficha de ${editingProfile.fullName || editingProfile.email || editingProfile.uid}. Los cambios se aplican a su ficha del directorio.`,
                                `You are editing ${editingProfile.fullName || editingProfile.email || editingProfile.uid}'s profile. Changes apply to their directory entry.`,
                                lang
                              )}
                            </p>
                          ) : null}
                          <div className="space-y-1.5">
                            <p className="rounded-md border border-stone-200/70 bg-stone-50/60 px-2 py-1 text-[11px] leading-snug text-stone-500">
                              {t('profileFormRequiredLegend')}
                            </p>
                            {user && !editingSomeoneElse ? (
                              <p className="rounded-md border border-blue-100/70 bg-blue-50/50 px-2 py-1 text-[11px] leading-snug text-blue-900/90">
                                {t('profileFormDraftLocalHint')}
                              </p>
                            ) : null}
                          </div>

                          <section
                            className={cn(
                              'profile-card-compact space-y-4',
                              isEditProfileRoute && 'profile-card-soft profile-stack-md'
                            )}
                          >
                            <div className="profile-section-header">
                              <h2 className="m-0 min-w-0 text-sm font-semibold text-stone-900">
                                {t('profileFormSectionPerson')}
                              </h2>
                              <ProfileSectionTag
                                tone="public"
                                label={pickLang(
                                  'Visible publiquement',
                                  'Visible públicamente',
                                  'Shown on your public profile',
                                  lang
                                )}
                              />
                              <ProfileSectionTag
                                tone="matching"
                                label={pickLang(
                                  'Important pour le matching',
                                  'Importante para el emparejamiento',
                                  'Used for matching',
                                  lang
                                )}
                              />
                            </div>

                            <ProfileSectionHint tone="public">
                              {pickLang(
                                'Identité, moyens de contact, langues, présentation personnelle et photo.',
                                'Identidad, contacto, idiomas, bio personal y foto.',
                                'Identity, contact, languages, personal intro and photo.',
                                lang
                              )}
                            </ProfileSectionHint>

                            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                              {t('profileFormSectionIdentity')}
                            </p>
                            <div className={cn('profile-form-grid-2', isEditProfileRoute && 'profile-grid-2')}>
                              <div className="profile-form-block--dense space-y-1">
                                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600">
                                  {profileEditFrUx ? PROFILE_FIELD_LABELS.fullName : t('fullName')}
                                  <span className="text-red-500 font-semibold" aria-hidden>
                                    {' *'}
                                  </span>
                                </label>
                                <input
                                  id="profile-completion-fullName"
                                  name="fullName"
                                  defaultValue={
                                    formDraftT?.fullName ??
                                    editingProfile?.fullName ??
                                    profile?.fullName ??
                                    ''
                                  }
                                  className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
                                />
                              </div>

                              <div className="profile-form-block--dense space-y-1">
                                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600">
                                  {profileEditFrUx ? PROFILE_FIELD_LABELS.email : t('email')}
                                  <span className="text-red-500 font-semibold" aria-hidden>
                                    {' *'}
                                  </span>
                                </label>
                                <input
                                  id="profile-completion-email"
                                  type="email"
                                  name="email"
                                  defaultValue={
                                    formDraftT?.email ??
                                    editingProfile?.email ??
                                    profile?.email ??
                                    user.email ??
                                    ''
                                  }
                                  className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
                                />
                              </div>

                              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 sm:col-span-2">
                                {t('profileFormSubContact')}
                              </p>
                              <div className="profile-form-block--dense min-w-0 space-y-1 sm:col-span-2">
                                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600">
                                  {profileEditFrUx ? PROFILE_FIELD_LABELS.linkedinUrl : t('linkedin')}
                                </label>
                                <input
                                  name="linkedin"
                                  id="linkedin-input"
                                  type="url"
                                  autoComplete="url"
                                  defaultValue={
                                    formDraftT?.linkedin ??
                                    editingProfile?.linkedin ??
                                    profile?.linkedin ??
                                    ''
                                  }
                                  placeholder="https://linkedin.com/in/..."
                                  className="h-10 min-w-0 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
                                />
                              </div>

                              <div className="profile-form-block--dense min-w-0 sm:col-span-2">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(9rem,12rem)_1fr]">
                                  <div className="space-y-1">
                                    <label
                                      className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600"
                                      htmlFor="whatsappDial"
                                    >
                                      {profileEditFrUx ? PROFILE_FIELD_LABELS.countryDialCode : t('profileFormPhoneCountryLabel')}
                                    </label>
                                    <select
                                      id="whatsappDial"
                                      name="whatsappDial"
                                      defaultValue={formDraftT?.whatsappDial ?? profileWhatsappDialDefault}
                                      className="h-10 w-full rounded-lg border border-stone-200 bg-white px-2 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
                                    >
                                      {phoneDialRowsOrderedForUi().map((row) => (
                                        <option key={row.dial} value={row.dial}>
                                          {dialLabelForLang(row.dial, lang)}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="space-y-1">
                                    <label
                                      className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600"
                                      htmlFor="whatsappLocal"
                                    >
                                      {profileEditFrUx ? PROFILE_FIELD_LABELS.phoneWhatsapp : t('profileFormPhoneLocalLabel')}
                                      <span className="text-red-500 font-semibold" aria-hidden>
                                        {' *'}
                                      </span>
                                    </label>
                                    <input
                                      id="whatsappLocal"
                                      type="tel"
                                      name="whatsappLocal"
                                      defaultValue={formDraftT?.whatsappLocal ?? profileWhatsappLocalDefault}
                                      placeholder={pickLang('ex. 33 1234 5678', 'ej. 33 1234 5678', 'e.g. 33 1234 5678', lang)}
                                      autoComplete="tel-national"
                                      className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
                                    />
                                    <ProfileFieldHint>
                                      {pickLang(
                                        PROFILE_FIELD_HELP.phoneWhatsapp,
                                        'Número sin repetir el prefijo internacional.',
                                        'Number without repeating the country prefix.',
                                        lang
                                      )}
                                    </ProfileFieldHint>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div
                              className={cn(
                                'mb-4',
                                isEditProfileRoute ? 'inline-checkboxes' : 'flex flex-col gap-2'
                              )}
                            >
                              <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700 hover:text-stone-900">
                                <input
                                  type="checkbox"
                                  name="isEmailPublic"
                                  defaultChecked={
                                    formDraftC?.isEmailPublic ??
                                    editingProfile?.isEmailPublic ??
                                    profile?.isEmailPublic ??
                                    false
                                  }
                                  className="h-4 w-4 shrink-0 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                                />
                                <span>{t('isEmailPublic')}</span>
                              </label>
                              <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700 hover:text-stone-900">
                                <input
                                  type="checkbox"
                                  name="isWhatsappPublic"
                                  defaultChecked={
                                    formDraftC?.isWhatsappPublic ??
                                    editingProfile?.isWhatsappPublic ??
                                    profile?.isWhatsappPublic ??
                                    false
                                  }
                                  className="h-4 w-4 shrink-0 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                                />
                                <span>{t('isWhatsappPublic')}</span>
                              </label>
                            </div>

                            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                              {t('profileFormSubLanguages')}
                            </p>
                            <div className="mb-4 space-y-1" id="profile-completion-workLanguages">
                              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600">
                                {profileEditFrUx ? PROFILE_FIELD_LABELS.languages : t('contactPrefsWorkingLangLabel')}
                              </span>
                              <div className="flex flex-wrap gap-2">
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
                                          ? 'border-blue-600 bg-blue-700 text-white shadow-sm'
                                          : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300',
                                        disabled && !selected && 'cursor-not-allowed opacity-40 hover:border-stone-200'
                                      )}
                                    >
                                      {opt.label[lang]}
                                    </button>
                                  );
                                })}
                              </div>
                              <ProfileFieldHint>
                                {profileEditFrUx
                                  ? PROFILE_FIELD_HELP.languages
                                  : t('contactPrefsWorkingLangTip')}
                              </ProfileFieldHint>
                            </div>

                            <input type="hidden" name="photoURL" value={profilePhotoUrlDraft} />
                            {isEditProfileRoute ? (
                              <ProfileEditorialMemberBioField
                                formDraftT={formDraftT}
                                editingProfile={editingProfile}
                                profile={profile}
                                profileEditFrUx={profileEditFrUx}
                                lang={lang}
                                t={t}
                              />
                            ) : (
                              <div className="space-y-1">
                                <label
                                  className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600"
                                  htmlFor="profile-member-bio"
                                >
                                  {profileEditFrUx ? PROFILE_FIELD_LABELS.bio : t('memberBio')}
                                  <span className="text-red-500 font-semibold" aria-hidden>
                                    {' *'}
                                  </span>
                                </label>
                                <textarea
                                  id="profile-member-bio"
                                  name="memberBio"
                                  rows={4}
                                  maxLength={4000}
                                  defaultValue={
                                    formDraftT?.memberBio ??
                                    (editingProfile?.memberBio ??
                                      profile?.memberBio ??
                                      editingProfile?.bio ??
                                      profile?.bio) ??
                                    ''
                                  }
                                  placeholder={pickLang(
                                    'Qui êtes-vous, votre parcours, ce que vous apportez au réseau…',
                                    'Quién eres, tu trayectoria, qué aportas a la red…',
                                    'Who you are, your path, what you bring to the network…',
                                    lang
                                  )}
                                  className="min-h-[90px] w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
                                />
                                <ProfileFieldHint>
                                  {profileEditFrUx ? PROFILE_FIELD_HELP.bio : t('profileFormMemberBioHint')}
                                </ProfileFieldHint>
                              </div>
                            )}
                            <div className="space-y-3 rounded-xl border border-stone-200 bg-white/70 p-4 shadow-sm">
                              <h3 className="text-sm font-semibold text-stone-900">
                                {t('profileFormSectionPhotoVisual')}
                              </h3>
                              <p className="text-xs leading-relaxed text-stone-600">
                                {t('profileFormPhotoVisualIntro')}
                              </p>
                              <p className="border-l-2 border-stone-300 pl-3 text-xs leading-relaxed text-stone-500">
                                {t('profileFormPhotoNoHostingNote')}
                              </p>
                              <ProfileIdentityVisual
                                fullName={
                                  editingProfile?.fullName ??
                                  profile?.fullName ??
                                  user?.displayName ??
                                  ''
                                }
                                photoUrl={profilePhotoUrlDraft}
                                linkedinUrl={
                                  editingProfile?.linkedin ?? profile?.linkedin ?? undefined
                                }
                                size="lg"
                                imageAlt={
                                  profilePhotoUrlDraft.trim()
                                    ? pickLang(
                                        'Photo de profil — aperçu',
                                        'Foto de perfil — vista previa',
                                        'Profile photo — preview',
                                        lang
                                      )
                                    : undefined
                                }
                              />
                              <p className="text-xs font-medium text-stone-800">
                                {t('profileFormPhotoCredibilityNote')}
                              </p>
                              <div className="space-y-1">
                                <label
                                  className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600"
                                  htmlFor="profilePhotoUrl"
                                >
                                  {profileEditFrUx
                                    ? PROFILE_FIELD_LABELS.profilePhoto
                                    : t('profileFormPhotoPublicUrlLabel')}
                                </label>
                                <input
                                  id="profilePhotoUrl"
                                  type="url"
                                  inputMode="url"
                                  autoComplete="url"
                                  value={profilePhotoUrlDraft}
                                  onChange={(e) => setProfilePhotoUrlDraft(e.target.value)}
                                  onBlur={() => {
                                    setProfilePhotoUrlDraft((prev) => {
                                      const trimmed = String(prev ?? '').trim();
                                      if (!trimmed) return '';
                                      return trimmed.split('#')[0];
                                    });
                                  }}
                                  onPaste={(e) => {
                                    const text = e.clipboardData?.getData('text') ?? '';
                                    if (!text) return;
                                    e.preventDefault();
                                    setProfilePhotoUrlDraft(text.trim().split('#')[0]);
                                  }}
                                  placeholder="https://…"
                                  className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
                                />
                              </div>
                            </div>
                          </section>

                          <ProfileMatchingSection
                            lang={lang}
                            t={t}
                            pickLang={pickLang}
                            profileEditFrUx={profileEditFrUx}
                            isEditProfileRoute={isEditProfileRoute}
                            formDraftT={formDraftT}
                            editingProfile={editingProfile}
                            profile={profile}
                            highlightedNeedsDraft={highlightedNeedsDraft}
                            onToggleHighlightedNeed={toggleHighlightedNeedDraft}
                          />
                          <section
                            className={cn(
                              'space-y-3 rounded-xl border border-stone-200 bg-stone-50/40 p-4',
                              isEditProfileRoute && 'profile-card-soft profile-stack-md'
                            )}
                          >
                            <div className="profile-section-header">
                              <h2 className="m-0 min-w-0 text-sm font-semibold text-stone-900">
                                {t('profileFormSectionCompanyActivity')}
                              </h2>
                              <ProfileSectionTag
                                tone="public"
                                label={pickLang(
                                  'Visible publiquement',
                                  'Visible públicamente',
                                  'Shown on your public profile',
                                  lang
                                )}
                              />
                              <ProfileSectionTag
                                tone="matching"
                                label={pickLang(
                                  'Important pour le matching',
                                  'Importante para el emparejamiento',
                                  'Used for matching',
                                  lang
                                )}
                              />
                            </div>
                            <ProfileSectionHint tone="public">{t('profileFormCompanyDetailsIntro')}</ProfileSectionHint>
                            <p className="mb-3 text-xs font-medium text-stone-700">
                              {companyActivitiesDraft
                                .map((s) => s.companyName.trim())
                                .filter(Boolean)
                                .join(' | ') ||
                                pickLang('—', '—', '—', lang)}
                            </p>

                            <div className="space-y-4">
                              {companyActivitiesDraft.map((slot, idx) => {
                                const collapsed = companyActivityEditCollapsed[slot.id] === true;
                                return (
                                  <div
                                    key={slot.id}
                                    className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm"
                                  >
                                    <div className="mb-3 flex flex-wrap items-center gap-2">
                                      <button
                                        type="button"
                                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100"
                                        aria-expanded={!collapsed}
                                        onClick={() =>
                                          setCompanyActivityEditCollapsed((p) => ({
                                            ...p,
                                            [slot.id]: !(p[slot.id] === true),
                                          }))
                                        }
                                      >
                                        {collapsed ? (
                                          <ChevronRight className="h-4 w-4" aria-hidden />
                                        ) : (
                                          <ChevronDown className="h-4 w-4" aria-hidden />
                                        )}
                                      </button>
                                      <span className="min-w-0 flex-1 text-xs font-bold uppercase tracking-wide text-stone-800">
                                        {t('profileFormCompanyActivityBlockTitle')} {idx + 1}
                                        {slot.companyName.trim() ? (
                                          <span className="ml-1 font-semibold normal-case text-stone-600">
                                            — {slot.companyName.trim()}
                                          </span>
                                        ) : null}
                                      </span>
                                      {companyActivitiesDraft.length > 1 ? (
                                        <button
                                          type="button"
                                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-800 hover:bg-rose-100"
                                          onClick={() =>
                                            setCompanyActivitiesDraft((prev) =>
                                              prev.length <= 1 ? prev : prev.filter((s) => s.id !== slot.id)
                                            )
                                          }
                                        >
                                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                          {t('profileFormRemoveCompanyActivity')}
                                        </button>
                                      ) : null}
                                    </div>

                                    {!collapsed ? (
                                      <div className="space-y-4 border-t border-stone-100 pt-3">
                                        <div
                                          className={cn(
                                            'grid grid-cols-1 gap-4 md:grid-cols-2',
                                            isEditProfileRoute && 'profile-grid-2'
                                          )}
                                        >
                                          <div className="space-y-1">
                                            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600">
                                              {profileEditFrUx ? PROFILE_FIELD_LABELS.companyName : t('companyName')}
                                              <span className="text-red-500 font-semibold" aria-hidden>
                                                {' *'}
                                              </span>
                                            </label>
                                            <input
                                              id={idx === 0 ? 'profile-completion-companyName' : undefined}
                                              value={slot.companyName}
                                              onChange={(e) =>
                                                updateCompanyActivitySlot(slot.id, {
                                                  companyName: e.target.value,
                                                })
                                              }
                                              className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600">
                                              {profileEditFrUx ? PROFILE_FIELD_LABELS.companyWebsite : t('website')}
                                              <span className="text-red-500 font-semibold" aria-hidden>
                                                {' *'}
                                              </span>
                                            </label>
                                            <input
                                              type="url"
                                              inputMode="url"
                                              autoComplete="url"
                                              placeholder="https://..."
                                              value={slot.website ?? ''}
                                              onChange={(e) =>
                                                updateCompanyActivitySlot(slot.id, { website: e.target.value })
                                              }
                                              className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
                                            />
                                          </div>
                                        </div>

                                        <div className="space-y-1">
                                          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600">
                                            {profileEditFrUx ? PROFILE_FIELD_LABELS.sector : t('activityCategory')}
                                            <span className="text-red-500 font-semibold" aria-hidden>
                                              {' *'}
                                            </span>
                                          </label>
                                          <select
                                            value={slot.activityCategory || ''}
                                            onChange={(e) =>
                                              updateCompanyActivitySlot(slot.id, {
                                                activityCategory: e.target.value || undefined,
                                              })
                                            }
                                            className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
                                          >
                                            <option value="">
                                              {pickLang('— Secteur —', '— Sector —', '— Sector —', lang)}
                                            </option>
                                            {ACTIVITY_CATEGORIES.map((c) => (
                                              <option key={c} value={c}>
                                                {activityCategoryLabel(c, lang)}
                                              </option>
                                            ))}
                                          </select>
                                        </div>

                                        <div
                                          className={cn(
                                            'grid grid-cols-1 gap-4 md:grid-cols-3',
                                            isEditProfileRoute && 'profile-grid-3'
                                          )}
                                        >
                                          <div className="space-y-1">
                                            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600">
                                              {profileEditFrUx ? PROFILE_FIELD_LABELS.city : t('city')}
                                              <span className="text-red-500 font-semibold" aria-hidden>
                                                {' *'}
                                              </span>
                                            </label>
                                            <select
                                              value={slot.city || ''}
                                              onChange={(e) =>
                                                updateCompanyActivitySlot(slot.id, { city: e.target.value })
                                              }
                                              className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
                                            >
                                              <option value="">
                                                {pickLang('— Ville —', '— Ciudad —', '— City —', lang)}
                                              </option>
                                              {CITIES.map((c) => (
                                                <option key={c} value={c}>
                                                  {cityOptionLabel(c, lang)}
                                                </option>
                                              ))}
                                            </select>
                                          </div>
                                          <div className="space-y-1">
                                            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600">
                                              {profileEditFrUx ? PROFILE_FIELD_LABELS.district : t('neighborhood')}
                                            </label>
                                            <input
                                              value={slot.neighborhood ?? ''}
                                              onChange={(e) =>
                                                updateCompanyActivitySlot(slot.id, {
                                                  neighborhood: e.target.value,
                                                })
                                              }
                                              className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600">
                                              {profileEditFrUx ? PROFILE_FIELD_LABELS.state : t('state')}
                                              <span className="text-red-500 font-semibold" aria-hidden>
                                                {' *'}
                                              </span>
                                            </label>
                                            <input
                                              value={slot.state ?? ''}
                                              placeholder={pickLang('Jalisco', 'Jalisco', 'Jalisco', lang)}
                                              onChange={(e) =>
                                                updateCompanyActivitySlot(slot.id, { state: e.target.value })
                                              }
                                              className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
                                            />
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                          <div className="space-y-1 md:col-span-2">
                                            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600">
                                              {profileEditFrUx ? PROFILE_FIELD_LABELS.country : t('country')}
                                              <span className="text-red-500 font-semibold" aria-hidden>
                                                {' *'}
                                              </span>
                                            </label>
                                            <input
                                              value={slot.country ?? ''}
                                              placeholder={pickLang('Mexique', 'México', 'Mexico', lang)}
                                              onChange={(e) =>
                                                updateCompanyActivitySlot(slot.id, { country: e.target.value })
                                              }
                                              className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
                                            />
                                            <ProfileFieldHint>
                                              {profileEditFrUx
                                                ? PROFILE_FIELD_HELP.country
                                                : t('profileFormCountryFootnote')}
                                            </ProfileFieldHint>
                                          </div>
                                          <div className="space-y-1 md:col-span-1">
                                            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600">
                                              {profileEditFrUx ? PROFILE_FIELD_LABELS.roleInCompany : t('workFunction')}
                                              <span className="text-red-500 font-semibold" aria-hidden>
                                                {' *'}
                                              </span>
                                            </label>
                                            <select
                                              value={slot.positionCategory || ''}
                                              onChange={(e) =>
                                                updateCompanyActivitySlot(slot.id, {
                                                  positionCategory: e.target.value,
                                                })
                                              }
                                              className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
                                            >
                                              <option value="">{t('selectWorkFunction')}</option>
                                              {WORK_FUNCTION_OPTIONS.map((opt) => (
                                                <option key={opt} value={opt}>
                                                  {workFunctionLabel(opt, lang)}
                                                </option>
                                              ))}
                                            </select>
                                            <ProfileFieldHint>
                                              {profileEditFrUx
                                                ? PROFILE_FIELD_HELP.roleInCompany
                                                : t('workFunctionHint')}
                                            </ProfileFieldHint>
                                          </div>
                                        </div>

                                        {idx === 0 ? (
                                          <div className="space-y-1">
                                            <label
                                              className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600"
                                              htmlFor="profile-arrival-year"
                                            >
                                              {profileEditFrUx
                                                ? PROFILE_FIELD_LABELS.arrivalYearInMexico
                                                : t('arrivalYear')}
                                            </label>
                                            <input
                                              id="profile-arrival-year"
                                              type="number"
                                              value={slot.arrivalYear ?? ''}
                                              onChange={(e) => {
                                                const v = e.target.value;
                                                updateCompanyActivitySlot(slot.id, {
                                                  arrivalYear: v === '' ? undefined : Number(v),
                                                });
                                              }}
                                              className="h-10 w-full max-w-xs rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
                                            />
                                            <ProfileFieldHint>
                                              {profileEditFrUx
                                                ? PROFILE_FIELD_HELP.arrivalYearInMexico
                                                : t('profileFormArrivalRegionHint')}
                                            </ProfileFieldHint>
                                          </div>
                                        ) : null}

                                        <div
                                          className={cn(
                                            'grid grid-cols-1 gap-4 md:grid-cols-2',
                                            isEditProfileRoute && 'profile-grid-2'
                                          )}
                                        >
                                          <div className="space-y-1">
                                            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600">
                                              {t('creationYear')}
                                            </label>
                                            <input
                                              type="number"
                                              value={slot.creationYear ?? ''}
                                              onChange={(e) => {
                                                const v = e.target.value;
                                                updateCompanyActivitySlot(slot.id, {
                                                  creationYear: v === '' ? undefined : Number(v),
                                                });
                                              }}
                                              className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600">
                                              {profileEditFrUx ? PROFILE_FIELD_LABELS.employeeRange : t('employeeCount')}{' '}
                                              <span className="text-[10px] font-normal normal-case text-stone-400">
                                                {t('employeeCountOptional')}
                                              </span>
                                            </label>
                                            <select
                                              value={employeeCountToSelectDefault(slot.employeeCount)}
                                              onChange={(e) =>
                                                updateCompanyActivitySlot(slot.id, {
                                                  employeeCount: e.target.value === '' ? '' : e.target.value,
                                                })
                                              }
                                              className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
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

                                        <div
                                          className={cn(
                                            'grid grid-cols-1 gap-4 md:grid-cols-3',
                                            isEditProfileRoute && 'profile-grid-3'
                                          )}
                                        >
                                          <div className="space-y-1">
                                            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600">
                                              {profileEditFrUx ? PROFILE_FIELD_LABELS.companyType : t('profileFormCompanyType')}
                                              <span className="text-red-500 font-semibold" aria-hidden>
                                                {' *'}
                                              </span>
                                            </label>
                                            <select
                                              required
                                              value={slot.communityCompanyKind ?? ''}
                                              onChange={(e) =>
                                                updateCompanyActivitySlot(slot.id, {
                                                  communityCompanyKind:
                                                    (e.target.value as CommunityCompanyKind) || undefined,
                                                })
                                              }
                                              className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
                                            >
                                              <option value="" disabled>
                                                {pickLang('— Choisir —', '— Elegir —', '— Choose —', lang)}
                                              </option>
                                              <option value="startup">Startup</option>
                                              <option value="pme">PME / SME</option>
                                              <option value="corporate">Corporate</option>
                                              <option value="independent">
                                                {pickLang('Indépendant', 'Independiente', 'Independent', lang)}
                                              </option>
                                              <option value="association">
                                                {pickLang('Association', 'Asociación', 'Association', lang)}
                                              </option>
                                              <option value="nonprofit">
                                                {pickLang('Non profit', 'Sin fines de lucro', 'Non-profit', lang)}
                                              </option>
                                              <option value="club">
                                                {pickLang('Club', 'Club', 'Club', lang)}
                                              </option>
                                            </select>
                                          </div>
                                          <div className="space-y-1">
                                            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600">
                                              {profileEditFrUx
                                                ? PROFILE_FIELD_LABELS.professionalStatus
                                                : t('profileFormProfessionalStatus')}
                                              <span className="text-red-500 font-semibold" aria-hidden>
                                                {' *'}
                                              </span>
                                            </label>
                                            <select
                                              required
                                              value={slot.communityMemberStatus ?? ''}
                                              onChange={(e) =>
                                                updateCompanyActivitySlot(slot.id, {
                                                  communityMemberStatus:
                                                    (e.target.value as CommunityMemberStatus) || undefined,
                                                })
                                              }
                                              className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
                                            >
                                              <option value="" disabled>
                                                {pickLang('— Choisir —', '— Elegir —', '— Choose —', lang)}
                                              </option>
                                              <option value="freelance">Freelance</option>
                                              <option value="employee">
                                                {pickLang('Salarié', 'Asalariado', 'Employee', lang)}
                                              </option>
                                              <option value="owner">
                                                {pickLang('Dirigeant / fondateur', 'Director / fundador', 'Owner / founder', lang)}
                                              </option>
                                              <option value="volunteer">
                                                {pickLang('Bénévole', 'Voluntario(a)', 'Volunteer', lang)}
                                              </option>
                                            </select>
                                          </div>
                                          <div className="space-y-1">
                                            <label
                                              htmlFor={`typicalClientSizes-${slot.id}`}
                                              className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600"
                                            >
                                              {profileEditFrUx
                                                ? PROFILE_FIELD_LABELS.typicalClientSizes
                                                : t('contactPrefsClientSizeLabel')}
                                            </label>
                                            <TypicalClientSizesDropdown
                                              fieldId={`typicalClientSizes-${slot.id}`}
                                              value={slot.typicalClientSizes ?? []}
                                              onChange={(next) =>
                                                updateCompanyActivitySlot(slot.id, {
                                                  typicalClientSizes: next,
                                                })
                                              }
                                              lang={lang}
                                              emptyLabel={t('contactPrefsClientSizeEmpty')}
                                              maxHint={t('contactPrefsClientSizeMaxHint')}
                                            />
                                            <p className="mt-1 text-[10px] text-stone-400">
                                              {t('contactPrefsClientSizeHint')}
                                            </p>
                                          </div>
                                        </div>

                                        <div className="space-y-1">
                                          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600">
                                            {profileEditFrUx
                                              ? PROFILE_FIELD_LABELS.activityDescription
                                              : t('profileFormActivityDescriptionLabel')}
                                            <span className="text-red-500 font-semibold" aria-hidden>
                                              {' *'}
                                            </span>
                                          </label>
                                          <textarea
                                            id={idx === 0 ? 'profile-completion-activityDescription' : undefined}
                                            value={slot.activityDescription ?? ''}
                                            onChange={(e) =>
                                              updateCompanyActivitySlot(slot.id, {
                                                activityDescription: e.target.value,
                                              })
                                            }
                                            rows={4}
                                            maxLength={4000}
                                            placeholder={pickLang(
                                              'Décrivez l’activité de cette entreprise sur ce marché…',
                                              'Describe la actividad de esta empresa en este mercado…',
                                              'Describe this company’s activity in this market…',
                                              lang
                                            )}
                                            className="min-h-[90px] w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
                                          />
                                          <ProfileFieldHint>
                                            {profileEditFrUx
                                              ? PROFILE_FIELD_HELP.activityDescription
                                              : t('profileFormActivityDescriptionHint')}
                                          </ProfileFieldHint>
                                        </div>
                                      </div>
                                    ) : null}
                                  </div>
                                );
                              })}
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setCompanyActivitiesDraft((prev) => [...prev, emptyCompanyActivitySlot()])
                              }
                              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-stone-300 bg-white py-2.5 text-xs font-semibold text-stone-700 hover:border-stone-400 hover:bg-stone-50"
                            >
                              <Plus className="h-4 w-4" aria-hidden />
                              {t('profileFormAddCompanyActivity')}
                            </button>
                          </section>
                          <section
                            id="profile-completion-passions"
                            className={cn(
                              'space-y-3 rounded-xl border border-stone-200 bg-white p-4',
                              isEditProfileRoute && 'profile-card-compact'
                            )}
                          >
                            <div className="profile-section-header">
                              <h2 className="m-0 min-w-0 text-sm font-semibold text-stone-900">
                                {t('profileFormSectionPassions')}
                              </h2>
                              <ProfileSectionTag
                                tone="public"
                                label={pickLang(
                                  'Visible publiquement',
                                  'Visible públicamente',
                                  'Shown on your public profile',
                                  lang
                                )}
                              />
                              <ProfileSectionTag
                                tone="matching"
                                label={pickLang(
                                  'Important pour le matching',
                                  'Importante para el emparejamiento',
                                  'Used for matching',
                                  lang
                                )}
                              />
                            </div>
                            <ProfileSectionHint tone="public">
                              {pickLang(
                                `${PROFILE_FIELD_HELP.passions} Ils font aussi office d’ice breakers relationnels.`,
                                'Intereses fuera de tu actividad principal: humanizan tu ficha y el matching. También sirven como rompehielos.',
                                'Interests outside your core work humanize your profile and matching. They also work as conversational ice-breakers.',
                                lang
                              )}
                            </ProfileSectionHint>
                            <IceBreakerInterests
                              lang={lang}
                              value={passionIdsDraft}
                              onChange={(ids) => setPassionIdsDraft(sanitizePassionIds(ids))}
                              markRequired
                            />
                          </section>


                          <section
                            className={cn(
                              'space-y-3',
                              isEditProfileRoute && 'profile-card-soft profile-stack-md'
                            )}
                          >
                            <div className="profile-section-header">
                              <h2 className="m-0 min-w-0 text-sm font-semibold text-stone-900">
                                {t('profileFormSectionVisibility')}
                              </h2>
                              <ProfileSectionTag
                                tone="public"
                                label={pickLang(
                                  'Visible publiquement',
                                  'Visible públicamente',
                                  'Shown on your public profile',
                                  lang
                                )}
                              />
                            </div>
                            <ProfileSectionHint tone="public">
                              {pickLang(
                                'Ces options contrôlent ce que les autres membres voient sur votre fiche.',
                                'Estas opciones controlan lo que otros miembros ven en tu ficha.',
                                'These options control what other members see on your profile.',
                                lang
                              )}
                            </ProfileSectionHint>
                            <div className="space-y-1">
                              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600">
                                {profileEditFrUx ? PROFILE_FIELD_LABELS.openness : t('contactPrefsOpenToLabel')}
                              </span>
                              <div
                                className={cn(
                                  'mt-0',
                                  isEditProfileRoute ? 'inline-checkboxes' : 'space-y-2'
                                )}
                              >
                                <label className="flex cursor-pointer items-start gap-3 rounded-lg p-1 hover:bg-stone-50">
                                  <input
                                    type="checkbox"
                                    name="openToMentoring"
                                    defaultChecked={
                                      formDraftC?.openToMentoring ??
                                      (editingProfile?.openToMentoring ?? profile?.openToMentoring) ===
                                        true
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
                                      formDraftC?.openToTalks ??
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
                                      formDraftC?.openToEvents ??
                                      (editingProfile?.openToEvents ?? profile?.openToEvents) === true
                                    }
                                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                                  />
                                  <span className="text-sm text-stone-700">{t('contactPrefsOpenEvents')}</span>
                                </label>
                              </div>
                              <ProfileFieldHint>
                                {profileEditFrUx ? PROFILE_FIELD_HELP.openness : t('contactPrefsOpenToHint')}
                              </ProfileFieldHint>
                            </div>
                          </section>

                          {formAdminPrivateReady && formAdminPrivate !== null ? (
                            <section
                              key={`unpublished-admin-${editingProfile?.uid ?? profile?.uid}`}
                              className={cn(
                                'profile-card-compact space-y-4 border-t border-stone-200 pt-4',
                                isEditProfileRoute && 'profile-card-soft profile-stack-md'
                              )}
                            >
                              <div className="profile-section-header">
                                <h2 className="m-0 min-w-0 text-sm font-semibold text-stone-900">
                                  {t('profileFormSectionUnpublished')}
                                </h2>
                                <ProfileSectionTag
                                  tone="internal"
                                  label={pickLang('Interne uniquement', 'Solo interno', 'Internal only', lang)}
                                />
                              </div>

                              <ProfileSectionHint tone="internal">
                                {pickLang(
                                  'Ces informations servent aux statistiques et à l’animation du réseau.',
                                  'Estos datos sirven para estadísticas y la dinámica de la red.',
                                  'This information supports statistics and how we run the community.',
                                  lang
                                )}
                              </ProfileSectionHint>

                              <div className={cn('profile-form-grid-2', isEditProfileRoute && 'profile-grid-2')}>
                                <div className="profile-form-block--dense space-y-1">
                                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600">
                                    {profileEditFrUx ? PROFILE_FIELD_LABELS.gender : t('genderStatLabel')}
                                  </label>
                                  <select
                                    name="genderStat"
                                    defaultValue={formDraftT?.genderStat ?? formAdminPrivate.genderStat ?? ''}
                                    className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
                                  >
                                    <option value="">{t('genderStatSelectPlaceholder')}</option>
                                    <option value="male">{t('genderStatMale')}</option>
                                    <option value="female">{t('genderStatFemale')}</option>
                                    <option value="other">{t('genderStatOther')}</option>
                                    <option value="prefer_not_say">{t('genderStatPreferNotSay')}</option>
                                  </select>
                                  <ProfileFieldHint>
                                    {pickLang(
                                      PROFILE_FIELD_HELP.gender,
                                      'Solo con fines estadísticos.',
                                      'For internal statistics only.',
                                      lang
                                    )}
                                  </ProfileFieldHint>
                                </div>

                                <div className="profile-form-block--dense space-y-1">
                                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-600">
                                    {profileEditFrUx ? PROFILE_FIELD_LABELS.nationality : t('nationalityLabel')}
                                  </label>
                                  <select
                                    name="nationality"
                                    defaultValue={formDraftT?.nationality ?? formAdminPrivate.nationality ?? ''}
                                    className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none transition-all focus:ring-2 focus:ring-stone-900"
                                  >
                                    <option value="">{t('nationalitySelectPlaceholder')}</option>
                                    {NATIONALITY_OPTIONS.map((o) => (
                                      <option key={o.code} value={o.code}>
                                        {nationalityLabel(o.code, lang)}
                                      </option>
                                    ))}
                                  </select>
                                  <ProfileFieldHint>{t('nationalityHint')}</ProfileFieldHint>
                                </div>

                                <div className="profile-form-block--dense sm:col-span-2">
                                  <div className="rounded-xl border border-stone-200 bg-stone-50/60 px-3 py-3 sm:px-4 sm:py-3">
                                    <div
                                      className={cn(
                                        'flex flex-wrap items-center gap-x-5 gap-y-2 sm:gap-x-8',
                                        isEditProfileRoute && 'inline-checkboxes'
                                      )}
                                    >
                                      <label className="flex min-w-0 cursor-pointer items-center gap-2.5 rounded-lg py-0.5 pr-1 hover:bg-stone-100/80">
                                        <input
                                          type="checkbox"
                                          name="openToEventSponsoring"
                                          defaultChecked={
                                            formDraftC?.openToEventSponsoring ??
                                            formAdminPrivate.openToEventSponsoring === true
                                          }
                                          className="h-4 w-4 shrink-0 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                                        />
                                        <span className="text-sm font-medium text-stone-800">
                                          {t('contactPrefsOpenEventSponsoring')}
                                        </span>
                                      </label>
                                      <label className="flex min-w-0 cursor-pointer items-center gap-2.5 rounded-lg py-0.5 pr-1 hover:bg-stone-100/80">
                                        <input
                                          type="checkbox"
                                          name="acceptsDelegationVisits"
                                          defaultChecked={
                                            formDraftC?.acceptsDelegationVisits ??
                                            formAdminPrivate.acceptsDelegationVisits === true
                                          }
                                          className="h-4 w-4 shrink-0 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                                        />
                                        <span className="text-sm font-medium text-stone-800">
                                          {profileEditFrUx
                                            ? PROFILE_FIELD_LABELS.hostDelegations
                                            : t('acceptsDelegationVisitsLabel')}
                                        </span>
                                      </label>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </section>
                          ) : null}

                          <div className="flex justify-end gap-3 border-t border-stone-200 pt-6">
                            <button
                              type="button"
                              onClick={() => {
                                setIsEditing(false);
                                setEditingProfile(null);
                                if (!isEditProfileRoute) {
                                  setIsProfileExpanded(false);
                                }
                              }}
                              className="rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-700 transition-colors hover:bg-stone-50"
                            >
                              {t('cancel')}
                            </button>
                            <button
                              type="submit"
                              disabled={profileSaveBusy}
                              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {profileSaveBusy
                                ? pickLang('Enregistrement...', 'Guardando...', 'Saving...', lang)
                                : t('save')}
                            </button>
                          </div>

                          {(editingProfile?.uid ?? profile?.uid) ? (
                            <div className="mt-8 border-t border-red-100 pt-4">
                              <p className="mb-2 text-xs text-stone-400">{t('profileFormDangerZoneLabel')}</p>
                              <button
                                type="button"
                                className="text-xs text-red-500 underline decoration-red-500/80 underline-offset-2 hover:text-red-700"
                                onClick={() => {
                                  const delUid = editingProfile?.uid ?? profile?.uid;
                                  if (!delUid) return;
                                  if (
                                    !window.confirm(
                                      delUid === user?.uid
                                        ? t('profileFormDeleteOwnConfirm')
                                        : t('confirmDelete')
                                    )
                                  ) {
                                    return;
                                  }
                                  void handleDeleteProfile(delUid);
                                }}
                              >
                                {t('deleteProfile')}
                              </button>
                            </div>
                          ) : null}

                          {profileSaveError && (
                            <p className="mt-3 text-xs text-red-600">{profileSaveError}</p>
                          )}
                            </form>
                          </div>
                          {/* Profile completion card is sticky on /profile/edit */}
                        </div>
                      ) : (
                        <div className="py-8 text-center">
                          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-stone-50 text-stone-300">
                            <Plus size={32} />
                          </div>
                          <p className="mb-6 text-sm text-stone-500">{t('noProfile')}</p>
                          <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            className="rounded-lg bg-stone-900 px-8 py-2 font-medium text-white transition-all hover:bg-stone-800"
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
            ) : null}
          </div>
        </div>
      )}

      <main
        className={cn(pageMainPad, isAdminRoute ? 'max-w-none' : 'max-w-7xl')}
      >
        {isAdminRoute ? (
          viewerIsAdmin ? (
            <React.Suspense
              fallback={
                <div className="rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-500 shadow-sm">
                  {lang === 'es' ? 'Cargando…' : lang === 'en' ? 'Loading…' : 'Chargement…'}
                </div>
              }
            >
              <AdminPageLazy lang={lang} t={t} />
            </React.Suspense>
          ) : (
            <Navigate to={user ? '/dashboard' : '/'} replace />
          )
        ) : isSignupMinimal ? (
          <>
            <Helmet>
              <title>{`${t('signupPageDocumentTitle')} · ${t('title')}`}</title>
              <meta name="description" content={t('signupPageMetaDescription')} />
            </Helmet>
            <div className="flex w-full flex-col items-center gap-6 sm:gap-8">
              <First50MembersBanner
                currentCount={stats.total}
                targetCount={FIRST_50_MEMBER_TARGET}
                inviteUrl={getSignupJoinUrl()}
                className="w-full max-w-3xl"
              />
              <OnboardingIntroBanner t={t} className="w-full max-w-3xl" />
              <SignupInviteCard
                lang={lang}
                t={t}
                onOpenAuth={openAuthModal}
                authBusy={authProviderBusy !== null || authEmailBusy}
              />
              <WhyJoinSection className="w-full max-w-3xl" />
            </div>
          </>
        ) : isHomeRoute && !isSignupLandingRoute && !isAdminDashboard ? (
          <MarketingHomePage
            isAdmin={viewerIsAdmin}
            visibleMemberCount={stats.total}
            membersForSectors={allProfiles.map((p) => ({ id: p.uid, sector: p.activityCategory ?? null }))}
            signupHref={user ? '/profile/edit' : '/inscription'}
            onInviteClick={() => setShowInviteNetworkModal(true)}
            exploreMembersHref="/network"
            postRequestHref="/requests"
            className="w-full"
            heroSearch={
              <HeroSearchSection
                welcome={
                  <WelcomeContextCard
                    title={t('welcome')}
                    body={t('welcomeIntro')}
                    collapsibleOnMobile
                    mobileShowIntroLabel={t('welcomeIntroShow')}
                    mobileHideIntroLabel={t('welcomeIntroHide')}
                  />
                }
                hero={
                  <HeroSection
                    copy={{
                      ...h,
                      ctaPrimary: user ? t('dashboardTab') : h.ctaPrimary,
                      ctaPrimaryBusy: user ? t('dashboardTab') : h.ctaPrimaryBusy,
                      steps: user
                        ? [
                            lang === 'en'
                              ? 'Open your dashboard.'
                              : lang === 'es'
                                ? 'Abre tu panel.'
                                : 'Ouvrez votre tableau de bord.',
                            lang === 'en'
                              ? 'Explore members and requests.'
                              : lang === 'es'
                                ? 'Explora miembros y necesidades.'
                                : 'Explorez les membres et les demandes.',
                            lang === 'en'
                              ? 'Contact the right people.'
                              : lang === 'es'
                                ? 'Contacta a las personas adecuadas.'
                                : 'Contactez les bonnes personnes.',
                          ]
                        : h.steps,
                    }}
                    authBusy={authProviderBusy !== null}
                    onCreateProfile={() => {
                      if (user) {
                        navigate('/dashboard');
                        return;
                      }
                      openAuthModal();
                    }}
                    onExploreMembers={() => navigate('/network')}
                    showCtas={!user}
                    className="w-full"
                  />
                }
                // Homepage-safe: no directory search here, only orientation CTAs.
                search={
                  <div className="home-cta-row">
                    {user ? (
                      <Link
                        to="/profile/edit"
                        className="home-cta-row__primary inline-flex min-h-[44px] items-center justify-center rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800"
                      >
                        {t('editProfile')}
                      </Link>
                    ) : (
                      <Link
                        to="/inscription"
                        className="home-cta-row__primary inline-flex min-h-[44px] items-center justify-center rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800"
                      >
                        {t('home.marketing.ctaCreateProfile')}
                      </Link>
                    )}
                    {!user ? (
                      <Link
                        to="/network"
                        className="home-cta-row__secondary inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        {t('home.marketing.ctaExploreMembers')}
                      </Link>
                    ) : null}
                    <Link to="/requests" className="home-cta-row__tertiary">
                      {t('homeViewRequestsCta')}
                    </Link>
                  </div>
                }
              />
            }
            mainColumn={
              <div className="space-y-6">
                <NewMembersSection
                  copy={h}
                  lang={lang}
                  profiles={stats.newThisWeekProfiles}
                  totalNewThisWeek={stats.newThisWeekCount}
                  guestTeaser={guestDirectoryRestricted}
                  onOpenProfile={(p) => setSelectedProfile(p)}
                  onSeeAll={() => navigate('/network')}
                />
                <NetworkRequestsSection
                  t={t}
                  lang={lang}
                  requests={memberRequests.slice(0, 6)}
                  user={user}
                  profile={profile}
                  viewerIsAdmin={viewerIsAdmin}
                  onOpenAuth={openAuthModal}
                  onOpenAuthorProfile={(uid) => {
                    const found = allProfiles.find((p) => p.uid === uid);
                    if (found) setSelectedProfile(found);
                  }}
                  onCreate={handleCreateMemberRequest}
                  onDelete={handleDeleteMemberRequest}
                />
                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/network"
                    className="inline-flex items-center justify-center rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                  >
                    {t('homeExploreNetworkCta')}
                  </Link>
                  <Link
                    to="/requests"
                    className="inline-flex items-center justify-center rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                  >
                    {t('homeViewRequestsCta')}
                  </Link>
                </div>
              </div>
            }
          />
        ) : isRequestsRoute && !isAdminDashboard ? (
          <div className={cn(pageInnerMax, pageStack)}>
            <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
              {t('memberRequestsTitle')}
            </h1>
            <p className="text-sm text-stone-600">
              {t('memberRequestsSubtitle')}
            </p>
            <div>
              <NetworkRequestsSection
                t={t}
                lang={lang}
                requests={memberRequests}
                user={user}
                profile={profile}
                viewerIsAdmin={viewerIsAdmin}
                onOpenAuth={openAuthModal}
                onOpenAuthorProfile={(uid) => {
                  const found = allProfiles.find((p) => p.uid === uid);
                  if (found) setSelectedProfile(found);
                }}
                onCreate={handleCreateMemberRequest}
                onDelete={handleDeleteMemberRequest}
                postModalOpenNonce={memberRequestModalNonce}
              />
            </div>
          </div>
        ) : isRadarRoute && !isAdminDashboard ? (
          <div className={pageInnerFluid}>
            <div className="mx-auto w-full min-w-0 max-w-none">
              <SectionErrorBoundary
                fallback={
                  <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                    {pickLang(
                      'Le module Radar a rencontré une erreur.',
                      'El módulo Radar encontró un error.',
                      'Radar module crashed.',
                      lang
                    )}
                  </div>
                }
              >
                <React.Suspense
                  fallback={
                    <div className="rounded-xl border border-stone-200 bg-white p-6 text-sm text-stone-500">
                      {pickLang('Chargement du radar...', 'Cargando radar...', 'Loading radar...', lang)}
                    </div>
                  }
                >
                  <NetworkRadarSection
                    lang={lang}
                    t={t}
                    allProfiles={allProfiles}
                    viewerProfile={profile}
                    user={user}
                    copy={h}
                    activityCategoryLabel={activityCategoryLabel}
                    needOptionLabel={needOptionLabel}
                    getPassionEmoji={getPassionEmoji}
                    getPassionLabel={getPassionLabel}
                    onNeedClick={(needId) => {
                      navigate('/network');
                      setPassionIdFilter('');
                      setHighlightedNeedFilter(needId);
                    }}
                    onPassionClick={(passionId) => {
                      navigate('/network');
                      setHighlightedNeedFilter('');
                      setPassionIdFilter(passionId);
                    }}
                    onCreateProfile={openAuthModal}
                    registeredWithProfile={!!user && !!profile}
                    onUnlockRadar={() => {
                      if (!user) {
                        openAuthModal();
                      } else {
                        setShowOnboarding(true);
                      }
                    }}
                  />
                </React.Suspense>
              </SectionErrorBoundary>
            </div>
          </div>
        ) : (
        <>
        <div
          className={cn(
            'min-w-0',
            user &&
              isNetworkRoute &&
              !isEditProfileRoute &&
              !isAdminDashboard
              ? 'fn-network-page network-layout'
              : cn(
                  'grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8 lg:items-stretch',
                  isNetworkRoute && 'fn-network-page'
                )
          )}
        >
          {/* Invités : hero + recherche, puis blocs d’accueil (pile unique) */}
          {!user && !isAdminDashboard && !isSignupLandingRoute && (
            <div className="flex w-full flex-col gap-6 lg:col-span-12">
              <HeroSearchSection
                welcome={
                  <WelcomeContextCard
                    title={t('welcome')}
                    body={t('welcomeIntro')}
                    collapsibleOnMobile
                    mobileShowIntroLabel={t('welcomeIntroShow')}
                    mobileHideIntroLabel={t('welcomeIntroHide')}
                  />
                }
                hero={
                  <HeroSection
                    copy={h}
                    authBusy={authProviderBusy !== null}
                    onCreateProfile={openAuthModal}
                    onExploreMembers={() => {
                      setDirectoryDiscoveryStripsHidden(true);
                      setViewMode('members');
                      requestAnimationFrame(() =>
                        directoryMainRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      );
                    }}
                    className="w-full"
                  />
                }
                search={
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
                    randomDisabled={guestVisibleProfilesForRandom.length === 0}
                    showClearFilters={showDirectoryClearFilters}
                  />
                }
              />
              <section className="w-full min-w-0">
                <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-12 lg:gap-8 lg:items-stretch">
                  <div className="min-w-0 lg:col-span-8">
                    <WhyJoinSection className="h-full w-full" />
                  </div>
                  <div className="min-w-0 lg:col-span-4">
                    <First50MembersBanner
                      currentCount={stats.total}
                      targetCount={FIRST_50_MEMBER_TARGET}
                      inviteUrl={getSignupJoinUrl()}
                      className="h-full w-full"
                      narrow
                    />
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* Colonne gauche — recherche (membres connectés uniquement), stats (masquée sur /evenements) */}
          {user && !isAdminDashboard && !isEditProfileRoute && !isEventsAdminRoute && (
          <div
            className={cn(
              'order-1 min-w-0 w-full lg:order-1',
              !(
                user &&
                isNetworkRoute &&
                !isEditProfileRoute &&
                !isAdminDashboard
              ) && 'lg:col-start-1 lg:col-span-4 lg:self-start',
              isAdminDashboard && 'hidden'
            )}
          >
            {upcomingInviteEvent ? (
              <div className="mb-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                      {pickLang('Événement à venir', 'Próximo evento', 'Upcoming event', lang)}
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold text-stone-900">
                      {upcomingInviteEvent.event.title}
                    </p>
                    <p className="mt-1 text-xs text-stone-600">
                      {(() => {
                        try {
                          const d = upcomingInviteEvent.event.startsAt?.toDate?.();
                          const when = d
                            ? d.toLocaleString(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-MX' : 'fr-FR', {
                                year: 'numeric',
                                month: 'short',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '';
                          const where = String(upcomingInviteEvent.event.address ?? '').trim();
                          return `${when}${where ? ` · ${where}` : ''}`;
                        } catch {
                          return '';
                        }
                      })()}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                      upcomingInviteEvent.status === 'present'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : upcomingInviteEvent.status === 'declined'
                          ? 'border-rose-200 bg-rose-50 text-rose-800'
                          : 'border-stone-200 bg-stone-50 text-stone-700'
                    )}
                  >
                    {upcomingInviteEvent.status === 'present'
                      ? pickLang('Inscrit', 'Inscrito', 'Registered', lang)
                      : upcomingInviteEvent.status === 'declined'
                        ? pickLang('Refusé', 'Rechazado', 'Declined', lang)
                        : pickLang('Invitation', 'Invitación', 'Invited', lang)}
                  </span>
                </div>
                <div className="mt-3">
                  <Link
                    to={`/e/${encodeURIComponent(String(upcomingInviteEvent.event.slug ?? ''))}`}
                    className={cn(
                      'inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold',
                      upcomingInviteEvent.status === 'present'
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-stone-900 text-white hover:bg-stone-800'
                    )}
                  >
                    {upcomingInviteEvent.status === 'present'
                      ? pickLang('Voir les détails', 'Ver detalles', 'View details', lang)
                      : pickLang('Répondre maintenant', 'Responder ahora', 'RSVP now', lang)}
                  </Link>
                  {upcomingInviteLoading ? (
                    <p className="mt-2 text-[11px] text-stone-400">
                      {pickLang('Mise à jour…', 'Actualizando…', 'Refreshing…', lang)}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {isNetworkRoute ? (
              <NetworkSidebar
                query={searchTerm}
                onQueryChange={setSearchTerm}
                onSubmitSearch={scrollDirectoryIntoView}
                sectorOptions={networkSidebarSectorOptions}
                profileOptions={networkSidebarProfileOptions}
                locationOptions={networkSidebarLocationOptions}
                selectedSector={filterCategory}
                selectedProfile={filterProfileType}
                selectedLocation={filterLocation}
                onSectorChange={setFilterCategory}
                onProfileChange={(v) => handleFilterProfileTypeChange(v as ProfileTypeFilterKey)}
                onLocationChange={(v) => setFilterLocation(v as LocationFilterKey)}
                onSuggestContact={handleRandomProfile}
                suggestContactDisabled={guestVisibleProfilesForRandom.length === 0}
                showClearFilters={showDirectoryClearFilters}
                onClearFilters={clearDirectoryFilters}
                launchProgress={
                  stats.total < FIRST_50_MEMBER_TARGET
                    ? {
                        currentCount: stats.total,
                        targetCount: FIRST_50_MEMBER_TARGET,
                        inviteUrl: getSignupJoinUrl(),
                        defaultOpen: false,
                      }
                    : null
                }
              />
            ) : (
              <div className="space-y-4 sm:space-y-6">
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
                  randomDisabled={guestVisibleProfilesForRandom.length === 0}
                  showClearFilters={showDirectoryClearFilters}
                />

                {stats.total < FIRST_50_MEMBER_TARGET ? (
                  <First50MembersBanner
                    currentCount={stats.total}
                    targetCount={FIRST_50_MEMBER_TARGET}
                    inviteUrl={getSignupJoinUrl()}
                    className="w-full min-w-0"
                    narrow
                  />
                ) : null}
              </div>
            )}

            {/* Opportunités retirées du produit */}
          </div>
          )}

          {/* Colonne droite — invités : nouveaux membres + opportunités ; connecté : recommandations, onglets, listes */}
          <div
            ref={directoryMainRef}
            id="directory-main"
            className={cn(
              'order-2 min-w-0 w-full scroll-mt-24 lg:order-2',
              /* Sur /network : espacement uniquement via .network-main { gap } (évite space-y + gap cumulés). */
              !(
                user &&
                isNetworkRoute &&
                !isEditProfileRoute &&
                !isAdminDashboard
              ) && 'space-y-6',
              user &&
                isNetworkRoute &&
                !isEditProfileRoute &&
                !isAdminDashboard &&
                'network-main',
              !(
                user &&
                isNetworkRoute &&
                !isEditProfileRoute &&
                !isAdminDashboard
              ) &&
                (isAdminDashboard
                  ? 'lg:col-span-12 lg:col-start-1'
                  : !user
                    ? 'lg:col-span-12 lg:col-start-1'
                    : isEventsAdminRoute
                      ? 'lg:col-span-12 lg:col-start-1'
                      : 'lg:col-span-8 lg:col-start-5'),
              user && showDiscoveryStrips && !isAdminDashboard && 'lg:space-y-5'
            )}
          >
            {/* Connecté : nouveaux membres en tête de la colonne centrale */}
            {user && showDiscoveryStrips && !isAdminDashboard && !isEditProfileRoute && !isEventsAdminRoute && (
              <NewMembersSection
                copy={h}
                lang={lang}
                profiles={stats.newThisWeekProfiles}
                totalNewThisWeek={stats.newThisWeekCount}
                className="lg:min-h-[12rem]"
                compact
                guestTeaser={guestDirectoryRestricted}
                onOpenProfile={(p) => setSelectedProfile(p)}
                onSeeAll={() => {
                  navigate('/membres?sort=recent');
                }}
              />
            )}

            {/* Bandeaux découverte : visiteurs uniquement (connectés : ligne du haut + colonne gauche) */}
            {!user && showDiscoveryStrips && (
              <>
                <NewMembersSection
                  copy={h}
                  lang={lang}
                  profiles={stats.newThisWeekProfiles}
                  totalNewThisWeek={stats.newThisWeekCount}
                  className="lg:min-h-[12rem]"
                  compact
                  guestTeaser={guestDirectoryRestricted}
                  onOpenProfile={(p) => setSelectedProfile(p)}
                  onSeeAll={() => {
                    navigate('/membres?sort=recent');
                  }}
                />

                {/* Opportunités retirées du produit */}
              </>
            )}

            {!isMembersDirectoryRoute && !isAdminDashboard && !isEditProfileRoute && !isEventsAdminRoute && (
              <NetworkRequestsSection
                t={t}
                lang={lang}
                requests={memberRequests}
                user={user}
                profile={profile}
                viewerIsAdmin={viewerIsAdmin}
                onOpenAuth={openAuthModal}
                onOpenAuthorProfile={(uid) => {
                  const found = allProfiles.find((p) => p.uid === uid);
                  if (found) setSelectedProfile(found);
                }}
                onCreate={handleCreateMemberRequest}
                onDelete={handleDeleteMemberRequest}
                postModalOpenNonce={memberRequestModalNonce}
              />
            )}

            {/* Recommandations IA — uniquement dans /dashboard */}
            {user && profile && !isAdminDashboard && isDashboardRoute && (
              <RecommendedForYouSection
                t={t}
                needsInviteGate={aiRecNeedsInviteGate}
                onInviteClick={() => setShowInviteNetworkModal(true)}
              >
                <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-3">
                  {matchLoading || (matches.length === 0 && !aiRecResolved) ? (
                    [1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex h-48 min-h-[12rem] flex-col gap-4 rounded-2xl border border-stone-100 bg-white p-5 animate-pulse md:h-full md:min-h-[14rem]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-xl bg-stone-100" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 w-3/4 rounded bg-stone-100" />
                            <div className="h-3 w-1/2 rounded bg-stone-100" />
                          </div>
                        </div>
                        <div className="h-16 rounded-xl bg-stone-50" />
                      </div>
                    ))
                  ) : matches.length > 0 ? (
                    matches.map((m) => {
                      const p = allProfiles.find((ap) => ap.uid === m.profileId);
                      if (!p) return null;
                      return (
                        <React.Fragment key={m.profileId}>
                          <MatchCard
                            m={m}
                            p={p}
                            onShare={(id) => {
                              const found = allProfiles.find((ap) => ap.uid === id);
                              if (found) setSelectedProfile(found);
                            }}
                            expanded={expandedHookId === m.profileId}
                            onToggleHook={() =>
                              setExpandedHookId(expandedHookId === m.profileId ? null : m.profileId)
                            }
                          />
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <div className="col-span-3 space-y-3 rounded-2xl border border-dashed border-stone-200 bg-white px-4 py-8 text-center">
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
              </RecommendedForYouSection>
            )}

            {user &&
              networkCompatibilityCurrentUser &&
              isNetworkRoute &&
              !guestDirectoryRestricted &&
              isMembersDirectoryRoute &&
              !isAdminDashboard && (
                <RecommendedMembersSection
                  currentUser={networkCompatibilityCurrentUser}
                  members={membersDirectoryList
                    .filter((p) => p.uid !== profile?.uid)
                    .map((p) => userProfileToRecommendedMember(p, lang))}
                  viewerProfile={profile}
                />
              )}

            {isMembersDirectoryRoute && !isAdminDashboard && (
              <header
                data-testid="members-directory-page"
                className={cn(
                  isNetworkRoute
                    ? 'network-directory-header'
                    : 'rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-6 sm:py-5'
                )}
              >
                <h1
                  className={cn(
                    !isNetworkRoute &&
                      'text-xl font-bold tracking-tight text-stone-900 sm:text-2xl'
                  )}
                >
                  {t('membersPageTitle')}
                </h1>
                <p className={cn(!isNetworkRoute && 'mt-2 text-sm leading-snug text-stone-600')}>
                  {t('membersPageSubtitle')}
                </p>
              </header>
            )}

            {!isEditProfileRoute && (
            <DirectoryTabsSection
              tabs={
                isNetworkRoute || isEventsAdminRoute
                  ? []
                  : directoryViewTabs.map((tab) => ({
                      id: tab.id,
                      label: tab.label,
                      icon: <tab.icon size={16} aria-hidden />,
                    }))
              }
              activeTab={viewMode}
              onTabChange={(id) => {
                if (isNetworkRoute || isEventsAdminRoute) return;
                if (id === 'dashboard') {
                  setSelectedProfile(null);
                  setShowValidationPanel(false);
                  window.location.assign('/dashboard');
                  return;
                }
                if (isMembersDirectoryRoute && id !== 'members') {
                  navigate('/');
                }
                setDirectoryDiscoveryStripsHidden(true);
                setViewMode(
                  id as 'companies' | 'members' | 'activities' | 'radar' | 'dashboard'
                );
              }}
            >
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
                        viewerIsAdmin={viewerIsAdmin}
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
                <div
                  className={cn(
                    isNetworkRoute ? 'flex min-w-0 flex-col gap-6' : 'space-y-6'
                  )}
                >
                  {isMembersDirectoryRoute &&
                    (isNetworkRoute ? (
                      <NetworkToolbar>
                        <SortPanel title={t('membersSortLabel')} htmlFor="members-directory-sort">
                          <SortSelect
                            id="members-directory-sort"
                            value={membersSortMode}
                            onChange={(mode) => {
                              const sortParam =
                                mode === 'recent'
                                  ? 'recent'
                                  : mode === 'alphabetical'
                                    ? 'alpha'
                                    : 'default';
                              const p = new URLSearchParams(location.search);
                              p.set('sort', sortParam);
                              navigate(
                                { pathname: '/network', search: `?${p.toString()}` },
                                { replace: true }
                              );
                            }}
                          />
                        </SortPanel>
                        <SavedMembersPanel
                          title={t('network.savedPanel.title')}
                          count={savedMembersCount}
                          description={t('network.savedPanel.description')}
                          onClick={openSavedMembersDirectoryView}
                          active={showSavedMembersOnly}
                        />
                      </NetworkToolbar>
                    ) : (
                      <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:gap-6">
                        <div className="min-w-0 flex-1 space-y-1">
                          <label
                            htmlFor="members-directory-sort"
                            className="block text-xs font-semibold uppercase tracking-wider text-stone-500"
                          >
                            {t('membersSortLabel')}
                          </label>
                          <select
                            id="members-directory-sort"
                            data-testid="members-directory-sort"
                            value={membersSortMode}
                            onChange={(e) => {
                              const mode = e.target.value as MembersSortMode;
                              const sortParam =
                                mode === 'recent'
                                  ? 'recent'
                                  : mode === 'alphabetical'
                                    ? 'alpha'
                                    : 'default';
                              const p = new URLSearchParams(location.search);
                              p.set('sort', sortParam);
                              navigate(
                                { pathname: '/membres', search: `?${p.toString()}` },
                                { replace: true }
                              );
                            }}
                            className="w-full max-w-md rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-800 outline-none transition-all focus:ring-2 focus:ring-blue-600"
                          >
                            <option value="recent">{t('membersSortOptionRecent')}</option>
                            <option value="alphabetical">{t('membersSortOptionAlphabetical')}</option>
                            <option value="default">{t('membersSortOptionDefault')}</option>
                          </select>
                        </div>
                      </div>
                    ))}
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
                  <div
                    ref={membersDirectoryGridRef}
                    className={cn(
                      isNetworkRoute
                        ? 'member-grid'
                        : 'grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch'
                    )}
                  >
                    {membersDirectoryListDisplayed.map((p) => {
                      const cats = profileDistinctActivityCategories(p);
                      const sectorLine = cats.length
                        ? cats.map((c) => activityCategoryLabel(c, lang)).join(' · ')
                        : undefined;
                      const needLabels = sanitizeHighlightedNeeds(p.highlightedNeeds ?? []).map((id) =>
                        needOptionLabel(id, lang)
                      );
                      return (
                        <React.Fragment key={p.uid}>
                          {isNetworkRoute && !guestDirectoryRestricted ? (
                            <MemberCard
                              profileUid={p.uid}
                              fullName={p.fullName}
                              companyName={p.companyName}
                              sector={sectorLine}
                              bio={memberListingBioSource(p)}
                              photoUrl={p.photoURL}
                              needs={needLabels}
                              onOpen={() => setSelectedProfile(p)}
                              viewerProfile={profile}
                            />
                          ) : (
                            <ProfileCard
                              p={p}
                              onSelect={setSelectedProfile}
                              onEdit={startEditing}
                              onDelete={setProfileToDelete}
                              user={user}
                              profile={profile}
                              viewerIsAdmin={viewerIsAdmin}
                              guestDirectoryTeaser={guestDirectoryRestricted}
                              onGuestJoin={onGuestDirectoryJoin}
                              networkListing={isNetworkRoute}
                            />
                          )}
                        </React.Fragment>
                      );
                    })}
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
                              viewerIsAdmin={viewerIsAdmin}
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
                <SectionErrorBoundary
                  fallback={
                    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                      {pickLang('Le module Radar a rencontré une erreur. Revenez sur Membres.', 'El módulo Radar encontró un error. Vuelve a Miembros.', 'Radar module crashed. Please switch back to Members.', lang)}
                    </div>
                  }
                >
                  <React.Suspense
                    fallback={
                      <div className="rounded-xl border border-stone-200 bg-white p-6 text-sm text-stone-500">
                        {pickLang('Chargement du radar...', 'Cargando radar...', 'Loading radar...', lang)}
                      </div>
                    }
                  >
                    <NetworkRadarSection
                      lang={lang}
                      t={t}
                      allProfiles={allProfiles}
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
                      onCreateProfile={openAuthModal}
                      registeredWithProfile={!!user && !!profile}
                      onUnlockRadar={() => {
                        if (!user) {
                          openAuthModal();
                        } else {
                          setShowOnboarding(true);
                        }
                      }}
                    />
                  </React.Suspense>
                </SectionErrorBoundary>
              )}

              {isAdminDashboard && !isEventsAdminRoute && !location.pathname.startsWith('/e/') && (
                <SectionErrorBoundary
                  fallback={
                    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                      {pickLang('Le tableau de bord a rencontré une erreur. Retour sur la vue Membres.', 'El panel encontró un error. Vuelve a la vista Miembros.', 'Dashboard crashed. Please return to Members view.', lang)}
                    </div>
                  }
                >
                  <React.Suspense
                    fallback={
                      <div className="rounded-xl border border-stone-200 bg-white p-6 text-sm text-stone-500">
                        {pickLang('Chargement du tableau de bord...', 'Cargando panel...', 'Loading dashboard...', lang)}
                      </div>
                    }
                  >
                    <DashboardPage
                      lang={lang}
                      t={t}
                      registeredWithProfile={!!user && !!profile}
                      initialAdminTab={dashboardInitialAdminTab}
                      onUnlockRadar={() => {
                        if (!user) {
                          openAuthModal();
                        } else {
                          setShowOnboarding(true);
                        }
                      }}
                      user={user}
                    />
                  </React.Suspense>
                </SectionErrorBoundary>
              )}

              {isEventsAdminRoute && (
                <SectionErrorBoundary
                  fallback={
                    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                      {pickLang('La page Événements a rencontré une erreur.', 'La página de Eventos encontró un error.', 'Events page crashed.', lang)}
                    </div>
                  }
                >
                  <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-6">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="text-lg font-bold text-stone-900">
                          {pickLang('Événements', 'Eventos', 'Events', lang)}
                        </h2>
                        <p className="text-sm text-stone-500">
                          {pickLang(
                            'Piloter les invitations, présences/refus et notes.',
                            'Gestionar invitaciones, presentes/rechazados y notas.',
                            'Manage invitations, present/declined and notes.',
                            lang
                          )}
                        </p>
                      </div>
                      <Link
                        to="/dashboard"
                        className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100"
                      >
                        {pickLang('Retour tableau de bord', 'Volver al panel', 'Back to dashboard', lang)}
                      </Link>
                    </div>

                    <div className="space-y-6">
                      <React.Suspense
                        fallback={
                          <div className="rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-500">
                            {t('loading')}
                          </div>
                        }
                      >
                        <AdminEventsLazy lang={lang} t={t} adminUid={user?.uid ?? null} />
                      </React.Suspense>
                    </div>
                  </div>
                </SectionErrorBoundary>
              )}

              {location.pathname.startsWith('/e/') && (
                <SectionErrorBoundary
                  fallback={
                    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                      {pickLang('La page inscription a rencontré une erreur.', 'La página de inscripción encontró un error.', 'RSVP page crashed.', lang)}
                    </div>
                  }
                >
                  <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-6">
                    <React.Suspense
                      fallback={
                        <div className="rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-500">
                          {t('loading')}
                        </div>
                      }
                    >
                      <PublicEventPageLazy lang={lang} t={t} currentUser={user} onStartRsvp={startRsvpFromPublicPage} />
                    </React.Suspense>
                  </div>
                </SectionErrorBoundary>
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
            </DirectoryTabsSection>
            )}
          </div>
        </div>
        </>
        )}
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
              role="dialog"
              aria-modal="true"
              aria-labelledby="profile-modal-title"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
              <div className="min-h-0 flex-1 overflow-y-auto p-6 sm:p-8">
                <button 
                  onClick={() => setSelectedProfile(null)}
                  className="absolute top-6 right-6 p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-400 hover:text-stone-900"
                >
                  <Plus size={24} className="rotate-45" />
                </button>

                {guestDirectoryRestricted ? (
                  <div className="flex flex-col items-center gap-5 py-6 text-center">
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-3xl border border-stone-200 bg-stone-100">
                      <div
                        className="pointer-events-none absolute inset-0 z-0 scale-110 blur-md opacity-70"
                        aria-hidden
                      >
                        <ProfileAvatar
                          photoURL={selectedProfile.photoURL}
                          fullName={selectedProfile.fullName}
                          className="h-full w-full"
                          initialsClassName="text-xl font-bold text-stone-400 sm:text-2xl"
                          iconSize={48}
                        />
                      </div>
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-stone-100/40">
                        <Lock className="h-8 w-8 text-stone-500" strokeWidth={2} aria-hidden />
                      </div>
                    </div>
                    <div className="min-w-0 px-2">
                      <h2 className="break-words text-2xl font-bold tracking-tight text-stone-900">
                        {selectedProfile.fullName}
                      </h2>
                      <p className="mt-1 text-lg font-medium text-stone-500">
                        {companyActivityNamesJoined(selectedProfile) || selectedProfile.companyName}
                      </p>
                    </div>
                    <div className="relative mt-2 w-full min-h-[200px] overflow-hidden rounded-2xl border border-stone-100 bg-stone-50">
                      <div
                        className="pointer-events-none flex flex-col justify-end space-y-2 p-4 opacity-40 blur-sm select-none"
                        aria-hidden
                      >
                        <div className="h-3 w-3/4 rounded bg-slate-200" />
                        <div className="h-3 w-1/2 rounded bg-slate-200" />
                        <div className="h-16 w-full rounded-lg bg-slate-100" />
                      </div>
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/88 px-4 backdrop-blur-[2px]">
                        <p className="text-sm font-medium text-stone-700">{t('guestOverlayTitle')}</p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onGuestDirectoryJoin();
                          }}
                          className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
                        >
                          {t('guestJoinCta')}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                <>
                <div className="mb-6 flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-start">
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-stone-100 ring-1 ring-slate-200">
                    <ProfileAvatar
                      photoURL={selectedProfile.photoURL}
                      fullName={selectedProfile.fullName}
                      className="h-full w-full"
                      initialsClassName="text-xl font-bold text-stone-400 sm:text-2xl"
                      iconSize={48}
                    />
                  </div>
                  <div className="min-w-0 flex-1 pr-14 sm:pr-16">
                    <h2
                      id="profile-modal-title"
                      className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl"
                    >
                      <span className="break-words">{selectedProfile.fullName}</span>
                    </h2>
                    <p className="mt-1 text-lg font-medium text-stone-600 sm:text-xl">
                      {companyActivityNamesJoined(selectedProfile) || selectedProfile.companyName}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                      {selectedProfile.linkedin?.trim() ? (
                        <a
                          href={
                            selectedProfile.linkedin.trim().startsWith('http')
                              ? selectedProfile.linkedin.trim()
                              : `https://${selectedProfile.linkedin.trim()}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-medium text-blue-700 underline-offset-2 hover:text-blue-800 hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (user) {
                              void trackMemberInteraction({
                                eventType: 'click_linkedin',
                                targetId: selectedProfile.uid,
                                targetType: 'profile',
                                metadata: {
                                  profileName: (selectedProfile.fullName || selectedProfile.companyName || '').slice(
                                    0,
                                    120
                                  ),
                                },
                              });
                            }
                          }}
                          aria-label={t('openLinkedin')}
                        >
                          <Linkedin className="size-4 shrink-0 text-[#0A66C2]" strokeWidth={2} aria-hidden />
                          {pickLang('LinkedIn', 'LinkedIn', 'LinkedIn', lang)}
                        </a>
                      ) : null}
                      {selectedProfile.website?.trim() ? (
                        <ProfileWebsiteInlineLink
                          website={selectedProfile.website}
                          className="text-sm font-medium"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : null}
                    </div>
                    {selectedProfile.positionCategory && (
                      <p className="mt-2 flex items-center gap-2 text-sm text-stone-600">
                        <UserCog size={16} className="shrink-0 text-stone-400" />
                        {workFunctionLabel(selectedProfile.positionCategory, lang)}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(() => {
                        const cats = profileDistinctActivityCategories(selectedProfile);
                        return cats.length ? (
                          cats.map((cat) => (
                            <span key={cat} className={profileNeutralPillClass}>
                              {activityCategoryLabel(cat, lang)}
                            </span>
                          ))
                        ) : (
                          <span className={profileNeutralPillClass}>—</span>
                        );
                      })()}
                      <span className={profileNeutralPillClass}>{selectedProfile.city}</span>
                    </div>
                    <div
                      className={cn(
                        'mt-3 flex flex-wrap items-center gap-3',
                        viewerIsAdmin ? 'justify-between' : 'justify-end'
                      )}
                    >
                      {viewerIsAdmin ? (
                        <p className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-700">
                          <span className="font-semibold text-slate-900">{t('adminLastSeenLabel')}</span>
                          {': '}
                          {formatProfileLastSeen(selectedProfile.lastSeen, lang) ?? t('adminLastSeenUnknown')}
                        </p>
                      ) : null}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsShareProfileModalOpen(true);
                        }}
                        className="inline-flex shrink-0 items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 shadow-sm transition-colors hover:bg-stone-50"
                        title={pickLang('Partager le profil', 'Compartir perfil', 'Share profile', lang)}
                      >
                        <Share2 size={18} aria-hidden />
                        {pickLang('Partager', 'Compartir', 'Share', lang)}
                      </button>
                    </div>
                    {viewerIsAdmin &&
                      (selectedProfile.needsAdminReview === true || selectedProfile.isValidated === false) && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={async () => {
                            await handleValidateProfile(selectedProfile.uid, true);
                            setSelectedProfile((prev) =>
                              prev
                                ? { ...prev, isValidated: true, needsAdminReview: false }
                                : prev
                            );
                          }}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all"
                        >
                          {t('validate')}
                        </button>
                        <button
                          onClick={async () => {
                            await handleValidateProfile(selectedProfile.uid, false);
                            setSelectedProfile((prev) =>
                              prev
                                ? { ...prev, isValidated: false, needsAdminReview: false }
                                : prev
                            );
                          }}
                          className="px-4 py-2 rounded-lg border border-red-200 bg-white text-red-700 text-xs font-bold hover:bg-red-50 transition-all"
                        >
                          {pickLang('Annuler', 'Cancelar', 'Cancel', lang)}
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
                    {viewerIsAdmin &&
                      (selectedProfile.needsAdminReview === true || selectedProfile.isValidated === false) &&
                      selectedProfile.optimizationSuggestion && (
                      <div className={cn(profileCardClass, 'mt-4 space-y-3 border-l-4 border-l-slate-300')}>
                        <p className="text-xs font-semibold text-slate-800">
                          {pickLang(
                            'Resume des optimisations proposees:',
                            'Resumen de optimizaciones propuestas:',
                            'Summary of suggested improvements:',
                            lang
                          )}
                        </p>
                        <ul className="list-disc space-y-1 pl-4 text-xs text-slate-700">
                          {selectedProfile.optimizationSuggestion.summary.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                        <button
                          onClick={() => sendOptimizationEmail(selectedProfile)}
                          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50"
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

                <div className="mb-6 space-y-4 md:mb-8">
                {viewerIsAdmin ? (
                  <React.Suspense
                    fallback={
                      <div className="rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-500">
                        {t('loading')}
                      </div>
                    }
                  >
                    <AdminMemberEventHistoryLazy
                      lang={lang}
                      t={t}
                      uid={selectedProfile.uid}
                      email={selectedProfile.email}
                    />
                  </React.Suspense>
                ) : null}
                {user && profile && profile.uid !== selectedProfile.uid && (
                  <AffinityScore
                    viewer={profile}
                    target={selectedProfile}
                    lang={lang}
                    t={t}
                    canRevealPrivateWhatsApp={!!user}
                    suppressCommonNeedLabels
                  />
                )}

                <div className="space-y-4">
                  <div className={profileCardClass}>
                    <h3 className={profileSectionTitleClass}>{t('needsSought')}</h3>
                    {sanitizeHighlightedNeeds(selectedProfile.highlightedNeeds).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {sanitizeHighlightedNeeds(selectedProfile.highlightedNeeds).map((id) => (
                          <span key={id} className={profileNeedPillClass}>
                            {needOptionLabel(id, lang)}
                          </span>
                        ))}
                      </div>
                    )}
                    {sanitizeHighlightedNeeds(selectedProfile.highlightedNeeds).length === 0 && (
                      <p className="mt-2 text-sm text-stone-600">{t('noNeedsSpecified')}</p>
                    )}
                  </div>
                  {selectedProfile.targetSectors && selectedProfile.targetSectors.length > 0 && (
                    <div className={profileCardClass}>
                      <p className={profileSectionTitleClass}>{t('targetSectors')}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedProfile.targetSectors.map((s) => (
                          <span key={s} className={profileNeutralPillClass}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedProfile.helpNewcomers?.trim() ? (
                    <div className={profileCardClass}>
                      <p className={profileSectionTitleClass}>{t('profileHelpNewcomersLabel')}</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
                        {selectedProfile.helpNewcomers}
                      </p>
                    </div>
                  ) : null}
                  {selectedProfile.networkGoal?.trim() ? (
                    <div className={profileCardClass}>
                      <p className={profileSectionTitleClass}>{t('profileNetworkGoalLabel')}</p>
                      <p className="mt-2 text-sm font-medium leading-relaxed text-stone-800">
                        {selectedProfile.networkGoal}
                      </p>
                    </div>
                  ) : null}
                </div>
                </div>

                <div className="space-y-5">
                  <div className={profileCardClass}>
                    <h3 className={profileSectionTitleClass}>{t('memberBio')}</h3>
                    {effectiveMemberBio(selectedProfile).trim() ? (
                      <AiTranslatedFreeText
                        lang={lang}
                        t={t}
                        text={effectiveMemberBio(selectedProfile)}
                        pretranslatedByLang={
                          selectedProfile.memberBio?.trim()
                            ? selectedProfile.memberBioTranslations
                            : selectedProfile.bioTranslations
                        }
                        className="mt-2 text-sm text-stone-600 leading-relaxed"
                        whitespace="pre-wrap"
                      />
                    ) : (
                      <p className="mt-2 text-sm text-stone-600 whitespace-pre-wrap">
                        {t('noCompanyDescription')}
                      </p>
                    )}
                  </div>

                  {normalizeProfileCompanyActivities(selectedProfile).some(
                    (slot) =>
                      displayActivityDescriptionForSlot(slot).trim() && slot.companyName.trim()
                  ) ? (
                    <div className={profileCardClass}>
                      <h3 className={profileSectionTitleClass}>{t('profileFormActivityDescriptionLabel')}</h3>
                      <div className="mt-3 space-y-4">
                        {normalizeProfileCompanyActivities(selectedProfile).map((slot) => {
                          const actText = displayActivityDescriptionForSlot(slot);
                          if (!actText.trim() || !slot.companyName.trim()) return null;
                          return (
                            <div key={slot.id}>
                              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                                {slot.companyName.trim()}
                              </p>
                              <AiTranslatedFreeText
                                lang={lang}
                                t={t}
                                text={actText}
                                className="mt-1 text-sm text-stone-600 leading-relaxed"
                                whitespace="pre-wrap"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  <div className={profileCardClass}>
                    <h3 className={profileSectionTitleClass}>{t('company')}</h3>
                    <div className="mt-2 space-y-2">
                      <div className="group flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-stone-400 ring-1 ring-slate-100 transition-colors group-hover:bg-slate-100">
                          <Building2 size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className={profileFieldLabelClass}>{t('creationYear')}</p>
                          <p className="text-sm font-medium text-stone-900">{selectedProfile.creationYear || '-'}</p>
                        </div>
                      </div>

                      <div className="group flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-stone-400 ring-1 ring-slate-100 transition-colors group-hover:bg-slate-100">
                          <Users size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className={profileFieldLabelClass}>{t('employeeCount')}</p>
                          <p className="text-sm font-medium text-stone-900">
                            {formatEmployeeCountDisplay(selectedProfile.employeeCount) || '-'}
                          </p>
                        </div>
                      </div>

                      <div className="group flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-stone-400 ring-1 ring-slate-100 transition-colors group-hover:bg-slate-100">
                          <Calendar size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className={profileFieldLabelClass}>{t('arrivalYear')}</p>
                          <p className="text-sm font-medium text-stone-900">
                            {selectedProfile.arrivalYear
                              ? `${selectedProfile.arrivalYear} (${new Date().getFullYear() - selectedProfile.arrivalYear} ans)`
                              : '-'}
                          </p>
                        </div>
                      </div>

                      <div className="group flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-stone-400 ring-1 ring-slate-100 transition-colors group-hover:bg-slate-100">
                          <Heart size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className={profileFieldLabelClass}>{t('passions')}</p>
                          {sanitizePassionIds(selectedProfile.passionIds).length > 0 ? (
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {sanitizePassionIds(selectedProfile.passionIds).map((id) => (
                                <span
                                  key={id}
                                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-800"
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

                  <div
                    className={cn(
                      profileCardClass,
                      'grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8'
                    )}
                  >
                  <div>
                      <h3 className={cn('mb-3', profileSectionTitleClass)}>{t('details')}</h3>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-x-8">
                        <div className="min-w-0 space-y-3">
                          <div className="group flex items-center gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-stone-400 transition-colors group-hover:bg-slate-100">
                              <MapPin size={18} />
                            </div>
                            <div className="min-w-0">
                              <p className={profileFieldLabelClass}>{t('city')}</p>
                              <p className="text-sm font-medium text-stone-900">{selectedProfile.city}</p>
                            </div>
                          </div>
                          <div className="group flex items-center gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-stone-400 transition-colors group-hover:bg-slate-100">
                              <MapPin size={18} />
                            </div>
                            <div className="min-w-0">
                              <p className={profileFieldLabelClass}>{t('neighborhood')}</p>
                              <p className="text-sm font-medium text-stone-900">{selectedProfile.neighborhood || '—'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="min-w-0 space-y-3">
                          <div className="group flex items-center gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-stone-400 transition-colors group-hover:bg-slate-100">
                              <MapPin size={18} />
                            </div>
                            <div className="min-w-0">
                              <p className={profileFieldLabelClass}>{t('state')}</p>
                              <p className="text-sm font-medium text-stone-900">{selectedProfile.state || 'Jalisco'}</p>
                            </div>
                          </div>
                          <div className="group flex items-center gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-stone-400 transition-colors group-hover:bg-slate-100">
                              <MapPin size={18} />
                            </div>
                            <div className="min-w-0">
                              <p className={profileFieldLabelClass}>{t('country')}</p>
                              <p className="text-sm font-medium text-stone-900">
                                {selectedProfile.country?.trim() ||
                                  pickLang('Mexique', 'México', 'Mexico', lang)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                  </div>

                  <div className="hidden border-t border-slate-200 pt-6 md:block md:border-t-0 md:border-l md:border-slate-200 md:pt-0 md:pl-8">
                      <h3 className={cn('mb-3', profileSectionTitleClass)}>
                        {pickLang('Contact', 'Contacto', 'Contact', lang)}
                      </h3>
                      <div className="space-y-2">
                        <ProfileCardEmailContact
                          email={selectedProfile.email}
                          canView={Boolean(
                            selectedProfile.isEmailPublic || (user && profile?.isValidated)
                          )}
                          t={t}
                          trackProfile={
                            user
                              ? {
                                  profileId: selectedProfile.uid,
                                  profileName:
                                    selectedProfile.fullName ||
                                    selectedProfile.companyName ||
                                    selectedProfile.uid,
                                }
                              : undefined
                          }
                        />
                        {selectedProfile.whatsapp ? (
                          <ProfileCardWhatsappContactFooter
                            whatsapp={selectedProfile.whatsapp}
                            canView={Boolean(
                              selectedProfile.isWhatsappPublic || (user && profile?.isValidated)
                            )}
                            t={t}
                            trackProfile={
                              user
                                ? {
                                    profileId: selectedProfile.uid,
                                    profileName:
                                      selectedProfile.fullName ||
                                      selectedProfile.companyName ||
                                      selectedProfile.uid,
                                  }
                                : undefined
                            }
                          />
                        ) : null}
                      </div>
                  </div>
                </div>
                </div>

                {viewerIsAdmin && (
                  <div
                    className={cn(profileCardClass, 'mt-6 border-l-4 border-l-amber-400')}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className={cn('mb-3', profileSectionTitleClass)}>{t('adminInternalDataTitle')}</p>
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

                {!guestDirectoryRestricted &&
                  !user &&
                  (!selectedProfile.isEmailPublic ||
                    (selectedProfile.whatsapp && !selectedProfile.isWhatsappPublic)) && (
                  <div
                    className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="mb-4 text-sm font-medium text-stone-800">{t('registerPrompt')}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProfile(null);
                        openAuthModal();
                      }}
                      disabled={authProviderBusy !== null || authEmailBusy}
                      className="w-full rounded-xl bg-blue-700 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {t('register')}
                    </button>
                  </div>
                )}
                </>
                )}
              </div>

              {selectedProfile &&
                !guestDirectoryRestricted &&
                (() => {
                  const p = selectedProfile;
                  const canEmail = Boolean(
                    p.email?.trim() &&
                      (p.isEmailPublic || (user && profile?.isValidated))
                  );
                  const canWhatsapp = Boolean(
                    p.whatsapp &&
                      (p.isWhatsappPublic || (user && profile?.isValidated))
                  );
                  if (!canEmail && !canWhatsapp) return null;
                  const mailto = p.email?.trim()
                    ? `mailto:${encodeURIComponent(p.email.trim())}`
                    : '#';
                  const waHref = p.whatsapp
                    ? `https://wa.me/${p.whatsapp.replace(/\D/g, '')}`
                    : '#';
                  return (
                    <div
                      role="region"
                      aria-label={t('contact')}
                      className="shrink-0 border-t border-slate-200 bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md supports-[backdrop-filter]:bg-white/90 md:hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <p className="mb-2 text-center text-[11px] font-medium uppercase tracking-wide text-slate-500">
                        {t('contact')}
                      </p>
                      <div className="flex gap-2">
                        {canEmail ? (
                          <a
                            href={mailto}
                            className="flex min-h-[44px] min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-700 px-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
                          >
                            <Mail className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                            <span className="truncate">{t('cardContactByEmail')}</span>
                          </a>
                        ) : null}
                        {canWhatsapp ? (
                          <a
                            href={waHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex min-h-[44px] min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              className="h-4 w-4 shrink-0"
                              fill="currentColor"
                              aria-hidden
                            >
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            <span className="truncate">{t('cardContactByWhatsapp')}</span>
                          </a>
                        ) : null}
                      </div>
                    </div>
                  );
                })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {selectedProfile ? (
        <ShareProfileModal
          open={isShareProfileModalOpen}
          onClose={() => setIsShareProfileModalOpen(false)}
          lang={lang}
          t={t}
          profile={selectedProfile}
        />
      ) : null}

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
                            <p className="text-xs text-stone-500">
                              {p.companyName} •{' '}
                              {(() => {
                                const cats = profileDistinctActivityCategories(p);
                                return cats.length
                                  ? cats.map((c) => activityCategoryLabel(c, lang)).join(' · ')
                                  : '—';
                              })()}
                            </p>
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
                            type="button"
                            onClick={() => {
                              setShowValidationPanel(false);
                              startEditing(p);
                            }}
                            className="flex-1 sm:flex-none px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-bold hover:bg-stone-800 transition-all"
                          >
                            {pickLang('Modifier', 'Editar', 'Edit', lang)}
                          </button>
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
                          <button 
                            onClick={() => handleValidateProfile(p.uid, false)}
                            className="flex-1 sm:flex-none px-4 py-2 bg-white text-red-700 rounded-lg text-xs font-bold border border-red-200 hover:bg-red-50 transition-all"
                          >
                            {pickLang('Annuler', 'Cancelar', 'Cancel', lang)}
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

      {/* Opportunités retirées du produit */}

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

      {/* Opportunités retirées du produit */}

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

      {/* Opportunités retirées du produit */}

        </>
      )}
      </div>

      <footer className="mt-auto border-t border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-4 text-xs text-stone-400 sm:flex-row">
          <span className="text-center sm:text-left">
            © {new Date().getFullYear()} {t('footerBrandCopyright')}
          </span>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-end">
            <Link
              to="/privacy"
              className="underline decoration-stone-400 underline-offset-2 transition-colors hover:text-stone-700"
            >
              {t('footerPrivacyPageLink')}
            </Link>
            <Link
              to="/terms"
              className="underline decoration-stone-400 underline-offset-2 transition-colors hover:text-stone-700"
            >
              {t('footerTermsPageLink')}
            </Link>
            <button
              type="button"
              onClick={() => setFooterContactOpen(true)}
              className="underline decoration-stone-400 underline-offset-2 transition-colors hover:text-stone-700"
            >
              {t('footerContact')}
            </button>
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

      <AnimatePresence>
        {showRsvpModal && publicEvent && (
          <div className="fixed inset-0 z-[230] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
              onClick={() => {
                if (!rsvpBusy) setShowRsvpModal(false);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 10 }}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-stone-900">
                    {pickLang('Participation à l’événement', 'Participación al evento', 'Event RSVP', lang)}
                  </h3>
                  <p className="mt-1 text-sm text-stone-600">
                    {pickLang('Souhaitez-vous participer à', '¿Quieres participar en', 'Do you want to attend', lang)}{' '}
                    <span className="font-semibold text-stone-900">{publicEvent.title}</span> ?
                  </p>
                  {String(publicEvent.organizerName ?? '').trim() ? (
                    <p className="mt-1 text-xs font-semibold text-stone-600">
                      {pickLang('Organisé par', 'Organizado por', 'Organized by', lang)}:{' '}
                      {String(publicEvent.organizerName ?? '').trim()}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!rsvpBusy) setShowRsvpModal(false);
                  }}
                  className="rounded-md p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                  aria-label={pickLang('Fermer', 'Cerrar', 'Close', lang)}
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>

              {rsvpError ? (
                <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
                  {rsvpError}
                </p>
              ) : null}

              <div className="mb-4 space-y-2">
                <p className="text-sm text-stone-700">
                  {(() => {
                    try {
                      const d = publicEvent.startsAt?.toDate?.();
                      const d2 = (publicEvent.endsAt as any)?.toDate?.();
                      const whenStart = d
                        ? d.toLocaleString(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-MX' : 'fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '';
                      let when = whenStart;
                      if (d && d2) {
                        const sameDay = d.getFullYear() === d2.getFullYear() && d.getMonth() === d2.getMonth() && d.getDate() === d2.getDate();
                        if (sameDay) {
                          const dateOnly = d.toLocaleDateString(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-MX' : 'fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: '2-digit',
                          });
                          const startTime = d.toLocaleTimeString(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-MX' : 'fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          });
                          const endTime = d2.toLocaleTimeString(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-MX' : 'fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          });
                          when = `${dateOnly} · ${startTime} – ${endTime}`;
                        } else {
                          const endFull = d2.toLocaleString(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-MX' : 'fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          });
                          when = `${whenStart} → ${endFull}`;
                        }
                      }
                      const where = String(publicEvent.address ?? '').trim();
                      return [when, where].filter(Boolean).join(' · ');
                    } catch {
                      return '';
                    }
                  })()}
                </p>
                {String(publicEvent.mapsUrl ?? '').trim() ? (
                  <a
                    href={String(publicEvent.mapsUrl ?? '').trim()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                  >
                    {pickLang('Ouvrir Google Maps', 'Abrir Google Maps', 'Open Google Maps', lang)}
                  </a>
                ) : null}
                {publicEvent.introText?.trim() ? (
                  <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                    <p className="whitespace-pre-wrap text-sm text-stone-700">{publicEvent.introText}</p>
                  </div>
                ) : null}
                {String(publicEvent.dressCode ?? '').trim() && String(publicEvent.dressCode ?? '') !== 'none_specified' ? (
                  <p className="text-xs text-stone-600">
                    <span className="font-semibold">{pickLang('Tenue :', 'Vestimenta:', 'Dress code:', lang)}</span>{' '}
                    {(() => {
                      const v = String(publicEvent.dressCode ?? '');
                      if (v === 'casual') return pickLang('Décontractée', 'Casual', 'Casual', lang);
                      if (v === 'smart_casual') return pickLang('Casual chic', 'Smart casual', 'Smart casual', lang);
                      if (v === 'business') return pickLang('Business', 'Business', 'Business', lang);
                      if (v === 'formal') return pickLang('Formelle', 'Formal', 'Formal', lang);
                      if (v === 'traditional') return pickLang('Traditionnelle', 'Tradicional', 'Traditional', lang);
                      return '';
                    })()}
                  </p>
                ) : null}
                {String(publicEvent.parking ?? '').trim() ? (
                  <p className="text-xs text-stone-600">
                    <span className="font-semibold">{pickLang('Stationnement :', 'Estacionamiento:', 'Parking:', lang)}</span>{' '}
                    {(() => {
                      const v = String(publicEvent.parking ?? '');
                      if (v === 'on_site') return pickLang('Parking sur place', 'Estacionamiento en sitio', 'On-site parking', lang);
                      if (v === 'secure_nearby')
                        return pickLang('Parking sécurisé proche', 'Estacionamiento seguro cercano', 'Secure parking nearby', lang);
                      if (v === 'valet') return pickLang('Voiturier', 'Valet parking', 'Valet service', lang);
                      return pickLang('Pas de solution identifiée', 'Sin solución identificada', 'No identified solution', lang);
                    })()}
                  </p>
                ) : null}
                <p className="text-xs text-stone-500">
                  {pickLang(
                    "Pour enregistrer « Je participe », il faut créer un compte et compléter votre profil (nom, email, WhatsApp/téléphone, société, poste, secteur).",
                    'Para registrar “Sí, participaré”, debes crear una cuenta y completar tu perfil (nombre, email, WhatsApp/teléfono, empresa, puesto, sector).',
                    'To save “Yes, I will attend”, you must create an account and complete your profile (name, email, WhatsApp/phone, company, position, industry).',
                    lang
                  )}
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => void submitRsvp('present')}
                  disabled={rsvpBusy}
                  className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pickLang('Je participe', 'Sí, participaré', 'Yes, I will attend', lang)}
                </button>
                <button
                  type="button"
                  onClick={() => void submitRsvp('declined')}
                  disabled={rsvpBusy}
                  className="rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pickLang('Je ne pourrai pas', 'No podré asistir', "No, I can't attend", lang)}
                </button>
              </div>
              <p className="mt-3 text-xs text-stone-500">
                {pickLang(
                  'Votre réponse sera visible uniquement par les administrateurs.',
                  'Tu respuesta será visible solo para administradores.',
                  'Your response is visible to admins only.',
                  lang
                )}
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Opportunités retirées du produit */}

      <LegalInfoModal
        open={footerLegalModal !== null}
        onClose={() => setFooterLegalModal(null)}
        title={
          footerLegalModal === 'terms' ? t('legalTermsTitle') : t('legalPrivacyTitle')
        }
        closeLabel={t('footerLegalClose')}
        paragraphs={
          footerLegalModal === 'terms'
            ? LEGAL_TERMS_PARAGRAPHS[lang]
            : LEGAL_PRIVACY_PARAGRAPHS[lang]
        }
      />
      <ContactFooterModal open={footerContactOpen} onClose={() => setFooterContactOpen(false)} t={t} />
    </div>
  );
};

const App = () => {
  return (
    <HelmetProvider>
      <LanguageProvider>
        <BrowserRouter>
          <SpaRouteAnalytics />
          <Routes>
            <Route path="/" element={<MainApp />} />
            <Route path="/inscription" element={<MainApp />} />
            <Route path="/rejoindre" element={<MainApp />} />
            <Route path="/join" element={<MainApp />} />
            <Route path="/membres" element={<MainApp />} />
            <Route path="/network" element={<MainApp />} />
            <Route path="/requests" element={<MainApp />} />
            <Route path="/radar" element={<MainApp initialViewMode="radar" />} />
            <Route path="/admin" element={<MainApp />} />
            <Route path="/requests/:id" element={<RequestsRedirect />} />
            <Route path="/network/member/:slug" element={<MemberRedirect />} />
            <Route path="/onboarding" element={<MainApp />} />
            <Route path="/profile/edit" element={<MainApp />} />
            <Route path="/confidentialite" element={<MainApp />} />
            <Route path="/privacy" element={<MainApp />} />
            <Route
              path="/legal/privacy"
              element={
                <LegalPageWrapper mode="privacy" />
              }
            />
            <Route path="/conditions" element={<MainApp />} />
            <Route path="/terms" element={<MainApp />} />
            <Route path="/terms-of-service" element={<MainApp />} />
            <Route
              path="/legal/terms"
              element={
                <LegalPageWrapper mode="terms" />
              }
            />
            <Route path="/dashboard" element={<MainApp initialViewMode="dashboard" />} />
            <Route path="/evenements" element={<MainApp initialViewMode="dashboard" />} />
            <Route path="/e/:slug" element={<MainApp />} />
            <Route path="/profil/:profileId" element={<ProfilePage />} />
            <Route path="/besoin/:needId" element={<NeedPage />} />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </HelmetProvider>
  );
};

export default App;

function LegalPageWrapper({ mode }: { mode: 'privacy' | 'terms' }) {
  const { lang, t } = useLanguage();
  return <LegalPage lang={lang} t={t} mode={mode} />;
}

function MemberRedirect() {
  const { slug } = useParams();
  const to = slug ? `/profil/${encodeURIComponent(String(slug))}` : '/network';
  return <Navigate to={to} replace />;
}

function RequestsRedirect() {
  const { id } = useParams();
  const to = id ? `/besoin/${encodeURIComponent(String(id))}` : '/requests';
  return <Navigate to={to} replace />;
}
