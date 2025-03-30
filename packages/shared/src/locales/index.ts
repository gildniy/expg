import en from './en';
import ko from './ko';

export type Language = 'en' | 'ko';

export const languages: Record<Language, string> = {
  en: 'English',
  ko: '한국어',
};

export type Messages = typeof en;

export const messages: Record<Language, Messages> = {
  en,
  ko,
};

export { en, ko }; 