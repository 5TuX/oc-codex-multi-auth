/**
 * Simple ASCII table formatter for CLI tools.
 * Generates consistent, aligned table output.
 */
import { displayWidth, padEndDisplay, padStartDisplay, sanitizeDisplayText, truncateToDisplayWidth, } from "./ui/display-text.js";
/**
 * Format a value to fit within a column width.
 *
 * `width` is a column budget in *display* columns: the value is sanitized
 * (escape sequences and control characters out), truncated on grapheme
 * boundaries so CJK and emoji never split mid-cluster, and padded by measured
 * width so a two-column cell still lines up with its ASCII neighbours.
 */
function formatCell(value, width, align = "left") {
    const cols = Math.max(0, Math.floor(width));
    if (cols === 0)
        return "";
    const clean = sanitizeDisplayText(value) ?? "";
    const truncated = displayWidth(clean) > cols
        ? truncateToDisplayWidth(clean, cols, "…")
        : clean;
    return align === "right"
        ? padStartDisplay(truncated, cols)
        : padEndDisplay(truncated, cols);
}
/**
 * Build a table header row and separator line.
 */
export function buildTableHeader(options) {
    const { columns, separatorChar = "-" } = options;
    const headerRow = columns.map((col) => formatCell(col.header, col.width, col.align)).join(" ");
    const separatorRow = columns
        .map((col) => separatorChar.repeat(Math.max(0, Math.floor(col.width))))
        .join(" ");
    return [headerRow, separatorRow];
}
/**
 * Build a single table row from values.
 * Values are matched to columns by index.
 */
export function buildTableRow(values, options) {
    const { columns } = options;
    return columns
        .map((col, i) => {
        const value = values[i] ?? "";
        return formatCell(value, col.width, col.align);
    })
        .join(" ");
}
/**
 * Build a complete table with header, separator, and rows.
 */
export function buildTable(rows, options) {
    const lines = buildTableHeader(options);
    for (const row of rows) {
        lines.push(buildTableRow(row, options));
    }
    return lines;
}
//# sourceMappingURL=table-formatter.js.map