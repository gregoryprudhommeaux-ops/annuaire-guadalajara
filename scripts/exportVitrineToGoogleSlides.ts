/**
 * OBJECTIF POUR CURSOR
 *
 * Contexte :
 * - Le projet contient un template JSON : config/vitrine-template.json
 *   -> il décrit le template Google Slides "FrancoNetwork Vitrine" (14 slides, couleurs, titres, mapping des champs).
 * - On dispose d'un objet VitrineData (types/vitrine-data.ts) qui correspond aux données extraites de la page Vitrine (https://franconetwork.app/stats).
 *
 * Ce que je veux :
 * Générer une fonction TypeScript `exportVitrineToGoogleSlides` qui :
 *   1. charge le template depuis config/vitrine-template.json
 *   2. reçoit en paramètre un objet `data: VitrineData`
 *   3. construit le titre du document Google Slides à partir de `document_naming` du template :
 *      - titre principal : "FrancoNetwork - Vitrine réseau - {{report_month_year_fr}}"
 *      - si possible, version archivage : "FrancoNetwork - Vitrine réseau - extraction du {{extraction_date_fr_long}}"
 *   4. crée (ou met à jour) un document Google Slides en utilisant l’API Google Slides
 *      - 14 slides, dans l’ordre défini par `template.slides`
 *      - pour chaque slide, applique :
 *          - le titre / sous-titre définis dans le template
 *          - les textes issus de `data` selon `value_path` ou `repeat_source`
 *          - le style (fonts, tailles, couleurs) défini dans `design_system`
 *   5. retourne l’ID et l’URL du document Google Slides.
 *
 * Contraintes :
 * - Ne pas redéfinir le template dans le code : toujours lire config/vitrine-template.json et appliquer ses règles.
 * - Respecter le type VitrineData.
 * - Ne pas inventer de champs : toute donnée vient de VitrineData.
 * - Si une valeur manque, utiliser la stratégie de fallback définie dans template.behavior_rules.missing_data_policy.
 *
 * Stack :
 * - Node + TypeScript
 * - Client Google API (googleapis) OU Apps Script (selon ce fichier).
 *
 * Tâche pour toi (Cursor) :
 * - Générer le squelette de code propre, typé, commenté, en TypeScript.
 * - Créer des fonctions utilitaires :
 *   - loadVitrineTemplate()
 *   - buildDocumentTitle(template, data)
 *   - buildSlidesRequests(template, data)
 *   - exportVitrineToGoogleSlides(auth, data)
 *
 * - Tu peux utiliser des placeholders TODO pour :
 *   - la partie authentification Google
 *   - l’ID de modèle de présentation Slides, si nécessaire.
 */

import fs from 'node:fs';
import path from 'node:path';
import { google, slides_v1 } from 'googleapis';
import type { VitrineData } from '../types/vitrine-data';

// Minimal template typing — keep it generic and driven by `config/vitrine-template.json`.
export type VitrineTemplate = {
  template_id: string;
  language: 'fr';
  document_naming: {
    default_title_format: string;
    archival_title_format: string;
    use_archival_title_if_full_date_available: boolean;
  };
  behavior_rules?: {
    missing_data_policy?: {
      fallback_text_short?: string;
      fallback_text_editorial?: string;
      allow_hide_empty_micro_block?: boolean;
      never_remove_entire_slide?: boolean;
    };
  };
  date_rules: {
    slide_1_date_format: string;
  };
  design_system: {
    colors: {
      muted_text: string;
      secondary_text: string;
      primary_text: string;
      neutral_card: string;
    };
    typography: {
      font_family_primary: string;
      title: { font_size_pt: number };
      section_title: { font_size_pt: number };
      subtitle: { font_size_pt: number };
      body: { font_size_pt: number };
      small: { font_size_pt: number };
      kpi_value: { font_size_pt: number };
    };
  };
  slides: Array<Record<string, unknown>>;
};

export type GoogleAuthClient = any; // TODO: OAuth2Client | JWT | BaseExternalAccountClient

