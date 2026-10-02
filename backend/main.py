from fastapi import FastAPI

app = FastAPI(
    title="AI Business Intelligence Platform",
    description="Backend API for business analytics and AI-powered insights",
    version="1.0.0"
)


@app.get("/")
def root():
    return {
        "message": "AI Business Intelligence Platform API is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }