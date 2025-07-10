# Chat Application

## Overview

This is a real-time chat application built with a modern full-stack architecture. The system features a React frontend with shadcn/ui components, an Express.js backend with WebSocket support, and uses Drizzle ORM for database operations. The application supports multiple chat rooms, real-time messaging, and user presence tracking.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Real-time Communication**: WebSocket client for live chat functionality

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **WebSocket**: Native WebSocket implementation for real-time messaging
- **Database**: PostgreSQL with Drizzle ORM for persistent storage
- **Database Connection**: Neon serverless PostgreSQL driver (@neondatabase/serverless)
- **Session Management**: connect-pg-simple for PostgreSQL session storage
- **Development**: tsx for TypeScript execution in development

### Database Schema
- **chat_rooms**: Stores chat room information (id, name, user_count, created_at)
- **chat_messages**: Stores chat messages (id, room_id, nickname, message, timestamp)
- **Relationships**: Messages belong to rooms via foreign key relationship

## Key Components

### Frontend Components
- **Chat Page**: Main chat interface with room selection and messaging
- **UI Components**: Complete shadcn/ui component library for consistent design
- **WebSocket Client**: Handles real-time message sending/receiving and room management
- **Query Client**: TanStack Query setup for API communication

### Backend Components
- **Route Handlers**: REST API endpoints for rooms and messages
- **WebSocket Server**: Real-time communication server with room management
- **Storage Layer**: DatabaseStorage implementation with PostgreSQL persistence
- **Database Connection**: Configured Drizzle ORM with connection pooling
- **Middleware**: Request logging, JSON parsing, and error handling

### Shared Components
- **Schema Definitions**: Drizzle table schemas and Zod validation schemas
- **Type Definitions**: Shared TypeScript types for WebSocket messages and data models

## Data Flow

### Room Management
1. Frontend fetches available rooms via REST API
2. Users can create new rooms through POST requests
3. Room user counts are tracked and updated via WebSocket messages
4. Real-time room updates are broadcast to all connected clients

### Messaging Flow
1. User joins a room via WebSocket connection
2. Historical messages are loaded via REST API
3. New messages are sent through WebSocket and broadcast to room participants
4. Messages are persisted to database and distributed in real-time
5. User presence is tracked per room with automatic cleanup on disconnect

### State Synchronization
- Frontend maintains local message state updated via WebSocket events
- User counts are synchronized across all clients in real-time
- Room lists are periodically refreshed to show current state

## External Dependencies

### Frontend Dependencies
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Headless UI component primitives
- **wouter**: Lightweight React router
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **date-fns**: Date manipulation utilities

### Backend Dependencies
- **express**: Web application framework
- **ws**: WebSocket implementation
- **drizzle-orm**: TypeScript ORM with type safety
- **@neondatabase/serverless**: Serverless PostgreSQL driver
- **connect-pg-simple**: PostgreSQL session store
- **zod**: Runtime type validation

### Development Dependencies
- **vite**: Build tool and development server
- **tsx**: TypeScript execution for Node.js
- **drizzle-kit**: Database schema management and migrations
- **esbuild**: JavaScript bundler for production builds

## Deployment Strategy

### Development Mode
- Vite dev server serves the frontend with hot module replacement
- Express server runs with tsx for TypeScript execution
- WebSocket server integrated with HTTP server
- Database migrations applied via drizzle-kit

### Production Build
- Frontend built to static files using Vite
- Backend bundled with esbuild for Node.js deployment
- Static files served by Express in production
- PostgreSQL database required for persistent storage

### Environment Configuration
- DATABASE_URL required for PostgreSQL connection
- Supports both development and production environments
- Session storage configured for PostgreSQL
- WebSocket server automatically adapts to HTTP/HTTPS protocols

The application is designed for easy deployment on platforms supporting Node.js with PostgreSQL databases, with particular optimization for serverless PostgreSQL providers like Neon.

## Recent Changes (July 10, 2025)

### Database Integration Completed
- ✓ Migrated from in-memory storage to PostgreSQL database
- ✓ Configured Drizzle ORM with Neon serverless driver  
- ✓ Added database tables: chat_rooms and chat_messages with proper relations
- ✓ Updated storage layer to use DatabaseStorage instead of MemStorage
- ✓ Applied database schema changes via drizzle-kit push
- ✓ Verified persistent message storage and room management

### Deployment Configuration Updates
- Updated Vercel deployment settings for production builds
- Created fallback entry point for serverless deployment
- Configured static file serving for production environment