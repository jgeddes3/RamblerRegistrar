// components/TrendChart.js — enrollment + waitlist mini-chart (F-QW1 + F-HI3).
// No SVG/chart deps: plain Views as bars, so it renders identically on native
// and web. Enrollment = maroon bars scaled against cap; waitlist = amber bars
// rising from the baseline on top. Pure layout math lives in buildTrendBars
// (exported for tests).

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MAROON, STONE, INK, HAIRLINE } from '../theme';

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

const seatsText = (p) => {
  const total = Number(p.total) || 0;
  const cap = Number(p.cap) || 0;
  return cap > 0 ? `${total} of ${cap}` : `${total}`;
};

// What the chart says, in words: the latest reading (shown beside the
// caption) and a one-sentence description for screen readers, which can't
// read bars. null when there is no trend to draw.
export function trendSummary(history) {
  // The same window the bars draw (buildTrendBars keeps the last 30).
  const points = (Array.isArray(history) ? history : [])
    .filter((p) => p && Number.isFinite(Number(p.total)))
    .slice(-30);
  if (points.length < 2) return null;
  const first = points[0];
  const last = points[points.length - 1];
  const wait = Number(last.waitlist) || 0;
  const waitText = wait > 0 ? `, ${wait} on waitlist` : '';
  const moved = Number(last.total) < Number(first.total) ? 'falling to' : 'rising to';
  return {
    latest: `${seatsText(last)} enrolled${waitText}`,
    spoken: `Seats filled from ${shortDate(first.date)} to ${shortDate(last.date)}: ` +
      `${seatsText(first)} ${moved} ${seatsText(last)}${waitText}.`,
    cap: Number(last.cap) || 0,
    count: points.length,
  };
}

const TrendChart = ({ history, height = 44, showWaitlist = true }) => {
  const bars = buildTrendBars(history);
  const summary = trendSummary(history);
  if (!bars.length || !summary) return null;
  const anyWaitlist = showWaitlist && bars.some((b) => b.waitlist > 0);

  return (
    <View
      style={st.wrap}
      accessible
      accessibilityRole="image"
      accessibilityLabel={summary.spoken}
    >
      {/* Caption: what the bars answer, and where it stands now. */}
      <View style={st.captionRow}>
        <Text style={st.caption}>Seats filled, last {bars.length} readings</Text>
        <Text style={st.latest}>{summary.latest}</Text>
      </View>
      {/* Scale: the dashed top line is a full section; bars rise toward it. */}
      {summary.cap > 0 ? <Text style={st.scaleText}>Full: {summary.cap}</Text> : null}
      <View style={[st.chartRow, { height }, summary.cap > 0 && st.chartFullLine]}>
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
  captionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 },
  // Numbers and small labels in the system sans (theme rule: Cormorant only at 14+).
  caption: { fontSize: 12, color: STONE },
  latest: { fontSize: 12, fontWeight: '600', color: INK },
  scaleText: { fontSize: 10, color: STONE, alignSelf: 'flex-end', marginBottom: 1 },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end' },
  chartFullLine: { borderTopWidth: 1, borderStyle: 'dashed', borderColor: HAIRLINE },
  barSlot: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', marginHorizontal: 0.5 },
  enrollBar: { alignSelf: 'stretch', backgroundColor: '#C4577E', borderTopLeftRadius: 1, borderTopRightRadius: 1 },
  enrollBarFull: { backgroundColor: MAROON },
  waitBar: { alignSelf: 'stretch', backgroundColor: AMBER, marginBottom: 1, borderTopLeftRadius: 1, borderTopRightRadius: 1 },
  axisRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendSwatch: { width: 8, height: 8, borderRadius: 2 },
  axisText: { fontSize: 11, color: STONE },
});

export default TrendChart;
