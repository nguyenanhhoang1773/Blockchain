import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ethers, BrowserProvider, Contract, JsonRpcProvider } from "ethers";
import { CONTRACT_ADDRESS, ABI, RPC_URL } from "../constants";
import { Web3ContextType } from "../types";

// Extend the global Window interface to include ethereum
declare global {
  interface Window {
    ethereum: any;
  }
}

const Web3Context = createContext<Web3ContextType | null>(null);

interface Web3ProviderProps {
  children?: ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  const [account, setAccount] = useState<string | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [chainId, setChainId] = useState<bigint | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        try {
          const browserProvider = new BrowserProvider(window.ethereum);
          const accounts = await browserProvider.listAccounts();

          if (accounts.length > 0) {
            const signer = await browserProvider.getSigner();
            const activeContract = new Contract(CONTRACT_ADDRESS, ABI, signer);
            const network = await browserProvider.getNetwork();

            setAccount(accounts[0].address);
            setChainId(network.chainId);
            setContract(activeContract);
          }
        } catch (err) {
          console.error("Auto-connect failed", err);
        }
      }
    };
    init();
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask to use this DApp!");
      return;
    }

    setIsConnecting(true);
    try {
      const browserProvider = new BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send("eth_requestAccounts", []);
      const network = await browserProvider.getNetwork();

      const signer = await browserProvider.getSigner();
      const activeContract = new Contract(CONTRACT_ADDRESS, ABI, signer);

      setAccount(accounts[0]);
      setChainId(network.chainId);
      setContract(activeContract);
    } catch (error) {
      console.error("Error connecting wallet:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setContract(null);
  };

  const getReadOnlyContract = () => {
    const readProvider = new JsonRpcProvider(RPC_URL);
    return new Contract(CONTRACT_ADDRESS, ABI, readProvider);
  };

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          connectWallet();
        }
      };
      
      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, []);

  return (
    <Web3Context.Provider
      value={{
        account,
        contract,
        connectWallet,
        disconnectWallet,
        isConnecting,
        getReadOnlyContract,
        chainId,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
}