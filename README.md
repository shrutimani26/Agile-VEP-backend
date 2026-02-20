# Vehicle Backend - Authentication API

A secure Flask-based REST API for user authentication inspired by .NET Core Identity, featuring JWT access tokens, database-managed refresh tokens, and HTTP-only cookie storage.

## Features

- ✅ User registration with email validation
- ✅ User login with JWT access tokens (1 hour expiry)
- ✅ Refresh token stored in secure HTTP-only cookies (7 days)
- ✅ Password hashing with bcrypt
- ✅ Protected endpoints with JWT authentication
- ✅ Refresh token revocation on logout
- ✅ Database-managed refresh token storage (prevents reuse)
- ✅ CORS support for frontend integration
- ✅ PostgreSQL database with SQLAlchemy ORM
- ✅ Database migrations with Flask-Migrate
- ✅ Environment-based configuration (dev/prod)

---

## System Requirements

- Python 3.8+
- PostgreSQL 12+ (or SQLite for development)
- pip and virtualenv

### Platform-Specific Setup

**macOS:**
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Python 3 and PostgreSQL
brew install python@3.11
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15
```

**Linux (Ubuntu/Debian):**
```bash
# Install Python and PostgreSQL
sudo apt-get update
sudo apt-get install python3.11 python3.11-venv postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
```

**Windows:**
- Download and install Python from https://www.python.org
- Download and install PostgreSQL from https://www.postgresql.org/download/windows/
- Start PostgreSQL from Services (services.msc)

---

## Quick Start

### 1. Clone and Setup Virtual Environment

```bash
# Navigate to project directory
cd vehicle_backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your settings
# On macOS/Linux:
nano .env  # or use: vim .env, code .env, etc.

# On Windows:
notepad .env  # or use your preferred editor
```

**Required `.env` variables:**

```env
# Flask Configuration
FLASK_APP=app
FLASK_ENV=development
SECRET_KEY=your-random-secret-key-change-in-production

# Database (PostgreSQL)
DATABASE_URL=postgresql://youruser:yourpassword@192.168.1.98:5432/vehicle_uat_db

# JWT Configuration
JWT_SECRET_KEY=your-jwt-secret-key-change-in-production (can be anything)
JWT_ACCESS_TOKEN_EXPIRES=3600

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080
```

### 4. Setup Database

**For PostgreSQL on macOS:**

```bash
# Create database
createdb vehicle_uat_db

# Verify PostgreSQL is running
pg_isready

# Connect to PostgreSQL (optional - to verify)
psql -U postgres -d vehicle_uat_db
```

**For PostgreSQL on Linux:**

```bash
# Connect as postgres user
sudo -u postgres psql

# Inside psql shell:
CREATE DATABASE vehicle_uat_db;
\q  # Exit psql
```

**For PostgreSQL on Windows:**

Ensure:
- PostgreSQL is running (check Services)
- Database `vehicle_uat_db` exists (create via pgAdmin if needed)
- User `postgres` can connect with the password in `.env`

**For all platforms - Run migrations:**

```bash
# Make sure virtual environment is activated
# macOS/Linux:
source venv/bin/activate

# Windows:
venv\Scripts\activate

# Then run migrations
flask db migrate -m "Initial migration - users table"
flask db upgrade
```

### 5. Run the Application

**Option 1: Using start.sh script (macOS/Linux)**

```bash
# Make start.sh executable (first time only)
chmod +x start.sh

# Run the script
./start.sh
```


---

## API Documentation

All endpoints are prefixed with `/api/v1/auth`

### Authentication Endpoints

1. **POST /register** - Register new user
2. **POST /login** - Login and get access token
3. **POST /refresh-token** - Refresh access token  
4. **GET /me** - Get current user profile (requires token)
5. **POST /logout** - Logout and revoke all refresh tokens (requires token)

---

## Authentication Endpoints

All endpoints return JSON responses with appropriate HTTP status codes.

### 1. Register User

**Endpoint:** `POST /api/v1/auth/register`

**Postman Example:**
```
Method: POST
URL: http://localhost:5000/api/v1/auth/register
Headers: Content-Type: application/json
Body (raw JSON):
{
  "email": "user@example.com",
  "password": "securepassword123",
  "full_name": "John Doe",
  "phone_number": "+6591234567",
  "nric_passport": "S1234567A"
}
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "full_name": "John Doe",
  "phone_number": "+6591234567",        // Optional
  "nric_passport": "S1234567A"          // Optional
}
```

**Response (201 - Created):**
```json
{
  "message": "Registration successful"
}
```

**Status Codes:**
- `201` - User registered successfully
- `400` - Invalid input or missing required fields
- `409` - Email already registered
- `500` - Server error

**Validation Rules:**
- Email must be valid format
- Password must be at least 8 characters
- Email must be unique

---

### 2. Login User

**Endpoint:** `POST /api/v1/auth/login`

**Postman Example:**
```
Method: POST
URL: http://localhost:5000/api/v1/auth/login
Headers: Content-Type: application/json
Body (raw JSON):
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200 - OK):**
```json
{
  "message": "Login successful",
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "phone_number": "+6591234567",
    "is_verified": false,
    "created_at": "2026-01-30T10:30:00"
  }
}
```

