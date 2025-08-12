export interface StudentRegisterInput {
    fullName: string;
    email: string;
    phone: string;
    password: string;
}
export interface ParentInfo {
    name: string;
    email: string;
    phone: string;
}
export interface contactInfo {
    parentInfo: ParentInfo;
    address: string;
    country: string;
    postalCode: string;
}
export interface AcademicDetails {
    institutionName: string;
    grade: string;
    syllabus: string;
}
export interface Student {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
    password: string;
    age: number;
    gender: string;
    dateOfBirth: Date;
    contactInfo: contactInfo;
    academicDetails: AcademicDetails;
    profileImage: string;
    goal?: string;
    isBlocked: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
//# sourceMappingURL=student.interface.d.ts.map