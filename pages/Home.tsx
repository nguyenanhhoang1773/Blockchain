import React, { useEffect, useState } from "react";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { Room } from "../types";
import { BACKEND_URL } from "../constants";
import RoomCard from "../components/RoomCard";
export default function Home() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      setError(null);
      const response = await axios.get(`${BACKEND_URL}/rooms`);
      setRooms(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4">
            Decentralized Luxury
          </h1>
          <p className="text-lg text-slate-600">
            Book your stay securely on the Sepolia Testnet.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-96 bg-slate-200 animate-pulse rounded-xl"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4">
          Decentralized Luxury
        </h1>
        <p className="text-lg text-slate-600">
          Book your stay securely on the Sepolia Testnet.
        </p>
      </div>
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      {rooms.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500 text-lg">No rooms available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <RoomCard
              key={room.roomId}
              room={room}
            />
          ))}
        </div>
      )}
    </div>
  );
}
