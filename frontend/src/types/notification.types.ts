export interface NotificationDTO {
  _id: string;
  title: string;
  message: string;
  createdAt: string;
  type: string;
  status?: 'pending' | 'sent' | 'read' | 'failed'; 
  payload?: any;
}


export interface NotificationUI {
  _id: string;
  title: string;
  message: string;
  createdAt: string;
  type: string;
  status: 'pending' | 'sent' | 'read' | 'failed';
   payload?: {
    joinLink?: string;
    startTime?: string;
    subjectName?: string;
    [key: string]: any;
  };
}

export const mapNotificationDTOToUI = (
  dto: NotificationDTO
): NotificationUI => ({
  _id: dto._id,
  title: dto.title,
  message: dto.message,
  createdAt: dto.createdAt,
  type: dto.type,
  status: dto.status ?? 'sent', // fallback
  payload: dto.payload
});