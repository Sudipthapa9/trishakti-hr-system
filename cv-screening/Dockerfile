# Use a small Python runtime for the standalone screening API.
FROM python:3.12-slim

# Avoid Python bytecode files and flush logs immediately inside the container.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Keep application files under a predictable container working directory.
WORKDIR /app

# Copy only the required build inputs into the image.
COPY requirements.txt .
# Install the declared dependencies without keeping a pip download cache.
RUN pip install --no-cache-dir -r requirements.txt

# Copy only the required build inputs into the image.
COPY app.py .

# Run the screening process as an unprivileged account.
USER nobody

# Document the internal API port; Compose controls actual host publishing.
EXPOSE 8000

# Start the FastAPI application through Uvicorn inside the container.
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
