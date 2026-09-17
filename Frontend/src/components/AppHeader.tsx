
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, User, LogOut, X, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/contexts/ProjectContext';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

const AppHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const { 
    notifications, 
    markNotificationAsRead, 
    clearReadNotifications,
    hasUnreadNotifications
  } = useProjects();
  const [notificationOpen, setNotificationOpen] = useState(false);

  const handleNotificationClick = (notificationId: string) => {
    markNotificationAsRead(notificationId);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/dashboard" className="text-xl font-bold text-primary flex items-center">
          <span className="bg-primary text-white px-2 py-1 rounded mr-2">TS</span>
          TaskSync
        </Link>

        {user && (
          <div className="flex items-center space-x-4">
            <Popover open={notificationOpen} onOpenChange={setNotificationOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                  <Bell size={18} />
                  {hasUnreadNotifications && (
                    <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-medium">Notifications</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearReadNotifications}
                    disabled={!notifications.some(n => n.read)}
                  >
                    Clear read
                  </Button>
                </div>
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No notifications yet
                  </div>
                ) : (
                  <>
                    <ScrollArea className="h-[300px]">
                      {notifications.map((notification) => (
                        <div 
                          key={notification.id}
                          className={`p-3 border-b border-gray-100 flex gap-3 items-start ${
                            notification.read ? 'bg-white' : 'bg-blue-50'
                          }`}
                        >
                          {notification.read ? (
                            <Check size={16} className="text-green-500 mt-1" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                          )}
                          <div className="flex-1">
                            <p className="text-sm">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          {!notification.read && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6"
                              onClick={() => handleNotificationClick(notification.id)}
                            >
                              <X size={14} />
                            </Button>
                          )}
                        </div>
                      ))}
                    </ScrollArea>
                  </>
                )}
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full bg-primary/10">
                  <User size={18} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuItem className="font-medium">{user.name}</DropdownMenuItem>
                <DropdownMenuItem className="text-gray-500 text-sm">{user.email}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-500 cursor-pointer">
                  <LogOut size={16} className="mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
};

export default AppHeader;
