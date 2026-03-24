/**
 * CTA E2E — comportement réel de l’app :
 * - Pas de routes dédiées `/invitation` ni `/opportunite` : tout passe par des modales sur `/`.
 * - Invitation : message prérempli + WhatsApp / e-mail / copier (pas de champ `email` ni `<form>` HTML).
 * - Opportunité (connecté) : `textarea[name="text"]`, `select[name="sector"]` (pas titre / catégorie).
 * - « Voir tous les derniers inscrits » : navigation vers `/membres?sort=recent` (page dédiée + onglet Membres).
 *
 * Variables :
 * - `CYPRESS_BASE_URL` (ex. https://annuaire-guadalajara.vercel.app) ou défaut localhost:3000.
 * - CTA « invitation » visible seulement si connecté avec fiche + compteur &lt; seuil lancement,
 *   ou si le bloc recommandations affiche l’état « inviter 3 contacts ».
 */

describe('CTA navigation — Annuaire Guadalajara', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('CTA invitation ouvre la modale de partage (si affichée)', () => {
    cy.get('body').then(($b) => {
      const $cta = $b.find('[data-testid="invite-network-cta"], [data-testid="ai-rec-invite-cta"]').first();
      if (!$cta.length) {
        cy.log(
          'Pas de CTA invitation (visiteur, ou seuil membres déjà dépassé sans état recommandations) — rien à cliquer.'
        );
        return;
      }
      cy.wrap($cta).click({ force: true });
      cy.get('[data-testid="invite-network-modal"]').should('be.visible');
      cy.get('[data-testid="invite-network-modal"]').within(() => {
        cy.get('textarea[name="message"]').should('exist');
        cy.contains('button', 'WhatsApp').should('be.visible');
      });
    });
    cy.url().should('not.include', 'invitation');
  });

  it('CTA « Poster une opportunité » : connexion (invité) ou formulaire besoin urgent (membre)', () => {
    cy.get('[data-testid="cta-post-opportunity"]').first().scrollIntoView().should('be.visible').click();

    cy.get('body').then(($b) => {
      if ($b.find('[data-testid="auth-modal"]').length) {
        cy.get('[data-testid="auth-modal"]').should('be.visible');
        cy.get('[data-testid="auth-modal"]').within(() => {
          cy.contains('button', /Google|Continuer|Continue/i).should('exist');
        });
        return;
      }
      cy.get('[data-testid="urgent-post-modal"]').should('be.visible');
      cy.get('[data-testid="urgent-post-modal"] form').should('exist');
      cy.get('textarea[name="text"]').should('exist');
      cy.get('select[name="sector"]').should('exist');
      cy.get('[data-testid="urgent-post-modal"] button[type="submit"]').should('be.visible');
    });
    cy.url().should('not.include', 'opportunite');
  });

  it('« Voir tous les derniers inscrits » bascule vers l’onglet Membres et affiche des fiches', () => {
    cy.get('[data-testid="new-members-see-all"]', { timeout: 20000 })
      .first()
      .scrollIntoView()
      .should('be.visible')
      .click();

    cy.url().should('include', '/membres');
    cy.url().should('include', 'sort=recent');
    cy.get('[data-testid="members-directory-page"]').should('be.visible');
    cy.get('[data-testid="directory-tab-members"]').should('have.attr', 'aria-pressed', 'true');
    cy.get('[data-testid="member-card"]', { timeout: 40000 }).should('have.length.greaterThan', 0);
  });
});
