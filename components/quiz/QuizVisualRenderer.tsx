import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { QuizVisual, QuizShapeType } from '../../types/quiz';
import { colors } from '../../constants/colors';

interface QuizVisualRendererProps {
  visual: QuizVisual;
  size?: 'normal' | 'large';
}

export const QuizVisualRenderer: React.FC<QuizVisualRendererProps> = ({
  visual,
  size = 'normal',
}) => {
  const isLarge = size === 'large';
  const baseDim = isLarge ? 56 : 44;

  switch (visual.type) {
    case 'color':
      return (
        <View
          style={[
            styles.colorSwatch,
            {
              width: baseDim,
              height: baseDim,
              borderRadius: baseDim / 2,
              backgroundColor: visual.value,
            },
          ]}
        />
      );

    case 'shape':
      return renderShape(visual.value, visual.color || colors.accent, baseDim);

    case 'emoji':
      return (
        <Text style={[styles.emoji, isLarge && styles.emojiLarge]}>
          {visual.value}
        </Text>
      );

    case 'objects': {
      const items = Array.from({ length: visual.count }, (_, i) => i);
      return (
        <View style={styles.objectsRow}>
          {items.map((idx) => (
            <Text
              key={idx}
              style={[styles.objectItem, isLarge && styles.objectItemLarge]}
            >
              {visual.item}
            </Text>
          ))}
        </View>
      );
    }

    default:
      return null;
  }
};

function renderShape(shape: QuizShapeType, shapeColor: string, dim: number) {
  switch (shape) {
    case 'circle':
      return (
        <View
          style={{
            width: dim,
            height: dim,
            borderRadius: dim / 2,
            backgroundColor: shapeColor,
          }}
        />
      );

    case 'square':
      return (
        <View
          style={{
            width: dim,
            height: dim,
            borderRadius: 8,
            backgroundColor: shapeColor,
          }}
        />
      );

    case 'rectangle':
      return (
        <View
          style={{
            width: dim * 1.35,
            height: dim * 0.75,
            borderRadius: 8,
            backgroundColor: shapeColor,
          }}
        />
      );

    case 'triangle':
      return (
        <View
          style={{
            width: 0,
            height: 0,
            backgroundColor: 'transparent',
            borderStyle: 'solid',
            borderLeftWidth: dim / 2,
            borderRightWidth: dim / 2,
            borderBottomWidth: dim * 0.9,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: shapeColor,
          }}
        />
      );

    case 'star':
      return (
        <Text
          style={{
            fontSize: dim * 0.95,
            color: shapeColor,
            lineHeight: dim,
            textAlign: 'center',
          }}
        >
          ★
        </Text>
      );

    default:
      return null;
  }
}

const styles = StyleSheet.create({
  colorSwatch: {
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    elevation: 2,
  },
  emoji: {
    fontSize: 32,
    textAlign: 'center',
  },
  emojiLarge: {
    fontSize: 48,
  },
  objectsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  objectItem: {
    fontSize: 34,
  },
  objectItemLarge: {
    fontSize: 42,
  },
});
