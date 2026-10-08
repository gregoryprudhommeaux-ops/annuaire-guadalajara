import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getApps } from 'firebase-admin/app';
import { randomBytes } from 'crypto';
import { FIRESTORE_DATABASE_ID } from '../constants';
import { APP_URL_PARAM, RESEND_FROM_PARAM, getResend } from '../lib/resend';
import { canonicalizeCity } from '../lib/canonicalizeCity';

type Lang = 'fr' | 'en' | 'es';

function json(res: { setHeader: (k: string, v: string) => void; status: (c: number) => { send: (b: string) => void } }, code: number, payload: unknown) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(code).send(JSON.stringify(payload));
}

function clip(value: unknown, max: number): string {
  return String(value ?? '').trim().slice(0, max);
}

function asLang(value: unknown): Lang {
  return value === 'en' || value === 'es' || value === 'fr' ? value : 'fr';
}

function yearsToArrivalYear(raw: string): number | undefined {
  const t = raw.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(t)) return undefined;
  const years = Math.floor(Number(t));
  if (!Number.isFinite(years) || years < 0 || years > 120) return undefined;
  return new Date().getFullYear() - years;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function emailCopy(lang: Lang, name: string, link: string, setPassword: boolean): { subject: string; text: string; html: string } {
  const safeName = escapeHtml(name);
  const safeLink = escapeHtml(link);
  const greeting =
    lang === 'es' ? `Hola ${safeName},` : lang === 'en' ? `Hello ${safeName},` : `Bonjour ${safeName},`;
  const subject =
    lang === 'es'
      ? 'Tu perfil quedó registrado en el directorio FrancoNetwork'
      : lang === 'en'
        ? 'Your profile is saved in the FrancoNetwork directory'
        : 'Votre profil est bien enregistré dans l’annuaire FrancoNetwork';
  const thanks =
    lang === 'es'
      ? 'Gracias por responder el cuestionario. Tu perfil quedó registrado en el directorio.'
      : lang === 'en'
        ? 'Thank you for answering the questionnaire. Your profile is saved in the directory.'
        : 'Merci d’avoir répondu au questionnaire. Votre profil est bien enregistré dans l’annuaire.';
  const next = setPassword
    ? lang === 'es'
      ? 'Puedes completarlo para sacarle más partido a la herramienta. Entra aquí para crear una contraseña y volver a tu ficha :'
      : lang === 'en'
        ? 'You can complete it to get more out of the tool. Sign in here to create a password and get back to your profile:'
        : 'Vous pouvez le compléter pour tirer un meilleur parti de l’outil. Connectez-vous ici pour créer un mot de passe et retrouver votre fiche :'
    : lang === 'es'
      ? 'Puedes completarlo para sacarle más partido a la herramienta. Entra aquí para volver a tu ficha :'
      : lang === 'en'
        ? 'You can complete it to get more out of the tool. Sign in here to get back to your profile:'
        : 'Vous pouvez le compléter pour tirer un meilleur parti de l’outil. Connectez-vous ici pour retrouver votre fiche :';
  const cta =
    lang === 'es' ? 'Crear mi contraseña y entrar' : lang === 'en' ? 'Create my password and sign in' : 'Créer mon mot de passe et me connecter';
  const ctaSignIn = lang === 'es' ? 'Entrar en FrancoNetwork' : lang === 'en' ? 'Sign in to FrancoNetwork' : 'Me connecter à FrancoNetwork';
  const buttonLabel = setPassword ? cta : ctaSignIn;
  const text = `${greeting.replace(/<[^>]+>/g, '')}\n\n${thanks}\n\n${next}\n${link}\n\nFrancoNetwork`;
  const html = `<!DOCTYPE html><html><body style="margin:0;padding:24px;background:#f7f5f0;color:#1f1d18;font-family:Georgia,serif;">
<div style="max-width:560px;margin:0 auto;background:#fcfbf8;border:1px solid #ddd7cd;border-radius:16px;padding:28px;">
<p style="margin:0 0 16px;font-size:16px;line-height:1.5;">${greeting}</p>
<p style="margin:0 0 12px;font-size:16px;line-height:1.5;">${thanks}</p>
<p style="margin:0 0 20px;font-size:16px;line-height:1.5;">${next}</p>
<p style="margin:0 0 20px;"><a href="${safeLink}" style="display:inline-block;background:#1f5f5b;color:#ffffff;text-decoration:none;border-radius:14px;padding:12px 18px;font-family:sans-serif;font-size:14px;">${buttonLabel}</a></p>
<p style="margin:0;font-size:13px;line-height:1.5;color:#6f6a61;"><a href="${safeLink}" style="color:#1f5f5b;">${safeLink}</a></p>
<p style="margin:24px 0 0;font-size:14px;">FrancoNetwork</p>
</div></body></html>`;
  return { subject, text: text.replace(safeName, name), html };
}

async function findAuthUser(email: string) {
  try {
    return await getAuth().getUserByEmail(email);
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === 'auth/user-not-found') return null;
    throw err;
  }
}

