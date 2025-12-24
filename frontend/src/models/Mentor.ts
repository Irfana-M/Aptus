import type { MentorProfile } from '../features/mentor/mentorSlice';

export class Mentor {
  readonly data: MentorProfile;

  constructor(data: MentorProfile) {
    this.data = data;
  }

  get id() { return this.data._id; }
  get name() { return this.data.fullName; }
  get email() { return this.data.email; }
  get phone() { return this.data.phoneNumber; }
  get approvalStatus() { return this.data.approvalStatus; }
  get isBlocked() { return this.data.isBlocked; }
  get rating() { return this.data.rating || 0; }

  // Logic: Get initials
  get initials() {
    return this.data.fullName
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || 'M';
  }

  // Logic: Approval Status formatting
  get approvalStatusText() {
    switch (this.data.approvalStatus) {
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'pending': return 'Pending Review';
      default: return 'Unknown';
    }
  }

  
  get approvalStatusColor() {
    switch (this.data.approvalStatus) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  // Logic: expertise summary
  get expertiseSummary() {
    if (!this.data.subjectProficiency || this.data.subjectProficiency.length === 0) return 'No subjects listed';
    return this.data.subjectProficiency.map(s => s.subject).join(', ');
  }
}
