import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export type MascotPose =
  | 'welcoming'
  | 'thinking'
  | 'celebrating'
  | 'peaceful'
  | 'reading'
  | 'toddler';

interface MascotCharacterProps {
  pose?: MascotPose;
  size?: 'small' | 'medium' | 'large';
}

export const MascotCharacter: React.FC<MascotCharacterProps> = ({
  pose = 'welcoming',
  size = 'medium',
}) => {
  const scale = size === 'small' ? 0.75 : size === 'large' ? 1.25 : 1.0;

  const baseSize = 88 * scale;
  const earSize = 22 * scale;
  const eyeSize = 9 * scale;
  const blushSize = 14 * scale;

  return (
    <View style={[styles.container, { width: baseSize + 30 * scale, height: baseSize + 25 * scale }]}>
      {/* Ambient Cloud Base / Rug */}
      <View
        style={[
          styles.cloudShadow,
          {
            width: baseSize + 24 * scale,
            height: 18 * scale,
            borderRadius: 9 * scale,
            bottom: 2 * scale,
          },
        ]}
      />

      {/* Floating Little Props based on Pose */}
      {pose === 'thinking' && (
        <View style={[styles.overheadProp, { top: -6 * scale }]}>
          <Text style={{ fontSize: 18 * scale }}>💡</Text>
        </View>
      )}

      {pose === 'celebrating' && (
        <View style={[styles.overheadProp, { top: -8 * scale }]}>
          <Text style={{ fontSize: 20 * scale }}>✨</Text>
        </View>
      )}

      {pose === 'welcoming' && (
        <View style={[styles.overheadProp, { top: -4 * scale, right: 4 * scale }]}>
          <Text style={{ fontSize: 16 * scale }}>⭐</Text>
        </View>
      )}

      {/* Ears */}
      <View style={styles.earsRow}>
        <View
          style={[
            styles.ear,
            styles.earLeft,
            {
              width: earSize,
              height: earSize,
              borderRadius: earSize / 2,
              top: 6 * scale,
              left: 16 * scale,
            },
          ]}
        />
        <View
          style={[
            styles.ear,
            styles.earRight,
            {
              width: earSize,
              height: earSize,
              borderRadius: earSize / 2,
              top: 6 * scale,
              right: 16 * scale,
            },
          ]}
        />
      </View>

      {/* Body / Head */}
      <View
        style={[
          styles.body,
          {
            width: baseSize,
            height: baseSize,
            borderRadius: baseSize * 0.44,
          },
          pose === 'toddler' && { backgroundColor: '#FDE047' },
          pose === 'celebrating' && { backgroundColor: '#FBCFE8' },
        ]}
      >
        {/* Face Elements */}
        <View style={[styles.face, { marginTop: 26 * scale }]}>
          {/* Eyes */}
          <View style={[styles.eyesRow, { gap: 26 * scale }]}>
            {pose === 'peaceful' ? (
              <>
                <Text style={{ fontSize: 13 * scale, fontWeight: '800', color: '#374151' }}>◠</Text>
                <Text style={{ fontSize: 13 * scale, fontWeight: '800', color: '#374151' }}>◠</Text>
              </>
            ) : pose === 'celebrating' ? (
              <>
                <Text style={{ fontSize: 14 * scale, fontWeight: '800', color: '#374151' }}>^</Text>
                <Text style={{ fontSize: 14 * scale, fontWeight: '800', color: '#374151' }}>^</Text>
              </>
            ) : (
              <>
                <View
                  style={[
                    styles.eye,
                    {
                      width: eyeSize,
                      height: eyeSize,
                      borderRadius: eyeSize / 2,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.eye,
                    {
                      width: eyeSize,
                      height: eyeSize,
                      borderRadius: eyeSize / 2,
                    },
                  ]}
                />
              </>
            )}
          </View>

          {/* Rosy Cheeks */}
          <View style={[styles.blushRow, { gap: 40 * scale, marginTop: 4 * scale }]}>
            <View
              style={[
                styles.blush,
                {
                  width: blushSize,
                  height: blushSize * 0.7,
                  borderRadius: blushSize / 2,
                },
              ]}
            />
            <View
              style={[
                styles.blush,
                {
                  width: blushSize,
                  height: blushSize * 0.7,
                  borderRadius: blushSize / 2,
                },
              ]}
            />
          </View>

          {/* Sweet Smile */}
          <View style={[styles.mouth, { marginTop: -2 * scale }]}>
            <Text style={{ fontSize: 10 * scale, color: '#374151', fontWeight: '800' }}>
              {pose === 'thinking' ? '•' : '‿'}
            </Text>
          </View>
        </View>

        {/* Book or Object in Hand */}
        {pose === 'reading' && (
          <View style={[styles.heldBook, { bottom: 6 * scale }]}>
            <Text style={{ fontSize: 18 * scale }}>📖</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cloudShadow: {
    position: 'absolute',
    backgroundColor: '#E5E7EB',
    opacity: 0.45,
  },
  overheadProp: {
    position: 'absolute',
    zIndex: 10,
  },
  earsRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  ear: {
    position: 'absolute',
    backgroundColor: '#E0E7FF',
    borderWidth: 2,
    borderColor: '#C7D2FE',
  },
  earLeft: {},
  earRight: {},
  body: {
    backgroundColor: '#EEF2FF',
    borderWidth: 2.5,
    borderColor: '#C7D2FE',
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 2,
    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.08)',
    elevation: 2,
  },
  face: {
    alignItems: 'center',
  },
  eyesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eye: {
    backgroundColor: '#1E1B4B',
  },
  blushRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blush: {
    backgroundColor: '#FDA4AF',
    opacity: 0.65,
  },
  mouth: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heldBook: {
    position: 'absolute',
    zIndex: 5,
  },
});
