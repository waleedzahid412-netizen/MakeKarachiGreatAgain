import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from './i18n/en.json';
import urTranslation from './i18n/ur.json';
import './index.css';
import App from './App.tsx';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation },
      ur: { translation: urTranslation }
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
