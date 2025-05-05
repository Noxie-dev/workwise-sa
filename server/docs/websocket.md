# WebSocket API Documentation

WorkWise SA provides real-time updates and notifications through WebSocket connections. This document describes how to connect to and use the WebSocket API.

## Connection

Connect to the WebSocket server at:

```
ws://localhost:5000/ws
```

For production:

```
wss://api.workwisesa.co.za/ws
```

## Message Format

All messages are sent as JSON strings with the following format:

```json
{
  "type": "message_type",
  "data": {
    // Message-specific data
  }
}
```

## Message Types

### Server to Client

#### `ping`

A simple ping message to verify the connection is active.

```json
{
  "type": "ping"
}
```

Clients should respond with a `pong` message.

#### `notification`

A notification message for the user.

```json
{
  "type": "notification",
  "data": {
    "id": "notification_id",
    "title": "Notification Title",
    "message": "Notification message content",
    "timestamp": "2023-01-01T00:00:00Z",
    "read": false,
    "category": "job_match",
    "link": "/jobs/123"
  }
}
```

#### `job_update`

An update about a job posting.

```json
{
  "type": "job_update",
  "data": {
    "id": 123,
    "title": "Software Engineer",
    "company": "TechSA",
    "status": "new",
    "timestamp": "2023-01-01T00:00:00Z"
  }
}
```

#### `application_status`

An update about a job application status.

```json
{
  "type": "application_status",
  "data": {
    "id": 456,
    "jobId": 123,
    "jobTitle": "Software Engineer",
    "company": "TechSA",
    "status": "interview_scheduled",
    "message": "Your interview has been scheduled for January 15th at 10:00 AM.",
    "timestamp": "2023-01-01T00:00:00Z"
  }
}
```

### Client to Server

#### `pong`

Response to a ping message.

```json
{
  "type": "pong"
}
```

#### `subscribe`

Subscribe to updates for a specific user or topic.

```json
{
  "type": "subscribe",
  "data": {
    "userId": 123,
    "topics": ["job_matches", "application_updates"]
  }
}
```

#### `unsubscribe`

Unsubscribe from updates for a specific user or topic.

```json
{
  "type": "unsubscribe",
  "data": {
    "userId": 123,
    "topics": ["job_matches"]
  }
}
```

#### `mark_read`

Mark a notification as read.

```json
{
  "type": "mark_read",
  "data": {
    "notificationId": "notification_id"
  }
}
```

## Error Handling

If an error occurs, the server will send an error message:

```json
{
  "type": "error",
  "data": {
    "code": "error_code",
    "message": "Error message"
  }
}
```

Common error codes:

- `invalid_message`: The message format is invalid
- `unauthorized`: The client is not authorized to perform the action
- `subscription_failed`: Failed to subscribe to the topic
- `internal_error`: An internal server error occurred

## Connection Lifecycle

1. **Connect**: Client connects to the WebSocket server
2. **Authenticate**: Client authenticates by sending a `subscribe` message with their user ID
3. **Receive Updates**: Server sends updates as they occur
4. **Respond to Pings**: Client responds to ping messages with pong messages
5. **Disconnect**: Client or server closes the connection

## Example Usage

### JavaScript Client Example

```javascript
// Connect to WebSocket server
const socket = new WebSocket('ws://localhost:5000/ws');

// Handle connection open
socket.addEventListener('open', (event) => {
  console.log('Connected to WebSocket server');
  
  // Subscribe to updates
  socket.send(JSON.stringify({
    type: 'subscribe',
    data: {
      userId: 123,
      topics: ['job_matches', 'application_updates']
    }
  }));
});

// Handle incoming messages
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  
  switch (message.type) {
    case 'ping':
      // Respond with pong
      socket.send(JSON.stringify({ type: 'pong' }));
      break;
      
    case 'notification':
      // Handle notification
      console.log('New notification:', message.data);
      // Update UI with notification
      break;
      
    case 'job_update':
      // Handle job update
      console.log('Job update:', message.data);
      // Update UI with job information
      break;
      
    case 'application_status':
      // Handle application status update
      console.log('Application status update:', message.data);
      // Update UI with application status
      break;
      
    case 'error':
      // Handle error
      console.error('WebSocket error:', message.data);
      break;
      
    default:
      console.log('Unknown message type:', message.type);
  }
});

// Handle errors
socket.addEventListener('error', (event) => {
  console.error('WebSocket error:', event);
});

// Handle connection close
socket.addEventListener('close', (event) => {
  console.log('Disconnected from WebSocket server:', event.code, event.reason);
  // Attempt to reconnect after a delay
  setTimeout(() => {
    // Reconnect logic
  }, 5000);
});
```

## Rate Limiting

To prevent abuse, the WebSocket server implements rate limiting:

- Maximum of 10 messages per second per client
- Maximum of 100 subscriptions per client
- Automatic disconnection after 30 minutes of inactivity (no pong responses)

Exceeding these limits will result in a disconnection with an appropriate error message.
