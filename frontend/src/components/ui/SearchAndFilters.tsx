import React from "react";
import { Search, Filter, X } from "lucide-react";

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
  defaultValue?: string;
}

interface SearchAndFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  filterConfigs: FilterConfig[];
  onClearFilters?: () => void;
  showClearFilters?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  searchTerm,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters,
  onFilterChange,
  filterConfigs,
  onClearFilters,
  showClearFilters = true,
  className = "",
  size = "md",
}) => {
  const hasActiveFilters = Object.values(filters).some((value) => value !== "");
  const activeFiltersCount = Object.values(filters).filter(
    (value) => value !== ""
  ).length;

  const handleClearFilters = () => {
    onSearchChange("");
    filterConfigs.forEach((config) => {
      onFilterChange(config.key, config.defaultValue || "");
    });
    onClearFilters?.();
  };

  const sizeClasses = {
    sm: "py-1 text-sm",
    md: "py-2 text-sm",
    lg: "py-3 text-base",
  };

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}
    >
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 w-full lg:w-auto">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`w-full pl-10 pr-4 ${sizeClasses[size]} bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent`}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          {filterConfigs.map((config) => (
            <div key={config.key} className="relative flex-1 sm:flex-none">
              <Filter
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={16}
              />
              <select
                value={filters[config.key] || ""}
                onChange={(e) => onFilterChange(config.key, e.target.value)}
                className={`pl-10 pr-8 ${sizeClasses[size]} w-full bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent appearance-none`}
              >
                <option value="">{config.label}</option>
                {config.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ))}

          {/* Clear Filters Button */}
          {showClearFilters && hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className={`flex items-center justify-center space-x-2 px-4 ${sizeClasses[size]} bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 whitespace-nowrap`}
            >
              <X size={16} />
              <span>Clear ({activeFiltersCount})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
