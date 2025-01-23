import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { FaRegCopy } from 'react-icons/fa';
import toast, { Toaster } from 'react-hot-toast';
import UserAvatar from './Client';
import 'tailwindcss/tailwind.css';
import CodeMirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/clike/clike';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/selection/active-line';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/hint/javascript-hint';
import 'codemirror/addon/hint/css-hint';
import 'codemirror/addon/hint/html-hint';
import 'codemirror/addon/hint/sql-hint';
import 'codemirror/addon/display/fullscreen';
import 'codemirror/addon/comment/comment';
import 'codemirror/addon/fold/foldcode';
import 'codemirror/addon/fold/foldgutter';
import 'codemirror/addon/fold/brace-fold';
import 'codemirror/addon/fold/xml-fold';
import 'codemirror/addon/hint/show-hint.css';
import 'codemirror/addon/display/fullscreen.css';
import 'codemirror/addon/fold/foldgutter.css';

import io from 'socket.io-client';
import debounce from 'lodash.debounce';

const EditorPage = () => {
    const [users, setUsers] = useState([]);
    const { roomId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const editorRef = useRef(null);
    const socketRef = useRef(null);

    const customStyles = `
      .CodeMirror-activeline-background {
        background: none !important;
      }

      .CodeMirror {
        font-size: 20px;
        font-family: Cursive;
        direction: ltr;
      }

      .CodeMirror-linenumbers {
        padding-right: 10px;
      }
    `;

    if (location.state == null) {
        toast.error("location state not found")
        navigate('/');  // go to home page
    }
    const { userDetails } = location.state
    useEffect(() => {
        const socket = io("http://localhost:3000", {
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            autoConnect: true,
            withCredentials: true,
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("Connected to the server from client to server");
            socket.emit("join", { roomId: roomId, username: userDetails.username }, (response) => {
                if (response.status === 'success') {
                    console.log("Joined the room successfully.");
                    setUsers(response.users); // Update users state
                    editorRef.current.setValue(response.code); // Set initial code
                } else {
                    console.error("Failed to join the room:", response.message);
                    toast.error(response.message); // Display error message
                }
            });
        });

        socket.on("disconnect", () => {
            console.log("Disconnected from the server");
        });

        socket.on("reconnect", (attemptNumber) => {
            console.log(`Reconnected on attempt ${attemptNumber}`);
        });

        socket.on("connect_error", (error) => {
            console.log("Connection error", error);
            toast.error("failed to connect")
            navigate('/') // go to home page
        });

        socket.on("updateUserList", (users) => {
            setUsers(users);
        });

        socket.on("userDisconnected", ({ id, username }) => {
            console.log(`User ${username} with ID ${id} has disconnected`);

            // Remove the disconnected user from the users list
            setUsers((prevUsers) => prevUsers.filter((user) => user.socketId !== id));

            // Optionally, you can display a notification
            toast.success(`${username} has left the room`);
        });

        // When new user connects in this room
        socket.on("userConnected", ({ id, username }) => {
            console.log(`User ${username} with ID ${id} has connected`);

            // Update the users list
            setUsers((prevUsers) => [...prevUsers, { socketId: id, username }]);

            // Optionally, display a notification
            toast.success(`${username} has joined the room`);
        });

        socket.on("userLeft", ({ username }) => {
            toast.success(`${username} has left the room`);
        });

        socket.on("codeChange", (code) => {
            if (editorRef.current && code !== editorRef.current.getValue()) {
                const doc = editorRef.current.getDoc();
                const cursor = doc.getCursor(); // Get the current cursor position

                editorRef.current.setValue(code); // Update the code in the editor

                // Move cursor to the last position of the editor
                const lastLine = doc.lineCount() - 1;
                const lastChar = doc.getLine(lastLine).length; // Length of the last line
                doc.setCursor({ line: lastLine, ch: lastChar });
            }
        });


        const init = async () => {
            const editor = CodeMirror.fromTextArea(
                document.getElementById('code_editor'),
                {
                    mode: 'text/x-c++src',
                    theme: 'material',
                    lineNumbers: true,
                    autoCloseBrackets: true,
                    autoCloseTags: true,
                    styleActiveLine: true,
                    extraKeys: {
                        "Ctrl-Space": "autocomplete",
                        "Ctrl-Q": function (cm) { cm.foldCode(cm.getCursor()); },
                        "F11": function (cm) { cm.setOption("fullScreen", !cm.getOption("fullScreen")); },
                        "Esc": function (cm) { if (cm.getOption("fullScreen")) cm.setOption("fullScreen", false); },
                    },
                    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
                    placeholder: "Write your code here..."
                }
            );
            editor.setSize('100%', '100%');
            editor.getWrapperElement().style.fontSize = '20px';
            editor.getWrapperElement().style.fontFamily = 'Cursive';
            editorRef.current = editor;

            // Listen for changes in the editor
            editor.on('change', debounce((cm) => {
                const code = cm.getValue();
                socket.emit("codeChange", { roomId, code });
            }, 10)); //  debounce is used to  minimize frequent socket emissions


            editor.focus();
        };
        init();

        return () => {
            if (socketRef.current) {
                socketRef.current.off("codeChange");
                socketRef.current.off("updateUserList");
                socketRef.current.disconnect();
            }
        };

    }, [roomId, userDetails]);

    const styleElement = document.createElement("style");
    styleElement.textContent = customStyles;
    document.head.append(styleElement);

    const handleLeaveRoom = () => {
        if (socketRef.current) {
            socketRef.current.emit("leaveRoom", { roomId }, (response) => {
                if (response.status === 'success') {
                    toast.success('You have left the room');
                    navigate('/');
                } else {
                    toast.error(`Failed to leave the room: ${response.message}`);
                }
            });
        }
    };

    const handleCopyRoomId = () => {
        navigator.clipboard.writeText(roomId);
        toast.success('Room ID copied to clipboard');
    };

    return (
        <div className="flex min-h-screen">
            <Toaster position="top-right" />
            <aside className="w-64 bg-gray-800 text-white flex flex-col">
                <div className="flex items-center justify-center h-16 bg-gray-900">
                    <img src="/logoRealTimeCoders.webp" alt="Logo" className="h-12" />
                </div>
                <div className="flex-grow p-4 overflow-y-auto">
                    <h2 className="text-xl font-bold mb-4">Users in Room</h2>
                    <ul className="space-y-1">
                        {users.map((user, index) => (
                            <li key={user.socketId || index}>
                                <UserAvatar socketId={user.socketId} username={user.username} />
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="p-4">
                    <button
                        onClick={handleCopyRoomId}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full flex items-center justify-center"
                    >
                        <FaRegCopy className="mr-2" />
                        Copy Room ID
                    </button>
                    <button
                        onClick={handleLeaveRoom}
                        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded w-full mt-2"
                    >
                        Leave Room
                    </button>
                </div>
            </aside>
            <div className="flex-grow p-4">
                <textarea
                    id="code_editor"
                    className="w-full h-full border-2 border-gray-300 p-2 rounded-md resize-none"
                    placeholder="Write your code here..."
                ></textarea>
            </div>
        </div>
    );
};

export default EditorPage;