export function loadVitrineTemplate(): VitrineTemplate {
  const templatePath = path.resolve(__dirname, '../config/vitrine-template.json');
  const raw = fs.readFileSync(templatePath, 'utf8');
  return JSON.parse(raw) as VitrineTemplate;
}

export function buildDocumentTitle(template: VitrineTemplate, data: VitrineData): string {
  const base = template.document_naming.default_title_format.replace(
    '{{report_month_year_fr}}',
    data.report_month_year_fr
  );

  if (
    template.document_naming.use_archival_title_if_full_date_available &&
    data.extraction_date_fr_long
  ) {
    return template.document_naming.archival_title_format.replace(
      '{{extraction_date_fr_long}}',
      data.extraction_date_fr_long
    );
  }

  return base;
}

export function getValueByPath(obj: unknown, pathStr: string): unknown {
  return String(pathStr || '')
    .split('.')
    .filter(Boolean)
    .reduce<unknown>((curr, key) => {
      if (!curr || typeof curr !== 'object') return undefined;
      return (curr as Record<string, unknown>)[key];
    }, obj);
}

export function applyFallback(template: VitrineTemplate, value: unknown): string {
  const policy = template.behavior_rules?.missing_data_policy;
  if (value === undefined || value === null || value === '') {
    return policy?.fallback_text_short ?? 'Donnée non disponible à la date d’extraction';
  }
  return String(value);
}

/**
 * # PATTERN DE GÉNÉRATION DES SLIDES 3 À 14 — FRANCONETWORK VITRINE
 *
 * ## Règle générale
 * Suivre exactement le style et la logique des slides 1 et 2 déjà codées :
 * - fond clair, sobre, premium
 * - marges fixes
 * - titre en haut à gauche
 * - sous-titre sous le titre
 * - cartes ou blocs alignés
 * - typographie issue de template.design_system
 * - couleurs issues de template.design_system
 * - fallback via applyFallback(template, value)
 *
 * ## Principe technique
 * Pour chaque slide :
 * 1. créer une slide BLANK
 * 2. ajouter le titre
 * 3. ajouter le sous-titre
 * 4. générer les blocs de contenu selon le layout attendu
 * 5. éviter les effets complexes
 * 6. privilégier un rendu lisible, business, propre, stable
 *
 * ---
 *
 * ## Slide 3 — indicators
 * slide_id: indicators
 * layout: 5_kpi_cards
 *
 * ### Structure
 * - titre en haut
 * - sous-titre en dessous
 * - 5 cartes KPI en ligne ou en grille 3 + 2
 * - chaque carte contient :
 *   - label en petit
 *   - valeur en grand
 *   - note éventuelle en bas si disponible
 *
 * ### KPI à afficher
 * - Décideurs actifs
 * - Nouveaux ce mois
 * - Consultations de profils
 * - Mises en relation initiées
 * - Connexions potentielles
 *
 * ### Rendu attendu
 * - même logique visuelle que slide 2
 * - cartes un peu plus compactes si nécessaire
 *
 * ---
 *
 * ## Slide 4 — affinities
 * slide_id: affinities
 * layout: affinity_cards
 *
 * ### Structure
 * - titre + sous-titre
 * - 5 cartes d’affinités
 * - grille recommandée :
 *   - 3 cartes première ligne
 *   - 2 cartes deuxième ligne
 *
 * ### Contenu d’une carte
 * - nom de l’affinité
 * - badge éventuel
 * - ligne stats : X membres / Y secteurs ou univers métier
 * - phrase insight courte
 *
 * ### Style
 * - badge en petit capsule colorée si présent
 * - carte sobre, fond léger, bord discret
 *
 * ---
 *
 * ## Slide 5 — affinity_insights
 * slide_id: affinity_insights
 * layout: editorial
 *
 * ### Structure
 * - titre + sous-titre
 * - paragraphe intro en haut
 * - 3 bullets au centre ou dans 3 mini-cartes
 * - bloc highlights en bas
 * - phrase de conclusion finale
 *
 * ### Rendu attendu
 * - slide éditoriale très simple
 * - pas de surcharge
 * - hiérarchie forte entre intro, bullets, highlights, closing
 *
 * ---
 *
 * ## Slide 6 — sectors
 * slide_id: sectors
 * layout: sector_list_or_chart
 *
 * ### Structure
 * Option recommandée :
 * - titre + sous-titre
 * - liste des 8 secteurs dans une grille 2 colonnes x 4 lignes
 *
 * Alternative si counts disponibles :
 * - bar chart horizontal simple
 *
 * ### Si pas de compte par secteur
 * - afficher uniquement les noms des secteurs sous forme de cartes ou tags larges
 *
 * ---
 *
 * ## Slide 7 — growth
 * slide_id: growth
 * layout: line_chart_plus_insights
 *
 * ### Structure
 * - titre + sous-titre
 * - zone graphique en haut ou à gauche
 * - zone insight à droite ou en bas
 * - bloc highlights
 * - phrase closing en bas
 *
 * ---
 *
 * ## Slide 8 — recent_activity
 * slide_id: recent_activity
 * layout: activity_cards
 *
 * ### Structure
 * - titre + sous-titre
 * - 4 cartes (grille 2 x 2 recommandée)
 *
 * ---
 *
 * ## Slide 9 — top_requested_opportunities
 * slide_id: top_requested_opportunities
 * layout: horizontal_bar_chart
 *
 * ---
 *
 * ## Slide 10 — active_opportunities
 * slide_id: active_opportunities
 * layout: opportunity_cards
 *
 * ---
 *
 * ## Slide 11 — opportunity_insights
 * slide_id: opportunity_insights
 * layout: editorial
 *
 * ---
 *
 * ## Slide 12 — recent_requests
 * slide_id: recent_requests
 * layout: editorial_with_empty_state
 *
 * ---
 *
 * ## Slide 13 — cta
 * slide_id: cta
 * layout: cta_cards
 *
 * ---
 *
 * ## Slide 14 — closing
 * slide_id: closing
 * layout: closing_brand
 *
 * ---
 *
 * ## Fonctions à générer
 * Créer des helpers réutilisables pour éviter du code répétitif :
 * - createTitleBlock(slideId, title, subtitle)
 * - createKpiCard(slideId, objectPrefix, x, y, width, height, label, value, note?)
 * - createSimpleCard(slideId, objectPrefix, x, y, width, height, title, body, footer?)
 * - createBadge(slideId, objectId, x, y, text, variant?)
 * - createEditorialBlock(slideId, x, y, width, title?, body)
 * - createBulletList(slideId, x, y, width, items)
 * - createHorizontalBarChart(slideId, x, y, width, items)
 * - createFooterMeta(slideId, footerData)
 *
 * ## Règle de code
 * Ne pas coder chaque slide de façon totalement unique si le pattern peut être factorisé.
 * Garder un code simple, lisible, stable, facile à maintenir.
 */

