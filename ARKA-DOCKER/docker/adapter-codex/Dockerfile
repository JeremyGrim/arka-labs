FROM python:3.11-slim
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir fastapi uvicorn[standard] requests
WORKDIR /app
COPY ARKA-ADAPTERS/codex /srv/adapter
ENV PYTHONPATH=/srv/adapter
EXPOSE 9093
CMD ["uvicorn","app.main:APP","--host","0.0.0.0","--port","9093"]
