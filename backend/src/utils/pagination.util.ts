import type { PaginationMeta } from "@/dtos/shared/paginationTypes";

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

/**
 * Extracts and normalizes page and limit from query parameters
 */
export const getPaginationParams = (query: Record<string, unknown>): PaginationParams => {
  const page = Math.max(1, parseInt(query.page as string) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(query.limit as string) || 10));
  const skip = (page - 1) * limit;
  
  return { page, limit, skip };
};

/**
 * Formats data into a standardized paginated response structure
 */
export const formatPaginatedResult = <T>(
  items: T[],
  total: number,
  params: { page: number, limit: number }
) => {
  const totalPages = Math.ceil(total / params.limit);
  
  const pagination: PaginationMeta = {
    currentPage: params.page,
    totalPages,
    totalItems: total,
    itemsPerPage: params.limit,
    hasNextPage: params.page < totalPages,
    hasPrevPage: params.page > 1
  };

  return {
    success: true,
    data: items,
    pagination,
    count: items.length // For backward compatibility with some frontend expectations
  };
};
