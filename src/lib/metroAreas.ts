import { countryMeansMexico, normalizeLocationToken } from '@/lib/profileLocationConsistency';

/** Même forme que `GeoKey` — évite une dépendance circulaire avec `geoDirectory`. */
export type MetroGeoInput = { country: string; state: string; city: string };

export const CANONICAL_COUNTRY_MEXICO = 'Mexico';

/** @deprecated Utiliser `metroPickerLabelKey` — conservé pour imports externes éventuels. */
export const METRO_GUADALAJARA_ZMG_CITY_KEY = 'Grand Guadalajara';

export type MetroRule = {
  /** États possibles sur les fiches (normalisés, sans accent). */
  sourceStates: ReadonlySet<string>;
  /** Municipalités / villes rattachées à cette métropole (normalisés). */
  sourceCities: ReadonlySet<string>;
  /** Triplet affiché dans l’index après fusion (pays appliqué séparément). */
  canonical: { state: string; city: string };
  i18nKey: string;
  /** Mots-clés pour le champ de recherche du combobox. */
  searchExtra: string;
};

function S(tokens: string[]): ReadonlySet<string> {
  return new Set(tokens.map((t) => normalizeLocationToken(t)));
}

/**
 * Règles ordonnées : la **première** qui matche (état + ville) gagne.
 * ZMVM en premier (plus de municipalités), puis autres métropoles.
 * Ajuster les listes au fil du temps (orthographes saisies dans l’annuaire).
 */
