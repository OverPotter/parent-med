"""Запуск API-сервера (uv run python main.py или uvicorn src.main:app --reload)."""

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
