import { AuthContext } from "./authContext";
import { TokenManager } from "./tokenManager";

export const prepareForVideoCall = (expectedRole?: string) => {
  console.log(
    "🧹 PREPARING FOR VIDEO CALL...",
    expectedRole ? `(Expecting: ${expectedRole})` : ""
  );

  let token = TokenManager.getToken(expectedRole as any);

  if (!token) {
    console.error("❌ No access token found");
    return false;
  }

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const actualRole = payload.role;
    const userId = payload.id || payload._id;

    console.log("👤 ACTUAL USER FROM TOKEN:", {
      email: payload.email,
      role: actualRole,
      id: userId,
    });

    // enforce single-role browser session
    TokenManager.setToken(actualRole, token);

    try {
      AuthContext.getInstance().setRole(
        actualRole as "admin" | "student" | "mentor"
      );
    } catch (e) {
      console.warn("⚠️ Failed to sync AuthContext", e);
    }

    console.log("✅ Video call environment ready");

    return true;
  } catch (error) {
    console.error("❌ Failed to prepare for video call:", error);
    return false;
  }
};