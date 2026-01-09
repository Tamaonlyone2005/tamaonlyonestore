
import React from 'react';
import { User } from '../types';

interface UserAvatarProps {
  user: User | null | undefined;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBorder?: boolean;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ user, size = 'md', className = '' }) => {
  if (!user) return null;

  // Dimensions
  const dim = size === 'sm' ? 'w-8 h-8' : size === 'md' ? 'w-10 h-10' : size === 'lg' ? 'w-16 h-16' : 'w-32 h-32 md:w-40 md:h-40';
  
  return (
    <div className={`relative inline-block ${dim} ${className} rounded-full`}>
      {/* Main Avatar Image */}
      <img 
        src={user.avatar || "https://picsum.photos/200/200"} 
        alt={user.username} 
        className="w-full h-full rounded-full object-cover bg-dark-bg border-2 border-white/10"
      />
    </div>
  );
};

export default UserAvatar;
