import { apiRequest } from "./api";
import { ApiResponse } from "../types/form.types";
import { AnalyticsOverview, AnalyticsRange } from "../types/analytics.types";

export const analyticsService = {
  getOverview: (range: AnalyticsRange = 30) =>
    apiRequest<ApiResponse<AnalyticsOverview>>(`/api/analytics/overview?range=${range}`),
};
