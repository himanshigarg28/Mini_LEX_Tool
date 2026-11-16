FROM python:3.12-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends g++ && rm -rf /var/lib/apt/lists/*
COPY . .
RUN g++ -std=c++17 -O2 main.cpp -o mini_lex && pip install --no-cache-dir -r requirements.txt
ENV PORT=10000
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-10000} app:app"]
