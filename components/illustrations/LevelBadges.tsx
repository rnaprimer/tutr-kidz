import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LevelId } from '../../types/level';
import { LEVEL_THEMES } from '../../constants/theme';

interface LevelBadgeProps {
  levelId: LevelId;
  size?: 'normal' | 'large';
}

export const LevelBadge: React.FC<LevelBadgeProps> = ({
  levelId,
  size = 'normal',
}) => {
  const theme = LEVEL_THEMES[levelId] || LEVEL_THEMES.toddler;
  const isLarge = size === 'large';
  const dimension = isLarge ? 56 : 44;
  const fontSize = isLarge ? 26 : 22;

  return (
    <View
      style={[
        styles.container,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension * 0.42,
          backgroundColor: theme.badgeBg,
          borderColor: theme.borderColor,
        },
      ]}
    >
      <Text style={[styles.emblem, { fontSize }]}>{theme.emblem}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
    elevation: 1,
  },
  emblem: {
    textAlign: 'center',
  },
});
