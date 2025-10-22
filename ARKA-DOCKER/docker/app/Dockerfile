FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends curl build-essential && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir fastapi uvicorn[standard] requests pyyaml psycopg2-binary sqlalchemy

WORKDIR /app
COPY main.py /app/main.py
EXPOSE 8080
