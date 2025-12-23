# Deploy UserProfile Contract via Remix

## Steps

1. **Open Remix IDE**: https://remix.ethereum.org

2. **Create New File**:
   - Click "File Explorer" in left sidebar
   - Create new file: `UserProfile.sol`
   - Copy entire contents from `contracts/UserProfile.sol`

3. **Compile**:
   - Go to "Solidity Compiler" tab
   - Select compiler version: `0.8.20` or higher
   - Click "Compile UserProfile.sol"
   - Check for errors (should be none)

4. **Deploy**:
   - Go to "Deploy & Run Transactions" tab
   - Environment: Select "Injected Provider - MetaMask"
   - Network: Select Sepolia Testnet
   - Contract: Select "UserProfile"
   - Click "Deploy"
   - Confirm transaction in MetaMask

5. **Get Contract Address**:
   - After deployment, copy the contract address
   - Update `VITE_PROFILE_CONTRACT_ADDRESS` in your `.env` file

6. **Verify on Etherscan** (Optional):
   - Go to Sepolia Etherscan
   - Find your contract
   - Click "Verify and Publish"
   - Select compiler version and settings
   - Paste contract code
   - Verify

## Contract ABI

After deployment, copy the ABI from Remix:
- Go to "Solidity Compiler" tab
- Click "ABI" button under compiled contract
- Copy the JSON ABI

The frontend already includes the ABI in `Profile.tsx`, but you can update it if needed.

## Gas Estimates

- **Deployment**: ~500,000 - 800,000 gas
- **setProfile()**: ~80,000 - 120,000 gas (first time)
- **setProfile()**: ~60,000 - 100,000 gas (update)
- **getProfile()**: Free (view function)

## Environment Variables

After deployment, update your `.env`:

```env
VITE_PROFILE_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```



