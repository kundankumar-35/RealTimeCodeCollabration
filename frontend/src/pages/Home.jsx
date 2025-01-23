import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import toast, { Toaster } from 'react-hot-toast';
import 'tailwindcss/tailwind.css';

const HomePage = () => {
    const [roomId, setRoomId] = useState('');
    const [username, setUsername] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();  // stop rerending
        if (!roomId || !username) {
            toast.error('Please enter room ID and username');
            return;
        }
        const userDetails = {
            username,
            roomID: roomId,
         
        };
        navigate(`/editor/${roomId}`, {
            state: {
                userDetails,
            }
        });
        toast.success('Navigating to editor...');
    };

    const handleCreateRoom = () => {
        const newRoomId = uuidv4();
        setRoomId(newRoomId);
        toast.success('New room ID created');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600">
            <Toaster position="top-right" />
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">RealTimeCoders</h1>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="roomId" className="block text-gray-700 text-sm font-bold mb-2">Room ID</label>
                        <input
                            type="text"
                            id="roomId"
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-green-500 font-bold leading-tight focus:outline-none focus:shadow-outline"
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="username" className="block text-gray-700 text-sm font-bold mb-2">Username</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-green-500 font-bold leading-tight focus:outline-none focus:shadow-outline"
                        />
                    </div>

                    <div className="flex items-center justify-between mb-4">
                        <button
                            type="submit"
                            className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        >
                            Join Room
                        </button>
                        <button
                            type="button"
                            onClick={handleCreateRoom}
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        >
                            Create New Room
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default HomePage;
