// Legacy/alternate prefix map — RMP sometimes uses old or non-standard codes
const PREFIX_ALIASES = {
  'CS': 'COMP',       // Old CS prefix → current COMP
  'POLS': 'PLSC',     // RMP uses POLS, Loyola uses PLSC for Political Science
  'SOC': 'SOCL',      // RMP sometimes uses SOC instead of SOCL
  'BIO': 'BIOL',      // Shortened prefix
  'CHEM': 'CHEM',     // Same (no change needed)
  'PHYS': 'PHYS',     // Same
  'ISOM': 'INFS',     // Old Info Systems prefix → current INFS
};

// Normalize RMP course codes to match our DB format
// "COMP170" → "COMP 170", "CS271" → "COMP 271", filters garbage
function normalizeRmpCourseCode(rmpCode) {
  let cleaned = rmpCode.trim().replace(/-/g, ' '); // "ANTH-102" → "ANTH 102"
  if (cleaned.length > 10 || !/\d/.test(cleaned)) return null;

  // Add space between letters and digits
  cleaned = cleaned.replace(/([A-Za-z]+)\s*(\d+)/, '$1 $2').toUpperCase();

  // Apply prefix aliases
  const parts = cleaned.split(' ');
  if (parts.length === 2 && PREFIX_ALIASES[parts[0]]) {
    parts[0] = PREFIX_ALIASES[parts[0]];
    cleaned = parts.join(' ');
  }

  return cleaned;
}

const RMP_ENDPOINT = 'https://www.ratemyprofessors.com/graphql';
const RMP_AUTH = 'Basic dGVzdDp0ZXN0';
const LOYOLA_SCHOOL_ID = 'U2Nob29sLTU0MA=='; // School-540 (Loyola University Chicago)

const rmpFetch = async (query, variables) => {
  const response = await fetch(RMP_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': RMP_AUTH,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`RMP API error: ${response.status}`);
  }

  const json = await response.json();
  if (json.errors) {
    throw new Error(`RMP GraphQL error: ${json.errors[0].message}`);
  }

  return json.data;
};

export const searchProfessors = async (name) => {
  const query = `
    query SearchTeachers($text: String!, $schoolID: ID!) {
      newSearch {
        teachers(query: { text: $text, schoolID: $schoolID }) {
          edges {
            node {
              id
              legacyId
              firstName
              lastName
              department
              school { name, id }
              avgRating
              avgDifficulty
              numRatings
              wouldTakeAgainPercent
            }
          }
        }
      }
    }
  `;

  const data = await rmpFetch(query, {
    text: name,
    schoolID: LOYOLA_SCHOOL_ID,
  });

  return data.newSearch.teachers.edges.map((edge) => ({
    rmpId: edge.node.id,
    legacyId: edge.node.legacyId,
    firstName: edge.node.firstName,
    lastName: edge.node.lastName,
    department: edge.node.department,
    avgRating: edge.node.avgRating,
    avgDifficulty: edge.node.avgDifficulty,
    numRatings: edge.node.numRatings,
    wouldTakeAgainPercent: edge.node.wouldTakeAgainPercent,
  }));
};

export const getProfessorDetail = async (rmpId) => {
  const query = `
    query ProfessorDetail($id: ID!) {
      node(id: $id) {
        ... on Teacher {
          id
          legacyId
          firstName
          lastName
          department
          avgRating
          avgDifficulty
          numRatings
          wouldTakeAgainPercent
          courseCodes {
            courseName
            courseCount
          }
          school { name }
        }
      }
    }
  `;

  const data = await rmpFetch(query, { id: rmpId });
  const prof = data.node;

  return {
    rmpId: prof.id,
    legacyId: prof.legacyId,
    firstName: prof.firstName,
    lastName: prof.lastName,
    department: prof.department,
    avgRating: prof.avgRating,
    avgDifficulty: prof.avgDifficulty,
    numRatings: prof.numRatings,
    wouldTakeAgainPercent: prof.wouldTakeAgainPercent,
    courseCodes: (prof.courseCodes || [])
      .map((c) => ({
        name: normalizeRmpCourseCode(c.courseName),
        rawName: c.courseName,
        count: c.courseCount,
      }))
      .filter((c) => c.name !== null),
  };
};

export const getProfessorRatings = async (rmpId, count = 20) => {
  const query = `
    query ProfessorRatings($id: ID!, $count: Int!) {
      node(id: $id) {
        ... on Teacher {
          ratings(first: $count) {
            edges {
              node {
                comment
                date
                class
                helpfulRating
                difficultyRating
                grade
                wouldTakeAgain
                isForOnlineClass
                attendanceMandatory
                ratingTags
                thumbsUpTotal
                thumbsDownTotal
              }
            }
          }
        }
      }
    }
  `;

  const data = await rmpFetch(query, { id: rmpId, count });

  return data.node.ratings.edges.map((edge) => ({
    comment: edge.node.comment,
    date: edge.node.date,
    class: edge.node.class,
    quality: edge.node.helpfulRating,
    difficulty: edge.node.difficultyRating,
    grade: edge.node.grade,
    wouldTakeAgain: edge.node.wouldTakeAgain,
    isOnline: edge.node.isForOnlineClass,
    attendanceMandatory: edge.node.attendanceMandatory,
    tags: edge.node.ratingTags ? edge.node.ratingTags.split('--').filter(Boolean) : [],
    thumbsUp: edge.node.thumbsUpTotal,
    thumbsDown: edge.node.thumbsDownTotal,
  }));
};
