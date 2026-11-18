// sql-batch.js — multi-row INSERT statements. Pure.
//
// The catalog sync used to await one INSERT per row (~8,600 on first launch).
// Packing rows into multi-row statements cuts that to a few dozen.
//
// rows: array of value arrays, each matching `columns`. maxParams keeps each
// statement under sqlite's bound-parameter limit (999 on older builds).
export function buildBatchInserts(table, columns, rows, maxParams = 900) {
  const perStatement = Math.max(1, Math.floor(maxParams / columns.length));
  const tuple = `(${columns.map(() => '?').join(', ')})`;
  const out = [];
  for (let i = 0; i < rows.length; i += perStatement) {
    const chunk = rows.slice(i, i + perStatement);
    out.push({
      sql: `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES ${chunk.map(() => tuple).join(', ')}`,
      params: chunk.flat(),
    });
  }
  return out;
}
