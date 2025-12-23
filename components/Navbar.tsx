import React from "react";
import { Link } from "react-router-dom";
import { useWeb3 } from "./Web3Context";
import { Wallet, LogOut, Menu } from "lucide-react";

export default function Navbar() {
  const { account, connectWallet, disconnectWallet } = useWeb3();

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link
              to="/"
              className="flex-shrink-0 flex items-center"
            >
              <span className="text-xl font-bold text-primary">EtherStay</span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/"
                className="border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Home
              </Link>
              <Link
                to="/my-bookings"
                className="border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                My Bookings
              </Link>
              <Link
                to="/profile"
                className="border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Profile
              </Link>
              {account === "0x52908ce6d302a8702c88eac779ea36999cebe64c" && (
                <Link
                  to="/admin"
                  className="border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Admin
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center">
            {account ? (
              <div className="flex items-center gap-4">
                <span className="text-xs font-mono bg-slate-100 px-3 py-1 rounded-full text-slate-600">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </span>
                <button
                  onClick={disconnectWallet}
                  className="p-2 rounded-full text-slate-500 hover:bg-slate-100"
                  title="Disconnect"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Wallet className="mr-2 h-4 w-4" />
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
