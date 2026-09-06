"""Business logic and service layer package for SahyogX."""
from src.services.auth_service import (
    authenticate_user,
    authenticate_user_async,
    get_user_by_username,
    get_user_by_id,
    get_user_from_db_or_dev,
)
from src.services.personnel_service import (
    create_personnel,
    get_personnel_by_id,
    get_personnel_by_service_number,
    list_personnel,
    update_personnel,
    deactivate_personnel,
)
from src.services.deployment_service import (
    create_deployment,
    get_deployment_by_id,
    list_deployments,
    update_deployment,
)
from src.services.duty_service import (
    create_duty_log,
    get_duty_log_by_id,
    list_duty_logs,
    update_duty_log,
    get_workload_summary,
)
from src.services.leave_service import (
    create_leave_record,
    get_leave_by_id,
    list_leaves,
    update_leave,
)
from src.services.survey_service import (
    create_survey,
    get_survey_by_id,
    list_surveys,
    update_survey,
    get_survey_summary,
)

from src.services.feature_aggregator import aggregate_personnel_features
from src.services.prediction_service import PredictionService, prediction_service
from src.services import alert_service, analytics_service
from src.services.audit_service import log_audit_event, list_audit_logs
from src.services.export_service import (
    generate_unit_csv_export,
    generate_unit_json_export,
    generate_alerts_csv_export,
)

__all__ = [
    "authenticate_user",
    "authenticate_user_async",
    "get_user_by_username",
    "get_user_by_id",
    "get_user_from_db_or_dev",
    "create_personnel",
    "get_personnel_by_id",
    "get_personnel_by_service_number",
    "list_personnel",
    "update_personnel",
    "deactivate_personnel",
    "create_deployment",
    "get_deployment_by_id",
    "list_deployments",
    "update_deployment",
    "create_duty_log",
    "get_duty_log_by_id",
    "list_duty_logs",
    "update_duty_log",
    "get_workload_summary",
    "create_leave_record",
    "get_leave_by_id",
    "list_leaves",
    "update_leave",
    "create_survey",
    "get_survey_by_id",
    "list_surveys",
    "update_survey",
    "get_survey_summary",
    "aggregate_personnel_features",
    "PredictionService",
    "prediction_service",
    "alert_service",
    "analytics_service",
    "log_audit_event",
    "list_audit_logs",
    "generate_unit_csv_export",
    "generate_unit_json_export",
    "generate_alerts_csv_export",
]