/**
 * Construit la liste des requests batchUpdate pour remplir les slides.
 * Squelette volontaire : Cursor complètera la logique exacte de mapping des 14 slides.
 */
export function buildSlidesRequests(
  template: VitrineTemplate,
  data: VitrineData,
  presentationId: string
): slides_v1.Params$Resource$Presentations$Batchupdate['requestBody'] {
  const requests: slides_v1.Schema$Request[] = [];

  const coverSlideDef = template.slides.find((s: any) => s.slide_id === 'cover') as any;
  const overviewSlideDef = template.slides.find((s: any) => s.slide_id === 'overview_kpis') as any;

  if (!coverSlideDef || !overviewSlideDef) {
    throw new Error("Template must define slides 'cover' and 'overview_kpis'.");
  }

  // Pattern for Cursor to generalize to slides 3–14:
  // - follow EXACTLY the same creation/styling pattern as slides 1 & 2
  // - create a BLANK slide
  // - add title/subtitle per template
  // - for repeat_source sections, loop and create cards/rows
  // - always use template.design_system for colors/typography
  // - use applyFallback(template, value) for missing data

  // 1) SLIDE 1 : COVER
  const coverObjectId = 'vitrine_cover_slide';

  requests.push({
    createSlide: {
      objectId: coverObjectId,
      slideLayoutReference: { predefinedLayout: 'BLANK' },
    },
  });

  // Eyebrow
  requests.push({
    createShape: {
      objectId: 'cover_eyebrow',
      shapeType: 'TEXT_BOX',
      elementProperties: {
        pageObjectId: coverObjectId,
        size: {
          width: { magnitude: 300, unit: 'PT' },
          height: { magnitude: 20, unit: 'PT' },
        },
        transform: {
          scaleX: 1,
          scaleY: 1,
          translateX: 44,
          translateY: 60,
          unit: 'PT',
        },
      },
    },
  });
  requests.push({
    insertText: {
      objectId: 'cover_eyebrow',
      insertionIndex: 0,
      text: coverSlideDef.eyebrow ?? 'VITRINE RÉSEAU',
    },
  });
  requests.push({
    updateTextStyle: {
      objectId: 'cover_eyebrow',
      style: {
        bold: false,
        fontFamily: template.design_system.typography.font_family_primary,
        fontSize: { magnitude: template.design_system.typography.small.font_size_pt, unit: 'PT' },
        foregroundColor: {
          opaqueColor: { rgbColor: hexToRgbColor(template.design_system.colors.muted_text) },
        },
      },
      fields: 'bold,fontFamily,fontSize,foregroundColor',
    },
  });

  // Title
  requests.push({
    createShape: {
      objectId: 'cover_title',
      shapeType: 'TEXT_BOX',
      elementProperties: {
        pageObjectId: coverObjectId,
        size: {
          width: { magnitude: 600, unit: 'PT' },
          height: { magnitude: 60, unit: 'PT' },
        },
        transform: {
          scaleX: 1,
          scaleY: 1,
          translateX: 44,
          translateY: 90,
          unit: 'PT',
        },
      },
    },
  });
  requests.push({
    insertText: {
      objectId: 'cover_title',
      insertionIndex: 0,
      text: coverSlideDef.title,
    },
  });
  requests.push({
    updateTextStyle: {
      objectId: 'cover_title',
      style: {
        bold: true,
        fontFamily: template.design_system.typography.font_family_primary,
        fontSize: { magnitude: template.design_system.typography.title.font_size_pt, unit: 'PT' },
        foregroundColor: {
          opaqueColor: { rgbColor: hexToRgbColor(template.design_system.colors.primary_text) },
        },
      },
      fields: 'bold,fontFamily,fontSize,foregroundColor',
    },
  });

  // Subtitle
  requests.push({
    createShape: {
      objectId: 'cover_subtitle',
      shapeType: 'TEXT_BOX',
      elementProperties: {
        pageObjectId: coverObjectId,
        size: {
          width: { magnitude: 600, unit: 'PT' },
          height: { magnitude: 40, unit: 'PT' },
        },
        transform: {
          scaleX: 1,
          scaleY: 1,
          translateX: 44,
          translateY: 150,
          unit: 'PT',
        },
      },
    },
  });
  requests.push({
    insertText: {
      objectId: 'cover_subtitle',
      insertionIndex: 0,
      text: coverSlideDef.subtitle,
    },
  });
  requests.push({
    updateTextStyle: {
      objectId: 'cover_subtitle',
      style: {
        bold: false,
        fontFamily: template.design_system.typography.font_family_primary,
        fontSize: { magnitude: template.design_system.typography.subtitle.font_size_pt, unit: 'PT' },
        foregroundColor: {
          opaqueColor: { rgbColor: hexToRgbColor(template.design_system.colors.secondary_text) },
        },
      },
      fields: 'bold,fontFamily,fontSize,foregroundColor',
    },
  });

  // Date line
  const dateLineText = template.date_rules.slide_1_date_format.replace(
    '{{extraction_date_fr_long}}',
    data.extraction_date_fr_long
  );

  requests.push({
    createShape: {
      objectId: 'cover_date',
      shapeType: 'TEXT_BOX',
      elementProperties: {
        pageObjectId: coverObjectId,
        size: {
          width: { magnitude: 400, unit: 'PT' },
          height: { magnitude: 30, unit: 'PT' },
        },
        transform: {
          scaleX: 1,
          scaleY: 1,
          translateX: 44,
          translateY: 200,
          unit: 'PT',
        },
      },
    },
  });
  requests.push({
    insertText: {
      objectId: 'cover_date',
      insertionIndex: 0,
      text: dateLineText,
    },
  });
  requests.push({
    updateTextStyle: {
      objectId: 'cover_date',
      style: {
        bold: false,
        fontFamily: template.design_system.typography.font_family_primary,
        fontSize: { magnitude: template.design_system.typography.body.font_size_pt, unit: 'PT' },
        foregroundColor: {
          opaqueColor: { rgbColor: hexToRgbColor(template.design_system.colors.muted_text) },
        },
      },
      fields: 'bold,fontFamily,fontSize,foregroundColor',
    },
  });

  // KPI row (4 cards) en bas de la slide 1
  const kpiRow = coverSlideDef.kpi_row as Array<{ label: string; value_path: string }>;
  const kpiCardWidth = 180;
  const kpiCardHeight = 80;
  const kpiRowTop = 520;
  const kpiRowLeft = 44;
  const kpiGap = 16;

  kpiRow.forEach((kpiDef, index) => {
    const baseId = `cover_kpi_${index + 1}`;
    const x = kpiRowLeft + index * (kpiCardWidth + kpiGap);
    const cardValue = applyFallback(template, getValueByPath(data, kpiDef.value_path));

    // Carte
    requests.push({
      createShape: {
        objectId: `${baseId}_card`,
        shapeType: 'RECTANGLE',
        elementProperties: {
          pageObjectId: coverObjectId,
          size: {
            width: { magnitude: kpiCardWidth, unit: 'PT' },
            height: { magnitude: kpiCardHeight, unit: 'PT' },
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: x,
            translateY: kpiRowTop,
            unit: 'PT',
          },
        },
      },
    });
    requests.push({
      updateShapeProperties: {
        objectId: `${baseId}_card`,
        shapeProperties: {
          shapeBackgroundFill: {
            solidFill: {
              color: { rgbColor: hexToRgbColor(template.design_system.colors.neutral_card) },
            },
          },
        },
        fields: 'shapeBackgroundFill.solidFill.color',
      },
    });

    // Label
    requests.push({
      createShape: {
        objectId: `${baseId}_label`,
        shapeType: 'TEXT_BOX',
        elementProperties: {
          pageObjectId: coverObjectId,
          size: {
            width: { magnitude: kpiCardWidth - 24, unit: 'PT' },
            height: { magnitude: 20, unit: 'PT' },
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: x + 12,
            translateY: kpiRowTop + 10,
            unit: 'PT',
          },
        },
      },
    });
    requests.push({
      insertText: {
        objectId: `${baseId}_label`,
        insertionIndex: 0,
        text: kpiDef.label,
      },
    });
    requests.push({
      updateTextStyle: {
        objectId: `${baseId}_label`,
        style: {
          bold: false,
          fontFamily: template.design_system.typography.font_family_primary,
          fontSize: { magnitude: template.design_system.typography.small.font_size_pt, unit: 'PT' },
          foregroundColor: {
            opaqueColor: { rgbColor: hexToRgbColor(template.design_system.colors.muted_text) },
          },
        },
        fields: 'bold,fontFamily,fontSize,foregroundColor',
      },
    });

    // Valeur
    requests.push({
      createShape: {
        objectId: `${baseId}_value`,
        shapeType: 'TEXT_BOX',
        elementProperties: {
          pageObjectId: coverObjectId,
          size: {
            width: { magnitude: kpiCardWidth - 24, unit: 'PT' },
            height: { magnitude: 30, unit: 'PT' },
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: x + 12,
            translateY: kpiRowTop + 30,
            unit: 'PT',
          },
        },
      },
    });
    requests.push({
      insertText: {
        objectId: `${baseId}_value`,
        insertionIndex: 0,
        text: cardValue,
      },
    });
    requests.push({
      updateTextStyle: {
        objectId: `${baseId}_value`,
        style: {
          bold: true,
          fontFamily: template.design_system.typography.font_family_primary,
          fontSize: {
            magnitude: template.design_system.typography.kpi_value.font_size_pt,
            unit: 'PT',
          },
          foregroundColor: {
            opaqueColor: { rgbColor: hexToRgbColor(template.design_system.colors.primary_text) },
          },
        },
        fields: 'bold,fontFamily,fontSize,foregroundColor',
      },
    });
  });

  // 2) SLIDE 2 : OVERVIEW KPIs
  const overviewSlideId = 'vitrine_overview_slide';

  requests.push({
    createSlide: {
      objectId: overviewSlideId,
      slideLayoutReference: { predefinedLayout: 'BLANK' },
    },
  });

  // Titre slide 2
  requests.push({
    createShape: {
      objectId: 'overview_title',
      shapeType: 'TEXT_BOX',
      elementProperties: {
        pageObjectId: overviewSlideId,
        size: {
          width: { magnitude: 600, unit: 'PT' },
          height: { magnitude: 40, unit: 'PT' },
        },
        transform: {
          scaleX: 1,
          scaleY: 1,
          translateX: 44,
          translateY: 60,
          unit: 'PT',
        },
      },
    },
  });
  requests.push({
    insertText: {
      objectId: 'overview_title',
      insertionIndex: 0,
      text: overviewSlideDef.title,
    },
  });
  requests.push({
    updateTextStyle: {
      objectId: 'overview_title',
      style: {
        bold: true,
        fontFamily: template.design_system.typography.font_family_primary,
        fontSize: {
          magnitude: template.design_system.typography.section_title.font_size_pt,
          unit: 'PT',
        },
        foregroundColor: {
          opaqueColor: { rgbColor: hexToRgbColor(template.design_system.colors.primary_text) },
        },
      },
      fields: 'bold,fontFamily,fontSize,foregroundColor',
    },
  });

  // Sous-titre slide 2
  requests.push({
    createShape: {
      objectId: 'overview_subtitle',
      shapeType: 'TEXT_BOX',
      elementProperties: {
        pageObjectId: overviewSlideId,
        size: {
          width: { magnitude: 600, unit: 'PT' },
          height: { magnitude: 30, unit: 'PT' },
        },
        transform: {
          scaleX: 1,
          scaleY: 1,
          translateX: 44,
          translateY: 100,
          unit: 'PT',
        },
      },
    },
  });
  requests.push({
    insertText: {
      objectId: 'overview_subtitle',
      insertionIndex: 0,
      text: overviewSlideDef.subtitle,
    },
  });
  requests.push({
    updateTextStyle: {
      objectId: 'overview_subtitle',
      style: {
        bold: false,
        fontFamily: template.design_system.typography.font_family_primary,
        fontSize: {
          magnitude: template.design_system.typography.subtitle.font_size_pt,
          unit: 'PT',
        },
        foregroundColor: {
          opaqueColor: { rgbColor: hexToRgbColor(template.design_system.colors.secondary_text) },
        },
      },
      fields: 'bold,fontFamily,fontSize,foregroundColor',
    },
  });

  // 4 KPI sous forme de cartes (slide 2)
  const overviewKpis = overviewSlideDef.kpis as Array<{ label: string; value_path: string }>;
  const overviewCardWidth = 260;
  const overviewCardHeight = 90;
  const overviewTop = 160;
  const overviewLeft = 44;
  const overviewGapX = 24;

  overviewKpis.forEach((kpiDef, index) => {
    const baseId = `overview_kpi_${index + 1}`;
    const x = overviewLeft + index * (overviewCardWidth + overviewGapX);
    const y = overviewTop;
    const value = applyFallback(template, getValueByPath(data, kpiDef.value_path));

    // Carte
    requests.push({
      createShape: {
        objectId: `${baseId}_card`,
        shapeType: 'RECTANGLE',
        elementProperties: {
          pageObjectId: overviewSlideId,
          size: {
            width: { magnitude: overviewCardWidth, unit: 'PT' },
            height: { magnitude: overviewCardHeight, unit: 'PT' },
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: x,
            translateY: y,
            unit: 'PT',
          },
        },
      },
    });
    requests.push({
      updateShapeProperties: {
        objectId: `${baseId}_card`,
        shapeProperties: {
          shapeBackgroundFill: {
            solidFill: {
              color: { rgbColor: hexToRgbColor(template.design_system.colors.neutral_card) },
            },
          },
        },
        fields: 'shapeBackgroundFill.solidFill.color',
      },
    });

    // Label
    requests.push({
      createShape: {
        objectId: `${baseId}_label`,
        shapeType: 'TEXT_BOX',
        elementProperties: {
          pageObjectId: overviewSlideId,
          size: {
            width: { magnitude: overviewCardWidth - 24, unit: 'PT' },
            height: { magnitude: 20, unit: 'PT' },
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: x + 12,
            translateY: y + 10,
            unit: 'PT',
          },
        },
      },
    });
    requests.push({
      insertText: {
        objectId: `${baseId}_label`,
        insertionIndex: 0,
        text: kpiDef.label,
      },
    });
    requests.push({
      updateTextStyle: {
        objectId: `${baseId}_label`,
        style: {
          bold: false,
          fontFamily: template.design_system.typography.font_family_primary,
          fontSize: { magnitude: template.design_system.typography.small.font_size_pt, unit: 'PT' },
          foregroundColor: {
            opaqueColor: { rgbColor: hexToRgbColor(template.design_system.colors.muted_text) },
          },
        },
        fields: 'bold,fontFamily,fontSize,foregroundColor',
      },
    });

    // Valeur
    requests.push({
      createShape: {
        objectId: `${baseId}_value`,
        shapeType: 'TEXT_BOX',
        elementProperties: {
          pageObjectId: overviewSlideId,
          size: {
            width: { magnitude: overviewCardWidth - 24, unit: 'PT' },
            height: { magnitude: 30, unit: 'PT' },
          },
          transform: {
            scaleX: 1,
            scaleY: 1,
            translateX: x + 12,
            translateY: y + 30,
            unit: 'PT',
          },
        },
      },
    });
    requests.push({
      insertText: {
        objectId: `${baseId}_value`,
        insertionIndex: 0,
        text: value,
      },
    });
    requests.push({
      updateTextStyle: {
        objectId: `${baseId}_value`,
        style: {
          bold: true,
          fontFamily: template.design_system.typography.font_family_primary,
          fontSize: {
            magnitude: template.design_system.typography.kpi_value.font_size_pt,
            unit: 'PT',
          },
          foregroundColor: {
            opaqueColor: { rgbColor: hexToRgbColor(template.design_system.colors.primary_text) },
          },
        },
        fields: 'bold,fontFamily,fontSize,foregroundColor',
      },
    });
  });

  return { requests };
}

