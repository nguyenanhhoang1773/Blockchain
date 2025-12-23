import express, { Request, Response, RequestHandler } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { ObjectId } from "mongodb";
import { ethers } from "ethers";
import {
  connectDatabase,
  getUsersCollection,
  UserProfile,
} from "./models/User";
import {
  getBookingsCollection,
  BookingStatus,
  Booking,
} from "./models/Booking";
import {
  getRoomsCollection,
  RoomBooking,
  RoomBookingStatus,
  RoomMeta,
} from "./models/Room";
dotenv.config();

const app = express();
app.use(cors() as RequestHandler);
app.use(express.json() as RequestHandler);

const PORT = process.env.PORT || 3001;

// Connect to MongoDB
const dbReady = connectDatabase().catch((err) => {
  console.error("Failed to connect to MongoDB:", err);
  throw err;
});

// Configuration
const RPC_URL =
  process.env.RPC_URL ||
  "https://eth-sepolia.g.alchemy.com/v2/uFKx4u5VYI7jT-eweG6oF";
const CONTRACT_ADDRESS =
  process.env.CONTRACT_ADDRESS || "0x27C98d65c46D5914C0b0370175C3EbF2775B396c";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
console.log("PRIVATE_KEY:", PRIVATE_KEY);
// Contract ABI (Subset needed for backend ops)
const ABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "AlreadyBooked",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "roomId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "checkIn",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "checkOut",
        type: "uint256",
      },
    ],
    name: "book",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "IncorrectETH",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidTime",
    type: "error",
  },
  {
    inputs: [],
    name: "NotOwner",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "bookingHash",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "roomId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "paidAmount",
        type: "uint256",
      },
    ],
    name: "Booked",
    type: "event",
  },
  {
    inputs: [],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Withdraw",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    name: "bookingOwner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "bookingHash",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "isBookingOwner",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

// Ethers Setup
const provider = new ethers.JsonRpcProvider(RPC_URL);
let wallet: ethers.Wallet | null = null;
let contract: ethers.Contract;

async function ensureDbReady() {
  await dbReady;
}

if (PRIVATE_KEY) {
  wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);
} else {
  // Read-only if no private key
  contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
  console.warn(
    "No PRIVATE_KEY provided. Backend runs in Read-Only mode for write operations."
  );
}

// Routes

