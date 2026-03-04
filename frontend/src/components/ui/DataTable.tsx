import React from "react";
import type { Column } from "../../types/table.types";
import { Loader } from "./Loader";
import { EmptyState } from "./EmptyState";

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onSort?: (column: keyof T, direction: "asc" | "desc") => void;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  rowClassName?: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  variant?: "default" | "bordered" | "striped";
  size?: "sm" | "md" | "lg";
}

export function DataTable<
  T extends { id?: string | number; _id?: string | number }
>({
  columns,
  data,
  loading = false,
  emptyMessage = "No data available",
  onSort,
  sortBy,
  sortDirection,
  rowClassName,
  onRowClick,
  variant = "default",
  size = "md",
}: DataTableProps<T>) {
  const handleSort = (column: keyof T) => {
    if (!onSort) return;

    const newDirection =
      sortBy === column && sortDirection === "asc" ? "desc" : "asc";
    onSort(column, newDirection);
  };

  const getTableClasses = () => {
    const baseClasses = "w-full text-left";

    const variantClasses = {
      default: "bg-white",
      bordered: "border border-gray-200 bg-white",
      striped: "bg-white striped-table",
    };

    const sizeClasses = {
      sm: "text-sm",
      md: "text-sm",
      lg: "text-base",
    };

    return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`;
  };

  const getRowClasses = (row: T, index: number) => {
    const baseClasses = onRowClick
      ? "cursor-pointer hover:bg-gray-50 transition-colors"
      : "";
    const variantClasses = {
      default: "border-b border-gray-100",
      bordered: "border-b border-gray-200",
      striped: index % 2 === 0 ? "bg-white" : "bg-gray-50",
    };

    const customClass = rowClassName ? rowClassName(row, index) : "";

    return `${baseClasses} ${variantClasses[variant]} ${customClass}`.trim();
  };

  if (loading) {
    return (
      <div className="py-20">
        <Loader size="lg" text="Fetching data..." />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState 
        title="No records found" 
        description={emptyMessage} 
        icon="database"
      />
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
      <table className={getTableClasses()}>
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column, index) => {
              const sortable = column.sortable && onSort;
              const isSorted = sortBy === column.accessor;

              return (
                <th
                  key={index}
                  className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    sortable ? "cursor-pointer select-none" : ""
                  } ${column.className || ""}`}
                  onClick={() =>
                    sortable &&
                    typeof column.accessor === "string" &&
                    handleSort(column.accessor as keyof T)
                  }
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.header}</span>
                    {sortable && isSorted && (
                      <span className="text-cyan-600">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr
              key={row.id || row._id || rowIndex}
              className={getRowClasses(row, rowIndex)}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column, colIndex) => (
                <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                  {typeof column.accessor === "function"
                    ? column.accessor(row)
                    : (row[column.accessor] as React.ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
