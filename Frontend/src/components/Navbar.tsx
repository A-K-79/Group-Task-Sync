import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/contexts/ProjectContext';
import { Button } from '@/components/ui/button';
import { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle
} from "@/components/ui/navigation-menu";
import { LayoutDashboard, Bell, User, LogOut, X, Check, ListTodo } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

const Navbar: React.FC = () => {
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
  
  if (!user) return null; // Don't show navbar for non-authenticated users
  
  return (
    <nav className="bg-white border-b border-gray-200 py-4 sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/dashboard" className="text-xl font-bold flex items-center mr-6">
            <span className="bg-primary text-white px-2 py-1 rounded mr-2">TS</span>
            TaskSync
          </Link>
          
          <NavigationMenu className="ml-8">
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link to="/dashboard" className={navigationMenuTriggerStyle() + " text-gray-800 hover:text-blue-500 transition-colors"}>
                  <LayoutDashboard size={16} className="mr-2" />
                  Dashboard
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/personal-todo" className={navigationMenuTriggerStyle() + " text-gray-800 hover:text-blue-500 transition-colors"}>
                  <ListTodo size={16} className="mr-2" />
                  Personal Todo
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="flex items-center space-x-4">
          <Popover open={notificationOpen} onOpenChange={setNotificationOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="relative border-gray-300 hover:bg-gray-100">
                <Bell size={18} className="text-gray-700" />
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
              <Button variant="ghost" size="icon" className="rounded-full bg-gray-100 hover:bg-gray-200">
                <User size={18} className="text-gray-700" />
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
      </div>
    </nav>
  );
};

export default Navbar;