export const METRO_RULES_ORDERED: MetroRule[] = [
  // ——— Ciudad de México + Estado de México + zone métropolitaine (ZMVM) ———
  {
    sourceStates: S([
      'Ciudad de México',
      'CDMX',
      'Distrito Federal',
      'DF',
      'Estado de México',
      'Edomex',
      'México',
    ]),
    sourceCities: S([
      'Álvaro Obregón',
      'Azcapotzalco',
      'Benito Juárez',
      'Coyoacán',
      'Cuajimalpa',
      'Cuauhtémoc',
      'Gustavo A. Madero',
      'Iztacalco',
      'Iztapalapa',
      'La Magdalena Contreras',
      'Miguel Hidalgo',
      'Milpa Alta',
      'Tláhuac',
      'Tlalpan',
      'Venustiano Carranza',
      'Xochimilco',
      'Ecatepec de Morelos',
      'Ecatepec',
      'Nezahualcóyotl',
      'Naucalpan de Juárez',
      'Naucalpan',
      'Tlalnepantla de Baz',
      'Tlalnepantla',
      'Chimalhuacán',
      'Tultitlán',
      'Cuautitlán Izcalli',
      'Atizapán de Zaragoza',
      'Atizapán',
      'Nicolás Romero',
      'Texcoco',
      'Coacalco',
      'Chalco',
      'Ixtapaluca',
      'Huixquilucan',
      'Huixquilucán',
      'Tecámac',
      'Valle de Chalco Solidaridad',
      'Los Reyes la Paz',
      'Chicoloapan',
      'La Paz',
      'Melchor Ocampo',
      'Tultepec',
      'Tepotzotlán',
      'Zumpango',
    ]),
    canonical: { state: 'Ciudad de México', city: 'Valle de México' },
    i18nKey: 'network.explorer.metroValleMexico',
    searchExtra:
      'cdmx edomex zona metropolitana df capir metro ciudad de mexico ecatepec naucalpan toluca satellite',
  },

  // ——— Monterrey (NL) ———
  {
    sourceStates: S(['Nuevo León', 'Nuevo Leon']),
    sourceCities: S([
      'Monterrey',
      'San Pedro Garza García',
      'San Pedro Garza Garcia',
      'Santa Catarina',
      'San Nicolás de los Garza',
      'San Nicolas de los Garza',
      'Guadalupe',
      'Apodaca',
      'General Escobedo',
      'Escobedo',
      'García',
      'Garcia',
      'Juárez',
      // NL Juárez municipality (distinct from Ciudad Juárez Chih.)
    ]),
    canonical: { state: 'Nuevo León', city: 'Gran Monterrey' },
    i18nKey: 'network.explorer.metroMonterrey',
    searchExtra: 'zmm monterrey san pedro regio',
  },

  // ——— Guadalajara ZMG ———
  {
    sourceStates: S(['Jalisco']),
    sourceCities: S([
      'Guadalajara',
      'Zapopan',
      'Tlaquepaque',
      'San Pedro Tlaquepaque',
      'Tonalá',
      'Tlajomulco',
      'Tlajomulco de Zúñiga',
      'El Salto',
      'Juanacatlán',
      'Ixtlahuacán de los Membrillos',
      'Zapotlanejo',
      'Acatlán de Juárez',
    ]),
    canonical: { state: 'Jalisco', city: METRO_GUADALAJARA_ZMG_CITY_KEY },
    i18nKey: 'network.explorer.metroGuadalajaraZmg',
    searchExtra: 'zmg zapopan tlaquepaque tlajomulco metropolitan',
  },

  // ——— Puebla–Tlaxcala (focus Puebla côté annuaire) ———
  {
    sourceStates: S(['Puebla', 'Tlaxcala']),
    sourceCities: S([
      'Puebla',
      'San Pedro Cholula',
      'San Andrés Cholula',
      'Cuautlancingo',
      'Amozoc',
      'Coronango',
      'San Gregorio Atzomapa',
      'Tlaxcala',
      'Apizaco',
    ]),
    canonical: { state: 'Puebla', city: 'Gran Puebla' },
    i18nKey: 'network.explorer.metroPuebla',
    searchExtra: 'cholula angelopolis',
  },

  // ——— Toluca ———
  {
    sourceStates: S(['México', 'Estado de México', 'Edomex']),
    sourceCities: S([
      'Toluca',
      'Metepec',
      'San Mateo Atenco',
      'Lerma',
      'Zinacantepec',
      'Ocoyoacac',
      'Xonacatlán',
    ]),
    canonical: { state: 'México', city: 'Valle de Toluca' },
    i18nKey: 'network.explorer.metroToluca',
    searchExtra: 'toluca metepec',
  },

  // ——— León / Bajío (León + Silao + centros voisins) ———
  {
    sourceStates: S(['Guanajuato']),
    sourceCities: S([
      'León',
      'Silao',
      'San Francisco del Rincón',
      'Purísima del Rincón',
      'Irapuato',
      'Salamanca',
    ]),
    canonical: { state: 'Guanajuato', city: 'León–Bajío' },
    i18nKey: 'network.explorer.metroLeonBajio',
    searchExtra: 'leon silao irapuato salamanca bajio',
  },

  // ——— Querétaro ———
  {
    sourceStates: S(['Querétaro', 'Queretaro']),
    sourceCities: S(['Querétaro', 'Queretaro', 'Corregidora', 'El Marqués', 'Huimilpan']),
    canonical: { state: 'Querétaro', city: 'Gran Querétaro' },
    i18nKey: 'network.explorer.metroQueretaro',
    searchExtra: 'queretaro corregidora',
  },

  // ——— Mérida ———
  {
    sourceStates: S(['Yucatán', 'Yucatan']),
    sourceCities: S(['Mérida', 'Merida', 'Kanasín', 'Kanasin', 'Umán', 'Uman', 'Conkal', 'Progreso']),
    canonical: { state: 'Yucatán', city: 'Gran Mérida' },
    i18nKey: 'network.explorer.metroMerida',
    searchExtra: 'merida yucatan',
  },

  // ——— Chihuahua capital ———
  {
    sourceStates: S(['Chihuahua']),
    sourceCities: S(['Chihuahua']),
    canonical: { state: 'Chihuahua', city: 'Chihuahua (metrópoli)' },
    i18nKey: 'network.explorer.metroChihuahua',
    searchExtra: 'chihuahua capital',
  },

  // ——— Ciudad Juárez (frontera) ———
  {
    sourceStates: S(['Chihuahua']),
    sourceCities: S(['Juárez', 'Ciudad Juárez', 'Ciudad Juarez']),
    canonical: { state: 'Chihuahua', city: 'Ciudad Juárez (metrópoli)' },
    i18nKey: 'network.explorer.metroCiudadJuarez',
    searchExtra: 'juarez frontera paso',
  },

  // ——— Saltillo ———
  {
    sourceStates: S(['Coahuila', 'Coahuila de Zaragoza']),
    sourceCities: S(['Saltillo', 'Ramos Arizpe', 'Arteaga']),
    canonical: { state: 'Coahuila', city: 'Saltillo (metrópoli)' },
    i18nKey: 'network.explorer.metroSaltillo',
    searchExtra: 'saltillo',
  },

  // ——— Torreón – La Laguna ———
  {
    sourceStates: S(['Coahuila', 'Coahuila de Zaragoza', 'Durango']),
    sourceCities: S([
      'Torreón',
      'Torreon',
      'Gómez Palacio',
      'Gomez Palacio',
      'Ciudad Lerdo',
      'Lerdo',
      'Matamoros',
    ]),
    canonical: { state: 'Coahuila', city: 'Torreón–La Laguna' },
    i18nKey: 'network.explorer.metroLaguna',
    searchExtra: 'laguna torreon gomez palacio comarca',
  },

  // ——— Aguascalientes ———
  {
    sourceStates: S(['Aguascalientes']),
    sourceCities: S(['Aguascalientes', 'Jesús María', 'Jesus Maria', 'San Francisco de los Romo']),
    canonical: { state: 'Aguascalientes', city: 'Gran Aguascalientes' },
    i18nKey: 'network.explorer.metroAguascalientes',
    searchExtra: 'aguascalientes',
  },

  // ——— Hermosillo ———
  {
    sourceStates: S(['Sonora']),
    sourceCities: S(['Hermosillo']),
    canonical: { state: 'Sonora', city: 'Hermosillo (metrópoli)' },
    i18nKey: 'network.explorer.metroHermosillo',
    searchExtra: 'hermosillo sonora',
  },

  // ——— Cajeme / Ciudad Obregón ———
  {
    sourceStates: S(['Sonora']),
    sourceCities: S(['Cajeme', 'Ciudad Obregón', 'Ciudad Obregon']),
    canonical: { state: 'Sonora', city: 'Ciudad Obregón (metrópoli)' },
    i18nKey: 'network.explorer.metroObregon',
    searchExtra: 'obregon cajeme',
  },

  // ——— Mexicali ———
  {
    sourceStates: S(['Baja California']),
    sourceCities: S(['Mexicali']),
    canonical: { state: 'Baja California', city: 'Mexicali (metrópoli)' },
    i18nKey: 'network.explorer.metroMexicali',
    searchExtra: 'mexicali',
  },

  // ——— Tijuana ———
  {
    sourceStates: S(['Baja California']),
    sourceCities: S(['Tijuana', 'Playas de Rosarito', 'Rosarito', 'Tecate']),
    canonical: { state: 'Baja California', city: 'Tijuana (metrópoli)' },
    i18nKey: 'network.explorer.metroTijuana',
    searchExtra: 'tijuana frontera san diego',
  },

  // ——— Culiacán ———
  {
    sourceStates: S(['Sinaloa']),
    sourceCities: S(['Culiacán', 'Culiacan', 'Navolato']),
    canonical: { state: 'Sinaloa', city: 'Gran Culiacán' },
    i18nKey: 'network.explorer.metroCuliacan',
    searchExtra: 'culiacan sinaloa',
  },

  // ——— Mazatlán ———
  {
    sourceStates: S(['Sinaloa']),
    sourceCities: S(['Mazatlán', 'Mazatlan']),
    canonical: { state: 'Sinaloa', city: 'Mazatlán (metrópoli)' },
    i18nKey: 'network.explorer.metroMazatlan',
    searchExtra: 'mazatlan',
  },

  // ——— Villahermosa ———
  {
    sourceStates: S(['Tabasco']),
    sourceCities: S(['Villahermosa', 'Centro', 'Centro Villahermosa']),
    canonical: { state: 'Tabasco', city: 'Villahermosa (metrópoli)' },
    i18nKey: 'network.explorer.metroVillahermosa',
    searchExtra: 'villahermosa tabasco',
  },

  // ——— Veracruz — Boca del Río ———
  {
    sourceStates: S(['Veracruz']),
    sourceCities: S(['Veracruz', 'Boca del Río', 'Boca del Rio']),
    canonical: { state: 'Veracruz', city: 'Veracruz–Boca del Río' },
    i18nKey: 'network.explorer.metroVeracruz',
    searchExtra: 'veracruz puerto jarocha',
  },

  // ——— Xalapa ———
  {
    sourceStates: S(['Veracruz']),
    sourceCities: S(['Xalapa', 'Xalapa-Enríquez', 'Banderilla']),
    canonical: { state: 'Veracruz', city: 'Gran Xalapa' },
    i18nKey: 'network.explorer.metroXalapa',
    searchExtra: 'xalapa jalapa',
  },

  // ——— Coatzacoalcos ———
  {
    sourceStates: S(['Veracruz']),
    sourceCities: S(['Coatzacoalcos']),
    canonical: { state: 'Veracruz', city: 'Coatzacoalcos (metrópoli)' },
    i18nKey: 'network.explorer.metroCoatzacoalcos',
    searchExtra: 'coatzacoalcos',
  },

  // ——— Cancún / Riviera Maya (focus principal) ———
  {
    sourceStates: S(['Quintana Roo']),
    sourceCities: S([
      'Benito Juárez',
      'Benito Juarez',
      'Cancún',
      'Cancun',
      'Solidaridad',
      'Playa del Carmen',
      'Puerto Morelos',
    ]),
    canonical: { state: 'Quintana Roo', city: 'Cancún–Riviera Maya' },
    i18nKey: 'network.explorer.metroCancun',
    searchExtra: 'cancun playa carmen quintana roo',
  },

  // ——— Reynosa ———
  {
    sourceStates: S(['Tamaulipas']),
    sourceCities: S(['Reynosa']),
    canonical: { state: 'Tamaulipas', city: 'Reynosa (metrópoli)' },
    i18nKey: 'network.explorer.metroReynosa',
    searchExtra: 'reynosa frontera',
  },

  // ——— Matamoros (Tmps) ———
  {
    sourceStates: S(['Tamaulipas']),
    sourceCities: S(['Matamoros']),
    canonical: { state: 'Tamaulipas', city: 'Matamoros (metrópoli)' },
    i18nKey: 'network.explorer.metroMatamoros',
    searchExtra: 'matamoros frontera brownsville',
  },

  // ——— Tampico–Ciudad Madero–Altamira ———
  {
    sourceStates: S(['Tamaulipas']),
    sourceCities: S(['Tampico', 'Ciudad Madero', 'Altamira']),
    canonical: { state: 'Tamaulipas', city: 'Zona Tampico' },
    i18nKey: 'network.explorer.metroTampico',
    searchExtra: 'tampico madero altamira',
  },

  // ——— Acapulco ———
  {
    sourceStates: S(['Guerrero']),
    sourceCities: S(['Acapulco de Juárez', 'Acapulco']),
    canonical: { state: 'Guerrero', city: 'Acapulco (metrópoli)' },
    i18nKey: 'network.explorer.metroAcapulco',
    searchExtra: 'acapulco',
  },

  // ——— Morelia ———
  {
    sourceStates: S(['Michoacán', 'Michoacan']),
    sourceCities: S(['Morelia']),
    canonical: { state: 'Michoacán', city: 'Morelia (metrópoli)' },
    i18nKey: 'network.explorer.metroMorelia',
    searchExtra: 'morelia michoacan',
  },

  // ——— Oaxaca ———
  {
    sourceStates: S(['Oaxaca']),
    sourceCities: S(['Oaxaca de Juárez', 'Oaxaca', 'Santa Lucía del Camino', 'Santa Lucia del Camino']),
    canonical: { state: 'Oaxaca', city: 'Oaxaca (metrópoli)' },
    i18nKey: 'network.explorer.metroOaxaca',
    searchExtra: 'oaxaca',
  },

  // ——— Cuernavaca ———
  {
    sourceStates: S(['Morelos']),
    sourceCities: S(['Cuernavaca', 'Jiutepec', 'Temixco', 'Emiliano Zapata']),
    canonical: { state: 'Morelos', city: 'Cuernavaca (metrópoli)' },
    i18nKey: 'network.explorer.metroCuernavaca',
    searchExtra: 'cuernavaca morelos',
  },

  // ——— Pachuca ———
  {
    sourceStates: S(['Hidalgo']),
    sourceCities: S(['Pachuca', 'Mineral de la Reforma', 'San Agustín Tlaxiaca']),
    canonical: { state: 'Hidalgo', city: 'Pachuca (metrópoli)' },
    i18nKey: 'network.explorer.metroPachuca',
    searchExtra: 'pachuca hidalgo',
  },

  // ——— San Luis Potosí ———
  {
    sourceStates: S(['San Luis Potosí', 'San Luis Potosi']),
    sourceCities: S([
      'San Luis Potosí',
      'San Luis Potosi',
      'Soledad de Graciano Sánchez',
      'Soledad de Graciano Sanchez',
    ]),
    canonical: { state: 'San Luis Potosí', city: 'San Luis Potosí (metrópoli)' },
    i18nKey: 'network.explorer.metroSanLuisPotosi',
    searchExtra: 'san luis potosi slp',
  },

  // ——— Tepic ———
  {
    sourceStates: S(['Nayarit']),
    sourceCities: S(['Tepic', 'Xalisco']),
    canonical: { state: 'Nayarit', city: 'Tepic (metrópoli)' },
    i18nKey: 'network.explorer.metroTepic',
    searchExtra: 'tepic nayarit',
  },

  // ——— Campeche ———
  {
    sourceStates: S(['Campeche']),
    sourceCities: S(['Campeche', 'San Francisco de Campeche']),
    canonical: { state: 'Campeche', city: 'Campeche (metrópoli)' },
    i18nKey: 'network.explorer.metroCampeche',
    searchExtra: 'campeche',
  },

  // ——— La Paz (BCS) ———
  {
    sourceStates: S(['Baja California Sur']),
    sourceCities: S(['La Paz']),
    canonical: { state: 'Baja California Sur', city: 'La Paz (metrópoli)' },
    i18nKey: 'network.explorer.metroLaPazBcs',
    searchExtra: 'la paz bcs',
  },

  // ——— Los Cabos ———
  {
    sourceStates: S(['Baja California Sur']),
    sourceCities: S(['Los Cabos', 'Cabo San Lucas', 'San José del Cabo', 'San Jose del Cabo']),
    canonical: { state: 'Baja California Sur', city: 'Los Cabos' },
    i18nKey: 'network.explorer.metroLosCabos',
    searchExtra: 'cabo los cabos',
  },

  // ——— Zacatecas ———
  {
    sourceStates: S(['Zacatecas']),
    sourceCities: S(['Zacatecas', 'Guadalupe']),
    canonical: { state: 'Zacatecas', city: 'Zacatecas (metrópoli)' },
    i18nKey: 'network.explorer.metroZacatecas',
    searchExtra: 'zacatecas guadalupe zacatecas',
  },

  // ——— Durango capital ———
  {
    sourceStates: S(['Durango']),
    sourceCities: S(['Durango', 'Victoria de Durango']),
    canonical: { state: 'Durango', city: 'Durango (metrópoli)' },
    i18nKey: 'network.explorer.metroDurango',
    searchExtra: 'durango capital',
  },

  // ——— Colima ———
  {
    sourceStates: S(['Colima']),
    sourceCities: S(['Colima', 'Villa de Álvarez', 'Villa de Alvarez']),
    canonical: { state: 'Colima', city: 'Colima (metrópoli)' },
    i18nKey: 'network.explorer.metroColima',
    searchExtra: 'colima',
  },

  // ——— Tuxtla Gutiérrez ———
  {
    sourceStates: S(['Chiapas']),
    sourceCities: S(['Tuxtla Gutiérrez', 'Tuxtla Gutierrez']),
    canonical: { state: 'Chiapas', city: 'Tuxtla Gutiérrez (metrópoli)' },
    i18nKey: 'network.explorer.metroTuxtla',
    searchExtra: 'tuxtla chiapas',
  },

  // ——— Tapachula ———
  {
    sourceStates: S(['Chiapas']),
    sourceCities: S(['Tapachula']),
    canonical: { state: 'Chiapas', city: 'Tapachula (metrópoli)' },
    i18nKey: 'network.explorer.metroTapachula',
    searchExtra: 'tapachula',
  },

  // ——— Poza Rica ———
  {
    sourceStates: S(['Veracruz']),
    sourceCities: S(['Poza Rica de Hidalgo', 'Poza Rica']),
    canonical: { state: 'Veracruz', city: 'Poza Rica (metrópoli)' },
    i18nKey: 'network.explorer.metroPozaRica',
    searchExtra: 'poza rica',
  },
];

