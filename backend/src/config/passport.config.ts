import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import { StudentModel } from "../models/student/student.model";
import { MentorModel } from "../models/mentor/mentor.model";

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      passReqToCallback: true,
    },
    async (req, _accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error("No email found"), undefined);

        // Decode state to get requested role
        let requestedRole = 'student';
        if (req.query && req.query.state) {
          try {
            const stateData = JSON.parse(Buffer.from(req.query.state as string, 'base64').toString());
            requestedRole = stateData.role || 'student';
          } catch (e) {
            console.warn('Passport: Failed to decode state, defaulting to student');
          }
        }

        // Check BOTH collections regardless of requested role (to find existing users)
        let user: any = await StudentModel.findOne({ email });
        if (!user) {
          user = await MentorModel.findOne({ email });
        }

        // If user doesn't exist, create them in the CORRECT collection
        if (!user) {
          if (requestedRole === 'mentor') {
            user = await MentorModel.create({
              fullName: profile.displayName,
              email,
              password: "",
              phoneNumber: "",
              isVerified: true,
              approvalStatus: "approved", 
            });
          } else {
            user = await StudentModel.create({
              fullName: profile.displayName,
              email,
              password: "",
              phoneNumber: "",
              isVerified: true,
            });
          }
        }

        if (user && user.role === 'mentor' && user.approvalStatus === 'rejected') {
          return done(new Error("Your application was not approved."), undefined);
        }

        done(null, user);
      } catch (error) {
        console.error("Google auth error:", error);
        done(error, undefined);
      }
    }
  )
);

export default passport;