**Cookies Set:**
- `refreshToken` (HTTP-only, SameSite=Strict, expires in 7 days)

**Status Codes:**
- `200` - Login successful
- `400` - Missing email or password
- `401` - Invalid email or password
- `403` - Account is disabled

**Security Features:**
- Password verified with bcrypt (12 rounds)
- Refresh token stored in HTTP-only cookie (not accessible via JavaScript)
- Prevents XSS attacks
- CSRF protection via SameSite=Strict cookie attribute
- Refresh token stored in database for revocation support

---

### 3. Get Current User Profile

**Endpoint:** `GET /api/v1/auth/me`

**Postman Example:**
```
Method: GET
URL: http://localhost:5000/api/v1/auth/me
Headers:
  - Authorization: Bearer <your_token_here>
```

**Response (200 - OK):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "phone_number": "+6591234567",
    "is_verified": false,
    "created_at": "2026-01-30T10:30:00"
  }
}
```

**Status Codes:**
- `200` - User profile retrieved
- `401` - Unauthorized (invalid/missing token)
- `404` - User not found

**Authentication:**
- Required: Bearer token in `Authorization` header
- Token obtained from login response

---

### 4. Refresh Access Token

**Endpoint:** `POST /api/v1/auth/refresh-token`

**Postman Example:**
```
Method: POST
URL: http://localhost:5000/api/v1/auth/refresh-token
Headers: 
  - Content-Type: application/json
