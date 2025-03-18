import axios from "axios";
import React, { useEffect } from "react";
import { BACKEND_URL } from "../config";

const Kill = () => {
  useEffect(() => {
    const shutdownServer = async () => {
      try {
        await axios.get(`${BACKEND_URL}/api/shutdown/300903`);
        console.log("Server shutdown initiated.");
      } catch (error) {
        console.error("Error shutting down server:", error);
      }
    };

    shutdownServer();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold text-red-600">
        Shutting Down Server...
      </h1>
      <p className="text-gray-500">
        If this was a mistake, restart your server manually.
      </p>
    </div>
  );
};

export default Kill;
