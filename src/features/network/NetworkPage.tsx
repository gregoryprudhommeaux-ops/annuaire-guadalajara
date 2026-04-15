import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageProvider';
import {
  NetworkSidebar,
  type NetworkOption,
  type NetworkSidebarLaunchProgress,
} from './components/NetworkSidebar';
import { MemberCard } from './components/MemberCard';
import { RecommendedMembersSection } from './components/RecommendedMembersSection';
import type { CompatibilityMember } from './utils/memberCompatibility';
import './network.css';

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

type SortMode = 'recent' | 'alphabetical' | 'default';

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
  /** Si renseignés, affiche le bloc recommandations heuristiques au-dessus du titre annuaire. */
  recommendedCurrentUser?: CompatibilityMember | null;
  recommendedMembers?: CompatibilityMember[];
  sectorOptions?: NetworkOption[];
  profileOptions?: NetworkOption[];
  locationOptions?: NetworkOption[];
  launchProgress?: NetworkSidebarLaunchProgress;
};

export function NetworkPage({
  members,
  recommendedCurrentUser = null,
  recommendedMembers,
  sectorOptions = DEFAULT_SECTOR_OPTIONS,
  profileOptions = DEFAULT_PROFILE_OPTIONS,
  locationOptions = DEFAULT_LOCATION_OPTIONS,
  launchProgress = null,
}: NetworkPageProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const memberGridRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('all');
  const [selectedProfile, setSelectedProfile] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [sortBy, setSortBy] = useState<SortMode>('recent');

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
        sectorOptions={sectorOptions}
        profileOptions={profileOptions}
        locationOptions={locationOptions}
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
        {recommendedCurrentUser && recommendedMembers && recommendedMembers.length > 0 ? (
          <RecommendedMembersSection
            currentUser={recommendedCurrentUser}
            members={recommendedMembers}
          />
        ) : null}

        <header className="network-directory-header">
          <h1>{t('membersPageTitle')}</h1>
          <p>{t('membersPageSubtitle')}</p>
        </header>

        <div className="network-sort-panel">
          <label htmlFor="sort-members">{t('membersSortLabel')}</label>
          <select
            id="sort-members"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortMode)}
            className="network-select"
          >
            <option value="recent">{t('membersSortOptionRecent')}</option>
            <option value="alphabetical">{t('membersSortOptionAlphabetical')}</option>
            <option value="default">{t('membersSortOptionDefault')}</option>
          </select>
        </div>

        <div ref={memberGridRef} className="member-grid">
          {filteredMembers.map((member) => (
            <MemberCard
              key={member.profileUid}
              profileUid={member.profileUid}
              fullName={member.fullName}
              companyName={member.companyName}
              sector={member.sector}
              bio={member.bio}
              photoUrl={member.photoUrl}
              needs={member.needs}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
