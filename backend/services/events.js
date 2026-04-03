// =============================================================================
// Localist API — Loyola University Campus Events
// Base URL: events.luc.edu
// No auth required
// =============================================================================

const EVENTS_BASE = 'https://events.luc.edu/api/2';

let eventsCache = {};
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Events API error: ${response.status}`);
  return await response.json();
}

async function getEvents(days = 7) {
  const cacheKey = `events_${days}`;

  if (eventsCache[cacheKey] && Date.now() - eventsCache[cacheKey].time < CACHE_TTL) {
    return eventsCache[cacheKey].data;
  }

  const data = await fetchJson(`${EVENTS_BASE}/events?days=${days}&pp=50`);

  // Transform to cleaner format
  const events = (data.events || []).map(wrapper => {
    const e = wrapper.event;
    return {
      id: e.id,
      title: e.title,
      description: e.description_text ? e.description_text.substring(0, 300) : null,
      location: e.location_name || e.location || null,
      address: e.address || null,
      url: e.localist_url || e.url || null,
      start: e.event_instances?.[0]?.event_instance?.start || null,
      end: e.event_instances?.[0]?.event_instance?.end || null,
      allDay: e.event_instances?.[0]?.event_instance?.all_day || false,
      image: e.photo_url || null,
      tags: e.tags || [],
      filters: e.filters || {},
    };
  });

  eventsCache[cacheKey] = { data: events, time: Date.now() };

  return events;
}

async function getEventsToday() {
  return await getEvents(1);
}

module.exports = { getEvents, getEventsToday };
