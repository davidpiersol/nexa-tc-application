import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface ColumnDef<T> {
  /** Unique column id */
  id: string;
  /** Header cell */
  header: React.ReactNode;
  /** Render cell from row */
  cell: (row: T) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  columns: ColumnDef<T>[];
  data: T[];
  /** Row key extractor */
  getRowId: (row: T, index: number) => string;
}

/**
 * Styled HTML table — warm neutrals, navy headers; overflow-x on small screens.
 */
function DataTable<T>({
  className,
  columns,
  data,
  getRowId,
  ...props
}: DataTableProps<T>) {
  return (
    <div
      className={cn("w-full overflow-x-auto rounded-brand-lg border border-neutral-300 bg-white shadow-brand-sm", className)}
      {...props}
    >
      <table className="w-full min-w-[640px] border-collapse text-left font-sans text-ui-body">
        <thead>
          <tr className="border-b border-neutral-300 bg-neutral-50">
            {columns.map((col) => (
              <th
                key={col.id}
                scope="col"
                className={cn(
                  "px-4 py-3 font-display text-sm font-semibold text-brand-navy",
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={getRowId(row, index)}
              className="border-b border-neutral-100 odd:bg-neutral-50/50 hover:bg-neutral-50"
            >
              {columns.map((col) => (
                <td key={col.id} className={cn("px-4 py-3 text-neutral-900", col.className)}>
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { DataTable };
