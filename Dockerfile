FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create a writable directory for the app to store data (if needed)
# Hugging Face Spaces allows writing to /app, but persistent storage requires /data usually.
# For now, we assume standard ephemeral storage is fine or the app handles it.
# We need to make sure the user has permissions.
RUN chmod -R 777 /app

EXPOSE 7860

CMD ["gunicorn", "-b", "0.0.0.0:7860", "app_copy:app"]
