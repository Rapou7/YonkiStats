import React, { useMemo, useEffect, useRef, useCallback } from 'react';
import { View, Dimensions, TouchableOpacity, Animated } from 'react-native';
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

// Component for animated cell
const AnimatedHeatmapCell = React.memo(({
    x,
    y,
    cellSize,
    categories,
    intensity,
    primaryColor,
    index
}: {
    x: number;
    y: number;
    cellSize: number;
    categories: string[];
    intensity: number;
    primaryColor: string;
    index: number;
}) => {
    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (categories.length > 1) {
            // Stagger the animation start based on index to create a wave effect
            const delay = (index % 10) * 200;

            const runAnimation = () => {
                animatedValue.setValue(0);
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(animatedValue, {
                        toValue: categories.length,
                        duration: categories.length * 2000, // 2 seconds per color
                        useNativeDriver: false,
                    }),
                ]).start((result) => {
                    if (result.finished) {
                        runAnimation(); // Loop by calling recursively
                    }
                });
            };

            runAnimation();

            return () => {
                animatedValue.stopAnimation();
            };
        }
    }, [categories.length, index]); // Removed animatedValue from deps as it's a ref

    if (categories.length === 0) {
        // Empty cell
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
        // Single category - no animation
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

    // Multiple categories - animate between colors
    const colors = categories.map(cat => getCategoryColor(cat, primaryColor));

    // Create interpolation ranges
    const inputRange = categories.map((_, i) => i);
    const opacity = 0.3 + (0.7 * intensity);

    const interpolatedColor = animatedValue.interpolate({
        inputRange: [...inputRange, categories.length],
        outputRange: [...colors, colors[0]], // Loop back to first color
    });

    return (
        <AnimatedRect
            x={x}
            y={y}
            width={cellSize}
            height={cellSize}
            rx={4}
            ry={4}
            fill={interpolatedColor}
            fillOpacity={opacity}
        />
    );
});

export default function Heatmap({ entries, numDays = 91, endDate = new Date(), onDayPress }: HeatmapProps) {
    const { primaryColor } = useThemeColor();
    const screenWidth = Dimensions.get('window').width;
    const gutter = 4;
    const padding = 64; // Total horizontal padding (Screen padding 32 + Card padding 32)

    // Calculate start date and its day of the week
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (numDays - 1));
    const startDay = startDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Calculate number of weeks to show, accounting for the offset
    const numWeeks = Math.ceil((numDays + startDay) / 7);

    // Calculate cell size to fit screen
    const availableWidth = screenWidth - padding;
    const cellSize = (availableWidth - (numWeeks - 1) * gutter) / numWeeks;

    const { cells } = useMemo(() => {
        const data: { [key: string]: { amount: number; entries: any[]; categories: Set<string> } } = {};
        let max = 0;

        entries.forEach(e => {
            const dateStr = e.date.split('T')[0];
            if (!data[dateStr]) {
                data[dateStr] = { amount: 0, entries: [], categories: new Set() };
            }
            data[dateStr].amount += e.amountSpent;
            data[dateStr].entries.push(e);

            // Track unique categories
            const cat = e.category || 'Other';
            data[dateStr].categories.add(cat);

            if (data[dateStr].amount > max) max = data[dateStr].amount;
        });

        const result = [];
        // Start from (numDays - 1) days ago
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
        return { cells: result, maxSpend: max };
    }, [entries, numDays, endDate]); // Removed unnecessary deps if endDate is stable, but keeping for safety

    const gridCells = useMemo(() => cells.map((cell, index) => {
        // Calculate column (week) and row (day of week) based on the start offset
        const globalIndex = index + startDay;
        const col = Math.floor(globalIndex / 7);
        const row = globalIndex % 7;

        return {
            ...cell,
            x: col * (cellSize + gutter),
            y: row * (cellSize + gutter),
        };
    }), [cells, startDay, cellSize, gutter]);

    // Calculate total width/height
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
                    />
                ))}
            </Svg>
            {/* Overlay touchable areas */}
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

