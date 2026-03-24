/**
 * Validation du formulaire « Publier un besoin urgent » (CTA « Poster une opportunité »).
 *
 * Réalité produit :
 * - Pas de champs `titre` ni `description` : `textarea[name="text"]` + `select[name="sector"]` (required).
 * - Le select n’a pas d’option vide : un secteur est toujours pré-sélectionné → la contrainte HTML5
 *   porte surtout sur la description vide au clic sur Enregistrer.
 * - Invité : la modale de connexion s’ouvre à la place — ces tests ne s’exécutent pas utilement sans session.
 *
 * `CYPRESS_BASE_URL` ou `baseUrl` dans cypress.config.ts (défaut localhost:3000).
 */

describe('Formulaire « Poster une opportunité » — validation', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('[data-testid="cta-post-opportunity"]').first().scrollIntoView().click({ force: true });
  });

  it('refuse l’envoi si la description est vide (HTML5)', () => {
    cy.get('body').then(($b) => {
      if ($b.find('[data-testid="auth-modal"]').length) {
        cy.log('Session invitée : modale connexion — connectez un compte test pour ce scénario.');
        return;
      }
      cy.get('[data-testid="urgent-post-modal"]').should('be.visible');
      cy.get('[data-testid="urgent-post-form"]')
        .as('oppForm')
        .find('textarea[name="text"]')
        .clear();
      cy.get('@oppForm').find('button[type="submit"]').click();
      cy.get('@oppForm').then(($form) => {
        expect(($form[0] as HTMLFormElement).checkValidity()).to.be.false;
      });
      cy.get('@oppForm').find('textarea:invalid').should('have.length.at.least', 1);
    });
  });

  it('affiche un message d’erreur si la description n’est que des espaces (validation applicative)', () => {
    cy.get('body').then(($b) => {
      if ($b.find('[data-testid="auth-modal"]').length) {
        cy.log('Session invitée : ignorer ou utiliser cy.session avec un membre.');
        return;
      }
      cy.get('[data-testid="urgent-post-modal"]').should('be.visible');
      cy.get('[data-testid="urgent-post-form"]')
        .find('textarea[name="text"]')
        .clear()
        .type('   ');
      cy.get('[data-testid="urgent-post-form"]').find('button[type="submit"]').click();
      // urgentPostFormInvalid (FR/ES/EN) — pas de champ « titre » dans ce formulaire
      cy.get('[data-testid="urgent-post-modal"] [role="alert"]')
        .should('be.visible')
        .invoke('text')
        .should((txt) => {
          const n = txt.toLowerCase();
          expect(
            /renseignez|completar|please fill|description|secteur|sector|campos/i.test(n),
            txt
          ).to.be.true;
        });
    });
  });
});
