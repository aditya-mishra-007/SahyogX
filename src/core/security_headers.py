from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware to inject OWASP-recommended security headers into all HTTP responses.
    Ensures protection against clickjacking, MIME-sniffing, XSS, and insecure transports.
    Permits Swagger UI / OpenAPI docs to load necessary scripts and styles.
    """

    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)

        # Anti-Clickjacking: Disallow rendering in iframes
        response.headers["X-Frame-Options"] = "DENY"

        # Prevent MIME-type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # HTTP Strict Transport Security (HSTS)
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        # Referrer Policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Restrict cross-domain policy files
        response.headers["X-Permitted-Cross-Domain-Policies"] = "none"

        # Content Security Policy (permits Swagger UI CDN assets)
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "img-src 'self' data: https:; "
            "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
            "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
            "font-src 'self' data: https://cdn.jsdelivr.net; "
            "connect-src 'self'"
        )

        return response
