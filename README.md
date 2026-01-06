# Nexus Casino - iGaming Platform

A full-stack iGaming platform built with React + TypeScript frontend and Spring Boot backend, featuring JWT authentication, PostgreSQL database, and WebSocket live chat.

## 🎮 Features

- **Multiple Casino Games**: Slots, Roulette, Blackjack, and Dice
- **User Authentication**: JWT-based authentication system
- **Real-time Chat**: WebSocket-powered live chat
- **Game History**: Track all your gaming sessions
- **Balance Management**: Virtual currency system (demo mode)
- **Responsive Design**: Modern UI with Tailwind CSS and animations

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Radix UI** components
- **Framer Motion** for animations
- **WebSocket** for real-time chat

### Backend
- **Spring Boot 3.2** with Java 17
- **Spring Security** with JWT authentication
- **Spring Data JPA** for database operations
- **PostgreSQL** database
- **WebSocket** for real-time communication

### Infrastructure
- **Docker** and **Docker Compose** for containerization
- **Maven** for Java dependency management
- **npm** for Node.js dependencies

## 📋 Prerequisites

- Docker and Docker Compose
- Java 17+ (for local development)
- Node.js 20+ and npm (for local development)
- Maven 3.9+ (for local development)

## 🚀 Quick Start with Docker

1. **Clone and navigate to the project:**
   ```bash
   cd NexusCasino
   ```

2. **Create environment file (optional):**
   ```bash
   cp .env.example .env
   # Edit .env with your preferred settings
   ```

3. **Start all services:**
   ```bash
   docker-compose up -d
   ```

4. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8080/api
   - PostgreSQL: localhost:5432

5. **Stop services:**
   ```bash
   docker-compose down
   ```

## 🔧 Local Development Setup

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Configure database in `src/main/resources/application.yml`:**
   ```yaml
   spring:
     datasource:
       url: jdbc:postgresql://localhost:5432/nexus_casino
       username: casino_user
       password: casino_pass
   ```

3. **Start PostgreSQL** (or use Docker):
   ```bash
   docker run -d --name postgres -e POSTGRES_DB=nexus_casino -e POSTGRES_USER=casino_user -e POSTGRES_PASSWORD=casino_pass -p 5432:5432 postgres:15-alpine
   ```

4. **Build and run:**
   ```bash
   mvn clean install
   mvn spring-boot:run
   ```

   Backend will run on http://localhost:8080

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file:**
   ```env
   VITE_API_BASE_URL=http://localhost:8080/api
   VITE_WS_URL=ws://localhost:8080/ws
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

   Frontend will run on http://localhost:5173

## 📁 Project Structure

```
NexusCasino/
├── frontend/                 # React + TypeScript frontend
│   ├── src/
│   │   ├── app/             # Main app components
│   │   ├── components/      # Reusable components
│   │   │   ├── chat/        # Live chat component
│   │   │   └── ui/          # UI components (Radix UI)
│   │   └── lib/             # Utilities and API client
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── backend/                  # Spring Boot backend
│   ├── src/main/java/com/nexus/casino/
│   │   ├── config/          # Configuration classes
│   │   ├── controller/      # REST controllers
│   │   ├── dto/             # Data Transfer Objects
│   │   ├── entity/          # JPA entities
│   │   ├── repository/      # JPA repositories
│   │   ├── security/        # JWT security
│   │   ├── service/         # Business logic
│   │   └── websocket/       # WebSocket handlers
│   ├── src/main/resources/
│   │   └── application.yml  # Application configuration
│   ├── pom.xml
│   └── Dockerfile
│
├── docker-compose.yml        # Docker Compose configuration
└── README.md
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
  ```json
  {
    "username": "player1",
    "email": "player@example.com",
    "password": "password123"
  }
  ```
- `POST /api/auth/login` - Login user
  ```json
  {
    "email": "player@example.com",
    "password": "password123"
  }
  ```
