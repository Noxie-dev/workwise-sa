import React, { useEffect, useState, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Bell, BellOff } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import websocketService from '@/services/websocketService';
import analyticsService from '@/services/analyticsService';

interface RealtimeUpdate {
  id: string;
  type: 'job' | 'skill' | 'market';
  message: string;
  timestamp: Date;
  read: boolean;
}

interface RealtimeUpdatesProps {
  userId?: string;
}

const RealtimeUpdates: React.FC<RealtimeUpdatesProps> = ({ userId }) => {
  const [updates, setUpdates] = useState<RealtimeUpdate[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);

  // Connect to WebSocket
  useEffect(() => {
    if (!userId || !notificationsEnabled) {
      setConnected(false);
      return;
    }

    setError(null);

    // Try to connect to WebSocket server
    const connectToWebSocket = async () => {
      try {
        const connected = await websocketService.connect(userId);
        setConnected(connected);

        if (connected) {
          // Register message handlers
          const handleJobUpdate = (data: any) => {
            if (notificationsEnabled) {
              const newUpdate: RealtimeUpdate = {
                id: `update-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: 'job',
                message: data.message,
                timestamp: new Date(data.timestamp),
                read: false
              };

              setUpdates(prev => [newUpdate, ...prev].slice(0, 10)); // Keep only the 10 most recent

              // Track notification
              if (userId) {
                analyticsService.trackNotificationInteraction(userId, 'job', 'received', newUpdate.id);
              }
            }
          };

          const handleSkillUpdate = (data: any) => {
            if (notificationsEnabled) {
              const newUpdate: RealtimeUpdate = {
                id: `update-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: 'skill',
                message: data.message,
                timestamp: new Date(data.timestamp),
                read: false
              };

              setUpdates(prev => [newUpdate, ...prev].slice(0, 10)); // Keep only the 10 most recent

              // Track notification
              if (userId) {
                analyticsService.trackNotificationInteraction(userId, 'skill', 'received', newUpdate.id);
              }
            }
          };

          const handleMarketUpdate = (data: any) => {
            if (notificationsEnabled) {
              const newUpdate: RealtimeUpdate = {
                id: `update-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: 'market',
                message: data.message,
                timestamp: new Date(data.timestamp),
                read: false
              };

              setUpdates(prev => [newUpdate, ...prev].slice(0, 10)); // Keep only the 10 most recent

              // Track notification
              if (userId) {
                analyticsService.trackNotificationInteraction(userId, 'market', 'received', newUpdate.id);
              }
            }
          };

          // Register handlers
          websocketService.on('job', handleJobUpdate);
          websocketService.on('skill', handleSkillUpdate);
          websocketService.on('market', handleMarketUpdate);

          // For development/demo purposes, simulate updates if no real ones are coming
          const interval = setInterval(() => {
            if (notificationsEnabled && updates.length === 0) {
              const newUpdate = generateMockUpdate();
              setUpdates(prev => [newUpdate, ...prev].slice(0, 10));
            }
          }, 15000);

          // Store interval for cleanup
          wsRef.current = interval;

          return () => {
            // Remove handlers
            websocketService.off('job', handleJobUpdate);
            websocketService.off('skill', handleSkillUpdate);
            websocketService.off('market', handleMarketUpdate);

            // Clear interval
            if (wsRef.current) {
              clearInterval(wsRef.current as unknown as number);
              wsRef.current = null;
            }
          };
        }
      } catch (err) {
        console.error('Failed to connect to WebSocket:', err);
        setError('Failed to connect to real-time updates service');
        setConnected(false);
      }
    };

    connectToWebSocket();

    // Cleanup function
    return () => {
      if (wsRef.current) {
        clearInterval(wsRef.current as unknown as number);
        wsRef.current = null;
      }

      // Don't disconnect from WebSocket here as other components might be using it
      // Just set our local state
      setConnected(false);
    };
  }, [userId, notificationsEnabled, updates.length]);

  // Generate a mock update for demonstration
  const generateMockUpdate = (): RealtimeUpdate => {
    const types = ['job', 'skill', 'market'] as const;
    const type = types[Math.floor(Math.random() * types.length)];

    let message = '';
    switch (type) {
      case 'job':
        const jobTitles = ['Warehouse Assistant', 'Retail Clerk', 'Security Guard', 'Admin Assistant'];
        const jobTitle = jobTitles[Math.floor(Math.random() * jobTitles.length)];
        message = `New ${jobTitle} position matching your profile`;
        break;
      case 'skill':
        const skills = ['Customer Service', 'MS Office', 'Communication', 'Problem Solving'];
        const skill = skills[Math.floor(Math.random() * skills.length)];
        message = `${skill} demand increased by ${Math.floor(Math.random() * 10) + 5}%`;
        break;
      case 'market':
        const industries = ['Retail', 'Hospitality', 'Security', 'Administration'];
        const industry = industries[Math.floor(Math.random() * industries.length)];
        message = `${industry} sector showing ${Math.floor(Math.random() * 15) + 2}% growth`;
        break;
    }

    return {
      id: `update-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      timestamp: new Date(),
      read: false
    };
  };

  // Mark all updates as read
  const markAllAsRead = () => {
    setUpdates(updates.map(update => ({ ...update, read: true })));

    // Track analytics
    if (userId) {
      analyticsService.trackNotificationInteraction(
        userId,
        'all',
        'mark_read',
        `batch-${Date.now()}`
      );
    }
  };

  // Toggle notifications
  const toggleNotifications = () => {
    const newState = !notificationsEnabled;
    setNotificationsEnabled(newState);

    // Track analytics
    if (userId) {
      analyticsService.trackNotificationInteraction(
        userId,
        'settings',
        newState ? 'enable' : 'disable'
      );
    }
  };

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get badge color based on update type
  const getBadgeVariant = (type: 'job' | 'skill' | 'market') => {
    switch (type) {
      case 'job': return 'default';
      case 'skill': return 'secondary';
      case 'market': return 'outline';
      default: return 'default';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Real-time Updates</CardTitle>
          <CardDescription>
            {connected
              ? 'Live updates based on your profile and market changes'
              : 'Connecting to update service...'}
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleNotifications}
          title={notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
        >
          {notificationsEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
        </Button>
      </CardHeader>

      <CardContent className="max-h-[400px] overflow-y-auto">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!connected && (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}

        {connected && updates.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <p>No updates yet</p>
            <p className="text-sm">Updates will appear here as they arrive</p>
          </div>
        )}

        {connected && updates.length > 0 && (
          <div className="space-y-3">
            {updates.map(update => (
              <div
                key={update.id}
                className={`p-3 border rounded-lg ${update.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'}`}
              >
                <div className="flex justify-between items-start">
                  <Badge variant={getBadgeVariant(update.type)}>
                    {update.type === 'job' && 'Job Alert'}
                    {update.type === 'skill' && 'Skill Trend'}
                    {update.type === 'market' && 'Market Insight'}
                  </Badge>
                  <span className="text-xs text-gray-500">{formatTime(update.timestamp)}</span>
                </div>
                <p className="mt-2 text-sm">{update.message}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {connected && updates.length > 0 && (
        <CardFooter className="flex justify-between">
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            Mark all as read
          </Button>
          <span className="text-xs text-gray-500">
            {updates.filter(u => !u.read).length} unread
          </span>
        </CardFooter>
      )}
    </Card>
  );
};

export default RealtimeUpdates;
