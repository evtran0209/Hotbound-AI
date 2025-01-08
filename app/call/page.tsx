"use client";

import { useEffect } from "react";

export default function CallSimulation() {
  useEffect(() => {
    // Simulate connecting to the voice agent
    console.log("Connecting to voice agent...");
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100">
      <h1 className="text-2xl font-bold mb-6">Sales Call Simulation</h1>
      <p className="mb-4">Your voice agent is ready. Start the call and practice your pitch!</p>
      <button
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        onClick={() => alert("Call started!")}
      >
        Start Call
      </button>
    </div>
  );
}