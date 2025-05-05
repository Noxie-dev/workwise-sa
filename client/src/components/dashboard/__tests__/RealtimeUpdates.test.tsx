import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import RealtimeUpdates from '../RealtimeUpdates';
import websocketService from '@/services/websocketService';
import analyticsService from '@/services/analyticsService';

// Mock dependencies
vi.mock('@/services/websocketService', () => ({
  default: {
    connect: vi.fn().mockResolvedValue(true),
    on: vi.fn(),
    off: vi.fn(),
    isConnected: vi.fn().mockReturnValue(true),
  }
}));

vi.mock('@/services/analyticsService', () => ({
  default: {
    trackNotificationInteraction: vi.fn(),
  }
}));

describe('RealtimeUpdates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders connecting state initially', () => {
    render(<RealtimeUpdates userId="test-user" />);
    
    expect(screen.getByText('Real-time Updates')).toBeInTheDocument();
    expect(screen.getByText('Connecting to update service...')).toBeInTheDocument();
  });

  it('connects to WebSocket service when mounted', async () => {
    render(<RealtimeUpdates userId="test-user" />);
    
    expect(websocketService.connect).toHaveBeenCalledWith('test-user');
  });

  it('registers WebSocket event handlers', async () => {
    render(<RealtimeUpdates userId="test-user" />);
    
    expect(websocketService.on).toHaveBeenCalledTimes(3);
    expect(websocketService.on).toHaveBeenCalledWith('job', expect.any(Function));
    expect(websocketService.on).toHaveBeenCalledWith('skill', expect.any(Function));
    expect(websocketService.on).toHaveBeenCalledWith('market', expect.any(Function));
  });

  it('toggles notifications when button is clicked', async () => {
    render(<RealtimeUpdates userId="test-user" />);
    
    // Find and click the notifications toggle button
    const toggleButton = screen.getByRole('button', { name: 'Disable notifications' });
    fireEvent.click(toggleButton);
    
    expect(analyticsService.trackNotificationInteraction).toHaveBeenCalledWith(
      'test-user',
      'settings',
      'disable'
    );
    
    // Button should now show "Enable notifications"
    expect(screen.getByRole('button', { name: 'Enable notifications' })).toBeInTheDocument();
  });

  it('marks all updates as read when button is clicked', async () => {
    // Mock the generateMockUpdate function to return a specific update
    const mockUpdate = {
      id: 'update-123',
      type: 'job',
      message: 'Test update',
      timestamp: new Date(),
      read: false
    };
    
    // Use spyOn to mock the implementation
    vi.spyOn(global.Math, 'random').mockReturnValue(0.5);
    
    const { rerender } = render(<RealtimeUpdates userId="test-user" />);
    
    // Manually add an update by accessing the component's state
    // This is a bit hacky but necessary for testing
    act(() => {
      // Find the generateMockUpdate function and call it
      const instance = (RealtimeUpdates as any).prototype;
      const update = instance.generateMockUpdate ? instance.generateMockUpdate() : mockUpdate;
      
      // Set the updates state
      instance.setUpdates = (updates: any[]) => {
        instance.updates = [update];
        rerender(<RealtimeUpdates userId="test-user" />);
      };
      
      instance.setUpdates([mockUpdate]);
    });
    
    // Now the component should show the update
    // Find and click the "Mark all as read" button
    const markReadButton = screen.getByRole('button', { name: 'Mark all as read' });
    fireEvent.click(markReadButton);
    
    expect(analyticsService.trackNotificationInteraction).toHaveBeenCalledWith(
      'test-user',
      'all',
      'mark_read',
      expect.any(String)
    );
  });
});
