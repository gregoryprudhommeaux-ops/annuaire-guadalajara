# Export Vitrine → Google Slides

## Objectif
Générer un deck Google Slides (puis export PDF depuis Google Slides) pour la page `/stats`.

## Cloud Function
- **Nom**: `exportStatsToSlides` (callable)
- **Accès**: admins uniquement (même logique que les autres callables)
- **Résultat**: `{ ok, presentationId, url }`

## Paramètres Functions
Configurer via `firebase functions:config:set` ou `firebase functions:params:set` (selon votre setup).

- **`GOOGLE_SLIDES_TEMPLATE_ID`** (optionnel)
  - Si défini: la function **duplique** ce deck et remplace les placeholders.
  - Si vide: la function **crée** un deck “par défaut” (mise en page basique) et remplace les placeholders.
- **`GOOGLE_SLIDES_EXPORT_FOLDER_ID`** (optionnel)
  - Si défini: le deck dupliqué est créé dans ce dossier Drive.

## Placeholders attendus (si vous utilisez un template)
- Texte:
  - `{{TITLE}}`
  - `{{SUBTITLE}}`
  - `{{KPI_MEMBERS}}`
  - `{{KPI_NEW_30D}}`
  - `{{KPI_VIEWS}}`
  - `{{KPI_CLICKS}}`
- Graphes (shapes remplacées par des images):
  - `{{CHART_SECTORS}}`
  - `{{CHART_GROWTH}}`
  - `{{CHART_NEEDS}}`

## Partage Drive (compte de service)
La function utilise les credentials du **compte de service** Firebase.

Si vous utilisez un template et/ou un dossier Drive:
- Partager le deck template (et le dossier de destination) avec l’email du compte de service.
- Donner au minimum le droit **Éditeur**.

