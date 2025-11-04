import type {
  StudentDBInput,
  StudentProfile,
  StudentRegisterInput,
} from "@/interfaces/models/student.interface";

export class StudentMapper {
  static toDBInput(input: StudentRegisterInput): StudentDBInput {
    return {
      fullName: input.fullName,
      email: input.email,
      phoneNumber: input.phoneNumber,
      password: input.password,
      isBlocked: false,
    };
  }

  static toResponseDto(student: any): StudentProfile {
    const data = student.toObject ? student.toObject() : student;

    return {
      _id: data._id,
      fullName: data.fullName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      age: data.age,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth,
      contactInfo: data.contactInfo,
      academicDetails: data.academicDetails,
      profileImage: data.profileImage,
      goal: data.goal,
      isVerified: data.isVerified,
      isBlocked: data.isBlocked,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      hasPaid: data.hasPaid,
      authProvider: data.authProvider,
      googleId: data.googleId,
    };
  }

  static toProfileUpdate(
    data: Partial<StudentProfile>
  ): Partial<StudentProfile> {
    return {
      fullName: data.fullName ?? "",
      phoneNumber: data.phoneNumber ?? "",
      age: data.age ?? 0,
      gender: data.gender ?? "",
      dateOfBirth: data.dateOfBirth ?? new Date(),
      contactInfo: data.contactInfo ?? {
        parentInfo: { name: "", email: "", phoneNumber: "" },
        address: "",
        country: "",
        postalCode: "",
      },
      academicDetails: data.academicDetails ?? {
        institutionName: "",
        grade: "",
        syllabus: "",
      },
      goal: data.goal ?? "",
      profileImage: data.profileImage ?? "",
    };
  }
}
