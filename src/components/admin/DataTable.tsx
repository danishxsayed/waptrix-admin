"use client";
import { ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  keyField?: string;
}

export default function DataTable<T extends Record<string, any>>({
  columns, data, loading, emptyMessage = "No records found", keyField = "id"
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#E9EDEF]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#E9EDEF] bg-[#EDE8DE]">
            {columns.map(col => (
              <th key={col.key} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#667781]"
                style={{ width: col.width }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={columns.length} className="py-12 text-center">
              <Loader2 className="w-5 h-5 animate-spin text-[#25D366] mx-auto" />
            </td></tr>
          ) : data.length === 0 ? (
            <tr><td colSpan={columns.length} className="py-12 text-center text-[#667781] text-sm">{emptyMessage}</td></tr>
          ) : (
            data.map((row, i) => (
              <tr key={row[keyField] || i}
                className="border-b border-[#E9EDEF]/50 hover:bg-[#334155]/20 transition-colors">
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3 text-[#667781]">
                    {col.render ? col.render(row) : String(row[col.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
