import type { StudentBaseResponseDto } from '../types/studentTypes';

export class Student {
  readonly data: StudentBaseResponseDto;

  constructor(data: StudentBaseResponseDto) {
    this.data = data;
  }

  // Basic info
  get id() { return this.data.id; }
  get name() { return this.data.fullName; }
  get email() { return this.data.email; }
  get phone() { return this.data.phoneNumber || 'N/A'; }
  get isBlocked() { return this.data.isBlocked; }
  get isVerified() { return this.data.isVerified; }
  get isPaid() { return this.data.isPaid; }

  // Logic: Get initials for avatar
  get initials() {
    return this.data.fullName
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || 'U';
  }

  // Logic: Status Text
  get statusText() {
    if (this.isBlocked) return "Blocked";
    if (this.isVerified) return "Verified";
    return "Pending";
  }

  // Logic: Status Color (Tailwind classes)
  get statusColor() {
    if (this.isBlocked) return "bg-red-100 text-red-800";
    if (this.isVerified) return "bg-green-100 text-green-800";
    return "bg-yellow-100 text-yellow-800";
  }

  // Logic: Trial Class Summary
  get trialSummary() {
    const total = this.data.totalTrialClasses || 0;
    const pending = this.data.pendingTrialClasses || 0;
    
    if (total === 0) return null;
    
    let text = `${total} trial ${total === 1 ? 'class' : 'classes'}`;
    if (pending > 0) text += ` (${pending} pending)`;
    
    return {
      text,
      hasPending: pending > 0,
      total,
      pending
    };
  }

  // Subscription info
  get subscription() { return this.data.subscription; }
  get subscriptionPlan() { return this.data.subscription?.plan || 'None'; }
  get isSubscriptionActive() { return this.data.subscription?.status === 'active'; }
  
  get subscriptionExpiryDate() {
    if (!this.data.subscription?.endDate) return 'N/A';
    return new Date(this.data.subscription.endDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // Logic: Formatting dates
  get joinedDate() {
    if (!this.data.createdAt) return 'N/A';
    return new Date(this.data.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
}
