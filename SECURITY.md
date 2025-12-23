# Security Considerations for Encrypted User Profile System

## Architecture

### On-Chain Storage

- **IPFS CID**: Content Identifier pointing to encrypted profile data on IPFS
- **Data Hash**: Keccak256 hash of plaintext profile data for integrity verification
- **Timestamp**: Last update timestamp

### Off-Chain Storage (IPFS)

- **Encrypted Data**: AES-GCM encrypted profile data containing:
  - Name
  - Phone
  - ID Number
  - Background Image (Base64)

## Security Features

### 1. Data Privacy

✅ **Sensitive data is encrypted before IPFS storage**

- Personal information encrypted using AES-GCM
- Encryption key derived from wallet address
- Blockchain stores only encrypted CID and plaintext hash
- Only wallet owner can decrypt their data

### 2. Data Integrity

✅ **Hash-based verification**

- Keccak256 hash of plaintext data stored on-chain
- Frontend verifies data integrity after decryption
- Prevents tampering with encrypted off-chain data
- Hash calculated from plaintext, verified after decryption

### 3. Access Control

✅ **Wallet-based encryption**

- Encryption key derived from wallet address
- Only the wallet owner can decrypt their profile
- Profile updates require wallet signature
- No centralized authority can access encrypted data

### 4. Encryption Implementation

✅ **AES-GCM encryption**

- Uses Web Crypto API (browser-native)
- 256-bit key derived from wallet address via SHA-256
- Random IV (12 bytes) for each encryption
- Authenticated encryption prevents tampering

## Security Considerations

### Privacy

**Encryption Key Derivation:**

- Key derived from wallet address using SHA-256
- Each wallet has unique encryption key
- No password required (wallet-based)
- Optional: Can add password for additional security layer

**Data Access:**

- Encrypted data on IPFS is unreadable without wallet
- Even with CID, data cannot be decrypted without wallet address
- Wallet ownership = data access control

### Data Integrity

**Hash Verification:**

- Plaintext hash stored on-chain
- Hash calculated before encryption
- After decryption, hash is verified
- Ensures data hasn't been tampered with

**IPFS Considerations:**

- Encrypted data is publicly accessible via CID
- But data is unreadable without decryption key
- Hash verification ensures data authenticity

### Wallet Ownership

**Profile Control:**

- Only `msg.sender` can call `setProfile()`
- Each wallet address has one profile
- Profile tied to wallet, not transferable
- Lost wallet = lost access (consider backup mechanisms)

**Transaction Security:**

- All updates require MetaMask signature
- Gas fees paid by profile owner
- No third-party can modify profiles

## Security Risks & Mitigations

### Risk 1: Lost Wallet Access

**Risk**: If wallet is lost, encrypted data cannot be decrypted
**Mitigation**:

- Users should backup wallet seed phrase securely
- Consider implementing recovery mechanism (optional)
- Document importance of wallet security

### Risk 2: Weak Encryption Key

**Risk**: Key derived only from address might be predictable
**Mitigation**:

- SHA-256 of address provides sufficient entropy
- Consider adding optional password for additional security
- Current implementation is secure for this use case

### Risk 3: IPFS Data Availability

**Risk**: If IPFS node goes offline, data becomes unavailable
**Mitigation**:

- Use pinning services (Pinata, Infura) for guaranteed availability
- Multiple IPFS nodes for redundancy
- Monitor pin status regularly

### Risk 4: Hash Collision

**Risk**: Two different profiles could theoretically have the same hash
**Mitigation**:

- Keccak256 is cryptographically secure
- Extremely low collision probability (2^256)
- Current implementation is sufficient

### Risk 5: Frontend Manipulation

**Risk**: Malicious frontend could upload incorrect data
**Mitigation**:

- Users verify data before signing transaction
- Hash verification ensures data integrity
- Smart contract validates hash format
- Users should only use trusted frontend

## Best Practices

### For Users

1. ✅ Backup wallet seed phrase securely
2. ✅ Verify profile data before submitting
3. ✅ Use reputable IPFS services
4. ✅ Understand that lost wallet = lost access
5. ✅ Keep wallet private key secure

### For Developers

1. ✅ Never store private keys in code
2. ✅ Use environment variables for API keys
3. ✅ Implement proper error handling
4. ✅ Validate all user inputs
5. ✅ Use HTTPS for all API calls
6. ✅ Regularly audit smart contract code
7. ✅ Monitor IPFS pin status
8. ✅ Test encryption/decryption thoroughly

## Smart Contract Security

### Current Implementation

- ✅ No reentrancy vulnerabilities
- ✅ Input validation (non-empty CID, non-zero hash)
- ✅ Simple ownership model (user controls their profile)
- ✅ No access control needed (users can only modify their own profile)
- ✅ Gas-efficient operations

### Security Guarantees

- ✅ Only profile owner can update their profile
- ✅ Hash verification ensures data integrity
- ✅ Events emitted for all profile changes
- ✅ Immutable contract logic (once deployed)

## Compliance Considerations

### GDPR

- ⚠️ **Right to be Forgotten**: IPFS data is permanent
  - Consider: Ability to update with empty/null data
  - Consider: Clear documentation about data permanence
  - Consider: Encryption provides privacy even if data persists

### Data Minimization

- ✅ Only necessary data is collected
- ✅ Sensitive data encrypted before storage
- ✅ On-chain footprint is minimal (CID + hash only)

## Encryption Details

### Algorithm: AES-GCM

- **Key Size**: 256 bits
- **IV Size**: 12 bytes (random per encryption)
- **Mode**: Galois/Counter Mode (authenticated encryption)
- **Key Derivation**: SHA-256(walletAddress)

### Encryption Flow

1. User submits profile data
2. Data converted to JSON
3. Encryption key derived from wallet address
4. Data encrypted with AES-GCM (random IV)
5. Encrypted data uploaded to IPFS
6. Plaintext hash calculated and stored on-chain with CID

### Decryption Flow

1. Fetch CID from blockchain
2. Retrieve encrypted data from IPFS
3. Derive decryption key from wallet address
4. Decrypt data using AES-GCM
5. Verify hash matches stored hash
6. Display decrypted profile

## Conclusion

The current implementation provides:

- **Privacy**: Encrypted data on IPFS, unreadable without wallet
- **Integrity**: Hash-based verification
- **Decentralization**: User-controlled profiles
- **Transparency**: On-chain verification
- **Security**: AES-GCM encryption with wallet-based keys

For production use:

1. Use private IPFS services (Pinata, Infura)
2. Consider optional password for additional security
3. Implement wallet backup/recovery mechanisms
4. Regular security audits
5. Monitor IPFS pin status
