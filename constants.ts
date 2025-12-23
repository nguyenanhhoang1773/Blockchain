// Define ImportMeta interface for missing Vite types
declare global {
  interface ImportMeta {
    env: Record<string, string>;
  }
}

export const CONTRACT_ADDRESS = "0x27C98d65c46D5914C0b0370175C3EbF2775B396c";
export const RPC_URL =
  "https://eth-sepolia.g.alchemy.com/v2/uFKx4u5VYI7jT-eweG6oF";
// Use Vite environment variable if available, otherwise fallback to localhost
export const BACKEND_URL =
  import.meta.env?.VITE_BACKEND_URL || "http://localhost:3001";

export const ABI = [
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
