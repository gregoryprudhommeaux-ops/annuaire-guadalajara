export const PROFILE_EDITORIAL_RULES = {
  bio: {
    min: 40,
    max: 500,
    softMax: 360,
    placeholder:
      'Présentez votre parcours, votre activité et la valeur que vous apportez au réseau en 2 à 4 phrases.',
    help: 'Privilégiez une présentation claire, concrète et orientée business. Évitez les textes trop personnels ou trop longs.',
  },
  lookingForText: {
    min: 20,
    max: 220,
    softMax: 140,
    placeholder:
      'Ex. Développer des partenariats B2B au Mexique et rencontrer des décideurs pertinents dans mon secteur.',
    help: 'Expliquez en une phrase ce que vous attendez concrètement du réseau.',
  },
  helpOfferText: {
    min: 20,
    max: 280,
    softMax: 180,
    placeholder:
      'Ex. Je peux aider sur le développement commercial, les mises en relation locales et la structuration de partenariats.',
    help: 'Décrivez de façon concrète comment vous pouvez être utile à d’autres membres.',
  },
  preferredContactText: {
    min: 6,
    max: 120,
    softMax: 70,
    placeholder:
      'Ex. Premier contact par WhatsApp ou email, puis échange visio ou café.',
    help: 'Indiquez le canal de contact le plus simple et le plus naturel pour vous.',
  },
  keywords: {
    min: 0,
    max: 180,
    softMax: 120,
    placeholder:
      'Ex. développement international, sourcing, Mexique, B2B, investissements',
    help: 'Ajoutez 4 à 8 mots-clés utiles pour la recherche et le matching.',
  },
};
