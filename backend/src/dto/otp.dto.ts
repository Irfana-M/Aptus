export interface SendOtpDto {
    email: string;
    role: "student" | "mentor";
}