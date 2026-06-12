import { ReactNode } from "react";

type Column<T> = {
  key: keyof T | string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
};

type Props<T> = {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyText?: string;
};

function SimpleTable<T extends Record<string, any>>({
  columns,
  data,
  loading,
  emptyText = "No data",
}: Props<T>) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              {columns.map((c) => (
                <th key={String(c.key)} className="text-left px-4 py-3 font-medium text-foreground/80">
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-t border-border">
                  {columns.map((c) => (
                    <td key={String(c.key)} className="px-4 py-3">
                      <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data?.length ? (
              data.map((row, i) => (
                <tr key={i} className="border-t border-border hover:bg-muted/20">
                  {columns.map((c) => (
                    <td key={String(c.key)} className={`px-4 py-3 ${c.className || ""}`}>
                      {c.render ? c.render(row) : String(row[c.key as keyof typeof row] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-6 text-center text-muted-foreground" colSpan={columns.length}>
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SimpleTable;
