import axios from "axios";
import { create } from "ipfs-http-client";
import { ethers } from "ethers";

// IPFS Configuration
// For production, use your own IPFS node or service like Pinata
const IPFS_GATEWAY =
  import.meta.env.VITE_IPFS_GATEWAY || "https://ipfs.io/ipfs/";
const IPFS_API_URL =
  import.meta.env.VITE_IPFS_API_URL || "https://ipfs.infura.io:5001/api/v0";

export interface ProfileData {
  name: string;
  phone: string;
  backgroundImage: string; // Base64 or URL
  idNumber: string;
}

/**
 * Upload encrypted data to IPFS
 * @param encryptedData Encrypted data as base64 string
 * @returns IPFS CID
 */
export async function uploadEncryptedToIPFS(
  encryptedData: string
): Promise<string> {
  try {
    // Try using IPFS client first
    const ipfs = getIPFSClient();
    if (ipfs) {
      const result = await ipfs.add(encryptedData);
      return result.cid.toString();
    }

    // Fallback: Use Pinata API if configured
    const pinataApiKey = import.meta.env.VITE_PINATA_API_KEY;
    const pinataSecretKey = import.meta.env.VITE_PINATA_SECRET_KEY;

    if (pinataApiKey && pinataSecretKey) {
      const formData = new FormData();
      const blob = new Blob([encryptedData], { type: "text/plain" });
      formData.append("file", blob, "profile.encrypted");

      const response = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        formData,
        {
          headers: {
            pinata_api_key: pinataApiKey,
            pinata_secret_api_key: pinataSecretKey,
          },
        }
      );

      return response.data.IpfsHash;
    }

    throw new Error(
      "IPFS upload failed. Please configure VITE_IPFS_API_URL or VITE_PINATA_API_KEY"
    );
  } catch (error: any) {
    console.error("IPFS upload error:", error);
    throw new Error(`Failed to upload to IPFS: ${error.message}`);
  }
}

/**
 * Retrieve encrypted data from IPFS
 * @param cid IPFS Content Identifier
 * @returns Encrypted data as base64 string
 */
export async function getEncryptedFromIPFS(cid: string): Promise<string> {
  try {
    const url = `${IPFS_GATEWAY}${cid}`;
    const response = await axios.get(url, {
      responseType: "text",
    });
    return response.data;
  } catch (error: any) {
    console.error("IPFS retrieval error:", error);
    throw new Error(`Failed to retrieve from IPFS: ${error.message}`);
  }
}

/**
 * Initialize IPFS client
 * Falls back to public gateway if no API URL configured
 */
function getIPFSClient() {
  try {
    return create({
      url: IPFS_API_URL,
    });
  } catch (error) {
    console.warn("IPFS client initialization failed, using fallback method");
    return null;
  }
}

export function hashProfileData(data: ProfileData): string {
  const jsonData = JSON.stringify(data);
  return ethers.keccak256(ethers.toUtf8Bytes(jsonData));
}

export function verifyProfileData(
  data: ProfileData,
  storedHash: string
): boolean {
  const calculatedHash = hashProfileData(data);
  return calculatedHash.toLowerCase() === storedHash.toLowerCase();
}

/**
 * Upload profile data to IPFS
 * @param data Profile data to upload
 * @returns IPFS CID
 */
export async function uploadToIPFS(data: ProfileData): Promise<string> {
  try {
    // Convert data to JSON
    const jsonData = JSON.stringify(data);

    // Try using IPFS client first
    const ipfs = getIPFSClient();
    if (ipfs) {
      const result = await ipfs.add(jsonData);
      return result.cid.toString();
    }

    // Fallback: Use Pinata API if configured
    const pinataApiKey = import.meta.env.VITE_PINATA_API_KEY;
    const pinataSecretKey = import.meta.env.VITE_PINATA_SECRET_KEY;

    if (pinataApiKey && pinataSecretKey) {
      const formData = new FormData();
      const blob = new Blob([jsonData], { type: "application/json" });
      formData.append("file", blob, "profile.json");

      const response = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        formData,
        {
          headers: {
            pinata_api_key: pinataApiKey,
            pinata_secret_api_key: pinataSecretKey,
          },
        }
      );

      return response.data.IpfsHash;
    }

    // Final fallback: Use public IPFS via Infura or similar
    // Note: This requires your own IPFS node or service
    throw new Error(
      "IPFS upload failed. Please configure VITE_IPFS_API_URL or VITE_PINATA_API_KEY"
    );
  } catch (error: any) {
    console.error("IPFS upload error:", error);
    throw new Error(`Failed to upload to IPFS: ${error.message}`);
  }
}

/**
 * Retrieve profile data from IPFS
 * @param cid IPFS Content Identifier
 * @returns Profile data
 */
export async function getFromIPFS(cid: string): Promise<ProfileData> {
  try {
    const url = `${IPFS_GATEWAY}${cid}`;
    const response = await axios.get(url);
    return response.data as ProfileData;
  } catch (error: any) {
    console.error("IPFS retrieval error:", error);
    throw new Error(`Failed to retrieve from IPFS: ${error.message}`);
  }
}
