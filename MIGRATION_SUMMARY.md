# Migration Summary: Blockchain to MongoDB

## Changes Made

### 1. Backend (Express.js)

**Added MongoDB Support:**
- Added `mongodb` package dependency
- Created `backend/models/User.ts` with UserProfile schema
- MongoDB connection with unique index on `walletAddress`

**New API Endpoints:**
- `POST /api/users` - Create or update user profile
- `GET /api/users/:walletAddress` - Get user profile by wallet address

**Removed:**
- All blockchain/IPFS-related profile code
- Encryption utilities for profiles
- IPFS upload/download for profiles

### 2. Frontend (React)

**Updated Profile.tsx:**
- Removed all blockchain contract calls
- Removed IPFS encryption/decryption
- Removed ethers.js contract interactions for profiles
- Now uses REST API (`/api/users`) instead
- Fetches profile on wallet connect
- Simple form submission to backend

**Updated Types:**
- Changed `UserProfile` interface to match MongoDB schema
- Removed blockchain-specific fields (CID, hash, etc.)

### 3. Smart Contract

**Status:**
- UserProfile contract is no longer used
- Can be ignored or deprecated
- Hotel booking contract remains unchanged

## MongoDB Schema

```typescript
{
  walletAddress: string;      // Unique, required, indexed
  name?: string;
  phone?: string;
  idNumber?: string;
  avatarUrl?: string;
  backgroundImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Environment Variables

**Backend (.env):**
```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=etherstay
```

## Setup Instructions

1. **Install MongoDB:**
   - Local: Install MongoDB locally or use Docker
   - Cloud: Use MongoDB Atlas (free tier available)

2. **Install Dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Configure Environment:**
   - Copy `.env.example` to `.env`
   - Set `MONGODB_URI` and `MONGODB_DB_NAME`

4. **Start Backend:**
   ```bash
   npm run dev
   ```

5. **Test API:**
   - POST to `/api/users` with wallet address
   - GET from `/api/users/:walletAddress`

## Benefits

✅ **Cost:** Free/cheap database vs expensive gas fees
✅ **Privacy:** Data can be deleted/modified (GDPR compliant)
✅ **Performance:** Fast queries vs slow blockchain reads
✅ **Flexibility:** Easy updates, schema changes
✅ **Scalability:** Handle thousands of users efficiently

## What Remains On-Chain

- ✅ Hotel room bookings (smart contract)
- ✅ Payments and transactions
- ✅ Room ownership and status
- ✅ Contract administration

## What's Now Off-Chain

- ✅ User profiles (MongoDB)
- ✅ Personal information
- ✅ Images and media
- ✅ User preferences



