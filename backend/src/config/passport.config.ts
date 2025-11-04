import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import { StudentModel } from "../models/student.model";
import { MentorModel } from "../models/mentor.model";

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

        let user =
          (await StudentModel.findOne({ email })) ||
          (await MentorModel.findOne({ email }));

        if (!user) {
          user = await StudentModel.create({
            fullName: profile.displayName,
            email,
            password: "",
            phoneNumber: "",
            isVerified: true,
          });
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
