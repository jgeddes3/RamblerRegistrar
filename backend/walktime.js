// =============================================================================
// Walk Time Calculator — Haversine distance between campus buildings
// =============================================================================

// Haversine formula: distance in meters between two GPS coordinates
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Calculate walk time between two buildings
// Returns { distance_m, walk_minutes }
function calculateWalkTime(buildingA, buildingB) {
  if (!buildingA || !buildingB) return null;

  const straightLine = haversineDistance(
    buildingA.latitude, buildingA.longitude,
    buildingB.latitude, buildingB.longitude
  );

  // Walking factor: paths aren't straight lines, multiply by 1.3
  const walkingDistance = straightLine * 1.3;

  // Average walking speed: 80 meters per minute
  const walkMinutes = Math.ceil(walkingDistance / 80);

  return {
    from: buildingA.name,
    to: buildingB.name,
    distance_m: Math.round(walkingDistance),
    walk_minutes: walkMinutes,
  };
}

// Parse building name from LOCUS room string
// "Cuneo Hall - Room 324" → "Cuneo Hall"
function parseBuildingName(roomString) {
  if (!roomString) return null;
  if (roomString === 'TBA' || roomString === 'Online') return null;
  return roomString.split(' - ')[0].trim();
}

// Parse time string to minutes since midnight
// "1:00PM" → 780, "8:30AM" → 510
function parseTime(timeStr) {
  if (!timeStr) return null;
  const match = timeStr.match(/(\d+):(\d+)(AM|PM)/i);
  if (!match) return null;
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

// Parse days string to array
// "TuTh" → ["Tu", "Th"], "MoWeFr" → ["Mo", "We", "Fr"]
function parseDays(daysStr) {
  if (!daysStr) return [];
  const days = [];
  const dayMap = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  for (const day of dayMap) {
    if (daysStr.includes(day)) days.push(day);
  }
  return days;
}

// Analyze a schedule for conflicts and walk time issues
// sections: array of section objects with days_times, room, building
function analyzeSchedule(sections, buildings) {
  const conflicts = [];
  const walkTimes = [];
  const warnings = [];

  // Build a lookup map for buildings
  const buildingMap = {};
  for (const b of buildings) {
    buildingMap[b.name.toLowerCase()] = b;
  }

  // Find building by partial name match
  const findBuilding = (name) => {
    if (!name) return null;
    const lower = name.toLowerCase();
    // Exact match first
    if (buildingMap[lower]) return buildingMap[lower];
    // Partial match
    for (const [key, val] of Object.entries(buildingMap)) {
      if (lower.includes(key) || key.includes(lower)) return val;
    }
    return null;
  };

  // Parse each section into structured time blocks
  const timeBlocks = [];
  for (const section of sections) {
    const days = parseDays(section.meeting_days || section.days_times);
    const timeMatch = (section.days_times || '').match(/(\d+:\d+[AP]M)\s*-\s*(\d+:\d+[AP]M)/i);
    if (!timeMatch || days.length === 0) continue;

    const startMin = parseTime(timeMatch[1]);
    const endMin = parseTime(timeMatch[2]);
    const buildingName = parseBuildingName(section.room);

    for (const day of days) {
      timeBlocks.push({
        day,
        start: startMin,
        end: endMin,
        section,
        building: buildingName,
        buildingData: findBuilding(buildingName),
      });
    }
  }

  // Sort by day then start time
  const dayOrder = { Mo: 0, Tu: 1, We: 2, Th: 3, Fr: 4, Sa: 5, Su: 6 };
  timeBlocks.sort((a, b) => (dayOrder[a.day] || 0) - (dayOrder[b.day] || 0) || a.start - b.start);

  // Check consecutive classes on the same day
  for (let i = 0; i < timeBlocks.length - 1; i++) {
    const curr = timeBlocks[i];
    const next = timeBlocks[i + 1];

    if (curr.day !== next.day) continue;

    // Time overlap check
    if (curr.end > next.start) {
      conflicts.push({
        day: curr.day,
        section1: `${curr.section.subject || ''} ${curr.section.catalog_number || ''}`,
        section2: `${next.section.subject || ''} ${next.section.catalog_number || ''}`,
        overlap_minutes: curr.end - next.start,
      });
    }

    // Walk time check
    const gapMinutes = next.start - curr.end;
    if (curr.buildingData && next.buildingData && curr.building !== next.building) {
      const walk = calculateWalkTime(curr.buildingData, next.buildingData);
      walkTimes.push({
        day: curr.day,
        from: `${curr.section.subject || ''} ${curr.section.catalog_number || ''} (${curr.building})`,
        to: `${next.section.subject || ''} ${next.section.catalog_number || ''} (${next.building})`,
        gap: gapMinutes,
        walkTime: walk.walk_minutes,
        ok: gapMinutes >= walk.walk_minutes,
      });

      if (gapMinutes < walk.walk_minutes) {
        warnings.push(
          `Tight walk on ${curr.day}: ${walk.walk_minutes} min walk from ${curr.building} to ${next.building}, but only ${gapMinutes} min gap`
        );
      }
    }

    // No break warnings
    if (gapMinutes === 0) {
      warnings.push(`Back-to-back classes on ${curr.day} with no break`);
    }
  }

  // Check for no lunch break (any day with classes from before 11 AM to after 1 PM with no gap > 30 min)
  const days = [...new Set(timeBlocks.map(b => b.day))];
  for (const day of days) {
    const dayBlocks = timeBlocks.filter(b => b.day === day).sort((a, b) => a.start - b.start);
    if (dayBlocks.length < 2) continue;

    const firstStart = dayBlocks[0].start;
    const lastEnd = dayBlocks[dayBlocks.length - 1].end;

    // If classes span from before 11 AM to after 1 PM
    if (firstStart <= 660 && lastEnd >= 780) {
      let hasLunchBreak = false;
      for (let j = 0; j < dayBlocks.length - 1; j++) {
        const gap = dayBlocks[j + 1].start - dayBlocks[j].end;
        if (gap >= 30 && dayBlocks[j].end >= 660 && dayBlocks[j + 1].start <= 840) {
          hasLunchBreak = true;
          break;
        }
      }
      if (!hasLunchBreak) {
        warnings.push(`No lunch break on ${day} (classes from ${formatTime(firstStart)} to ${formatTime(lastEnd)})`);
      }
    }
  }

  return { conflicts, walkTimes, warnings };
}

function formatTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h > 12 ? h - 12 : (h === 0 ? 12 : h);
  return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
}

module.exports = { calculateWalkTime, parseBuildingName, analyzeSchedule, haversineDistance };
