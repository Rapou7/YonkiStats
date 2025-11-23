import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/Colors';

interface ThemeContextType {
    primaryColor: string;
    setPrimaryColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const AVAILABLE_COLORS = [
    '#00E676', // Vibrant Green (Default)
    '#BB86FC', // Soft Purple
    '#03DAC6', // Teal
    '#CF6679', // Red/Pink
    '#3700B3', // Deep Purple
    '#FF9800', // Orange
];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [primaryColor, setPrimaryColorState] = useState(Colors.dark.primary);

    useEffect(() => {
        loadThemeColor();
    }, []);

    const loadThemeColor = async () => {
        try {
            const storedColor = await AsyncStorage.getItem('@yonkistats_theme_color');
            if (storedColor) {
                setPrimaryColorState(storedColor);
            }
        } catch (e) {
            console.error('Failed to load theme color', e);
        }
    };

    const setPrimaryColor = async (color: string) => {
        try {
            setPrimaryColorState(color);
            await AsyncStorage.setItem('@yonkistats_theme_color', color);
        } catch (e) {
            console.error('Failed to save theme color', e);
        }
    };

    return (
        <ThemeContext.Provider value={{ primaryColor, setPrimaryColor }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useThemeColor() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useThemeColor must be used within a ThemeProvider');
    }
    return context;
}
