import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Easing, TouchableOpacity, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { CategoryColors } from '../constants/Colors';
import { useThemeColor } from '../context/ThemeContext';

interface HeatmapProps {
    entries: any[];
    numDays?: number;
    endDate?: Date;
    onDayPress?: (date: Date, dayEntries: any[], position: { x: number; y: number }) => void;
}

function getCategoryColor(category: string, primaryColor: string): string {
    return CategoryColors[category as keyof typeof CategoryColors] || primaryColor;
}

const AnimatedRect = Animated.createAnimatedComponent(Rect);

// AnimatedHeatmapCell now uses Animated.modulo for seamless color looping
const AnimatedHeatmapCell = React.memo(({
    x,
    y,
    cellSize,
    categories,
    intensity,
    primaryColor,
    index,
    sharedAnimValue,
}: {
    x: number;
    y: number;
    cellSize: number;
    categories: string[];
    intensity: number;
    primaryColor: string;
    index: number;
    sharedAnimValue: Animated.Value;
}) => {
    if (categories.length === 0) {
        return (
            <Rect
                x={x}
                y={y}
                width={cellSize}
                height={cellSize}
                rx={4}
                ry={4}
                fill="#2C2C2E"
                fillOpacity={1}
            />
        );
    }

    if (categories.length === 1) {
        const color = getCategoryColor(categories[0], primaryColor);
        const opacity = 0.3 + (0.7 * intensity);
        return (
            <Rect
                x={x}
                y={y}
                width={cellSize}
                height={cellSize}
                rx={4}
                ry={4}
                fill={color}
                fillOpacity={opacity}
            />
        );
    }

    // Multi-category: Animated color cycling, seamless loop!
    const colors = categories.map(cat => getCategoryColor(cat, primaryColor));
    const opacity = 0.3 + (0.7 * intensity);

    // Controls phase/wave: change waveLength for different effects
    const waveLength = 20;
    const N = categories.length;
    const phase = (index % waveLength) / waveLength;

    // For seamless looping, Animated.modulo(Animated.add(...), 1)
    const animatedPhase = Animated.modulo(
        Animated.add(sharedAnimValue, phase),
        1
    );

    // input/output ranges strictly monotonic: [0, 1/N, 2/N, ..., 1]
    const inputRange = colors.map((_, i) => i / N);
    inputRange.push(1);
    const outputRange = [...colors, colors[0]];

    const colorAnim = animatedPhase.interpolate({
        inputRange,
        outputRange,
        extrapolate: 'clamp',
    });

    return (
        <AnimatedRect
            x={x}
            y={y}
            width={cellSize}
            height={cellSize}
            rx={4}
            ry={4}
            fill={colorAnim}
            fillOpacity={opacity}
        />
    );
});

export default function Heatmap({ entries, numDays = 91, endDate = new Date(), onDayPress }: HeatmapProps) {
    const { primaryColor } = useThemeColor();
    const screenWidth = Dimensions.get('window').width;
    const gutter = 4;
    const padding = 64;

    // Calculate start date and day offset
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (numDays - 1));
    const startDay = startDate.getDay();

    // Number of week columns, and cell size
    const numWeeks = Math.ceil((numDays + startDay) / 7);
    const availableWidth = screenWidth - padding;
    const cellSize = (availableWidth - (numWeeks - 1) * gutter) / numWeeks;

    // Prepare heatmap cells and maxCategories
    const { cells, maxCategories } = useMemo(() => {
        const data: { [key: string]: { amount: number; entries: any[]; categories: Set<string> } } = {};
        let max = 0;
        let maxCats = 0;
        entries.forEach(e => {
            const dateStr = e.date.split('T')[0];
            if (!data[dateStr]) {
                data[dateStr] = { amount: 0, entries: [], categories: new Set() };
            }
            data[dateStr].amount += e.amountSpent;
            data[dateStr].entries.push(e);

            const cat = e.category || 'Other';
            data[dateStr].categories.add(cat);

            if (data[dateStr].amount > max) max = data[dateStr].amount;
            if (data[dateStr].categories.size > maxCats) maxCats = data[dateStr].categories.size;
        });

        const result = [];
        for (let i = numDays - 1; i >= 0; i--) {
            const d = new Date(endDate);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayData = data[dateStr] || { amount: 0, entries: [], categories: new Set() };

            result.push({
                date: d,
                amount: dayData.amount,
                entries: dayData.entries,
                intensity: max > 0 ? dayData.amount / max : 0,
                categories: Array.from(dayData.categories),
            });
        }
        return { cells: result, maxCategories: maxCats };
    }, [entries, numDays, endDate]);

    const gridCells = useMemo(() => cells.map((cell, index) => {
        const globalIndex = index + startDay;
        const col = Math.floor(globalIndex / 7);
        const row = globalIndex % 7;

        return {
            ...cell,
            x: col * (cellSize + gutter),
            y: row * (cellSize + gutter),
        };
    }), [cells, startDay, cellSize, gutter]);

    const width = numWeeks * (cellSize + gutter) - gutter;
    const height = 7 * (cellSize + gutter) - gutter;

    const handleDayPress = useCallback((cell: any, event: any) => {
        if (onDayPress) {
            onDayPress(cell.date, cell.entries, {
                x: event.nativeEvent.pageX - (cellSize / 2),
                y: event.nativeEvent.pageY - (cellSize / 2)
            });
        }
    }, [onDayPress, cellSize]);

    const sharedAnimValue = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        const duration = Math.max(1, maxCategories) * 2000;
        const anim = Animated.loop(
            Animated.timing(sharedAnimValue, {
                toValue: 1,
                duration,
                easing: Easing.linear,
                useNativeDriver: false,
            })
        );
        anim.start();
        return () => anim.stop();
    }, [sharedAnimValue, maxCategories]);

    return (
        <View style={{ alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <Svg width={width} height={height}>
                {gridCells.map((cell, index) => (
                    <AnimatedHeatmapCell
                        key={index}
                        x={cell.x}
                        y={cell.y}
                        cellSize={cellSize}
                        categories={cell.categories}
                        intensity={cell.intensity}
                        primaryColor={primaryColor}
                        index={index}
                        sharedAnimValue={sharedAnimValue}
                    />
                ))}
            </Svg>
            <View style={{ position: 'absolute', width, height }}>
                {gridCells.map((cell, index) => (
                    <TouchableOpacity
                        key={index}
                        style={{
                            position: 'absolute',
                            left: cell.x,
                            top: cell.y,
                            width: cellSize,
                            height: cellSize,
                        }}
                        onPress={(e) => handleDayPress(cell, e)}
                        activeOpacity={0.7}
                    />
                ))}
            </View>
        </View>
    );
}