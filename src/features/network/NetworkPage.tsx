import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageProvider';
import { activityCategoryLabel } from '@/constants';
import type { Language } from '@/types';
import {
  NetworkSidebar,
  type NetworkOption,
  type NetworkSidebarLaunchProgress,
} from './components/NetworkSidebar';
import { NetworkToolbar } from './components/NetworkToolbar';
import { SortPanel } from './components/SortPanel';
import { SortSelect, type NetworkSortMode } from './components/SortSelect';
import { SavedMembersPanel } from './components/SavedMembersPanel';
import { MemberCard } from './components/MemberCard';
import { RecommendedMembersSection } from './components/RecommendedMembersSection';
import type { UserProfile } from '@/types';
import { useCurrentCompatibilityMember } from './hooks/useCurrentCompatibilityMember';
import { mapGridDirectoryMemberToRecommendedCompatibilityMember } from './utils/mapGridDirectoryMemberToRecommendedCompatibilityMember';
import {
  loadRecommendationPrefs,
  subscribeRecommendationPrefs,
} from './utils/recommendationPreferences';
import './network.css';
import './network-recommendations.css';

export type DirectoryMember = {
  /** UID Firestore — requis pour liens `/profil/:uid` et clés stables. */
  profileUid: string;
  /** Optionnel (SEO, anciennes URLs) ; ne pas utiliser seul pour `/profil/`. */
  slug?: string;
  fullName: string;
  companyName?: string;
  sector?: string;
  bio?: string;
  photoUrl?: string;
  needs?: string[];
  /** Pour le tri « récents » (timestamp ms). */
  sortTimestamp?: number;
  /** Valeur alignée sur `locationOptions` (ex. `guadalajara`). */
  locationKey?: string;
  /** Filtre type de profil : `company` | `member`. */
  profileKind?: 'company' | 'member';
};

const DEFAULT_SECTOR_OPTIONS: NetworkOption[] = [
  { label: 'Secteur', value: 'all' },
  { label: 'Agriculture & Agroalimentaire', value: 'Agriculture & Agroalimentaire' },
  {
    label: 'Conseil & Services aux entreprises',
    value: 'Conseil & Services aux entreprises',
  },
  { label: 'Industrie & Manufacturier', value: 'Industrie & Manufacturier' },
  { label: 'Technologies & Informatique', value: 'Technologies & Informatique' },
];

const DEFAULT_PROFILE_OPTIONS: NetworkOption[] = [
  { label: 'Profil', value: 'all' },
  { label: 'Entreprise', value: 'company' },
  { label: 'Membre', value: 'member' },
];

const DEFAULT_LOCATION_OPTIONS: NetworkOption[] = [
  { label: 'Lieux', value: 'all' },
  { label: 'Guadalajara', value: 'guadalajara' },
  { label: 'Zapopan', value: 'zapopan' },
  { label: 'Autre', value: 'other' },
];

export type NetworkPageProps = {
  members: DirectoryMember[];
  /** Même source que le profil session / édition (`MainApp` state `profile`) — pour recommandations. */
  profile?: UserProfile | null;
  sectorOptions?: NetworkOption[];
  profileOptions?: NetworkOption[];
  locationOptions?: NetworkOption[];
  launchProgress?: NetworkSidebarLaunchProgress;
};

