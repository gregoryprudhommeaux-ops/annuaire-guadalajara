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
    help: 'Décrivez en une phrase le type d’opportunité, de contact ou de soutien que vous cherchez réellement dans le réseau.',
  },
  helpOfferText: {
    min: 20,
    max: 280,
    softMax: 180,
    placeholder:
      'Ex. Je peux aider sur le développement commercial, les mises en relation locales et la structuration de partenariats.',
    help: 'Expliquez concrètement ce que vous pouvez apporter à d’autres membres : expertise, réseau, accès marché, partenaires, financement, conseil.',
  },
  keywords: {
    min: 0,
    max: 600,
    softMax: 400,
    placeholder:
      'Ex. développement international, sourcing, Mexique, B2B, investissements',
    help: 'Ajoutez des mots-clés précis pour être trouvé plus facilement et apparaître dans les bons matchs (jusqu’à 20, séparés par des virgules).',
  },
};