// GET /rooms - List all rooms
app.get("/rooms", async (_req: Request, res: Response) => {
  try {
    await ensureDbReady();
    const roomsCollection = getRoomsCollection();
    const rooms: RoomMeta[] = await roomsCollection.find({}).toArray();

    const formattedRooms = rooms.map((room) => ({
      id: room.roomId.toString(),
      roomId: room.roomId,
      name: room.name,
      description: room.description || "",
      images: room.images || [],
      price: room.pricePerNight.toString(),
      pricePerNight: room.pricePerNight,
      beds: room.beds,
      maxGuests: room.maxGuests,
      bookings: (room.bookings || []).map((b) => ({
        userId: b.userId,
        checkInDate: b.checkInDate,
        checkOutDate: b.checkOutDate,
        status: b.status,
        txHash: b.txHash,
        bookingHash: b.bookingHash,
      })),
    }));
    res.json(formattedRooms);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// GET /rooms/:id - Get specific room
app.get("/rooms/:id", async (req: Request, res: Response) => {
  try {
    await ensureDbReady();
    const { id } = req.params;
    const room = await getRoomsCollection().findOne({ roomId: Number(id) });
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    res.json({
      roomId: room.roomId,
      name: room.name,
      description: room.description || "",
      pricePerNight: room.pricePerNight,
      images: room.images,
      beds: room.beds,
      maxGuests: room.maxGuests,
      bookings: room.bookings || [],
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /rooms - Add a new room (Admin)

// POST /rooms/:id/book - Book a room (Server pays)
// Note: In a real DApp, the frontend user usually signs this.
// This endpoint implies the server acts as a relayer or pays on behalf of someone.

// GET /admin/rooms - List all rooms (Admin view)
app.get("/admin/rooms", async (req: Request, res: Response) => {
  try {
    await ensureDbReady();
    const rooms = await getRoomsCollection().find({}).toArray();
    const formattedRooms = rooms.map((r) => ({
      roomId: r.roomId,
      name: r.name,
      pricePerNight: r.pricePerNight,
      beds: r.beds,
      maxGuests: r.maxGuests,
    }));
    res.json(formattedRooms);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// POST /withdraw - Withdraw funds (Owner only)
app.post("/withdraw", async (req: Request, res: Response) => {
  if (!wallet) {
    res.status(403).json({ error: "Server wallet not configured" });
    return;
  }
  try {
    const tx = await contract.withdraw();
    await tx.wait();
    res.json({ success: true, hash: tx.hash });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/users - Create or update user profile
app.post("/api/users", async (req: Request, res: Response) => {
  try {
    const {
      walletAddress,
      name,
      phone,
      idNumber,
      avatarUrl,
      backgroundImageUrl,
    } = req.body;

    if (!walletAddress) {
      res.status(400).json({ error: "walletAddress is required" });
      return;
    }

    // Validate wallet address format
    if (!ethers.isAddress(walletAddress)) {
      res.status(400).json({ error: "Invalid wallet address format" });
      return;
    }

    const usersCollection = getUsersCollection();
    const normalizedAddress = walletAddress.toLowerCase();

    const updateData: Partial<UserProfile> = {
      walletAddress: normalizedAddress,
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (idNumber !== undefined) updateData.idNumber = idNumber;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (backgroundImageUrl !== undefined)
      updateData.backgroundImageUrl = backgroundImageUrl;

    const result = await usersCollection.findOneAndUpdate(
      { walletAddress: normalizedAddress },
      {
        $set: updateData,
        $setOnInsert: { createdAt: new Date() },
      },
      {
        upsert: true,
        returnDocument: "after",
      }
    );

    res.json({ success: true, user: result });
  } catch (error: any) {
    console.error("Error creating/updating user:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/users/:walletAddress - Get user profile
app.get("/api/users/:walletAddress", async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.params;

    if (!ethers.isAddress(walletAddress)) {
      res.status(400).json({ error: "Invalid wallet address format" });
      return;
    }

    const usersCollection = getUsersCollection();
    const normalizedAddress = walletAddress.toLowerCase();
    const user = await usersCollection.findOne({
      walletAddress: normalizedAddress,
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(user);
  } catch (error: any) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: error.message });
  }
});

// Booking Routes (MongoDB)

// Helper to parse date-only strings (from frontend)
function parseDate(value: string, fieldName: string): Date {
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date for ${fieldName}`);
  }
  // Normalise to midnight to treat as date-only
  date.setHours(0, 0, 0, 0);
  return date;
}

function isActiveStatus(status: string | undefined | null): boolean {
  if (!status) return false;
  const upper = status.toUpperCase();
  return upper === "BOOKED" || upper === "CHECKED_IN";
}

// Apply hotel check-in/check-out rules and validate duration

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function normalizeBookingDates(checkInRaw: string, checkOutRaw: string) {
  const checkInDate = parseDate(checkInRaw, "checkIn");
  const checkOutDate = parseDate(checkOutRaw, "checkOut");

  if (checkOutDate <= checkInDate) {
    throw new Error("Minimum stay is 1 night");
  }

  checkInDate.setHours(14, 0, 0, 0);
  checkOutDate.setHours(12, 0, 0, 0);

  return { checkIn: checkInDate, checkOut: checkOutDate };
}

// POST /api/bookings/check - Check availability
app.post("/api/bookings/check", async (req, res) => {
  try {
    await ensureDbReady();
    const { roomId, checkIn, checkOut } = req.body;
    if (roomId == null || !checkIn || !checkOut) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const roomIdNum = Number(roomId);
    const room = await getRoomsCollection().findOne({ roomId: roomIdNum });
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    // Normalize and enforce hotel hours (14:00 / 12:00)
    const { checkIn: ci, checkOut: co } = normalizeBookingDates(
      checkIn,
      checkOut
    );

    // Overlap if checkIn < existingCheckOut && checkOut > existingCheckIn
    const conflict = await getBookingsCollection().findOne({
      roomId: roomIdNum,
      status: { $in: ["BOOKED", "CHECKED_IN"] },
      checkIn: { $lt: co },
      checkOut: { $gt: ci },
    });

    return res.json({ available: !conflict });
  } catch (err: any) {
    console.error("check-availability failed:", err);
    const message =
      err?.message && typeof err.message === "string"
        ? err.message
        : "Failed to check availability";
    return res.status(500).json({ error: message });
  }
});

// POST /api/bookings - Save booking after blockchain tx success
app.post("/api/bookings", async (req, res) => {
  console.log(1);
  try {
    await ensureDbReady();
    const {
      roomId,
      walletAddress,
      customerName,
      phoneNumber,
      checkIn,
      checkOut,
      txHash,
    } = req.body;

    if (roomId == null || !walletAddress || !checkIn || !checkOut || !txHash) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!ethers.isAddress(walletAddress)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    if (!ethers.isHexString(txHash) || txHash.length !== 66) {
      return res.status(400).json({ error: "Invalid txHash" });
    }

    const roomIdNum = Number(roomId);
    const room = await getRoomsCollection().findOne({ roomId: roomIdNum });
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    const { checkIn: ci, checkOut: co } = normalizeBookingDates(
      checkIn,
      checkOut
    );

    // 1️⃣ Check overlap against bookings collection
    const overlap = await getBookingsCollection().findOne({
      roomId: roomIdNum,
      status: { $in: ["BOOKED", "CHECKED_IN"] },
      checkIn: { $lt: co },
      checkOut: { $gt: ci },
    });
    if (overlap) return res.status(409).json({ error: "Room not available" });

    // 2️⃣ Get transaction and receipt
    const receipt = await provider.getTransactionReceipt(txHash);
    const txSuccess =
      receipt && receipt.status !== null && Number(receipt.status) === 1;
    if (!receipt || !txSuccess)
      return res.status(400).json({ error: "Transaction failed" });

    const tx = await provider.getTransaction(txHash);
    if (!tx || !tx.to)
      return res.status(400).json({ error: "Transaction not found" });
    if (ethers.getAddress(tx.to) !== ethers.getAddress(CONTRACT_ADDRESS)) {
      return res.status(400).json({ error: "Wrong contract address" });
    }

    // 3️⃣ Decode function input
    const iface = new ethers.Interface(ABI);
    const decoded = iface.parseTransaction({ data: tx.data });
    if (decoded.name !== "book" && decoded.name !== "bookRoom")
      return res
        .status(400)
        .json({ error: "Not a book()/bookRoom() transaction" });

    const onChainRoomId = Number(decoded.args[0]);
    if (onChainRoomId !== roomIdNum)
      return res.status(400).json({ error: "roomId mismatch" });

    // 4️⃣ Verify payment (allow either on-chain price or per-night total)
    const nights = Math.ceil((co.getTime() - ci.getTime()) / MS_PER_DAY);
    console.log("nights", nights);
    if (nights < 1) {
      return res.status(400).json({ error: "Minimum stay is 1 night" });
    }

    // 5️⃣ Decode event Booked to get bookingHash
    const bookedEvent = receipt.logs
      .map((log) => {
        try {
          return iface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((e) => e && e.name === "Booked");

    if (!bookedEvent)
      return res
        .status(400)
        .json({ error: "Booked event not found in transaction" });

    const bookingHash = bookedEvent.args.bookingHash;

    // 6️⃣ Save booking in MongoDB (both bookings collection and embedded)
    const booking: Booking = {
      roomId: roomIdNum,
      walletAddress: walletAddress.toLowerCase(),
      customerName: customerName || "",
      phoneNumber: phoneNumber || "",
      checkIn: ci,
      checkOut: co,
      txHash,
      bookingHash: bookingHash as string,
      status: "BOOKED",
      createdAt: new Date(),
    };

    const result = await getBookingsCollection().insertOne(booking);

    const roomBooking: RoomBooking = {
      userId: walletAddress.toLowerCase(),
      checkInDate: ci,
      checkOutDate: co,
      txHash,
      bookingHash: bookingHash as string,
      status: "BOOKED",
      createdAt: booking.createdAt,
    };

    await getRoomsCollection().updateOne(
      { roomId: roomIdNum },
      { $push: { bookings: roomBooking } }
    );

    // Get room information to include in response
    const roomInfo = await getRoomsCollection().findOne({
      roomId: roomIdNum,
    });

    const bookingResponse = {
      success: true,
      bookingId: result.insertedId,
      booking: {
        ...booking,
        room: roomInfo
          ? {
              roomId: roomInfo.roomId,
              name: roomInfo.name,
              description: roomInfo.description || "",
              images: roomInfo.images || [],
              pricePerNight: roomInfo.pricePerNight,
              beds: roomInfo.beds,
              maxGuests: roomInfo.maxGuests,
            }
          : null,
      },
    };

    res.json(bookingResponse);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bookings/room/:roomId - Get all bookings for a room
app.get("/api/bookings/room/:roomId", async (req, res) => {
  await ensureDbReady();
  const roomId = Number(req.params.roomId);
  const bookings = await getBookingsCollection()
    .find({ roomId })
    .sort({ checkIn: 1 })
    .toArray();

  res.json(bookings);
});

// GET /api/bookings/my/:wallet - Get bookings for a user
app.get("/api/bookings/my/:wallet", async (req, res) => {
  await ensureDbReady();
  const wallet = req.params.wallet.toLowerCase();
  if (!ethers.isAddress(wallet)) {
    return res.status(400).json({ error: "Invalid wallet" });
  }

  const bookings = await getBookingsCollection()
    .find({ walletAddress: wallet })
    .sort({ checkIn: 1 })
    .toArray();

  // Populate room information for each booking
  const bookingsWithRoomInfo = await Promise.all(
    bookings.map(async (booking) => {
      const room = await getRoomsCollection().findOne({
        roomId: booking.roomId,
      });
      return {
        ...booking,
        room: room
          ? {
              roomId: room.roomId,
              name: room.name,
              description: room.description || "",
              images: room.images || [],
              pricePerNight: room.pricePerNight,
              beds: room.beds,
              maxGuests: room.maxGuests,
            }
          : null,
      };
    })
  );

  res.json(bookingsWithRoomInfo);
});

// GET /api/bookings/admin - All bookings (for admin)
app.get("/api/bookings/admin", async (_req, res) => {
  await ensureDbReady();
  const bookings = await getBookingsCollection()
    .find({})
    .sort({ roomId: 1, checkIn: 1 })
    .toArray();

  res.json(bookings);
});
app.patch("/api/bookings/:id/cancel", async (req, res) => {
  await ensureDbReady();
  const { id } = req.params;

  const booking = await getBookingsCollection().findOne({
    _id: new ObjectId(id),
  });
  if (!booking) {
    return res.status(404).json({ error: "Booking not found" });
  }

  await getBookingsCollection().updateOne(
    { _id: new ObjectId(id) },
    { $set: { status: "CANCELLED" as BookingStatus } }
  );
  await getRoomsCollection().updateOne(
    { roomId: booking.roomId, "bookings.txHash": booking.txHash },
    { $set: { "bookings.$.status": "CANCELLED" as RoomBookingStatus } }
  );

  res.json({ success: true });
});
app.patch("/api/bookings/:id/checkin", async (req, res) => {
  await ensureDbReady();
  const { id } = req.params;

  const booking = await getBookingsCollection().findOne({
    _id: new ObjectId(id),
  });
  if (!booking) {
    return res.status(404).json({ error: "Booking not found" });
  }

  await getBookingsCollection().updateOne(
    { _id: new ObjectId(id) },
    { $set: { status: "CHECKED_IN" as BookingStatus } }
  );
  await getRoomsCollection().updateOne(
    { roomId: booking.roomId, "bookings.txHash": booking.txHash },
    { $set: { "bookings.$.status": "CHECKED_IN" as RoomBookingStatus } }
  );

  res.json({ success: true });
});
app.post("/api/admin/rooms", async (req, res) => {
  try {
    await ensureDbReady();
    const { name, description, images, pricePerNight, beds, maxGuests } =
      req.body;

    if (
      !name ||
      !images ||
      images.length === 0 ||
      !pricePerNight ||
      !beds ||
      !maxGuests
    ) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const rooms = getRoomsCollection();

    // auto increment roomId
    const lastRoom = await rooms
      .find({})
      .sort({ roomId: -1 })
      .limit(1)
      .toArray();

    const nextRoomId = lastRoom.length ? lastRoom[0].roomId + 1 : 1;

    const room = {
      roomId: nextRoomId,
      name,
      description,
      images,
      pricePerNight: Number(pricePerNight),
      beds: Number(beds),
      maxGuests: Number(maxGuests),
      bookings: [],
      createdAt: new Date(),
    };

    await rooms.insertOne(room);

    res.json({ success: true, room });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`Connected to Sepolia via ${RPC_URL}`);
  console.log(`Contract: ${CONTRACT_ADDRESS}`);
});
