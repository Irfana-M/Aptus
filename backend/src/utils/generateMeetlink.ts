export const generateMeetLink = (trialClassId: string): string => {
  const baseUrl = process.env.CLIENT_URL || "http://localhost:5173";
  return `${baseUrl}/trial-class/${trialClassId}/call`;
};