- `GET /api/auth/me` - Get current user (requires JWT token)
- `POST /api/auth/password-reset/request` - Request password reset
- `POST /api/auth/password-reset/confirm` - Confirm password reset with token

### Games
- `POST /api/games/play` - Play a game (requires auth)
  ```json
  {
    "gameType": "slots",
    "bet": 10.00
  }
  ```
- `GET /api/games/history` - Get game history (requires auth)
- `DELETE /api/games/history` - Clear game history (requires auth)

### Users
- `GET /api/users/balance` - Get user balance (requires auth)
- `PUT /api/users/balance` - Update balance (requires auth)
  ```json
  {
    "amount": 500.00
  }
  ```
- `POST /api/users/balance/reset` - Reset balance to $1000 (requires auth)

### WebSocket
- Connect to: `ws://localhost:8080/ws?token=<JWT_TOKEN>`
- Send messages:
  ```json
  {
    "type": "CHAT_MESSAGE",
    "payload": {
      "message": "Hello everyone!"
    }
  }
  ```

## 🎯 Usage

### Demo Mode
The application runs in demo mode by default. Users start with $1000 virtual currency.

### Authentication
1. Register a new account or login
2. JWT token is stored in localStorage
3. Token is automatically included in API requests
4. WebSocket connection uses token for authentication
5. Use "Forgot Password" to reset your password if needed

### Playing Games
1. Select a game from the tabs (Slots, Roulette, Blackjack, Dice)
2. Set your bet amount
3. Play the game
4. Results are saved to your game history
5. Balance is updated automatically
6. Use "Reset" button to reset balance to $1000 (clears game history)

### Live Chat
1. Click the chat button (bottom right)
2. Messages are broadcast to all connected users
3. System messages notify when users join/leave
4. Chat window appears above all other content

## 🔒 Security

- JWT tokens with configurable expiration
- Password encryption using BCrypt
- CORS configuration for frontend access
- WebSocket authentication via JWT token
- SQL injection protection via JPA

## 🐳 Docker Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DB_NAME=nexus_casino
DB_USER=casino_user
DB_PASSWORD=casino_pass

# JWT
JWT_SECRET=your-256-bit-secret-key-change-this-in-production-minimum-32-characters
JWT_EXPIRATION=86400000

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Frontend
VITE_API_BASE_URL=http://localhost:8080/api
VITE_WS_URL=ws://localhost:8080/ws
```

## 🐛 Troubleshooting

### Backend won't start
- Check PostgreSQL is running
- Verify database credentials in `application.yml`
- Check port 8080 is not in use
- View logs: `docker-compose logs backend`

### Frontend can't connect to backend
- Verify `VITE_API_BASE_URL` in `.env` or environment variables
- Check CORS configuration in backend
- Ensure backend is running on port 8080
- Check browser console for errors

### WebSocket connection fails
- Verify JWT token is valid
- Check `VITE_WS_URL` in environment variables
- Ensure WebSocket handler is configured correctly
- Check backend logs for WebSocket errors

### Database connection issues
- Verify PostgreSQL is running: `docker-compose ps`
- Check connection string in `application.yml`
- Ensure database exists
- View database logs: `docker-compose logs postgres`

### Login/Registration issues
- Check backend logs for authentication errors
- Verify JWT secret is set in environment variables
- Ensure password meets requirements (min 6 characters)
- Check email format is valid

## 📝 Development Notes

- Backend uses Spring Boot 3.2 with Java 17
- Frontend uses React 18 with TypeScript strict mode
- Database schema is auto-generated via JPA
- All game logic is server-side for security
- WebSocket reconnects automatically on disconnect
- Password reset tokens expire after 1 hour
- Currency values are formatted to 2 decimal places

## 🧪 Testing

Testing setup is skipped for now (as per requirements). To add testing later:

- Backend: JUnit 5 + Mockito
- Frontend: Vitest + React Testing Library
- E2E: Playwright or Cypress

## 📄 License

This is a demo project for educational purposes.

## 🤝 Contributing

This is a private project. For questions or issues, please contact the development team.

