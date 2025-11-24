import { useLanguage } from '@/context/LanguageContext';
import { AVAILABLE_COLORS, useThemeColor } from '@/context/ThemeContext';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity } from 'react-native';

import { FadeInView } from '@/components/FadeInView';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';
import { Storage } from '@/utils/storage';

export default function ConfigurationScreen() {
    const { i18n, language, setLanguage } = useLanguage();
    const { primaryColor, setPrimaryColor } = useThemeColor();
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    const handleExportData = async () => {
        try {
            setIsExporting(true);
            const data = await Storage.exportData();
            const jsonString = JSON.stringify(data, null, 2);
            const fileName = `yonkistats_backup_${new Date().toISOString().split('T')[0]}.json`;

            // Create file using new API
            const file = new File(Paths.document, fileName);
            await file.create();
            await file.write(jsonString);

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(file.uri);
                Alert.alert(i18n.t('common.success'), i18n.t('configuration.exportSuccess'));
            } else {
                Alert.alert(i18n.t('common.error'), i18n.t('configuration.exportError'));
            }
        } catch (error) {
            console.error('Export error:', error);
            Alert.alert(i18n.t('common.error'), i18n.t('configuration.exportError'));
        } finally {
            setIsExporting(false);
        }
    };

    const handleImportData = async () => {
        try {
            // Show warning first
            Alert.alert(
                i18n.t('configuration.importData'),
                i18n.t('configuration.importWarning'),
                [
                    {
                        text: i18n.t('common.cancel'),
                        style: 'cancel',
                    },
                    {
                        text: i18n.t('common.done'),
                        onPress: async () => {
                            try {
                                setIsImporting(true);
                                const result = await DocumentPicker.getDocumentAsync({
                                    type: 'application/json',
                                    copyToCacheDirectory: true,
                                });

                                if (result.canceled) {
                                    setIsImporting(false);
                                    return;
                                }

                                // Read file using new API
                                const file = new File(result.assets[0].uri);
                                const fileContent = await file.text();
                                const data = JSON.parse(fileContent);

                                await Storage.importData(data);
                                Alert.alert(i18n.t('common.success'), i18n.t('configuration.importSuccess'));

                                // Reload the app to show new data
                                // Note: You might want to add a refresh mechanism or navigate to home
                            } catch (error: any) {
                                console.error('Import error:', error);
                                if (error.message === 'Invalid data format' || error.message === 'Invalid entry format') {
                                    Alert.alert(i18n.t('common.error'), i18n.t('configuration.importInvalidFormat'));
                                } else {
                                    Alert.alert(i18n.t('common.error'), i18n.t('configuration.importError'));
                                }
                            } finally {
                                setIsImporting(false);
                            }
                        },
                    },
                ]
            );
        } catch (error) {
            console.error('Import setup error:', error);
            Alert.alert(i18n.t('common.error'), i18n.t('configuration.importError'));
        }
    };

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

                <ThemedView style={styles.configSection}>
                    <ThemedText type="subtitle">{i18n.t('configuration.dataManagement')}</ThemedText>
                    <ThemedView style={styles.optionContainer}>
                        <TouchableOpacity
                            style={[
                                styles.dataButton,
                                { borderColor: primaryColor },
                            ]}
                            onPress={handleExportData}
                            disabled={isExporting}>
                            <IconSymbol
                                size={20}
                                color={primaryColor}
                                name="arrow.up.doc"
                            />
                            <ThemedText style={[styles.dataButtonText, { color: primaryColor }]}>
                                {isExporting ? '...' : i18n.t('configuration.exportData')}
                            </ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.dataButton,
                                { borderColor: primaryColor },
                            ]}
                            onPress={handleImportData}
                            disabled={isImporting}>
                            <IconSymbol
                                size={20}
                                color={primaryColor}
                                name="arrow.down.doc"
                            />
                            <ThemedText style={[styles.dataButtonText, { color: primaryColor }]}>
                                {isImporting ? '...' : i18n.t('configuration.importData')}
                            </ThemedText>
                        </TouchableOpacity>
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
        flexWrap: 'wrap',
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
    dataButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 2,
        minWidth: 150,
    },
    dataButtonText: {
        fontWeight: '600',
    },
});
