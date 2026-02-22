import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors, radii, fonts } from "../lib/theme";

interface SegmentedControlProps {
  segments: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
}

export default function SegmentedControl({ segments, selectedIndex, onChange }: SegmentedControlProps) {
  return (
    <View style={styles.container}>
      {segments.map((segment, index) => (
        <TouchableOpacity
          key={segment}
          style={[styles.segment, index === selectedIndex && styles.segmentActive]}
          onPress={() => onChange(index)}
          activeOpacity={0.7}
        >
          <Text style={[styles.segmentText, index === selectedIndex && styles.segmentTextActive]}>
            {segment}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "rgba(118,118,128,0.24)",
    borderRadius: radii.sm,
    padding: 2,
  },
  segment: {
    flex: 1,
    paddingVertical: 7,
    alignItems: "center",
    borderRadius: 7,
  },
  segmentActive: {
    backgroundColor: colors.bgTertiary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  segmentText: {
    fontSize: fonts.sizes.footnote,
    fontWeight: fonts.weights.medium,
    color: colors.textMuted,
  },
  segmentTextActive: {
    color: colors.text,
    fontWeight: fonts.weights.semibold,
  },
});
