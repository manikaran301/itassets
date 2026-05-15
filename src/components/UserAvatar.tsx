"use client";

import { cn } from "@/lib/utils";

interface UserAvatarProps {
  photoPath?: string | null;
  fullName?: string;
  className?: string;
}

export function UserAvatar({ photoPath, fullName, className }: UserAvatarProps) {
  const initials = fullName
    ? fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : "?";

  return (
    <div className={cn("relative overflow-hidden shrink-0 flex items-center justify-center bg-primary/10 text-primary font-black border border-primary/10", className)}>
      <div className="w-full h-full flex items-center justify-center absolute inset-0 z-0">
        <span className="uppercase tracking-tighter" style={{ fontSize: 'inherit' }}>
          {initials}
        </span>
      </div>
      {photoPath && (
        <img
          src={photoPath}
          alt={fullName || "User Avatar"}
          className="w-full h-full object-cover absolute inset-0 z-10"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      )}
    </div>
  );
}
