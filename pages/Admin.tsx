import React, { useState, useEffect } from "react";
import axios from "axios";
import { useWeb3 } from "../components/Web3Context";
import { BACKEND_URL } from "../constants";
import { Loader2, Plus, ShieldCheck, Calendar } from "lucide-react";
import { Booking, Room } from "../types";

export default function Admin() {
  const { account } = useWeb3();
  const [processing, setProcessing] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [pricePerNight, setPricePerNight] = useState("");
  const [beds, setBeds] = useState("");
  const [maxGuests, setMaxGuests] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);

  const fetchRooms = async () => {
    setRoomsLoading(true);
    setRoomsError(null);
    try {
      const response = await axios.get(`${BACKEND_URL}/rooms`);
      setRooms(response.data);
    } catch (error: any) {
      console.error(error);
      setRoomsError(
        error.response?.data?.error || error.message || "Failed to fetch rooms"
      );
    } finally {
      setRoomsLoading(false);
    }
  };

  const fetchBookings = async () => {
    setBookingsLoading(true);
    setBookingsError(null);
    try {
      const response = await axios.get(`${BACKEND_URL}/api/bookings/admin`);
      setBookings(response.data);
    } catch (error: any) {
      console.error(error);
      setBookingsError(
        error.response?.data?.error ||
          error.message ||
          "Failed to fetch bookings"
      );
    } finally {
      setBookingsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchBookings();
  }, []);

  const formatDateTime = (value: string) => {
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return date.toLocaleString();
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setProcessing(true);

      const priceNum = Number(pricePerNight);
      const bedsNum = Number(beds);
      const maxGuestsNum = Number(maxGuests);

      if (!Number.isFinite(priceNum) || priceNum <= 0) {
        throw new Error("Price must be > 0");
      }
      if (!Number.isInteger(bedsNum) || bedsNum < 1) {
        throw new Error("Beds must be >= 1");
      }
      if (!Number.isInteger(maxGuestsNum) || maxGuestsNum < bedsNum) {
        throw new Error("Max guests must be >= beds");
      }

      // Use images array if available, otherwise fall back to imageUrl
      const imagesToSend =
        images.length > 0 ? images : imageUrl ? [imageUrl] : [];
      await axios.post(`${BACKEND_URL}/api/admin/rooms`, {
        name,
        description,
        images: imagesToSend,
        imageUrl: imageUrl || undefined, // Legacy support
        pricePerNight: priceNum,
        beds: bedsNum,
        maxGuests: maxGuestsNum,
      });

      alert("Room created successfully");
      setName("");
      setDescription("");
      setImageUrl("");
      setImages([]);
      setPricePerNight("");
      setBeds("");
      setMaxGuests("");
      await fetchRooms();
    } catch (err: any) {
      console.error("Add room failed:", err);
      alert(err.response?.data?.error || err.message || "Failed to add room");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <ShieldCheck className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
      </div>

      <div className="bg-white shadow rounded-lg border border-slate-200 p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-slate-800">
            Create New Room (DB only)
          </h2>
        </div>

        <form
          onSubmit={handleAddRoom}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Room Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              placeholder="Deluxe Suite"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Image URL
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              placeholder="https://..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              placeholder="Spacious room with balcony, ocean view, free WiFi..."
              rows={3}
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Price per night (ETH)
              </label>
              <input
                type="number"
                step="0.0001"
                value={pricePerNight}
                onChange={(e) => setPricePerNight(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                placeholder="0.05"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Beds
              </label>
              <input
                type="number"
                min={1}
                value={beds}
                onChange={(e) => setBeds(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                placeholder="2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Max Guests
              </label>
              <input
                type="number"
                min={1}
                value={maxGuests}
                onChange={(e) => setMaxGuests(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                placeholder="4"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={processing}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-indigo-700 disabled:opacity-50"
          >
            {processing ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              <>
                <Plus className="mr-2 h-5 w-5" /> Add Room
              </>
            )}
          </button>
        </form>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Room ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                Price / Night (ETH)
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-slate-200">
            {rooms.map((room) => (
              <tr key={room.roomId}>
                <td className="px-6 py-4 text-sm font-medium text-slate-900">
                  {room.roomId}
                </td>
                <td className="px-6 py-4 text-sm text-slate-900">
                  {room.name}
                </td>

                <td className="px-6 py-4 text-sm text-slate-700">
                  Ξ {Number(room.pricePerNight).toFixed(4)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white shadow rounded-lg border border-slate-200 p-6 mb-8">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-slate-800">
            Booking Schedule
          </h2>
        </div>

        {bookingsLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
          </div>
        ) : bookingsError ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-700">{bookingsError}</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p>No bookings yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Room ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Price (ETH)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Wallet
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Check-in
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Check-out
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Tx Hash
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {bookings.map((booking, index) => {
                  const room = rooms.find(
                    (r) => Number(r.roomId) === booking.roomId
                  );

                  return (
                    <tr key={`${booking.txHash}-${index}`}>
                      <td className="px-4 py-3 font-medium">
                        {booking.roomId}
                      </td>

                      <td className="px-4 py-3">
                        {room
                          ? `Ξ ${Number(room.pricePerNight).toFixed(4)}`
                          : "-"}
                      </td>

                      <td className="px-4 py-3 text-xs font-mono">
                        {booking.walletAddress}
                      </td>

                      <td className="px-4 py-3">
                        {formatDateTime(booking.checkIn)}
                      </td>

                      <td className="px-4 py-3">
                        {formatDateTime(booking.checkOut)}
                      </td>

                      <td className="px-4 py-3">{booking.customerName}</td>

                      <td className="px-4 py-3">{booking.phoneNumber}</td>

                      <td className="px-4 py-3 font-semibold">
                        {booking.status}
                      </td>

                      <td className="px-4 py-3 text-xs font-mono text-slate-500">
                        {booking.txHash.slice(0, 10)}...
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
