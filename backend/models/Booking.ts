import { Collection, Db } from "mongodb";

let db: Db | null = null;

export type BookingStatus = "BOOKED" | "CANCELLED" | "CHECKED_IN" | "COMPLETED";

export interface Booking {
  roomId: number;
  walletAddress: string;
  customerName: string;
  phoneNumber: string;
  checkIn: Date;
  checkOut: Date;
  txHash: string;
  bookingHash?: string;
  status: BookingStatus;
  createdAt: Date;
}

export function initBookingModel(database: Db) {
  db = database;
}

export function getBookingsCollection(): Collection<Booking> {
  if (!db) {
    throw new Error("Database not initialized for bookings");
  }
  return db.collection<Booking>("bookings");
}
