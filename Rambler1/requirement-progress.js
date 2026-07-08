// requirement-progress.js — PURE requirement-vs-completed math (B12).
// Zero react/firebase imports (progress.js consumes this; tests import directly).
//
// Requirement rows come in three flavors (programs/{id}/requiredCourses docs,
// already joined to course rows by progress.js):
//   - required:         { code, name, credits, requirement_type: 'required'|'elective' }
//   - choice:           { ..., requirement_type: 'choice', choice_group: <int>,
//                         choose_count: <int> }  — pick N of the group's options.
//   - subject_elective: { requirement_type: 'subject_elective', subject: 'PHIL',
//                         min_level: 300|null, count: 2 } — prose requirements
//                         like "Two PHIL 300-level Elective Courses": ANY course
//                         with that subject (and level) counts.
//
// Semantics:
//   - Every non-choice row is one unit, complete when its code is completed.
//   - A choice group of M options with choose_count N contributes N units;
//     completed units = min(#completed options, N). While unmet, the group's
//     UNCOMPLETED options are listed in `remaining`, each annotated with
//     choice_note ("Choose 1 of the following:") + choice_group so the UI can
//     render a picker-style section instead of implying every option is due.
//   - A subject_elective contributes `count` units, satisfied by the user's
//     completed courses matching subject/level that were NOT already consumed
//     by a required row or choice group (no double-counting one course into
//     both "PHIL 181 required" and "any PHIL elective"). Unmet units appear in
//     `remaining` as placeholder rows (is_placeholder: true — not tappable).
//   - Credits: completed sums actual credits; an unmet choice unit estimates
//     the credits of its cheapest remaining option (conservative-ish, 3 default).

export function computeRequirementProgress(requirementRows, completedCodes) {
  const done = completedCodes instanceof Set ? completedCodes : new Set(completedCodes || []);
  const rows = Array.isArray(requirementRows) ? requirementRows : [];

  const completed = [];
  const remaining = [];
  let totalRequired = 0;
  let completedCount = 0;
  let creditsCompleted = 0;
  let creditsRemaining = 0;

  // Preserve first-seen order of groups; collect options per group.
  const groups = new Map(); // choice_group -> { choose, options: [] }
  const plain = [];
  const subjectElectives = [];
  for (const row of rows) {
    if (row && row.requirement_type === 'subject_elective') {
      subjectElectives.push(row);
    } else if (row && row.choice_group != null && row.requirement_type === 'choice') {
      if (!groups.has(row.choice_group)) {
        groups.set(row.choice_group, {
          choose: Math.max(1, Number(row.choose_count) || 1),
          options: [],
        });
      }
      groups.get(row.choice_group).options.push(row);
    } else if (row) {
      plain.push(row);
    }
  }

  // Codes consumed by explicit requirements — a course can't satisfy both
  // "PHIL 181 (required)" and "any PHIL elective".
  const consumed = new Set();

  for (const course of plain) {
    totalRequired += 1;
    if (done.has(course.code)) {
      completedCount += 1;
      creditsCompleted += course.credits || 3;
      completed.push(course);
      consumed.add(course.code);
    } else {
      creditsRemaining += course.credits || 3;
      remaining.push(course);
    }
  }

  for (const [groupId, g] of groups) {
    const choose = Math.min(g.choose, g.options.length) || 1;
    const doneOptions = g.options.filter((o) => done.has(o.code));
    const met = Math.min(doneOptions.length, choose);
    totalRequired += choose;
    completedCount += met;
    for (const o of doneOptions.slice(0, choose)) {
      creditsCompleted += o.credits || 3;
      completed.push(o);
    }
    for (const o of doneOptions.slice(0, choose)) consumed.add(o.code);
    const unmet = choose - met;
    if (unmet > 0) {
      const note = `Choose ${unmet} of the following:`;
      const left = g.options.filter((o) => !done.has(o.code));
      for (const o of left) {
        remaining.push({ ...o, choice_note: note, choice_group: groupId });
      }
      // Estimate credits from the cheapest remaining options (one per unmet unit).
      const sorted = left.map((o) => o.credits || 3).sort((a, b) => a - b);
      for (let i = 0; i < unmet; i++) creditsRemaining += sorted[i] ?? 3;
    }
  }

  // Subject electives: satisfied by any unconsumed completed course whose code
  // matches "<SUBJECT> <number>" with number >= min_level (when set).
  for (const se of subjectElectives) {
    const count = Math.max(1, Number(se.count) || 1);
    const subject = String(se.subject || '').toUpperCase();
    const minLevel = se.min_level != null ? Number(se.min_level) : null;
    const label = `${subject}${minLevel ? ` ${minLevel}-level` : ''} elective`;

    const matches = [...done].filter((code) => {
      if (consumed.has(code)) return false;
      const m = String(code).toUpperCase().match(/^([A-Z]{2,5})\s+(\d{2,3})/);
      if (!m || m[1] !== subject) return false;
      return minLevel == null || parseInt(m[2], 10) >= minLevel;
    }).sort().slice(0, count);

    totalRequired += count;
    for (const code of matches) {
      consumed.add(code);
      completedCount += 1;
      creditsCompleted += 3;
      completed.push({ code, name: `Counts toward: ${label}`, credits: 3, requirement_type: 'subject_elective' });
    }
    const unmet = count - matches.length;
    for (let i = 0; i < unmet; i++) {
      creditsRemaining += 3;
      remaining.push({
        code: `Any ${label}`,
        name: `Any ${subject} course${minLevel ? ` at the ${minLevel} level or above` : ''}`,
        credits: 3,
        requirement_type: 'subject_elective',
        is_placeholder: true,
      });
    }
  }

  return {
    totalRequired,
    completedCount,
    remainingCount: totalRequired - completedCount,
    creditsCompleted,
    creditsRemaining,
    percentComplete: totalRequired > 0
      ? Math.round((completedCount / totalRequired) * 100)
      : 0,
    completed,
    remaining,
  };
}
