# User Profile System

A blockchain-based user profile system that stores sensitive data off-chain using IPFS while maintaining data integrity through on-chain hashing.

## Features

- ✅ Wallet-based authentication
- ✅ Profile creation and updates
- ✅ Sensitive data stored on IPFS (off-chain)
- ✅ Data integrity verification via blockchain hash
- ✅ Image upload support
- ✅ Privacy-focused architecture

## Setup

### 1. Install Dependencies

```bash
npm install
```

This will install `ipfs-http-client` and other required dependencies.

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Profile Contract Address (after deployment)
VITE_PROFILE_CONTRACT_ADDRESS=0xYourDeployedContractAddress

# IPFS Configuration
# Option 1: Public Gateway (development only)
VITE_IPFS_GATEWAY=https://ipfs.io/ipfs/

# Option 2: Infura IPFS
VITE_IPFS_API_URL=https://ipfs.infura.io:5001/api/v0

# Option 3: Pinata (recommended for production)
VITE_PINATA_API_KEY=your_pinata_api_key
VITE_PINATA_SECRET_KEY=your_pinata_secret_key
```

### 3. Deploy Smart Contract

See `contracts/DEPLOYMENT.md` for detailed deployment instructions.

### 4. Update Contract Address

After deployment, update `VITE_PROFILE_CONTRACT_ADDRESS` in your `.env` file.

## Usage

1. **Connect Wallet**: Click "Connect Wallet" in the navbar
2. **Navigate to Profile**: Click "Profile" in the navigation menu
3. **Create Profile**: Fill in the form with:
   - Name (required)
   - Phone (required)
   - ID Number (required)
   - Background Image (optional)
4. **Submit**: Click "Create Profile" to:
   - Upload data to IPFS
   - Calculate data hash
   - Store CID and hash on blockchain
5. **View Profile**: Your profile will be displayed on the left side

## Architecture

### On-Chain (Blockchain)
- IPFS CID (Content Identifier)
- Data hash (Keccak256)
- Update timestamp

### Off-Chain (IPFS)
- Name
- Phone
- ID Number
- Background Image

## Security

See `SECURITY.md` for detailed security considerations.

**Key Points:**
- Sensitive data is NOT stored on-chain
- Data integrity verified via hash
- Users control their own profiles
- IPFS data is publicly accessible (unless using private IPFS)

## IPFS Services

### Development
- Public IPFS gateways (ipfs.io, cloudflare-ipfs.com)
- Free but data may not persist

### Production
- **Pinata**: Recommended, easy to use, free tier available
- **Infura**: Reliable, requires account
- **Custom IPFS Node**: Full control, requires infrastructure

## Troubleshooting

### "IPFS upload failed"
- Check IPFS API configuration
- Ensure API keys are set (if using Pinata/Infura)
- Check network connectivity

### "Profile contract address not configured"
- Set `VITE_PROFILE_CONTRACT_ADDRESS` in `.env`
- Ensure contract is deployed

### "Failed to load profile from IPFS"
- IPFS node may be offline
- CID may be incorrect
- Try using a different IPFS gateway

### Image upload issues
- Maximum file size: 5MB
- Supported formats: PNG, JPG, GIF
- Ensure image is valid

## Development

### Running Locally

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

## Files Structure

```
etherstay-hotel-dapp/
├── contracts/
│   ├── UserProfile.sol          # Smart contract
│   └── DEPLOYMENT.md            # Deployment guide
├── pages/
│   └── Profile.tsx              # Profile page component
├── utils/
│   └── ipfs.ts                  # IPFS utility functions
├── SECURITY.md                  # Security documentation
└── PROFILE_README.md            # This file
```

## API Reference

### Smart Contract Functions

#### `setProfile(string memory ipfsCID, bytes32 dataHash)`
Creates or updates user profile.

#### `getProfile(address user)`
Returns profile metadata (CID, hash, timestamp, exists).

#### `hasProfile(address user)`
Checks if user has a profile.

#### `verifyProfile(address user, bytes32 dataHash)`
Verifies profile data integrity.

### IPFS Utilities

#### `uploadToIPFS(data: ProfileData): Promise<string>`
Uploads profile data to IPFS, returns CID.

#### `getFromIPFS(cid: string): Promise<ProfileData>`
Retrieves profile data from IPFS.

#### `hashProfileData(data: ProfileData): string`
Calculates Keccak256 hash of profile data.

#### `verifyProfileData(data: ProfileData, storedHash: string): boolean`
Verifies data integrity against stored hash.

## License

MIT



