FROM python:3.12-slim

# Hugging Face Spaces runs containers as uid 1000
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    ALLOWED_ORIGINS=https://interactive-ml-kappa.vercel.app,http://localhost:3000
WORKDIR /home/user/app

COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Bake the one dataset that downloads at runtime into the image (no cold-start fetch)
RUN python -c "from sklearn.datasets import fetch_california_housing; fetch_california_housing()"

COPY --chown=user . .

EXPOSE 7860
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-7860}"]
