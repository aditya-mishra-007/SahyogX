"""
Security and Operational Audit Service for SahyogX Phase 5.
Maintains an immutable append-only record of security-critical actions,
data exports, authentication events, and alert operations.
"""

from datetime import datetime, timezone
import json
import logging
from typing import Any, Dict, List, Optional, Tuple, Union
import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.audit import AuditLog

logger = logging.getLogger("sahyogx.audit_service")

# Keywords that must be masked to prevent credential or secret leakage into audit logs
SENSITIVE_AUDIT_KEYS = {
    "password",
    "password_hash",
    "token",
    "access_token",
    "secret",
    "secret_key",
    "authorization",
    "credential",
    "api_key",
}


def _sanitize_details(details: Optional[Union[str, Dict[str, Any]]]) -> Optional[str]:
    """
    Sanitizes dictionary or string detail payloads to remove credentials,
    tokens, or passwords prior to persistence.
    """
    if details is None:
        return None

    if isinstance(details, dict):
        sanitized = {}
        for k, v in details.items():
            if any(s in k.lower() for s in SENSITIVE_AUDIT_KEYS):
                sanitized[k] = "[REDACTED]"
            elif isinstance(v, dict):
                sanitized[k] = json.loads(_sanitize_details(v) or "{}")
            else:
                sanitized[k] = v
        return json.dumps(sanitized, default=str)

    # If it's a string, ensure it doesn't exceed maximum storage limits
    clean_str = str(details).strip()
    if len(clean_str) > 2048:
        clean_str = clean_str[:2045] + "..."
    return clean_str


async def log_audit_event(
    db: AsyncSession,
    action: str,
    user_id: Optional[str] = None,
    user_role: Optional[str] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[Union[str, int]] = None,
    ip_address: Optional[str] = None,
    details: Optional[Union[str, Dict[str, Any]]] = None,
) -> Optional[AuditLog]:
    """
    Safely records an audit log entry.
    Exceptions are suppressed to guarantee audit logging cannot break primary user requests.
    """
    try:
        sanitized_details = _sanitize_details(details)

        audit_entry = AuditLog(
            id=str(uuid.uuid4()),
            user_id=user_id,
            user_role=user_role,
            action=action.upper(),
            resource_type=resource_type.upper() if resource_type else None,
            resource_id=str(resource_id) if resource_id is not None else None,
            ip_address=ip_address,
            details=sanitized_details,
            created_at=datetime.now(timezone.utc),
        )

        db.add(audit_entry)
        await db.commit()
        await db.refresh(audit_entry)
        return audit_entry
    except Exception as exc:
        logger.warning(f"Audit log recording failed: {exc}", exc_info=False)
        return None


async def list_audit_logs(
    db: AsyncSession,
    user_id: Optional[str] = None,
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    page: int = 1,
    page_size: int = 50,
) -> Tuple[int, List[AuditLog]]:
    """
    Retrieves filtered, paginated audit log events ordered by timestamp descending.
    Restricted to authorized COMMANDER roles.
    """
    query = select(AuditLog)

    if user_id:
        query = query.where(AuditLog.user_id == user_id)
    if action:
        query = query.where(AuditLog.action == action.upper())
    if resource_type:
        query = query.where(AuditLog.resource_type == resource_type.upper())
    if start_time:
        query = query.where(AuditLog.created_at >= start_time)
    if end_time:
        query = query.where(AuditLog.created_at <= end_time)

    # Calculate total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    # Pagination & Ordering
    safe_page = max(1, page)
    safe_page_size = min(max(1, page_size), 200)
    offset = (safe_page - 1) * safe_page_size

    query = query.order_by(AuditLog.created_at.desc()).offset(offset).limit(safe_page_size)
    result = await db.execute(query)
    items = list(result.scalars().all())

    return total, items
