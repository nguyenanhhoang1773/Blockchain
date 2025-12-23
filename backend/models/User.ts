import { MongoClient, Db, Collection } from "mongodb";
import { initBookingModel } from "./Booking";
import { initRoomModel } from "./Room";
export interface UserProfile {
  walletAddress: string;
  name?: string;
  phone?: string;
  idNumber?: string;
  avatarUrl?: string;
  backgroundImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

let db: Db | null = null;

export async function connectDatabase(): Promise<Db> {
  if (db) {
    return db;
  }

  const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017";
  const dbName = process.env.MONGODB_DB_NAME || "etherstay";

  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    db = client.db(dbName);
    // Initialize booking model with same DB instance
    initBookingModel(db);
    initRoomModel(db);
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }

  // Create unique index on walletAddress
  const usersCollection = db.collection<UserProfile>("users");
  await usersCollection.createIndex({ walletAddress: 1 }, { unique: true });

  console.log(`Connected to MongoDB: ${dbName}`);
  return db;
}

export function getUsersCollection(): Collection<UserProfile> {
  if (!db) {
    throw new Error("Database not connected. Call connectDatabase() first.");
  }
  return db.collection<UserProfile>("users");
}
