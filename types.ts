import { ethers } from "ethers";

export interface RoomBooking {
  userId: string;
  checkInDate: string;
  checkOutDate: string;
  txHash: string;
  bookingHash?: string;
  status: "BOOKED" | "CANCELLED" | "CHECKED_IN";
  createdAt?: string;
}

export interface Room {
  id?: string; // convenience id
  roomId: number;
  name: string;
  description?: string;
  images: string[];
  price?: string; // from blockchain
  pricePerNight: number; // from Mongo
  beds: number;
  maxGuests: number;
  bookings?: RoomBooking[];
}

export interface Web3ContextType {
  account: string | null;
  contract: ethers.Contract | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isConnecting: boolean;
  getReadOnlyContract: () => ethers.Contract;
  chainId: bigint | null;
}

export interface UserProfile {
  walletAddress: string;
  name?: string;
  phone?: string;
  idNumber?: string;
  avatarUrl?: string;
  backgroundImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type BookingStatus = "BOOKED" | "CANCELLED" | "CHECKED_IN" | "COMPLETED";

export interface Booking {
  _id?: string;
  roomId: number;
  walletAddress: string;
  customerName: string;
  phoneNumber: string;
  checkIn: string;
  checkOut: string;
  txHash: string;
  bookingHash?: string;
  status: BookingStatus;
  createdAt: string;
  room?: {
    roomId: number;
    name: string;
    description: string;
    images: string[];
    pricePerNight: number;
    beds: number;
    maxGuests: number;
  };
}
