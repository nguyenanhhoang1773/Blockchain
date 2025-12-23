// backend/models/Room.ts
import { Db, Collection } from "mongodb";

let db: Db | null = null;

export type RoomBookingStatus = "BOOKED" | "CANCELLED" | "CHECKED_IN";

export interface RoomBooking {
  userId: string; // wallet address (lowercase)
  checkInDate: Date;
  checkOutDate: Date;
  txHash: string;
  bookingHash?: string;
  status: RoomBookingStatus;
  createdAt: Date;
}

export interface RoomMeta {
  roomId: number; // from blockchain
  name: string;
  description?: string;
  images: string[];
  pricePerNight: number; // ETH
  beds: number;
  maxGuests: number;
  bookings?: RoomBooking[];
  createdAt: Date;
}

export function initRoomModel(database: Db) {
  db = database;
  const col = getRoomsCollection();
  col.createIndex({ roomId: 1 }, { unique: true }).catch(console.error);
}

export function getRoomsCollection(): Collection<RoomMeta> {
  if (!db) throw new Error("Rooms DB not initialized");
  return db.collection<RoomMeta>("rooms");
}
