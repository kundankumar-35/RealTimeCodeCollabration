import React from 'react';
import Avatar from 'react-avatar';

const UserAvatar = ({ socketId, username }) => {
    return (
        <div className="flex items-center space-x-4">
            <Avatar name={username} round={true} size="50" className="shadow-md" />
            <p className="text-lg font-medium">{username}</p>
        </div>
    );
};

export default UserAvatar;