function canonicalGeoId(state: string, city: string): string {
  return `${CANONICAL_COUNTRY_MEXICO}||${String(state).trim()}||${String(city).trim()}`.toLowerCase();
}

/** id stable → clé i18n pour libellé du sélecteur */
const METRO_CANONICAL_ID_TO_I18N: Map<string, string> = new Map();
const METRO_CANONICAL_ID_TO_SEARCH: Map<string, string> = new Map();

for (const r of METRO_RULES_ORDERED) {
  const id = canonicalGeoId(r.canonical.state, r.canonical.city);
  METRO_CANONICAL_ID_TO_I18N.set(id, r.i18nKey);
  METRO_CANONICAL_ID_TO_SEARCH.set(id, r.searchExtra);
}

function canonicalizeCountryForGeo(country: string): string {
  const c = String(country ?? '').trim();
  if (!c) return c;
  if (countryMeansMexico(c)) return CANONICAL_COUNTRY_MEXICO;
  return c;
}

/** Identique à `geoDirectory.geoId` pour un pays canonique mexicain. */
export function metroGeoIdLike(g: MetroGeoInput): string {
  const country = canonicalizeCountryForGeo(g.country);
  const state = String(g.state ?? '').trim();
  const city = String(g.city ?? '').trim();
  return `${country}||${state}||${city}`.toLowerCase();
}

