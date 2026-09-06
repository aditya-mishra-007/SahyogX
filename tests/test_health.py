import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_root_health_check(async_client: AsyncClient):
    """Verify that GET /health returns 200 with service information."""
    response = await async_client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "SahyogX Backend"


@pytest.mark.asyncio
async def test_api_health_check(async_client: AsyncClient):
    """Verify that GET /api/health returns operational status."""
    response = await async_client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["service"] == "SahyogX Backend"
    assert "services" in data
    assert data["services"]["api"] == "operational"
    assert "database" in data["services"]


@pytest.mark.asyncio
async def test_v1_health_check(async_client: AsyncClient):
    """Verify that GET /api/v1/health returns 200 and operational status."""
    response = await async_client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["status"] in ["healthy", "degraded"]
    assert data["service"] == "SahyogX Backend"


@pytest.mark.asyncio
async def test_root_discovery(async_client: AsyncClient):
    """Verify application discovery root endpoint."""
    response = await async_client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "SahyogX Backend API"
    assert data["docs_url"] == "/docs"
    assert data["health_check"] == "/health"
