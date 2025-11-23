import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { en } from '../constants/languages/en';
import { es } from '../constants/languages/es';

type Language = 'en' | 'es';
type Translations = typeof en;

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    i18n: {
        t: (key: string) => string;
    };
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
    en,
    es,
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<Language>('en');

    useEffect(() => {
        loadLanguage();
    }, []);

    const loadLanguage = async () => {
        try {
            const storedLanguage = await AsyncStorage.getItem('@yonkistats_language');
            if (storedLanguage === 'en' || storedLanguage === 'es') {
                setLanguageState(storedLanguage);
            }
        } catch (e) {
            console.error('Failed to load language', e);
        }
    };

    const setLanguage = async (lang: Language) => {
        try {
            setLanguageState(lang);
            await AsyncStorage.setItem('@yonkistats_language', lang);
        } catch (e) {
            console.error('Failed to save language', e);
        }
    };

    const t = (key: string) => {
        const keys = key.split('.');
        let value: any = translations[language];

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k as keyof typeof value];
            } else {
                return key;
            }
        }

        return typeof value === 'string' ? value : key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, i18n: { t } }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
