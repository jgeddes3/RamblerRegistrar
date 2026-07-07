// components/ScheduleGrid.js — PRESENTATIONAL weekly time-grid.
// Props only; no firestore/data imports. Blocks come from
// schedule-utils.sectionsToBlocks(), conflicts from findConflicts().

import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const HOUR_HEIGHT = 52;
const MIN_BLOCK_HEIGHT = 26;
const GUTTER_WIDTH = 44;
const CONFLICT_BORDER = '#d00000';

const DAY_LABELS = {
  Mo: 'Mon',
  Tu: 'Tue',
  We: 'Wed',
  Th: 'Thu',
  Fr: 'Fri',
  Sa: 'Sat',
  Su: 'Sun',
};

// '8 AM', '12 PM', '9 PM' style hour labels.
function hourLabel(hour) {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const ampm = hour < 12 ? 'AM' : 'PM';
  return `${h12} ${ampm}`;
}

// Readable text color for a block background: white fails WCAG on the lighter
// palette entries (amber #d97706, green #059669, teal #0891b2), so pick dark
// text when the background's relative luminance is high enough.
function textColorFor(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ''));
  if (!m) return '#ffffff';
  const int = parseInt(m[1], 16);
  const lin = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const L =
    0.2126 * lin((int >> 16) & 255) + 0.7152 * lin((int >> 8) & 255) + 0.0722 * lin(int & 255);
  return L > 0.18 ? '#102027' : '#ffffff';
}

// Lane layout for overlapping blocks: cluster transitively-overlapping blocks,
// then greedily assign each block the first lane free at its start time. Blocks
// in an N-lane cluster each get 1/N of the column width, side by side — without
// this, two same-time sections stack and the lower one is invisible/untappable.
function layoutLanes(dayBlocks) {
  const sorted = [...dayBlocks].sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);
  const layout = new Map(); // block.key -> {lane, lanes}
  let cluster = [];
  let laneEnds = []; // per-lane last endMin within the cluster
  let clusterMaxEnd = -1;

  const flush = () => {
    for (const item of cluster) layout.set(item.key, { lane: item.lane, lanes: laneEnds.length });
    cluster = [];
    laneEnds = [];
    clusterMaxEnd = -1;
  };

  for (const b of sorted) {
    if (cluster.length > 0 && b.startMin >= clusterMaxEnd) flush();
    let lane = laneEnds.findIndex((end) => b.startMin >= end);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(b.endMin);
    } else {
      laneEnds[lane] = b.endMin;
    }
    cluster.push({ key: b.key, lane });
    clusterMaxEnd = Math.max(clusterMaxEnd, b.endMin);
  }
  flush();
  return layout;
}

export default function ScheduleGrid({
  blocks,
  conflicts = [],
  startHour,
  endHour,
  days,
  onPressBlock,
}) {
  const safeBlocks = blocks || [];
  const dayList = days || ['Mo', 'Tu', 'We', 'Th', 'Fr'];
  const hours = [];
  for (let h = startHour; h < endHour; h++) hours.push(h);
  const columnHeight = (endHour - startHour) * HOUR_HEIGHT;

  // Keys of blocks that appear in any conflict pair.
  const conflictKeys = new Set();
  for (const pair of conflicts) {
    if (pair && pair.a) conflictKeys.add(pair.a.key);
    if (pair && pair.b) conflictKeys.add(pair.b.key);
  }

  const blocksByDay = {};
  for (const day of dayList) blocksByDay[day] = [];
  for (const b of safeBlocks) {
    if (blocksByDay[b.day]) blocksByDay[b.day].push(b);
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      {/* Header row: gutter spacer + day names */}
      <View style={styles.headerRow}>
        <View style={styles.gutterSpacer} />
        {dayList.map((day) => (
          <View key={day} style={styles.dayHeaderCell}>
            <Text style={styles.dayHeaderText}>{DAY_LABELS[day] || day}</Text>
          </View>
        ))}
      </View>

      {/* Body row: time gutter + one column per day */}
      <View style={styles.bodyRow}>
        <View style={[styles.gutter, { height: columnHeight }]}>
          {hours.map((h) => (
            <View key={h} style={[styles.gutterCell, { height: HOUR_HEIGHT }]}>
              <Text style={styles.gutterText}>{hourLabel(h)}</Text>
            </View>
          ))}
        </View>

        {dayList.map((day) => {
          const lanes = layoutLanes(blocksByDay[day]);
          return (
          <View key={day} style={[styles.dayColumn, { height: columnHeight }]}>
            {/* hour hairlines */}
            {hours.map((h) => (
              <View
                key={h}
                style={[styles.hairline, { top: (h - startHour) * HOUR_HEIGHT }]}
              />
            ))}

            {blocksByDay[day].map((block) => {
              const top = ((block.startMin - startHour * 60) / 60) * HOUR_HEIGHT;
              const rawHeight = ((block.endMin - block.startMin) / 60) * HOUR_HEIGHT;
              const height = Math.max(MIN_BLOCK_HEIGHT, rawHeight);
              const conflicted = conflictKeys.has(block.key);
              const { lane, lanes: laneCount } = lanes.get(block.key) || { lane: 0, lanes: 1 };
              const laneStyle = {
                left: `${(lane / laneCount) * 100}%`,
                width: `${100 / laneCount}%`,
              };
              const building =
                (block.section && (block.section.building || block.section.room)) || '';
              const textColor = textColorFor(block.color);
              return (
                <TouchableOpacity
                  key={block.key}
                  testID={`block-${block.key}`}
                  activeOpacity={0.7}
                  onPress={() => onPressBlock && onPressBlock(block)}
                  // Short meetings render below the 40px touch minimum — widen
                  // the tap area so removing a 30-min lab is still hittable.
                  hitSlop={height < 40 ? { top: 8, bottom: 8, left: 4, right: 4 } : undefined}
                  style={[
                    styles.block,
                    laneStyle,
                    { top, height, backgroundColor: block.color },
                    conflicted && styles.conflictBlock,
                  ]}
                >
                  <Text style={[styles.blockLabel, { color: textColor }]} numberOfLines={1}>
                    {block.label}
                  </Text>
                  {building ? (
                    <Text
                      style={[styles.blockBuilding, { color: textColor }]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {building}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e2e2',
    paddingBottom: 4,
  },
  gutterSpacer: {
    width: GUTTER_WIDTH,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A30046',
  },
  bodyRow: {
    flexDirection: 'row',
  },
  gutter: {
    width: GUTTER_WIDTH,
  },
  gutterCell: {
    alignItems: 'flex-end',
    paddingRight: 6,
  },
  gutterText: {
    fontSize: 9,
    color: '#888888',
    marginTop: -5,
  },
  dayColumn: {
    flex: 1,
    position: 'relative',
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: '#ececec',
  },
  hairline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#ececec',
  },
  block: {
    position: 'absolute',
    // left/width come from the lane layout (percent strings) so overlapping
    // blocks render side by side instead of stacking.
    borderRadius: 6,
    paddingHorizontal: 3,
    paddingVertical: 2,
    marginHorizontal: 1,
    overflow: 'hidden',
  },
  conflictBlock: {
    borderWidth: 2,
    borderColor: CONFLICT_BORDER,
    opacity: 0.85,
  },
  blockLabel: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 11,
  },
  blockBuilding: {
    color: '#ffffff',
    fontSize: 9,
  },
});
