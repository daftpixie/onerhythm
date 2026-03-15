FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# onnxruntime-backed OCR and OpenCV need these runtime libraries
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libgomp1 \
        libglib2.0-0 \
        libgl1 \
        libsm6 \
        libxext6 \
        libxrender1 \
        libxcb1 \
    && rm -rf /var/lib/apt/lists/*

COPY . /app

RUN python -m venv .venv \
    && ./.venv/bin/pip install --upgrade pip \
    && ./.venv/bin/pip install -e .

CMD ["sh", "-lc", "./.venv/bin/python -m uvicorn app.main:app --app-dir . --host 0.0.0.0 --port ${PORT:-8000}"]
