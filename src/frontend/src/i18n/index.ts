/**
 * Configuración de Internacionalización (i18n)
 * 
 * Sistema de traducciones por módulo usando i18next.
 * Cada módulo tiene su propio archivo de traducción.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Traducciones comunes
import esCommon from './locales/es/common.json';
import enCommon from './locales/en/common.json';

// Traducciones de módulos
import esReservoirs from './locales/es/reservoirs.json';
import enReservoirs from './locales/en/reservoirs.json';
import esBasins from './locales/es/basins.json';
import esFields from './locales/es/fields.json';
import esWells from './locales/es/wells.json';

// Estructura de recursos por idioma
const resources = {
  es: {
    common: esCommon,
    reservoirs: esReservoirs,
    basins: esBasins,
    fields: esFields,
    wells: esWells,
  },
  en: {
    common: enCommon,
    reservoirs: enReservoirs,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'es',
    supportedLngs: ['es', 'en'],
    defaultNS: 'common',
    ns: ['common', 'reservoirs', 'basins', 'fields', 'wells'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

/**
 * Función para cargar traducciones de un módulo dinámicamente
 * 
 * @example
 * // En el componente del módulo
 * useEffect(() => {
 *   loadModuleTranslations('wells');
 * }, []);
 */
export const loadModuleTranslations = async (moduleName: string) => {
  try {
    // Cargar traducciones ES
    const esModule = await import(`./locales/es/${moduleName}.json`);
    i18n.addResourceBundle('es', moduleName, esModule.default, true, true);

    // Cargar traducciones EN
    const enModule = await import(`./locales/en/${moduleName}.json`);
    i18n.addResourceBundle('en', moduleName, enModule.default, true, true);
  } catch (error) {
    console.warn(`No translations found for module: ${moduleName}`);
  }
};

/**
 * Cambiar idioma
 */
export const changeLanguage = (lng: 'es' | 'en') => {
  i18n.changeLanguage(lng);
};

/**
 * Obtener idioma actual
 */
export const getCurrentLanguage = () => {
  return i18n.language || 'es';
};

export default i18n;
