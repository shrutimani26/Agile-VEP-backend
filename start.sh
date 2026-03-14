#!/bin/bash

# Set environment variables
export FLASK_APP=app
export PYTHONPATH=.
export FLASK_DEBUG=1
export FLASK_ENV="development"

# Run Flask development server
flask run --host=0.0.0.0