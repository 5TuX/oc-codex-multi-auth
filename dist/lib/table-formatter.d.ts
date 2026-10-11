/**
 * Simple ASCII table formatter for CLI tools.
 * Generates consistent, aligned table output.
 */
export interface TableColumn {
    /** Column header text */
    header: string;
    /** Column width (content will be padded/truncated to fit) */
    width: number;
    /** Alignment: 'left' (default) or 'right' */
    align?: "left" | "right";
}
export interface TableOptions {
    /** Column definitions */
    columns: TableColumn[];
    /** Character used for header separator line (default: '-') */
    separatorChar?: string;
}
/**
 * Build a table header row and separator line.
 */
export declare function buildTableHeader(options: TableOptions): string[];
/**
 * Build a single table row from values.
 * Values are matched to columns by index.
 */
export declare function buildTableRow(values: string[], options: TableOptions): string;
/**
 * Build a complete table with header, separator, and rows.
 */
export declare function buildTable(rows: string[][], options: TableOptions): string[];