Note: Postman automatically sends cookies
```

**Note:** The refresh token is automatically sent in the HTTP-only cookie. No manual header needed.

**Response (200 - OK):**
```json
{
  "message": "Token refreshed successfully",
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Cookies Updated:**
- `refreshToken` - New refresh token set (expires in 7 days)

**Status Codes:**
- `200` - Token refreshed successfully
- `401` - Invalid or expired refresh token
- `500` - Server error

**How It Works:**
1. Client sends POST request with refresh token in cookie
2. Server validates refresh token in database
3. Server revokes old refresh token
4. Server creates new access token and refresh token
5. New refresh token set in cookie response

---

### 5. Logout User

**Endpoint:** `POST /api/v1/auth/logout`

**Postman Example:**
```
Method: POST
URL: http://localhost:5000/api/v1/auth/logout
Headers:
  - Authorization: Bearer <your_token_here>
```

**Response (200 - OK):**
```json
{
  "message": "Logged out successfully"
}
```

**Status Codes:**
- `200` - Logout successful
- `401` - Unauthorized (invalid/missing token)
- `404` - User not found

**What Happens:**
- All refresh tokens for user are revoked in database
- Refresh token cookie is deleted
- Access token becomes invalid
- User must login again to get new tokens

---

## Architecture Overview

This API follows a .NET Core Identity-inspired architecture:

### Components

1. **TokenProvider Service** (`app/services/token_provider.py`)
   - Creates JWT access tokens (1 hour expiry)
   - Manages refresh tokens in database
   - Validates and revokes refresh tokens
   - Equivalent to .NET's `TokenService`

2. **User Model** (`app/models/user.py`)
   - Core user data (email, password_hash, profile info)
   - Relationship to refresh tokens
   - to_dict() for serialization

3. **RefreshToken Model** (`app/models/user.py`)
   - Stores refresh tokens in database
   - Tracks expiration and revocation status
   - One-to-many relationship with User
   - Enables token revocation support

4. **Authentication Routes** (`app/api/v1/auth.py`)
   - Register, Login, Refresh, Logout endpoints
   - Leverages TokenProvider for token management
   - HTTP-only cookie handling
   - Comprehensive error handling

### Token Flow

```
1. User registers → User created in DB
2. User logs in → 
   - Access token (JWT, 1hr, in response body)
   - Refresh token (random string, 7 days, in DB + cookie)
3. User accesses protected resource →
   - Include access token in Authorization header
4. Access token expires →
   - POST /refresh-token with refresh token cookie
   - New access token generated
   - New refresh token generated
5. User logs out →
   - All refresh tokens revoked in database
   - Cookie deleted
```

---

## Project Structure

```
vehicle_backend/
├── app/
│   ├── __init__.py              # Flask app factory, Swagger UI setup
│   ├── config.py                # Configuration classes (dev/prod)
│   ├── extensions.py            # Flask extensions (DB, JWT, Bcrypt, etc.)
│   ├── models/
│   │   ├── __init__.py
│   │   └── user.py              # User database model
│   └── api/
│       ├── __init__.py
│       └── v1/
│           ├── __init__.py      # Blueprint registration
│           └── auth.py          # Authentication endpoints
├── migrations/                  # Database migration scripts
├── .env                         # Environment variables (not in git)
├── .env.example                 # Example environment template
├── .flaskenv                    # Flask CLI environment variables
├── .gitignore
├── requirements.txt             # Python dependencies
├── swagger.json                 # Swagger/OpenAPI specification
├── start.sh                     # Startup script
├── run.py                       # Alternative startup script
└── README.md                    # This file
```

---

## Environment Configuration

### Configuration Hierarchy

1. **Base Config** (`config.py` - `Config` class)
   - Applied to all environments
   - JWT settings, CORS configuration

2. **Development Config** (`DevelopmentConfig`)
   - `DEBUG = True`
   - SQL logging enabled
   - Swagger UI available

3. **Production Config** (`ProductionConfig`)
   - `DEBUG = False`
   - SQL logging disabled
   - Swagger UI disabled
   - Requires `DATABASE_URL` in environment

### JWT Configuration

```python
JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hour
JWT_REFRESH_TOKEN_EXPIRES = 30 days
JWT_TOKEN_LOCATION = ['headers', 'cookies']
JWT_COOKIE_SECURE = True         # HTTPS only
JWT_COOKIE_HTTPONLY = True       # JS cannot access
JWT_COOKIE_SAMESITE = 'Lax'      # CSRF protection
```

---

## Common Issues

### Issue: Database Connection Error

**Error:** `connection to server at "192.168.1.98", port 5432 failed`

**Solutions:**
1. Ensure PostgreSQL is running on Windows
2. Check PostgreSQL configuration:
   - `listen_addresses = '*'` in postgresql.conf
   - Add firewall rule for port 5432
   - Update `pg_hba.conf` to allow remote connections
3. Verify DATABASE_URL in .env is correct
4. Test connection: `psql -U postgres -h 192.168.1.98`

### Issue: "ModuleNotFoundError: No module named 'psycopg2'"

**Solution:**
```bash
# Activate virtual environment first
source venv/bin/activate
│   ├── config.py                # Configuration classes (dev/prod)
│   ├── extensions.py            # Flask extensions (DB, JWT, Bcrypt, etc.)
│   ├── models/
│   │   ├── __init__.py
│   │   └── user.py              # User and RefreshToken models
│   ├── services/
│   │   ├── __init__.py
│   │   └── token_provider.py    # TokenProvider service (equivalent to .NET)
│   └── api/
│       ├── __init__.py
│       └── v1/
│           ├── __init__.py      # Blueprint registration
│           └── auth.py          # Authentication endpoints
├── migrations/                  # Database migration scripts
├── .env                         # Environment variables (not in git)
├── .env.example                 # Example environment template
├── .flaskenv                    # Flask CLI environment variables
├── .gitignore
├── requirements.txt             # Python dependencies
4. Check token wasn't modified

### Issue: Swagger UI not accessible at /api/docs

**Causes:**
1. Running in production mode: Set `FLASK_ENV=development`
2. Flask app not reloaded: Restart the server
3. Check if error in app initialization

---

## Database Schema

### Users Table

```sql,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    nric_passport VARCHAR(20) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX(email)
);
```

### Refresh Tokens Table

```sql
CREATE TABLE refresh_tokens (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL FOREIGN KEY references users(id),
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Why database-backed refresh tokens?**
- Token revocation support (logout invalidates all tokens)
- Token reuse detection (security feature)
- Audit trail (track when tokens created/revoked)
- .NET Identity pattern compatibility_ACCESS_TOKEN_EXPIRES = 3600  # 1 hour
JWT_REFRESH_TOKEN_EXPIRES = 604800  # 7 days (via database)
JWT_TOKEN_LOCATION = ['headers']  # Access token in Authorization header
JWT_HEADER_NAME = 'Authorization'
JWT_HEADER_TYPE = 'Bearer'
JWT_COOKIE_SECURE = False  # True in production (HTTPS)
JWT_COOKIE_HTTPONLY = True  # Cannot access via JavaScript
JWT_COOKIE_SAMESITE = 'Strict'  # CSRF protection
```

**Note:** 
- Access tokens are JWT tokens stored in memory/localStorage (1 hour)
- Refresh tokens are random strings stored in database and HTTP-only cookies (7 days)
- Refresh tokens in database enable revocation and logout functionalitySecurity Considerations

### Password Security
- ✅ Hashed with bcrypt (12 rounds)
- ✅ Minimum 8 characters required
- ✅ Never stored or logged in plain text

### Token Security
- ✅ JWT tokens signed with secret key
- ✅ Access token expires in 1 hour
- ✅ Refresh token expires in 30 days
- ✅ Refresh token stored in HTTP-only cookie
- ✅ Cannot be accessed by JavaScript (prevents XSS)

### Communication Security
- ✅ HTTPS required for production (JWT_COOKIE_SECURE=True)
- ✅ CSRF protection via SameSite=Lax
- ✅ CORS enabled only for specified origins

### Data Protection
- ✅ Email and NRIC/Passport are unique (no duplicates)
- ✅ Account can be disabled (is_active flag)
- ✅ User verification tracking (is_verified flag)
- ✅ Timestamps for audit trail

---

## Performance Tips

1. **Database Indexing**
   - Email column is indexed for faster lookups
   - Unique constraints prevent duplicate entries

2. **Token Caching**
   - Access tokens are short-lived (1 hour)
   - Consider caching user data to reduce DB queries

3. **CORS Optimization**
   - Only allow necessary origins in CORS config
   - Reduces unnecessary preflight requests

---

## Deployment

### Production Checklist

Before deploying to production:

- [ ] Change all secrets in `.env` (SECRET_KEY, JWT_SECRET_KEY)
- [ ] Set `FLASK_ENV=production`
- [ ] Enable HTTPS (JWT_COOKIE_SECURE=True)
- [ ] Use strong, random SECRET_KEY (min 32 chars)
- [ ] Configure proper database with backups
- [ ] Enable error logging and monitoring
- [ ] Test all endpoints thoroughly
- [ ] Set up rate limiting
- [ ] Configure CORS for frontend domain only
- [ ] Use environment-based configuration

### Heroku Deployment Example

```bash
# Create Procfile
echo "web: gunicorn run:app" > Procfile

# Create runtime.txt
echo "python-3.11.0" > runtime.txt

# Deploy
git push heroku main
```

---

## Next Steps & Future Features

- [ ] Email verification workflow
- [ ] Password reset functionality
- [ ] Two-factor authentication (2FA)
- [ ] OAuth2/Social login integration
- [ ] Token blacklisting with Redis
- [ ] Rate limiting (Flask-Limiter)
- [ ] Audit logging
- [ ] User profile update endpoint
- [ ] Admin dashboard
- [ ] Unit and integration tests

---

## Troubleshooting

### Enable Debug Logging

**macOS/Linux:**
```bash
export FLASK_DEBUG=1
export FLASK_ENV=development
flask run
```

**Windows (Command Prompt):**
```cmd
set FLASK_DEBUG=1
set FLASK_ENV=development
flask run
```

**Windows (PowerShell):**
```powershell
$env:FLASK_DEBUG="1"
$env:FLASK_ENV="development"
flask run
```

### Check Flask App

```bash
# Verify app structure
python -c "from app import create_app; app = create_app(); print(app.url_map)"
```

### Test Database Connection

```bash
python -c "from app import create_app, db; app = create_app(); with app.app_context(): db.create_all(); print('DB OK')"
```

---

## Support & Documentation

- **Flask-JWT-Extended Docs**: https://flask-jwt-extended.readthedocs.io/
- **Flask Documentation**: https://flask.palletsprojects.com/
- **SQLAlchemy ORM**: https://docs.sqlalchemy.org/
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

---

## License

MIT License - See LICENSE file for details

---

## Version History

- **v1.0.0** (2024-01-15)
  - Initial release
  - User registration and login
  - JWT authentication with cookie storage
  - Swagger UI API documentation
  - PostgreSQL database integration