export function NetworkPage({
  members,
  profile = null,
  sectorOptions = DEFAULT_SECTOR_OPTIONS,
  profileOptions = DEFAULT_PROFILE_OPTIONS,
  locationOptions = DEFAULT_LOCATION_OPTIONS,
  launchProgress = null,
}: NetworkPageProps) {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const memberGridRef = useRef<HTMLDivElement>(null);

  const resolvedSectorOptions = useMemo(
    () =>
      sectorOptions.map((o) =>
        o.value === 'all'
          ? { ...o, label: t('network.filters.sectorAll') }
          : { ...o, label: activityCategoryLabel(o.value, lang as Language) }
      ),
    [sectorOptions, lang, t]
  );

  const resolvedProfileOptions = useMemo(
    () =>
      profileOptions.map((o) => {
        if (o.value === 'all') return { ...o, label: t('network.filters.profileAll') };
        if (o.value === 'company') return { ...o, label: t('network.filters.company') };
        if (o.value === 'member') return { ...o, label: t('network.filters.member') };
        return o;
      }),
    [profileOptions, t]
  );

  const resolvedLocationOptions = useMemo(
    () =>
      locationOptions.map((o) => {
        if (o.value === 'all') return { ...o, label: t('network.filters.locationAll') };
        if (o.value === 'other') return { ...o, label: t('network.filters.other') };
        return o;
      }),
    [locationOptions, t]
  );

  const currentUser = useCurrentCompatibilityMember({ profile });
  const viewerUid = (profile?.uid ?? '').trim();

  const savedUidsKey = useSyncExternalStore(
    subscribeRecommendationPrefs,
    () => loadRecommendationPrefs(viewerUid).savedUids.slice().sort().join('|'),
    () => ''
  );

  const savedUidsSet = useMemo(
    () => new Set(savedUidsKey.split('|').filter(Boolean)),
    [savedUidsKey]
  );
  const savedCount = savedUidsSet.size;

  const compatibleMembers = useMemo(
    () => members.map(mapGridDirectoryMemberToRecommendedCompatibilityMember),
    [members]
  );

  const [query, setQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('all');
  const [selectedProfile, setSelectedProfile] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [sortBy, setSortBy] = useState<NetworkSortMode>('recent');
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  useEffect(() => {
    if (savedCount === 0) setShowSavedOnly(false);
  }, [savedCount]);

  const filteredMembers = useMemo(() => {
    let result = [...members];

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter((member) => {
        return (
          member.fullName?.toLowerCase().includes(q) ||
          member.companyName?.toLowerCase().includes(q) ||
          member.bio?.toLowerCase().includes(q) ||
          member.needs?.some((need) => need.toLowerCase().includes(q))
        );
      });
    }

    if (selectedSector !== 'all') {
      result = result.filter((member) => member.sector === selectedSector);
    }

    if (selectedProfile !== 'all') {
      result = result.filter(
        (member) => (member.profileKind ?? 'member') === selectedProfile
      );
    }

    if (selectedLocation !== 'all') {
      result = result.filter(
        (member) =>
          member.locationKey != null && member.locationKey === selectedLocation
      );
    }

    if (sortBy === 'alphabetical') {
      result.sort((a, b) => a.fullName.localeCompare(b.fullName, undefined, { sensitivity: 'base' }));
    } else if (sortBy === 'recent') {
      result.sort((a, b) => (b.sortTimestamp ?? 0) - (a.sortTimestamp ?? 0));
    }

    return result;
  }, [members, query, selectedSector, selectedProfile, selectedLocation, sortBy]);

  const displayedMembers = useMemo(() => {
    if (!showSavedOnly) return filteredMembers;
    return filteredMembers.filter((m) => savedUidsSet.has(m.profileUid));
  }, [filteredMembers, showSavedOnly, savedUidsSet]);

  const openSavedMembersView = useCallback(() => {
    if (savedCount === 0) return;
    setShowSavedOnly((prev) => !prev);
    window.requestAnimationFrame(() => {
      memberGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [savedCount]);

  const handleSuggestContact = () => {
    if (!filteredMembers.length) return;
    const randomMember = filteredMembers[Math.floor(Math.random() * filteredMembers.length)];
    navigate(`/profil/${encodeURIComponent(randomMember.profileUid)}`);
  };

  const scrollToResults = () => {
    memberGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="fn-network-page network-layout">
      <NetworkSidebar
        query={query}
        onQueryChange={setQuery}
        onSubmitSearch={scrollToResults}
        sectorOptions={resolvedSectorOptions}
        profileOptions={resolvedProfileOptions}
        locationOptions={resolvedLocationOptions}
        selectedSector={selectedSector}
        selectedProfile={selectedProfile}
        selectedLocation={selectedLocation}
        onSectorChange={setSelectedSector}
        onProfileChange={setSelectedProfile}
        onLocationChange={setSelectedLocation}
        onSuggestContact={handleSuggestContact}
        suggestContactDisabled={filteredMembers.length === 0}
        launchProgress={launchProgress}
      />

      <section className="network-main">
        {currentUser && compatibleMembers.length > 0 ? (
          <RecommendedMembersSection currentUser={currentUser} members={compatibleMembers} />
        ) : null}

        <header className="network-directory-header">
          <h1>{t('membersPageTitle')}</h1>
          <p>{t('membersPageSubtitle')}</p>
        </header>

        <NetworkToolbar>
          <SortPanel title={t('membersSortLabel')}>
            <SortSelect value={sortBy} onChange={setSortBy} />
          </SortPanel>
          <SavedMembersPanel
            title={t('network.savedPanel.title')}
            count={savedCount}
            description={t('network.savedPanel.description')}
            onClick={openSavedMembersView}
            active={showSavedOnly}
          />
        </NetworkToolbar>

        <div ref={memberGridRef} className="member-grid">
          {displayedMembers.map((member) => (
            <MemberCard
              key={member.profileUid}
              profileUid={member.profileUid}
              fullName={member.fullName}
              companyName={member.companyName}
              sector={member.sector}
              bio={member.bio}
              photoUrl={member.photoUrl}
              needs={member.needs}
              viewerProfile={profile}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
