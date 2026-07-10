// components/TrendChart.js — enrollment + waitlist mini-chart (F-QW1 + F-HI3).
// No SVG/chart deps: plain Views as bars, so it renders identically on native
// and web. Enrollment = maroon bars scaled against cap; waitlist = amber bars
// rising from the baseline on top. Pure layout math lives in buildTrendBars
// (exported for tests).

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FONT, MAROON } from '../theme';

const AMBER = '#d97706';

/**
 * Normalize a recentHistory array ([{date, total, cap, waitlist?}]) into
 * render-ready bars. Heights are fractions of the chart height (0..1).
 * - Enrollment scales against the point's cap (falls back to the max total
 *   seen, so cap-less data still draws something sensible).
 * - Waitlist scales against the SAME denominator so the two series compare.
 * - Returns [] for missing/degenerate input (chart hides itself).
 */
export function buildTrendBars(history, maxBars = 30) {
  if (!Array.isArray(history)) return [];
  const points = history
    .filter((p) => p && Number.isFinite(Number(p.total)))
    .slice(-maxBars);
  if (points.length < 2) return []; // one dot is not a trend

  const maxTotal = Math.max(...points.map((p) => Number(p.total) || 0), 1);
  return points.map((p) => {
    const cap = Number(p.cap) > 0 ? Number(p.cap) : maxTotal;
    const denom = Math.max(cap, 1);
    const enroll = Math.max(0, Math.min(1, (Number(p.total) || 0) / denom));
    const waitlist = Math.max(0, Math.min(1, (Number(p.waitlist) || 0) / denom));
    return {
      date: p.date || '',
      enroll,
      waitlist,
      over: (Number(p.total) || 0) >= denom, // at/over cap -> full-red bar
    };
  });
}

// Short label for the x-axis ends: '2026-07-01T15' -> 'Jul 1'.
export function shortDate(iso) {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return '';
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${MONTHS[parseInt(m[2], 10) - 1]} ${parseInt(m[3], 10)}`;
}

const TrendChart = ({ history, height = 44, showWaitlist = true }) => {
  const bars = buildTrendBars(history);
  if (!bars.length) return null;
  const anyWaitlist = showWaitlist && bars.some((b) => b.waitlist > 0);

  return (
    <View style={st.wrap}>
      <View style={[st.chartRow, { height }]}>
        {bars.map((b, i) => (
          <View key={i} style={st.barSlot}>
            {anyWaitlist && b.waitlist > 0 ? (
              <View style={[st.waitBar, { height: Math.max(2, b.waitlist * height) }]} />
            ) : null}
            <View
              style={[
                st.enrollBar,
                { height: Math.max(2, b.enroll * height) },
                b.over && st.enrollBarFull,
              ]}
            />
          </View>
        ))}
      </View>
      <View style={st.axisRow}>
        <Text style={st.axisText}>{shortDate(bars[0].date)}</Text>
        <View style={st.legendRow}>
          <View style={[st.legendSwatch, { backgroundColor: MAROON }]} />
          <Text style={st.axisText}>enrolled</Text>
          {anyWaitlist ? (
            <>
              <View style={[st.legendSwatch, { backgroundColor: AMBER, marginLeft: 8 }]} />
              <Text style={st.axisText}>waitlist</Text>
            </>
          ) : null}
        </View>
        <Text style={st.axisText}>{shortDate(bars[bars.length - 1].date)}</Text>
      </View>
    </View>
  );
};

const st = StyleSheet.create({
  wrap: { marginTop: 8, marginBottom: 4 },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end' },
  barSlot: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', marginHorizontal: 0.5 },
  enrollBar: { alignSelf: 'stretch', backgroundColor: '#C4577E', borderTopLeftRadius: 1, borderTopRightRadius: 1 },
  enrollBarFull: { backgroundColor: MAROON },
  waitBar: { alignSelf: 'stretch', backgroundColor: AMBER, marginBottom: 1, borderTopLeftRadius: 1, borderTopRightRadius: 1 },
  axisRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendSwatch: { width: 8, height: 8, borderRadius: 2 },
  axisText: { fontFamily: FONT, fontSize: 11, color: '#999' },
});

export default TrendChart;