export const expressOnboarding = onRequest(
  {
    region: 'us-central1',
    cors: true,
    invoker: 'public',
    timeoutSeconds: 60,
    memory: '256MiB',
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      json(res, 405, { ok: false, code: 'method' });
      return;
    }

    try {
      const body = (req.body ?? {}) as Record<string, unknown>;
      if (clip(body.companyWebsite, 200)) {
        json(res, 200, { ok: true, created: true, emailSent: true });
        return;
      }

      const fullName = clip(body.fullName, 120);
      const email = clip(body.email, 320).toLowerCase();
      const whatsapp = clip(body.whatsapp, 40);
      const mexicoSince = clip(body.mexicoSince, 80);
      const nationality = clip(body.nationality, 3).toUpperCase();
      const city = canonicalizeCity(clip(body.city, 80));
      const companyName = clip(body.companyName, 160) || 'N/A';
      const lookingFor = clip(body.lookingFor, 2000);
      const communityGap = clip(body.communityGap, 2000);
      const lang = asLang(body.lang);

      if (!fullName || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        json(res, 400, { ok: false, code: 'invalid' });
        return;
      }
      if (!whatsapp || !city || !/^[A-Z]{2,3}$/.test(nationality)) {
        json(res, 400, { ok: false, code: 'invalid' });
        return;
      }

      let callerUid: string | null = null;
      const header = String(req.headers.authorization ?? '');
      if (header.toLowerCase().startsWith('bearer ')) {
        const decoded = await getAuth().verifyIdToken(header.slice(7).trim());
        callerUid = decoded.uid;
      }

      const auth = getAuth();
      let user = callerUid ? await auth.getUser(callerUid) : await findAuthUser(email);
      const accountEmail = (user?.email || email).trim().toLowerCase();
      if (callerUid && accountEmail !== email) {
        json(res, 400, { ok: false, code: 'email_mismatch' });
        return;
      }

      let createdAuth = false;
      if (!user) {
        try {
          user = await auth.createUser({
            email,
            password: randomBytes(24).toString('base64url'),
            displayName: fullName.slice(0, 80),
            emailVerified: false,
          });
          createdAuth = true;
        } catch (err) {
          const code = (err as { code?: string }).code;
          if (code !== 'auth/email-already-exists') throw err;
          user = await findAuthUser(email);
          if (!user) throw err;
        }
      }

      const uid = user.uid;
      const db = getFirestore(getApps()[0]!, FIRESTORE_DATABASE_ID);
      const userRef = db.doc(`users/${uid}`);
      const snap = await userRef.get();
      if (snap.exists && !callerUid) {
        json(res, 409, { ok: false, code: 'already_exists' });
        return;
      }

      const arrivalYear = yearsToArrivalYear(mexicoSince);
      const existingActivities = snap.exists ? snap.get('companyActivities') : undefined;
      const companyActivities = Array.isArray(existingActivities) && existingActivities.length > 0
        ? existingActivities.map((slot, index) =>
            index === 0 && slot && typeof slot === 'object'
              ? { ...(slot as Record<string, unknown>), companyName, city }
              : slot
          )
        : [
            {
              id: `act_${randomBytes(6).toString('hex')}`,
              companyName,
              city,
              website: '',
              state: '',
              neighborhood: '',
              country: '',
              positionCategory: '',
              employeeCount: '',
            },
          ];

      const payload: Record<string, unknown> = {
        uid,
        fullName,
        companyName,
        email: accountEmail,
        city,
        whatsapp,
        lookingFor,
        networkGoal: lookingFor,
        communityGap,
        // Legacy mirror: older UI/admin still read helpNewcomers for express gap quotes.
        helpNewcomers: communityGap,
        mexicoArrivalNote: mexicoSince,
        companyActivities,
        communicationLanguage: lang,
        lastSeen: Date.now(),
      };
      if (arrivalYear !== undefined) payload.arrivalYear = arrivalYear;

      const createdProfile = !snap.exists;
      if (createdProfile) {
        payload.role = 'user';
        payload.createdAt = FieldValue.serverTimestamp();
        payload.isValidated = false;
        payload.needsAdminReview = true;
        payload.onboardingSource = 'express';
        payload.welcomeEmailSentAt = FieldValue.serverTimestamp();
      }

      await userRef.set(payload, { merge: true });
      await db.doc(`user_admin_private/${uid}`).set(
        {
          uid,
          nationality,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      let emailSent = false;
      if (createdProfile) {
        const appUrl = APP_URL_PARAM.value().replace(/\/$/, '');
        const hasPassword = user.providerData.some((provider) => provider.providerId === 'password');
        const setPassword = createdAuth || !hasPassword;
        let link = `${appUrl}/`;
        if (setPassword) {
          try {
            link = await auth.generatePasswordResetLink(accountEmail, {
              url: `${appUrl}/`,
              handleCodeInApp: false,
            });
          } catch (err) {
            logger.error('Lien mot de passe express indisponible', { err, uid });
          }
        }
        try {
          const copy = emailCopy(lang, fullName.split(/\s+/)[0] || fullName, link, setPassword);
          const sent = await getResend().emails.send({
            from: RESEND_FROM_PARAM.value(),
            to: accountEmail,
            subject: copy.subject,
            html: copy.html,
            text: copy.text,
            tags: [{ name: 'category', value: 'express_onboarding' }],
          });
          if (sent.error) throw new Error(sent.error.message);
          emailSent = true;
        } catch (err) {
          logger.error('Email express non envoyé', { err, uid });
        }
      }

      json(res, 200, { ok: true, created: createdProfile, emailSent });
    } catch (err) {
      logger.error('expressOnboarding failed', { err });
      json(res, 500, { ok: false, code: 'error' });
    }
  }
);
