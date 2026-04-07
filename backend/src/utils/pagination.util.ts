import type { PaginationMeta } from "@/dtos/shared/paginationTypes";

export interface PaginationQueryParams {
  page: number;
  limit: number;
  skip: number;
}


export const getPaginationParams = (query: Record<string, unknown>): PaginationQueryParams => {
  const page = Math.max(1, parseInt(query.page as string) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(query.limit as string) || 10));
  const skip = (page - 1) * limit;
  
  return { page, limit, skip };
};


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

export const formatStandardizedPaginatedResult = <T>(
  items: T[],
  total: number,
  params: { page: number; limit: number },
  message: string
) => {
  const totalPages = Math.ceil(total / params.limit);
  const pagination: PaginationMeta = {
    currentPage: params.page,
    totalPages,
    totalItems: total,
    itemsPerPage: params.limit,
    hasNextPage: params.page < totalPages,
    hasPrevPage: params.page > 1,
  };

  return {
    success: true,
    message,
    data: {
      items,
      pagination,
    },
  };
};
