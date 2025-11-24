import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { StaggeredFadeInView } from '../../components/StaggeredFadeInView';
import { Colors } from '../../constants/Colors';
import { useLanguage } from '../../context/LanguageContext';
import { useThemeColor } from '../../context/ThemeContext';
import { Entry, Storage } from '../../utils/storage';

type Period = '7d' | '30d' | '90d';

export default function StatsScreen() {
    const { i18n, language } = useLanguage();
    const { primaryColor } = useThemeColor();
    const [entries, setEntries] = useState<Entry[]>([]);
    const [period, setPeriod] = useState<Period>('7d');
    const [displayedPeriod, setDisplayedPeriod] = useState<Period>('7d');
    const [scrollEnabled, setScrollEnabled] = useState(true);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    const [viewKey, setViewKey] = useState(0);

    const loadData = async () => {
        const data = await Storage.getEntries();
        setEntries(data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    };

    useFocusEffect(
        useCallback(() => {
            setViewKey(k => k + 1);
            loadData();
        }, [])
    );

    // Fade animation when period changes
    useEffect(() => {
        if (period !== displayedPeriod) {
            Animated.sequence([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                // Update the displayed period after fade-out completes
                setDisplayedPeriod(period);
                // Then fade back in after a small delay to let the chart render
                setTimeout(() => {
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    }).start();
                }, 50);
            });
        }
    }, [period, displayedPeriod, fadeAnim]);

    const getFilteredEntries = useCallback((days: number) => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return entries.filter(e => new Date(e.date) >= cutoff);
    }, [entries]);

    // Cumulative Chart Data Generation
    const chartData = useMemo(() => {
        const days = displayedPeriod === '7d' ? 7 : displayedPeriod === '30d' ? 30 : 90;
        const filtered = getFilteredEntries(days);

        // 1. Create a map of all dates in the period initialized to 0
        const dailyMap: { [key: string]: number } = {};

        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            dailyMap[dateStr] = 0;
        }

        // 2. Fill in actual spending
        filtered.forEach(e => {
            const dateStr = e.date.split('T')[0];
            if (dailyMap[dateStr] !== undefined) {
                dailyMap[dateStr] += e.amountSpent;
            }
        });

        // 3. Calculate Running Total and format for Gifted Charts
        const dataPoints: { value: number, label?: string, date: string }[] = [];
        let runningTotal = 0;
        const sortedDates = Object.keys(dailyMap).sort();
        const locale = language === 'es' ? 'es-ES' : 'en-US';

        sortedDates.forEach((date, index) => {
            runningTotal += dailyMap[date];
            const d = new Date(date);

            // Add labels sparingly based on period
            let label = undefined;
            if (displayedPeriod === '7d') {
                label = d.toLocaleDateString(locale, { weekday: 'short' });
            } else if (displayedPeriod === '30d' && index % 3 === 0) {
                label = d.toLocaleDateString(locale, { day: 'numeric' });
            } else if (displayedPeriod === '90d' && index % 15 === 0) {
                label = d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
            }

            dataPoints.push({
                value: runningTotal,
                label: label,
                date: d.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
            });
        });

        if (dataPoints.length === 0) {
            return [{ value: 0, date: new Date().toLocaleDateString(locale) }];
        }

        return dataPoints;
    }, [displayedPeriod, getFilteredEntries]);

    const screenWidth = Dimensions.get('window').width;

    const totals = useMemo(() => {
        const calculate = (days: number) => getFilteredEntries(days).reduce((sum, e) => sum + e.amountSpent, 0);
        return {
            d7: calculate(7),
            d30: calculate(30),
            d90: calculate(90)
        };
    }, [getFilteredEntries]);

    const currentTotal = period === '7d' ? totals.d7 : period === '30d' ? totals.d30 : totals.d90;

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content} scrollEnabled={scrollEnabled}>
                <StaggeredFadeInView key={`title-${viewKey}`} delay={0}>
                    <Text style={styles.title}>{i18n.t('stats.title')}</Text>
                </StaggeredFadeInView>

                {/* Period Selector */}
                <StaggeredFadeInView key={`period-${viewKey}`} delay={50}>
                    <View style={styles.periodSelector}>
                        {(['7d', '30d', '90d'] as Period[]).map((p) => (
                            <TouchableOpacity
                                key={p}
                                style={[styles.periodButton, period === p && { backgroundColor: primaryColor, shadowColor: primaryColor }]}
                                onPress={() => setPeriod(p)}
                            >
                                <Text style={[styles.periodButtonText, period === p && styles.periodButtonTextActive]}>
                                    {p.toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </StaggeredFadeInView>

                {/* Main Chart */}
                <StaggeredFadeInView key={`chart-${viewKey}`} delay={100}>
                    <View style={styles.chartCard}>
                        <Text style={styles.chartTitle}>{i18n.t('stats.totalSpent')} {currentTotal.toFixed(2).replace('.', ',')} €</Text>
                        <Animated.View
                            style={[{ opacity: fadeAnim }]}
                            onTouchStart={() => setScrollEnabled(false)}
                            onTouchEnd={() => setScrollEnabled(true)}
                        >
                            <LineChart
                                key={displayedPeriod}
                                data={chartData}
                                areaChart
                                isAnimated={false}
                                startFillColor={primaryColor}
                                startOpacity={0.8}
                                endFillColor={primaryColor}
                                endOpacity={0.3}
                                color={primaryColor}
                                thickness={3}
                                hideDataPoints={displayedPeriod !== '7d'}
                                dataPointsColor={primaryColor}
                                dataPointsRadius={4}
                                width={screenWidth - 70}
                                height={220}
                                spacing={displayedPeriod === '7d' ? (screenWidth - 110) / 7 : displayedPeriod === '30d' ? (screenWidth - 110) / 30 : (screenWidth - 110) / 90}
                                initialSpacing={10}
                                endSpacing={10}
                                noOfSections={4}
                                yAxisThickness={0}
                                xAxisThickness={0}
                                yAxisTextStyle={{ color: Colors.dark.textSecondary, fontSize: 11 }}
                                xAxisLabelTextStyle={{ color: Colors.dark.textSecondary, fontSize: displayedPeriod === '7d' ? 11 : 10, width: 40, textAlign: 'center' }}
                                yAxisLabelWidth={40}
                                hideRules
                                pointerConfig={{
                                    pointerStripHeight: 160,
                                    pointerStripColor: 'lightgray',
                                    pointerStripWidth: 2,
                                    pointerColor: 'lightgray',
                                    radius: 6,
                                    pointerLabelWidth: 100,
                                    pointerLabelHeight: 90,
                                    activatePointersOnLongPress: false,
                                    autoAdjustPointerLabelPosition: false,
                                    pointerLabelComponent: (items: any) => {
                                        return (
                                            <View
                                                style={{
                                                    height: 90,
                                                    width: 100,
                                                    justifyContent: 'center',
                                                    marginTop: -30,
                                                    marginLeft: -40,
                                                }}>
                                                <View style={{ padding: 6, borderRadius: 8, backgroundColor: '#333', opacity: 0.9 }}>
                                                    <Text style={{ color: 'white', fontSize: 10, marginBottom: 4, textAlign: 'center' }}>{items[0].date}</Text>
                                                    <Text style={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>{items[0].value.toFixed(2).replace('.', ',')} €</Text>
                                                </View>
                                            </View>
                                        );
                                    },
                                }}
                            />
                        </Animated.View>
                    </View>
                </StaggeredFadeInView>

                {/* Detailed Stats */}
                <StaggeredFadeInView key={`breakdown-${viewKey}`} delay={150}>
                    <Text style={styles.sectionTitle}>{i18n.t('stats.periodBreakdown')}</Text>
                </StaggeredFadeInView>

                <StaggeredFadeInView key={`grid-${viewKey}`} delay={200}>
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>{i18n.t('stats.days7')}</Text>
                            <Text style={styles.statValue}>{totals.d7.toFixed(2).replace('.', ',')} €</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>{i18n.t('stats.days30')}</Text>
                            <Text style={styles.statValue}>{totals.d30.toFixed(2).replace('.', ',')} €</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>{i18n.t('stats.days90')}</Text>
                            <Text style={styles.statValue}>{totals.d90.toFixed(2).replace('.', ',')} €</Text>
                        </View>
                    </View>
                </StaggeredFadeInView>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    content: {
        padding: 20,
        paddingTop: 60,
    },
    title: {
        color: Colors.dark.text,
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 24,
    },
    periodSelector: {
        flexDirection: 'row',
        backgroundColor: '#2C2C2E', // Lighter than background
        borderRadius: 16,
        padding: 4,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    periodButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 12,
    },
    periodButtonText: {
        color: Colors.dark.textSecondary,
        fontWeight: '600',
        fontSize: 14,
    },
    periodButtonTextActive: {
        color: '#000',
        fontWeight: 'bold',
    },
    chartCard: {
        backgroundColor: Colors.dark.surface,
        borderRadius: 24,
        padding: 16,
        marginBottom: 32,
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    chartTitle: {
        color: Colors.dark.text,
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        alignSelf: 'flex-start',
        marginLeft: 8
    },
    sectionTitle: {
        color: Colors.dark.text,
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    statCard: {
        backgroundColor: Colors.dark.surface,
        borderRadius: 16,
        padding: 16,
        width: '31%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.dark.border,
    },
    statLabel: {
        color: Colors.dark.textSecondary,
        fontSize: 12,
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statValue: {
        color: Colors.dark.text,
        fontSize: 20,
        fontWeight: 'bold'
    }
});
