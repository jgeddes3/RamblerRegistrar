// components/DayMap.native.js — the real day map (F-Q7, native only).
// Numbered pins for the day's classes in time order, a home pin when the user
// saved an address, and one polyline per leg of the day's path: walking legs
// follow the OSRM foot route (solid maroon), cross-campus LSC<->WTC legs the
// driving route (dashed blue). A straight dashed line stands in while a leg's
// geometry loads. Metro's platform extensions keep react-native-maps out of
// web bundles (same split as MapScreen.native.js — a Platform.OS require
// guard is NOT enough in dev).

import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { buildSegments, routeForSegments } from '../route-utils';

// stops: [{ latitude, longitude, campus, title, description }] in visit order.
// home: { latitude, longitude } | null.
const DayMap = ({ stops = [], home = null }) => {
  const points = [
    ...(home ? [{ latitude: Number(home.latitude), longitude: Number(home.longitude), campus: null }] : []),
    ...stops.map((p) => ({ latitude: p.latitude, longitude: p.longitude, campus: p.campus || null })),
  ];
  const pointsKey = points.map((p) => `${p.latitude},${p.longitude},${p.campus}`).join(';');
  const segments = useMemo(() => buildSegments(points), [pointsKey]);

  const [routes, setRoutes] = useState(null);
  useEffect(() => {
    let alive = true;
    setRoutes(null);
    if (segments.length) {
      routeForSegments(segments).then((r) => {
        if (alive) setRoutes(r);
      });
    }
    return () => { alive = false; };
  }, [segments]);

  if (!points.length) return null;

  const lats = points.map((p) => p.latitude);
  const lons = points.map((p) => p.longitude);
  const region = {
    latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
    longitude: (Math.min(...lons) + Math.max(...lons)) / 2,
    latitudeDelta: Math.max(0.008, (Math.max(...lats) - Math.min(...lats)) * 1.6),
    longitudeDelta: Math.max(0.008, (Math.max(...lons) - Math.min(...lons)) * 1.6),
  };

  return (
    <MapView style={s.map} initialRegion={region} key={points.map((p) => p.latitude).join(',')}>
      {home ? (
        <Marker
          coordinate={{ latitude: Number(home.latitude), longitude: Number(home.longitude) }}
          title="Home"
          pinColor="#2563eb"
        />
      ) : null}
      {stops.map((p, i) => (
        <Marker
          key={`${p.latitude},${p.longitude},${i}`}
          coordinate={{ latitude: p.latitude, longitude: p.longitude }}
          title={p.title}
          description={p.description}
          pinColor="#A30046"
        />
      ))}
      {segments.map((seg, i) => {
        const loaded = routes && routes[i];
        const coords = loaded
          ? routes[i].coords
          : [
              { latitude: seg.from.latitude, longitude: seg.from.longitude },
              { latitude: seg.to.latitude, longitude: seg.to.longitude },
            ];
        const driving = seg.profile === 'car';
        return (
          <Polyline
            key={`leg-${i}`}
            coordinates={coords}
            strokeColor={driving ? '#2563eb' : '#A30046'}
            strokeWidth={3}
            lineDashPattern={driving || !loaded ? [6, 6] : undefined}
          />
        );
      })}
    </MapView>
  );
};

const s = StyleSheet.create({
  map: { height: 220, borderRadius: 12, marginBottom: 10 },
});

export default DayMap;
