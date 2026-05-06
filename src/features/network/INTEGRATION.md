# Intégration Option B — FrancoNetwork `/network`

## Fichiers

| Fichier | Rôle |
|--------|------|
| `components/ResultsToolbar.tsx` | Barre compacte : compteur, zone lieu (slot), tri stylé, favoris |
| `results-toolbar.css` | Styles (importés par le composant) |
| `INTEGRATION.md` | Ce guide |

Le parent de page doit inclure la classe **`fn-network-page`** pour les tokens (`--fn-surface-2`, etc.).

---

## Étape 1 — Importer le composant

```tsx
import { ResultsToolbar } from '@/features/network/components/ResultsToolbar';
```

Les styles sont chargés automatiquement avec le composant (`results-toolbar.css`).

---

## Étape 2 — États typiques

```tsx
const [sortOrder, setSortOrder] = useState<NetworkSortMode>('recent');
const [showSaved, setShowSaved] = useState(false);
const savedCount = savedContacts?.length ?? 0;
```

Pour l’app principale, le filtre « ville » utilise le triplet pays / état / ville (`GeoCitySelector` + index géographique), pas une simple chaîne `cityFilter`.

---

## Étape 3 — Remplacer tri + favoris (+ champ ville si présent)

Au lieu de `SortPanel` + `SortSelect` + `SavedMembersPanel` (et au lieu d’un champ ville isolé), utiliser :

```tsx
<ResultsToolbar
  totalCount={filteredMembers.length}
  locationSlot={
    <>
      {/* Optionnel : GeoCitySelector + bouton « Revenir à… » */}
    </>
  }
  sortValue={sortOrder}
  onSortChange={setSortOrder}
  savedCount={savedCount}
  savedActive={showSaved}
  onToggleSaved={() => setShowSaved((v) => !v)}
  savedTitle={t('network.savedPanel.title')}
  savedDescription={t('network.savedPanel.description')}
/>
```

Sans filtre lieu dans la barre : omettre `locationSlot`.

---

## Étape 4 — Données

Exemple minimal de filtre / tri (story ou démo) :

```tsx
const filteredMembers = members
  .filter((m) => !cityFilter || m.city?.toLowerCase() === cityFilter)
  .sort((a, b) => {
    if (sortOrder === 'alphabetical') return a.name.localeCompare(b.name);
    if (sortOrder === 'recent') return new Date(b.createdAt) - new Date(a.createdAt);
    return 0;
  });
```

Dans **MainApp** (`App.tsx`), la ligne `/network` branche `ResultsToolbar` sur `networkMembersListForGrid`, `membersSortMode`, géolocalisation annuaire et contacts sauvegardés existants.

---

## Rendu visuel

- **Avant** : combobox ville + libellé « Trier par » + `<select>` natif + grand panneau favoris.
- **Après** : une carte unique fond `surface-2`, compteur `{n} résultats`, selects avec icônes, bouton signet + badge.
