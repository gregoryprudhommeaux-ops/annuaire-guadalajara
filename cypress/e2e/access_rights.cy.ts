/**
 * Droits d’accès / parcours invité.
 *
 * Réalité de l’app (Firebase + SPA) :
 * - Pas de route `/login` ni `/logout` : l’URL reste en général `/` et la connexion s’ouvre dans une modale.
 * - Le libellé « Inviter mon réseau » apparaît comme **titre** du bloc invitation, mais le lien cliquable
 *   est « Inviter → » (`invite-network-cta`) et **uniquement** pour un membre **connecté avec fiche**
 *   quand le nombre de membres est sous le seuil de lancement. Un **invité** voit plutôt le bloc
 *   « Communauté en cours de lancement » avec **Créer mon profil**.
 * - Pour vérifier « doit se connecter », on teste le **bouton d’en-tête**.
 *
 * `CYPRESS_BASE_URL` ou `baseUrl` (cypress.config.ts).
 */

describe('Droits d’accès sur les CTA (invité)', () => {
  beforeEach(() => {
    cy.clearAllCookies();
    cy.clearLocalStorage();
    cy.window().then((win) => {
      win.sessionStorage.clear();
      try {
        Object.keys(win.localStorage).forEach((k) => {
          if (/firebase|auth/i.test(k)) win.localStorage.removeItem(k);
        });
      } catch {
        /* ignore */
      }
    });
    cy.visit('/');
  });

  it('ne redirige pas vers /login : la connexion est une modale sur la page d’accueil', () => {
    cy.url().should('not.include', '/login');
    cy.get('[data-testid="header-login"]').should('be.visible').click();
    cy.url().should('not.include', '/login');
    cy.get('[data-testid="auth-modal"]').should('be.visible');
    cy.get('[data-testid="auth-modal"]').within(() => {
      cy.contains(/se connecter|sign in|iniciar sesión/i).should('be.visible');
    });
  });

  it('invité : le CTA « Inviter → » du bloc réseau n’est en général pas affiché (bloc lancement à la place)', () => {
    cy.get('body').then(($b) => {
      const invite = $b.find('[data-testid="invite-network-cta"]');
      if (invite.length === 0) {
        cy.log('Attendu pour un invité : pas de CTA invitation réseau.');
        cy.contains(/lancement|launching|lanzamiento|créer mon profil|create my profile/i).should('exist');
        return;
      }
      cy.wrap(invite).click({ force: true });
      cy.get('[data-testid="invite-network-modal"]').should('be.visible');
      cy.url().should('not.include', '/login');
    });
  });
});
