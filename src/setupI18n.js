import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './i18n/en.json';
import it from './i18n/it.json';

const LANG_KEY = 'caritas_lang';
const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(LANG_KEY) : null;
const initialLng = saved === 'en' || saved === 'it' ? saved : 'en';

void i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      it: { translation: it }
    },
    lng: initialLng,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

i18n.on('languageChanged', (lng) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(LANG_KEY, lng);
  }
});

export default i18n;

