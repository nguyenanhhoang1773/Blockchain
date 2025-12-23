# Security Considerations: Encrypted Blockchain User Profile System

## Overview

This system implements a privacy-preserving user profile system where sensitive data is encrypted before storage, ensuring that personal information remains confidential while maintaining data integrity through blockchain verification.

## 1. Privacy

### Encryption Implementation
- **Algorithm**: AES-GCM (Advanced Encryption Standard - Galois/Counter Mode)
- **Key Derivation**: SHA-256 hash of wallet address
- **IV Generation**: Random 12-byte initialization vector per encryption
- **Key Size**: 256 bits

### Privacy Guarantees

**Data Confidentiality:**
- Sensitive data (name, phone, ID number, image) is encrypted before IPFS upload
- Encrypted data stored on IPFS is unreadable without the decryption key
- Only the wallet owner can decrypt their profile data
- Even if someone obtains the IPFS CID, they cannot read the data without the wallet address

**On-Chain Privacy:**
- Blockchain stores only:
  - IPFS CID (points to encrypted data)
  - Keccak256 hash of plaintext data (for verification)
  - Timestamp
- No raw personal data is stored on-chain
- On-chain data is public but contains no sensitive information

**Access Control:**
- Encryption key is derived from wallet address
- Each wallet has a unique encryption key
- Lost wallet = lost access (by design)
- No centralized authority can decrypt user data

## 2. Data Integrity

### Hash-Based Verification

**Hash Calculation:**
- Keccak256 hash calculated from plaintext JSON data
- Hash stored on-chain with IPFS CID
- Hash is calculated before encryption

**Verification Process:**
1. User retrieves encrypted data from IPFS using CID
2. User decrypts data using wallet-derived key
3. System calculates hash of decrypted plaintext
4. System compares calculated hash with on-chain hash
5. If hashes match, data integrity is verified

**Integrity Guarantees:**
- Prevents tampering with encrypted IPFS data
- Ensures data hasn't been modified after encryption
- Hash mismatch indicates data corruption or tampering
- On-chain hash serves as immutable proof of original data

**Why Hash Plaintext, Not Ciphertext?**
- Hash of plaintext allows verification after decryption
- User can verify their own data hasn't been tampered with
- Hash of ciphertext would change with each encryption (different IV)
- Plaintext hash provides consistent verification

## 3. Wallet Ownership

### Profile Control

**Ownership Model:**
- Each wallet address can have one profile
- Only `msg.sender` can call `setProfile()` function
- Profile is tied to wallet address, not transferable
- Smart contract enforces ownership at blockchain level

**Transaction Security:**
- All profile updates require MetaMask signature
- User must approve each transaction
- Gas fees paid by profile owner
- No third-party can modify profiles without wallet access

**Access Control:**
- Encryption key derived from wallet address
- Only wallet owner can decrypt their profile
- Lost wallet = permanent data loss (by design)
- Users must backup wallet seed phrase securely

### Security Implications

**Advantages:**
- True user ownership of data
- No centralized authority
- Decentralized access control
- Immutable ownership records

**Considerations:**
- Wallet security is critical
- Lost wallet = lost access
- No recovery mechanism (by design)
- Users responsible for wallet backup

## Security Architecture Summary

```
User Input (Plaintext)
    ↓
Encrypt with Wallet-Derived Key (AES-GCM)
    ↓
Calculate Hash (Keccak256 of Plaintext)
    ↓
Upload Encrypted Data to IPFS → Get CID
    ↓
Store on Blockchain: CID + Hash
    ↓
[Retrieval]
    ↓
Fetch CID from Blockchain
    ↓
Retrieve Encrypted Data from IPFS
    ↓
Decrypt with Wallet-Derived Key
    ↓
Verify Hash Matches On-Chain Hash
    ↓
Display Profile Data
```

## Threat Model

### Protected Against

✅ **Data Theft**: Encrypted data unreadable without wallet
✅ **Data Tampering**: Hash verification detects modifications
✅ **Unauthorized Access**: Only wallet owner can decrypt
✅ **On-Chain Privacy**: No sensitive data on blockchain
✅ **Replay Attacks**: Each encryption uses unique IV
✅ **Man-in-the-Middle**: HTTPS + blockchain immutability

### Potential Risks

⚠️ **Lost Wallet**: Permanent data loss (mitigated by wallet backup)
⚠️ **IPFS Availability**: Data unavailable if IPFS node offline (mitigated by pinning services)
⚠️ **Frontend Compromise**: Malicious frontend could steal data before encryption (mitigated by using trusted frontend)
⚠️ **Key Derivation**: Weak if wallet address is predictable (not a risk, addresses are random)

## Best Practices

### For Users
1. Backup wallet seed phrase securely
2. Verify profile data before submitting
3. Use reputable IPFS services
4. Understand that lost wallet = lost access
5. Keep wallet private key secure

### For Developers
1. Never store private keys in code
2. Use environment variables for API keys
3. Implement proper error handling
4. Validate all user inputs
5. Use HTTPS for all API calls
6. Regularly audit smart contract code
7. Monitor IPFS pin status
8. Test encryption/decryption thoroughly

## Conclusion

This implementation provides:
- **Strong Privacy**: AES-GCM encryption with wallet-based keys
- **Data Integrity**: Hash-based verification system
- **User Ownership**: Wallet-based access control
- **Decentralization**: No centralized authority
- **Transparency**: On-chain verification without exposing data

The system balances privacy, security, and decentralization while maintaining usability and data integrity.



