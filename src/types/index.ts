export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface PrayerRoom {
  id: string;
  name: string;
  description: string;
  hostId: string;
  hostName: string;
  participantCount: number;
  isActive: boolean;
  createdAt: Date;
  category: string;
  circleId?: string | null;
  isPrivate: boolean;
  scheduledStartTime?: Date;
  scheduledEndTime?: Date;
  isScheduled?: boolean;
  status?: 'scheduled' | 'live' | 'ended';
  maxParticipants?: number;
}

export interface Circle {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  ownerName: string;
  memberCount: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CircleMember {
  id: string;
  circleId: string;
  userId: string;
  userName: string;
  role: 'owner' | 'member';
  joinedAt: Date;
}

export interface PrayerRequest {
  id: string;
  userId: string;
  userName: string;
  title: string;
  content: string;
  category: string;
  amenCount: number;
  responseCount: number;
  isAnswered: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PrayerRequestAmen {
  id: string;
  prayerRequestId: string;
  userId: string;
  createdAt: Date;
}

export interface PrayerRequestResponse {
  id: string;
  prayerRequestId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
}

export interface RoomMessage {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  message: string;
  createdAt: Date;
}

export interface Participant {
  identity: string;
  name: string;
  isSpeaking: boolean;
  isMuted: boolean;
  audioTrack?: any;
}

export interface RoomInvite {
  id: string;
  roomId: string;
  inviterId: string;
  inviteeId?: string | null;
  circleId?: string | null;
  createdAt: Date;
}

export interface RoomSpeaker {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  role: 'host' | 'speaker' | 'listener';
  addedAt: Date;
}
