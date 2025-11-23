import { Image } from 'expo-image';
import { Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { useLanguage } from '@/context/LanguageContext';
import { useThemeColor, AVAILABLE_COLORS } from '@/context/ThemeContext';

import { Collapsible } from '@/components/ui/collapsible';
import { ExternalLink } from '@/components/external-link';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';
import { FadeInView } from '@/components/FadeInView';

export default function ConfigurationScreen() {
    const { i18n, language, setLanguage } = useLanguage();
    const { primaryColor, setPrimaryColor } = useThemeColor();

    return (
        <FadeInView style={{ flex: 1 }}>
            <ParallaxScrollView
                headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
                headerImage={
                    <IconSymbol
                        size={310}
                        color="#808080"
                        name="gear"
                        style={styles.headerImage}
                    />
                }>
                <ThemedView style={styles.titleContainer}>
                    <ThemedText
                        type="title"
                        style={{
                            fontFamily: Fonts.rounded,
                        }}>
                        {i18n.t('configuration.title')}
                    </ThemedText>
                </ThemedView>

                <ThemedView style={styles.configSection}>
                    <ThemedText type="subtitle">{i18n.t('configuration.language')}</ThemedText>
                    <ThemedView style={styles.optionContainer}>
                        <TouchableOpacity
                            style={[
                                styles.optionButton,
                                language === 'en' && { backgroundColor: primaryColor },
                            ]}
                            onPress={() => setLanguage('en')}>
                            <ThemedText style={language === 'en' ? styles.selectedText : styles.unselectedText}>
                                English
                            </ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.optionButton,
                                language === 'es' && { backgroundColor: primaryColor },
                            ]}
                            onPress={() => setLanguage('es')}>
                            <ThemedText style={language === 'es' ? styles.selectedText : styles.unselectedText}>
                                Español
                            </ThemedText>
                        </TouchableOpacity>
                    </ThemedView>
                </ThemedView>

                <ThemedView style={styles.configSection}>
                    <ThemedText type="subtitle">{i18n.t('configuration.themeColor')}</ThemedText>
                    <ThemedView style={styles.colorContainer}>
                        {AVAILABLE_COLORS.map((color) => (
                            <TouchableOpacity
                                key={color}
                                style={[
                                    styles.colorCircle,
                                    { backgroundColor: color },
                                    primaryColor === color && styles.selectedColor,
                                ]}
                                onPress={() => setPrimaryColor(color)}
                            />
                        ))}
                    </ThemedView>
                </ThemedView>
            </ParallaxScrollView>
        </FadeInView>
    );
}

const styles = StyleSheet.create({
    headerImage: {
        color: '#808080',
        bottom: -90,
        left: -35,
        position: 'absolute',
    },
    titleContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    configSection: {
        marginVertical: 10,
        gap: 10,
    },
    optionContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    optionButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#333',
    },
    selectedText: {
        color: '#000',
        fontWeight: 'bold',
    },
    unselectedText: {
        color: '#FFF',
    },
    colorContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 15,
    },
    colorCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    selectedColor: {
        borderColor: '#FFF',
    },
});
