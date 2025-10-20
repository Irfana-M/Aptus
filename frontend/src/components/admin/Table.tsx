import React from "react";

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
}

export function Table<T extends { _id: string }>({
  columns,
  data,
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto bg-gray-800 rounded-xl p-4 border border-gray-700">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="text-gray-400 border-b border-gray-700">
            {columns.map((col, i) => (
              <th key={i} className="py-2">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={row._id}
              className="border-b border-gray-800 hover:bg-gray-700"
            >
              {columns.map((col, i) => (
                <td key={i} className="py-2">
                  {typeof col.accessor === "function"
                    ? col.accessor(row)
                    : (row[col.accessor] as React.ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
