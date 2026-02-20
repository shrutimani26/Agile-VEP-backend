# Docker Setup Guide

## Prerequisites
- Docker and Docker Compose installed on your system

## Quick Start

### 1. Copy environment file
```bash
cp .env.example .env
```

### 2. Customize environment variables
Edit `.env` to match your configuration:
```bash
# Change these in production
SECRET_KEY=your-secure-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here
POSTGRES_PASSWORD=your-secure-password-here
ALLOWED_ORIGINS=http://localhost:3000
```

### 3. Build and run containers
```bash
docker-compose up --build
```

This will:
- Build the Flask application Docker image
- Start a PostgreSQL database container
- Run database migrations automatically
- Start the Flask application

### 4. Access the application
- API: http://localhost:5000
- Database: localhost:5432

## Useful Commands

### View logs
```bash
docker-compose logs -f web
docker-compose logs -f db
```

### Run database migrations manually
```bash
docker-compose exec web flask db upgrade
docker-compose exec web flask db migrate -m "Description"
```

### Access database CLI
```bash
docker-compose exec db psql -U postgres -d vehicle_passport_dev
```

### Stop containers
```bash
docker-compose down
```

### Remove everything (including volumes)
```bash
docker-compose down -v
```

## Production Deployment

For production deployment:

1. Update `.env` with production values:
   - Change `FLASK_ENV=production`
   - Use strong SECRET_KEY and JWT_SECRET_KEY
   - Use strong POSTGRES_PASSWORD
   - Update ALLOWED_ORIGINS to your frontend domain

2. Update Dockerfile for production:
   - Remove `CMD ["python", "run.py"]` debug configuration
   - Consider using a production WSGI server like Gunicorn:
   
```dockerfile
RUN pip install gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "run:app"]
```

3. Use a reverse proxy like Nginx in front of the Flask app

4. Enable HTTPS/SSL
