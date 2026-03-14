#!/bin/sh
set -e

echo "Running database migrations..."
flask db upgrade

echo "Seeding database..."
python seed.py

echo "Starting Flask server..."
exec python run.py