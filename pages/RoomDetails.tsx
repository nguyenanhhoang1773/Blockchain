import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import { ethers } from "ethers";
import { useWeb3 } from "../components/Web3Context";
import { BACKEND_URL } from "../constants";
import { Room } from "../types";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  LogIn,
  BedDouble,
  Calendar,
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function RoomDetails() {
  const { id } = useParams<{ id: string }>();
  const { account, contract, connectWallet } = useWeb3();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState<string | null>(
    null
  );
  const [txHash, setTxHash] = useState<string | null>(null);

  useEffect(() => {
    fetchRoomDetails();
  }, [id, account]);

  const fetchRoomDetails = async () => {
    try {
      setLoading(true);
      // Fetch data via Axios (Backend)
      const response = await axios.get(`${BACKEND_URL}/rooms/${id}`);
      setRoom(response.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load room details");
    } finally {
      setLoading(false);
    }
  };

  const buildCheckInOutPayload = () => {
    if (!checkIn || !checkOut) return null;
    // We send date-only (YYYY-MM-DD) to backend; backend applies hotel times
    const ci = new Date(checkIn);
    const co = new Date(checkOut);
    ci.setHours(0, 0, 0, 0);
    co.setHours(0, 0, 0, 0);
    const ciIso = ci.toISOString();
    const coIso = co.toISOString();
    return { checkInIso: ciIso, checkOutIso: coIso };
  };

  const validateDates = () => {
    if (!checkIn || !checkOut) {
      setError("Please select both check-in and check-out dates");
      return false;
    }
    const ci = new Date(checkIn);
    const co = new Date(checkOut);
    ci.setHours(0, 0, 0, 0);
    co.setHours(0, 0, 0, 0);
    if (co <= ci) {
      setError("Minimum stay is 1 night");
      return false;
    }
    return true;
  };

  const handleBookRoom = async () => {
    if (!contract || !room || !account) return;

    setError(null);
    setAvailabilityMessage(null);
    setTxHash(null);

    if (!customerName || !phoneNumber) {
      setError("Please enter your name and phone number");
      return;
    }

    if (!validateDates()) {
      return;
    }

    try {
      if (!checkIn || !checkOut) return;
      const payloadDates = buildCheckInOutPayload();
      if (!payloadDates) return;

      setCheckingAvailability(true);

      // Step 1: Check availability with backend
      const checkResponse = await axios.post(
        `${BACKEND_URL}/api/bookings/check`,
        {
          roomId: Number(room.id),
          checkIn: payloadDates.checkInIso,
          checkOut: payloadDates.checkOutIso,
        }
      );

      if (!checkResponse.data.available) {
        setAvailabilityMessage("Selected dates are not available for booking.");
        setCheckingAvailability(false);
        return;
      }

      setCheckingAvailability(false);
      setProcessing(true);

      // Step 2: Call smart contract to book room with ETH
      const tx = await contract.bookRoom(room.id, {
        value: ethers.parseEther(room.price),
      });
      const receipt = await tx.wait();

      setTxHash(tx.hash);

      // Step 3: Save booking to backend
      try {
        await axios.post(`${BACKEND_URL}/api/bookings`, {
          roomId: Number(room.id),
          walletAddress: account,
          customerName,
          phoneNumber,
          checkIn: payloadDates.checkInIso,
          checkOut: payloadDates.checkOutIso,
          txHash: tx.hash,
        });
      } catch (saveError) {
        console.error("Failed to save booking in backend:", saveError);
      }

      alert("Room booked successfully!");
      fetchRoomDetails(); // Refresh room status
    } catch (err: any) {
      console.error(err);
      setError(err.reason || err.message || "Booking failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckIn = async () => {
    if (!contract || !room) return;
    try {
      setProcessing(true);
      const tx = await contract.checkIn(room.id);
      await tx.wait();
      alert("Checked in successfully!");
      fetchRoomDetails();
    } catch (err: any) {
      console.error(err);
      alert(err.reason || "Check-in failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!contract || !room) return;
    try {
      setProcessing(true);
      const tx = await contract.cancelBooking(room.id);
      await tx.wait();
      alert("Booking cancelled!");
      fetchRoomDetails();
    } catch (err: any) {
      console.error(err);
      alert(err.reason || "Cancellation failed");
    } finally {
      setProcessing(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
      </div>
    );
  if (!room)
    return <div className="text-center p-20 text-red-500">Room not found</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link
        to="/"
        className="text-sm text-slate-500 hover:text-primary mb-6 inline-block"
      >
        &larr; Back to Listings
      </Link>

      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="h-64 bg-slate-100 flex items-center justify-center">
          <BedDouble className="w-24 h-24 text-slate-300" />
        </div>

        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Room #{room.id}
              </h1>
              <p className="text-slate-500 mt-1">Premium Suite</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {room.price} ETH
              </div>
              <div className="text-sm text-slate-400">per night</div>
            </div>
          </div>

          <div className="flex gap-4 mb-8">
            <div className="flex-1 bg-slate-50 p-4 rounded-lg border border-slate-100">
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                Status
              </div>
              <div className="flex items-center gap-2">
                {isAvailable ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="font-semibold text-green-700">
                      Available
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="font-semibold text-red-700">Booked</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex-1 bg-slate-50 p-4 rounded-lg border border-slate-100">
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                Current Guest
              </div>
              <div className="font-mono text-sm break-all text-slate-700">
                {room.status === RoomStatus.Available ? "—" : room.bookedBy}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            {!account ? (
              <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 text-center">
                <p className="text-indigo-900 font-medium mb-3">
                  Connect your wallet to manage bookings
                </p>
                <button
                  onClick={connectWallet}
                  className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-indigo-700"
                >
                  <LogIn className="w-4 h-4 mr-2" /> Connect Wallet
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {isAvailable && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Name *
                        </label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Phone *
                        </label>
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          placeholder="+1234567890"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Check-in
                        </label>
                        <DatePicker
                          selected={checkIn}
                          onChange={(date) => setCheckIn(date)}
                          dateFormat="yyyy-MM-dd"
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          minDate={new Date()}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Check-out
                        </label>
                        <DatePicker
                          selected={checkOut}
                          onChange={(date) => setCheckOut(date)}
                          dateFormat="yyyy-MM-dd"
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          minDate={checkIn || new Date()}
                        />
                      </div>
                    </div>

                    {availabilityMessage && (
                      <p className="text-sm text-red-600">
                        {availabilityMessage}
                      </p>
                    )}
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    {txHash && (
                      <p className="text-xs text-slate-500 break-all">
                        Booking transaction: {txHash}
                      </p>
                    )}

                    <button
                      onClick={handleBookRoom}
                      disabled={processing || checkingAvailability}
                      className="w-full flex items-center justify-center py-3 px-4 rounded-md shadow-sm text-white bg-primary hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {processing || checkingAvailability ? (
                        <Loader2 className="animate-spin mr-2 h-5 w-5" />
                      ) : (
                        <Calendar className="mr-2 h-5 w-5" />
                      )}
                      {processing
                        ? "Processing booking..."
                        : checkingAvailability
                        ? "Checking availability..."
                        : "Book Now"}
                    </button>
                  </div>
                )}

                {isBookedByUser && (
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={handleCancelBooking}
                      disabled={processing}
                      className="flex items-center justify-center py-3 px-4 rounded-md border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {processing ? (
                        <Loader2 className="animate-spin mr-2 h-5 w-5" />
                      ) : (
                        "Cancel Booking"
                      )}
                    </button>
                    <button
                      onClick={handleCheckIn}
                      disabled={processing}
                      className="flex items-center justify-center py-3 px-4 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {processing ? (
                        <Loader2 className="animate-spin mr-2 h-5 w-5" />
                      ) : (
                        "Check In"
                      )}
                    </button>
                  </div>
                )}

                {!isAvailable && !isBookedByUser && (
                  <p className="text-center text-slate-500 italic">
                    This room is currently occupied.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
