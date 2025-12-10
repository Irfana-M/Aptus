export const generateMeetLink = (trialClassId: string): string => {
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  return `${baseUrl}/trial-class/${trialClassId}/call`;
};