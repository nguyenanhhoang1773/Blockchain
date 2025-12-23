import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Web3Provider } from "./components/Web3Context";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import RoomDetails from "./pages/RoomDetails";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import MyBookings from "./pages/MyBookings";

function App() {
  return (
    <Web3Provider>
      <Router>
        <div className="min-h-screen bg-slate-50">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/room/:id" element={<RoomDetails />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/my-bookings" element={<MyBookings />} />
          </Routes>
        </div>
      </Router>
    </Web3Provider>
  );
}

export default App;