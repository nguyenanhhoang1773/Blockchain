import React, { useState } from "react";
import { Link } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  BedDouble,
  DollarSign,
  Users,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  CheckCircle,
  Copy,
  FileText,
  Wallet,
  Camera,
} from "lucide-react";
import { Room, Booking } from "../types";
import { BACKEND_URL } from "../constants";
import axios from "axios";
import { useWeb3 } from "./Web3Context";
import { ethers } from "ethers";

interface RoomCardProps {
  room: Room;
}

export default function RoomCard({ room }: RoomCardProps) {
  const { account, contract } = useWeb3();
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [successBooking, setSuccessBooking] = useState<Booking | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const images =
    room.images && room.images.length > 0
      ? room.images
      : ["https://via.placeholder.com/800x600?text=No+Image"];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const normalizeHotelTimes = (checkInDate: Date, checkOutDate: Date) => {
    const ci = new Date(checkInDate);
    ci.setHours(14, 0, 0, 0);
    const co = new Date(checkOutDate);
    co.setHours(12, 0, 0, 0);
    return { ci, co };
  };

  const checkAvailability = async (): Promise<boolean> => {
    if (!checkIn || !checkOut) {
      setError("Please select both check-in and check-out dates");
      return false;
    }

    if (checkOut <= checkIn) {
      setError("Check-out date must be after check-in date");
      return false;
    }

    setCheckingAvailability(true);
    setError(null);
    setIsAvailable(null);

    try {
      const { ci, co } = normalizeHotelTimes(checkIn, checkOut);

      const response = await axios.post(`${BACKEND_URL}/api/bookings/check`, {
        roomId: room.roomId,
        checkIn: ci.toISOString(),
        checkOut: co.toISOString(),
      });

      setIsAvailable(response.data.available);
      if (!response.data.available) {
        setError("Selected dates are not available");
      }
      return response.data.available;
    } catch (err: any) {
      console.error("Availability check failed:", err);
      setError(err.response?.data?.error || "Failed to check availability");
      setIsAvailable(false);
      return false;
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleBookRoom = async () => {
    if (!account || !contract) {
      setError("Please connect your wallet first");
      return;
    }

    if (!checkIn || !checkOut) {
      setError("Please select dates first");
      return;
    }

    if (isAvailable !== true) {
      // force availability check to avoid stale state
      const available = await checkAvailability();
      if (!available) return;
    }

    if (!customerName.trim() || !phoneNumber.trim()) {
      setError("Please enter your name and phone number");
      return;
    }

    setBooking(true);
    setError(null);

    try {
      const { ci, co } = normalizeHotelTimes(checkIn, checkOut);

      const nights = Math.ceil(
        (co.getTime() - ci.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (nights <= 0) {
        throw new Error("Invalid booking dates");
      }
      const nightly =
        typeof room.pricePerNight === "number"
          ? room.pricePerNight
          : parseFloat(room.price || "0");
      if (!Number.isFinite(nightly) || nightly <= 0) {
        throw new Error("Invalid room price");
      }
      const pricePerNightWei = ethers.parseEther(nightly.toString());
      const totalWei = pricePerNightWei * BigInt(nights);
      const checkInTs = Math.floor(ci.getTime() / 1000);
      const checkOutTs = Math.floor(co.getTime() / 1000);

      // Call smart contract book(roomId, checkIn, checkOut)
      const tx = await contract.book(room.roomId, checkInTs, checkOutTs, {
        value: totalWei,
      });
      await tx.wait();
      // Save booking to backend
      const bookingResponse = await axios.post(`${BACKEND_URL}/api/bookings`, {
        roomId: room.roomId || Number(room.id),
        walletAddress: account,
        customerName: customerName.trim(),
        phoneNumber: phoneNumber.trim(),
        checkIn: ci.toISOString(),
        checkOut: co.toISOString(),
        txHash: tx.hash,
      });

      // Set success booking data to show in modal
      setSuccessBooking(bookingResponse.data.booking);

      // Reset form
      setCheckIn(null);
      setCheckOut(null);
      setIsAvailable(null);
      setCustomerName("");
      setPhoneNumber("");
    } catch (err: any) {
      console.error("Booking failed:", err);
      const errorMessage =
        err.response?.data?.error ||
        err.reason ||
        err.message ||
        "Booking failed";
      setError(errorMessage);
      alert(`Booking failed: ${errorMessage}`);
    } finally {
      setBooking(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-200">
      {/* Image Slider */}
      <div className="relative aspect-video bg-gradient-to-br from-indigo-50 to-blue-50 group">
        {images.length > 0 ? (
          <>
            <img
              src={images[currentImageIndex]}
              alt={room.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://via.placeholder.com/800x600?text=Image+Error";
              }}
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === currentImageIndex
                          ? "bg-white w-6"
                          : "bg-white/50"
                      }`}
                      aria-label={`Go to image ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BedDouble className="w-16 h-16 text-indigo-200" />
          </div>
        )}
      </div>

      <div className="p-6">
        {/* Room Name and Price */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{room.name}</h3>
            {room.description && (
              <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                {room.description}
              </p>
            )}
          </div>
          <div className="flex items-center text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded whitespace-nowrap ml-4">
            <DollarSign className="w-4 h-4 mr-1" />
            {room.pricePerNight || room.price} ETH
          </div>
        </div>

        {/* Room Details */}
        {(room.beds || room.maxGuests) && (
          <div className="flex gap-4 text-sm text-slate-600 mb-4">
            {room.beds && (
              <div className="flex items-center">
                <BedDouble className="w-4 h-4 mr-1" />
                {room.beds} {room.beds === 1 ? "bed" : "beds"}
              </div>
            )}
            {room.maxGuests && (
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                Up to {room.maxGuests} guests
              </div>
            )}
          </div>
        )}

        {/* Date Picker */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
            <Calendar className="w-4 h-4" />
            Select Dates
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-slate-600 mb-1">
                Check-in
              </label>
              <DatePicker
                selected={checkIn}
                onChange={(date) => {
                  setCheckIn(date);
                  setIsAvailable(null);
                  setError(null);
                }}
                selectsStart
                startDate={checkIn}
                endDate={checkOut}
                minDate={new Date()}
                placeholderText="Select date"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                dateFormat="MMM dd, yyyy"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">
                Check-out
              </label>
              <DatePicker
                selected={checkOut}
                onChange={(date) => {
                  setCheckOut(date);
                  setIsAvailable(null);
                  setError(null);
                }}
                selectsEnd
                startDate={checkIn}
                endDate={checkOut}
                minDate={checkIn || new Date()}
                placeholderText="Select date"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                dateFormat="MMM dd, yyyy"
              />
            </div>
          </div>
        </div>

        {/* Guest Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
          <div>
            <label className="block text-xs text-slate-600 mb-1">
              Your Name
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="+1 555-1234"
            />
          </div>
        </div>

        {/* Availability Status */}
        {isAvailable !== null && (
          <div
            className={`mb-3 p-2 rounded text-sm ${
              isAvailable
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {isAvailable ? "✓ Available for selected dates" : "✗ Not available"}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-3 p-2 bg-red-50 text-red-700 text-sm rounded">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={checkAvailability}
            disabled={!checkIn || !checkOut || checkingAvailability}
            className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {checkingAvailability ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              "Check Availability"
            )}
          </button>
          <button
            onClick={handleBookRoom}
            disabled={
              !account ||
              !contract ||
              !isAvailable ||
              booking ||
              !checkIn ||
              !checkOut
            }
            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {booking ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Booking...
              </>
            ) : (
              "Book Now"
            )}
          </button>
        </div>

        {/* View Details Link */}
        <Link
          to={`/room/${room.roomId || room.id}`}
          className="block mt-3 text-center text-sm text-indigo-600 hover:text-indigo-700"
        >
          View full details →
        </Link>
      </div>

      {/* Success Booking Modal */}
      {successBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <h2 className="text-xl font-bold text-slate-900">
                  Booking Successful!
                </h2>
              </div>
              <button
                onClick={() => setSuccessBooking(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Important Notice */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <Camera className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-yellow-900 mb-1">
                    Please take a screenshot
                  </p>
                  <p className="text-sm text-yellow-800">
                    Please capture a screenshot of this booking confirmation for
                    your records. This information is important for check-in.
                  </p>
                </div>
              </div>

              {/* Booking Details */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    Booking Details
                  </h3>
                  
                  {/* Room Information */}
                  {successBooking.room && (
                    <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <h4 className="font-semibold text-slate-900 mb-2">
                        {successBooking.room.name}
                      </h4>
                      {successBooking.room.description && (
                        <p className="text-sm text-slate-600 mb-3">
                          {successBooking.room.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        {successBooking.room.beds > 0 && (
                          <div className="flex items-center gap-1">
                            <BedDouble className="w-3 h-3" />
                            <span>{successBooking.room.beds} {successBooking.room.beds === 1 ? 'bed' : 'beds'}</span>
                          </div>
                        )}
                        {successBooking.room.maxGuests > 0 && (
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>Up to {successBooking.room.maxGuests} guests</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Status</p>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                        {successBooking.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Check-in</p>
                      <p className="text-sm font-medium text-slate-900">
                        {formatDate(successBooking.checkIn)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Check-out</p>
                      <p className="text-sm font-medium text-slate-900">
                        {formatDate(successBooking.checkOut)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Guest Name</p>
                      <p className="text-sm font-medium text-slate-900">
                        {successBooking.customerName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Phone</p>
                      <p className="text-sm font-medium text-slate-900">
                        {successBooking.phoneNumber}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Transaction Info */}
                <div className="border-t border-slate-200 pt-4 space-y-3">
                  <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Transaction Information
                  </h4>

                  <div>
                    <p className="text-xs text-slate-500 mb-1">
                      Wallet Address
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-mono text-slate-900 break-all">
                        {successBooking.walletAddress}
                      </p>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            successBooking.walletAddress,
                            "wallet"
                          )
                        }
                        className="p-1 hover:bg-slate-100 rounded transition-colors flex-shrink-0"
                        title="Copy wallet address"
                      >
                        {copiedField === "wallet" ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 mb-1">
                      Transaction Hash
                    </p>
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://sepolia.etherscan.io/tx/${successBooking.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-mono text-indigo-600 hover:text-indigo-700 hover:underline break-all"
                      >
                        {successBooking.txHash}
                      </a>
                      <button
                        onClick={() =>
                          copyToClipboard(successBooking.txHash, "txHash")
                        }
                        className="p-1 hover:bg-slate-100 rounded transition-colors flex-shrink-0"
                        title="Copy transaction hash"
                      >
                        {copiedField === "txHash" ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {successBooking.bookingHash && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">
                        Booking Hash
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-mono text-slate-900 break-all">
                          {successBooking.bookingHash}
                        </p>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              successBooking.bookingHash!,
                              "bookingHash"
                            )
                          }
                          className="p-1 hover:bg-slate-100 rounded transition-colors flex-shrink-0"
                          title="Copy booking hash"
                        >
                          {copiedField === "bookingHash" ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setSuccessBooking(null)}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors"
                >
                  Close
                </button>
                <Link
                  to="/my-bookings"
                  onClick={() => setSuccessBooking(null)}
                  className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium transition-colors text-center"
                >
                  View All Bookings
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
