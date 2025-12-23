// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title UserProfile
 * @notice Stores user profile metadata on-chain (CID and hash only)
 * @dev Sensitive data is encrypted and stored off-chain on IPFS, only references stored on-chain
 */
contract UserProfile {
    struct Profile {
        string ipfsCID;      // IPFS Content Identifier
        bytes32 dataHash;    // Hash of the profile data for verification
        uint256 updatedAt;   // Timestamp of last update
        bool exists;         // Whether profile exists
    }

    // Mapping from user address to their profile
    mapping(address => Profile) public profiles;

    // Events
    event ProfileCreated(address indexed user, string ipfsCID, bytes32 dataHash);
    event ProfileUpdated(address indexed user, string ipfsCID, bytes32 dataHash);

    /**
     * @notice Create or update user profile
     * @param ipfsCID The IPFS Content Identifier where encrypted profile data is stored
     * @param dataHash The keccak256 hash of the plaintext profile data for verification
     */
    function setProfile(string memory ipfsCID, bytes32 dataHash) external {
        require(bytes(ipfsCID).length > 0, "IPFS CID cannot be empty");
        require(dataHash != bytes32(0), "Data hash cannot be zero");

        bool isUpdate = profiles[msg.sender].exists;

        profiles[msg.sender] = Profile({
            ipfsCID: ipfsCID,
            dataHash: dataHash,
            updatedAt: block.timestamp,
            exists: true
        });

        if (isUpdate) {
            emit ProfileUpdated(msg.sender, ipfsCID, dataHash);
        } else {
            emit ProfileCreated(msg.sender, ipfsCID, dataHash);
        }
    }

    /**
     * @notice Get user profile metadata
     * @param user Address of the user
     * @return ipfsCID The IPFS Content Identifier
     * @return dataHash The hash of the profile data
     * @return updatedAt Timestamp of last update
     * @return exists Whether profile exists
     */
    function getProfile(address user) external view returns (
        string memory ipfsCID,
        bytes32 dataHash,
        uint256 updatedAt,
        bool exists
    ) {
        Profile memory profile = profiles[user];
        return (profile.ipfsCID, profile.dataHash, profile.updatedAt, profile.exists);
    }

    /**
     * @notice Check if a user has a profile
     * @param user Address of the user
     * @return exists Whether profile exists
     */
    function hasProfile(address user) external view returns (bool) {
        return profiles[user].exists;
    }

    /**
     * @notice Verify profile data integrity
     * @param user Address of the user
     * @param dataHash The hash to verify against stored hash
     * @return isValid Whether the hash matches
     */
    function verifyProfile(address user, bytes32 dataHash) external view returns (bool) {
        return profiles[user].exists && profiles[user].dataHash == dataHash;
    }
}
