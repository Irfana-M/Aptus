import adminApi from "../../api/adminApi";
import { API_ROUTES } from "../../constants/apiRoutes";
import { getErrorMessage } from "../../utils/errorUtils";

export const getAllPayments = async (page: number = 1, limit: number = 10) => {
  try {
    const response = await adminApi.get(API_ROUTES.ADMIN.TRANSACTIONS, {
      params: { page, limit },
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};


