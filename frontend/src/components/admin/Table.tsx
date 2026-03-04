import React from "react";

import type { Column } from "../../types/table.types";

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
}

export function Table<T extends { _id: string }>({
  columns,
  data,
  emptyMessage = "No data available",
}: TableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {columns.map((col, index) => (
              <th
                key={index}
                className="px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row) => (
            <tr
              key={row._id}
              className="hover:bg-gray-50 transition-colors duration-150"
            >
              {columns.map((col, index) => (
                <td key={index} className="px-6 py-4 whitespace-nowrap">
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
