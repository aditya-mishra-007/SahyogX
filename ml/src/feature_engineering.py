"""
SahyogX - Feature Engineering Module

This module constructs domain-informed, behavioral and operational indicators
derived from military wellness research (Army STARRS, DoD HRBS).

Engineered Features:
1. sleep_deficit_hours: Extent of daily sleep shortfall below the 7.5-hour operational minimum.
2. composite_fatigue_index: Multi-factor index combining sleep debt, sleep fragmentation, and long shifts.
3. deployment_to_recovery_ratio: Deployment duration relative to monthly stand-down recovery days.
4. leave_deprivation_index: Long interval without leave scaled against low annual leave utilization.
5. operational_strain_index: Base duty intensity scaled by environmental hardship.
6. protective_buffer_score: Resilience composite of peer cohesion, self-reported wellness, and physical readiness.
7. net_vulnerability_index: Operational strain and fatigue offset by protective buffers.

Why each feature is used:
- Military studies show that cumulative fatigue is non-linear: a soldier with high deployment
  and zero rest days is at exponentially higher risk than either factor alone.
- Peer support operates as a buffer: high cohesion protects against high duty strain.
- Sensitive demographics (race, religion, caste, gender, marital status) are intentionally omitted.
"""

from typing import List
import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin


class OperationalWelfareFeatureEngineer(BaseEstimator, TransformerMixin):
    """
    Scikit-learn compatible transformer that appends derived domain features
    for personnel stress and welfare prediction.
    """

    def __init__(self):
        self.engineered_feature_names_: List[str] = [
            "sleep_deficit_hours",
            "composite_fatigue_index",
            "deployment_to_recovery_ratio",
            "leave_deprivation_index",
            "operational_strain_index",
            "protective_buffer_score",
            "net_vulnerability_index",
        ]

    def fit(self, X: pd.DataFrame, y=None):
        return self

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        """
        Transforms input DataFrame by adding engineered domain features.
        """
        df = X.copy()

        def _get_series(col_name: str, default_val: float) -> pd.Series:
            if col_name in df.columns:
                return df[col_name]
            return pd.Series(default_val, index=df.index, dtype=float)

        duty_hours = _get_series("duty_hours_weekly", 44.0)
        dep_months = _get_series("deployment_duration_months", 2.0)
        days_leave = _get_series("days_since_last_leave", 60.0)
        leave_taken = _get_series("leave_days_taken_annual", 35.0)
        recovery_days = _get_series("recovery_rest_days_monthly", 4.0)
        sleep_hrs = _get_series("avg_sleep_hours", 7.0)
        sleep_disr = _get_series("sleep_disruption_index", 3.0)
        phys_score = _get_series("physical_readiness_score", 75.0)
        wellness_score = _get_series("wellness_survey_score", 18.0)
        peer_score = _get_series("peer_support_score", 3.8)
        hardship_score = _get_series("environmental_hardship_score", 2.0)

        # 1. Sleep deficit hours (Daily shortfall below 7.5h recommended minimum)
        sleep_deficit = np.maximum(0.0, 7.5 - sleep_hrs)

        # 2. Composite Fatigue Index (Sleep debt + Fragmentation + Shift elongation)
        excess_duty = np.maximum(0.0, duty_hours - 48.0)
        fatigue_idx = (
            (sleep_deficit * 1.6)
            + (sleep_disr * 0.75)
            + (excess_duty * 0.12)
        )

        # 3. Deployment to Recovery Ratio (Months of deployment per monthly recovery day)
        safe_recovery = np.maximum(1.0, recovery_days)
        dep_rec_ratio = dep_months / safe_recovery

        # 4. Leave Deprivation Index (Days elapsed since leave normalized by annual leave utilization)
        safe_leave_taken = np.maximum(10.0, leave_taken)
        leave_dep_idx = days_leave / safe_leave_taken

        # 5. Operational Strain Index (Duty load scaled by environmental hardship)
        strain_idx = (duty_hours / 40.0) * (1.0 + 0.12 * (hardship_score - 1.0))

        # 6. Protective Buffer Score (Composite resilience: peer cohesion + wellness + physical fitness)
        cohesion_norm = np.clip((peer_score - 1.0) / 4.0, 0.0, 1.0)
        wellness_norm = np.clip(wellness_score / 30.0, 0.0, 1.0)
        phys_norm = np.clip(phys_score / 100.0, 0.0, 1.0)
        buffer_score = (cohesion_norm * 0.40) + (wellness_norm * 0.35) + (phys_norm * 0.25)

        # 7. Net Vulnerability Index (Strain and Fatigue minus Protective Buffer)
        # Higher positive score = elevated vulnerability
        net_vuln = (0.45 * strain_idx + 0.45 * (fatigue_idx / 5.0)) - (0.80 * buffer_score)

        df["sleep_deficit_hours"] = np.round(sleep_deficit, 2)
        df["composite_fatigue_index"] = np.round(fatigue_idx, 2)
        df["deployment_to_recovery_ratio"] = np.round(dep_rec_ratio, 2)
        df["leave_deprivation_index"] = np.round(leave_dep_idx, 2)
        df["operational_strain_index"] = np.round(strain_idx, 2)
        df["protective_buffer_score"] = np.round(buffer_score, 3)
        df["net_vulnerability_index"] = np.round(net_vuln, 3)

        return df

    def get_feature_names_out(self, input_features=None) -> List[str]:
        if input_features is not None:
            return list(input_features) + self.engineered_feature_names_
        return self.engineered_feature_names_


def add_engineered_features(df: pd.DataFrame) -> pd.DataFrame:
    """Convenience function for non-pipeline DataFrame transformations."""
    transformer = OperationalWelfareFeatureEngineer()
    return transformer.transform(df)