/**
 * Helper pour convertir un hex (#RRGGBB) en rgbColor Slides.
 */
function hexToRgbColor(hex: string): slides_v1.Schema$RgbColor {
  const raw = hex.replace('#', '');
  const r = parseInt(raw.slice(0, 2), 16) / 255;
  const g = parseInt(raw.slice(2, 4), 16) / 255;
  const b = parseInt(raw.slice(4, 6), 16) / 255;
  return { red: r, green: g, blue: b };
}

export async function exportVitrineToGoogleSlides(
  auth: GoogleAuthClient,
  data: VitrineData
): Promise<{ presentationId: string; url: string }> {
  const slides = google.slides({ version: 'v1', auth });
  const template = loadVitrineTemplate();
  const title = buildDocumentTitle(template, data);

  // 1) Créer la présentation (ou: copier un template si votre stratégie est "copy+fill").
  // TODO(CURSOR): si utilisation d’un template master, faire un Drive `files.copy` au lieu de `presentations.create`.
  const createRes = await slides.presentations.create({
    requestBody: { title },
  });

  const presentationId = createRes.data.presentationId;
  if (!presentationId) {
    throw new Error('presentationId manquant');
  }
  const url = `https://docs.google.com/presentation/d/${presentationId}/edit`;

  // 2) Remplir via batchUpdate
  const batchUpdateBody = buildSlidesRequests(template, data, presentationId);
  if (batchUpdateBody?.requests && batchUpdateBody.requests.length > 0) {
    await slides.presentations.batchUpdate({
      presentationId,
      requestBody: batchUpdateBody,
    });
  }

  return { presentationId, url };
}

