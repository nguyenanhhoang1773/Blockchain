import React, { useState, useEffect } from "react";
import axios from "axios";
import { useWeb3 } from "../components/Web3Context";
import { BACKEND_URL } from "../constants";
import { Booking } from "../types";
import {
  Loader2,
  Calendar,
  MapPin,
  User,
  Phone,
  Wallet,
  FileText,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  BedDouble,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function MyBookings() {
  const { account } = useWeb3();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (account) {
      fetchBookings();
    } else {
      setLoading(false);
      setError("Please connect your wallet to view bookings");
    }
  }, [account]);

  const fetchBookings = async () => {
    if (!account) return;

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${BACKEND_URL}/api/bookings/my/${account}`
      );
      setBookings(response.data);
    } catch (err: any) {
      console.error("Error fetching bookings:", err);
      setError(
        err.response?.data?.error || "Failed to load bookings. Please try again."
      );
    } finally {
      setLoading(false);
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      BOOKED: {
        icon: Clock,
        bg: "bg-blue-100",
        text: "text-blue-700",
        label: "Booked",
      },
      CHECKED_IN: {
        icon: CheckCircle,
        bg: "bg-green-100",
        text: "text-green-700",
        label: "Checked In",
      },
      CANCELLED: {
        icon: XCircle,
        bg: "bg-red-100",
        text: "text-red-700",
        label: "Cancelled",
      },
      COMPLETED: {
        icon: CheckCircle,
        bg: "bg-gray-100",
        text: "text-gray-700",
        label: "Completed",
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      icon: Clock,
      bg: "bg-gray-100",
      text: "text-gray-700",
      label: status,
    };

    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}
      >
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  if (!account) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800">
            Please connect your wallet to view your bookings.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">My Bookings</h1>
        <p className="text-slate-600">
          View and manage all your hotel bookings
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
          <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            No bookings yet
          </h3>
          <p className="text-slate-600 mb-6">
            Start exploring our rooms and book your stay!
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors"
          >
            Browse Rooms
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => (
            <div
              key={booking._id || booking.txHash}
              className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-slate-900 mb-1">
                      {booking.room?.name || `Room #${booking.roomId}`}
                    </h3>
                    {booking.room?.description && (
                      <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                        {booking.room.description}
                      </p>
                    )}
                    {booking.room && (
                      <div className="flex items-center gap-4 text-xs text-slate-500 mb-2">
                        {booking.room.beds > 0 && (
                          <div className="flex items-center gap-1">
                            <BedDouble className="w-3 h-3" />
                            <span>{booking.room.beds} {booking.room.beds === 1 ? 'bed' : 'beds'}</span>
                          </div>
                        )}
                        {booking.room.maxGuests > 0 && (
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>Up to {booking.room.maxGuests} guests</span>
                          </div>
                        )}
                      </div>
                    )}
                    <Link
                      to={`/room/${booking.roomId}`}
                      className="text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      View room details →
                    </Link>
                  </div>
                  {getStatusBadge(booking.status)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500 mb-1">
                          Check-in
                        </p>
                        <p className="text-sm font-medium text-slate-900">
                          {formatDate(booking.checkIn)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500 mb-1">
                          Check-out
                        </p>
                        <p className="text-sm font-medium text-slate-900">
                          {formatDate(booking.checkOut)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Guest</p>
                        <p className="text-sm font-medium text-slate-900">
                          {booking.customerName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Phone</p>
                        <p className="text-sm font-medium text-slate-900">
                          {booking.phoneNumber}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4 mt-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Wallet className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 mb-1">
                        Wallet Address
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-mono text-slate-900">
                          {booking.walletAddress}
                        </p>
                        <button
                          onClick={() =>
                            copyToClipboard(booking.walletAddress, "wallet")
                          }
                          className="p-1 hover:bg-slate-100 rounded transition-colors"
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
                  </div>

                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 mb-1">
                        Transaction Hash
                      </p>
                      <div className="flex items-center gap-2">
                        <a
                          href={`https://sepolia.etherscan.io/tx/${booking.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-mono text-indigo-600 hover:text-indigo-700 hover:underline"
                        >
                          {booking.txHash.slice(0, 10)}...
                          {booking.txHash.slice(-8)}
                        </a>
                        <button
                          onClick={() =>
                            copyToClipboard(booking.txHash, "txHash")
                          }
                          className="p-1 hover:bg-slate-100 rounded transition-colors"
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
                  </div>

                  {booking.bookingHash && (
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-slate-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-slate-500 mb-1">
                          Booking Hash
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-mono text-slate-900 break-all">
                            {booking.bookingHash}
                          </p>
                          <button
                            onClick={() =>
                              copyToClipboard(booking.bookingHash!, "bookingHash")
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
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500 mb-1">
                        Booking Date
                      </p>
                      <p className="text-sm font-medium text-slate-900">
                        {formatDate(booking.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