/**
 * Clé i18n si ce triplet est une métropole canonique, sinon null.
 */
export function metroPickerLabelKey(g: MetroGeoInput): string | null {
  const c = canonicalizeCountryForGeo(g.country);
  if (normalizeLocationToken(c) !== 'mexico') return null;
  const id = metroGeoIdLike({ country: CANONICAL_COUNTRY_MEXICO, state: g.state, city: g.city });
  return METRO_CANONICAL_ID_TO_I18N.get(id) ?? null;
}

export function metroGeoSearchExtra(g: MetroGeoInput): string {
  const c = canonicalizeCountryForGeo(g.country);
  if (normalizeLocationToken(c) !== 'mexico') return '';
  const id = metroGeoIdLike({ country: CANONICAL_COUNTRY_MEXICO, state: g.state, city: g.city });
  return METRO_CANONICAL_ID_TO_SEARCH.get(id) ?? '';
}

export function collapseGeoForDirectory(g: MetroGeoInput): MetroGeoInput {
  const country = canonicalizeCountryForGeo(g.country);
  const stateRaw = String(g.state ?? '').trim();
  const cityRaw = String(g.city ?? '').trim();
  const stateN = normalizeLocationToken(stateRaw);
  const cityN = normalizeLocationToken(cityRaw);

  if (!countryMeansMexico(g.country)) {
    return { country, state: stateRaw, city: cityRaw };
  }

  for (const rule of METRO_RULES_ORDERED) {
    if (rule.sourceStates.has(stateN) && rule.sourceCities.has(cityN)) {
      return {
        country: CANONICAL_COUNTRY_MEXICO,
        state: rule.canonical.state,
        city: rule.canonical.city,
      };
    }
  }

  return { country, state: stateRaw, city: cityRaw };
}

/** @deprecated Utiliser `metroPickerLabelKey` */
export function isGuadalajaraZmgCanonicalGeo(g: MetroGeoInput): boolean {
  return metroPickerLabelKey(g) === 'network.explorer.metroGuadalajaraZmg';
}
