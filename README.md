<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/b6e23c83-eceb-4cf9-848f-8e11b8db6eb8

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Authentication (Firebase)

The app supports **Google**, **Microsoft**, and **Apple** sign-in. In [Firebase Console](https://console.firebase.google.com/) → **Authentication** → **Sign-in method**, enable each provider you need:

- **Google** — usually enabled by default.
- **Microsoft** — enable *Microsoft*, then follow the prompt to register the app in Microsoft Entra ID (Azure AD) and paste the Application ID / secret if required.
- **Apple** — enable *Apple*; for production you need an Apple Developer account, a Services ID, and (for web) **Sign in with Apple** configured for your domain. Local testing may be limited without HTTPS and Apple configuration.

Also add your deployment domain under **Authentication** → **Settings** → **Authorized domains**.

### OAuth leads (`auth_leads` in Firestore)

On each successful sign-in, the client upserts a document `auth_leads/{uid}` (email, display name, main provider, first/last connection). This is **separate** from the directory profile `users/{uid}`. Only **admins** can read this collection (see `firestore.rules`). After changing rules, deploy them to your Firebase project (`firebase deploy --only firestore:rules` or the Console). Admins open **Connexions OAuth (sans fiche)** from the header to copy emails for follow-up. **Apple** may supply a private relay address or no email on first sign-in — Firebase Auth remains the source of truth.

## Design system (`src/design-system.tsx`)

Reusable UI primitives aligned with a minimal palette: **slate** neutrals, **blue-700** primary CTA, **emerald** / **amber** accents. **Inter** is loaded in `src/index.css`.

- Components: `Button`, `Heading`, `BodyText`, `Tag`, `Card`, `MemberCard`, `OpportunityCard`, `SearchInput`, `SectorSelect`.
- `DirectoryExampleSection` is a static demo layout for reference; import it only if you need a playground page.

The global shell uses `bg-slate-50` / `text-slate-900` on `body` and the main `MainApp` wrapper. The rest of the app still uses many `stone-*` utility classes; migrate sections gradually or compose new features with the design-system components.
