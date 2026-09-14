from typing import Dict, Any, List, Optional
from datetime import datetime

class RiskEngineService:
    @classmethod
    def calculate_risk(
        cls,
        proximity_eval: Dict[str, Any],
        weather_data: Optional[Dict[str, Any]] = None,
        altitude_m: float = 2200.0,
        historical_incidents_count: int = 2,
        is_isolated_area: bool = False
    ) -> Dict[str, Any]:
        """
        Calculates explainable tourist risk score (0-100).
        Formula:
            Location/Zone Proximity Risk (0 - 40)
            Environmental / Weather Risk (0 - 25)
            Terrain / Elevation Risk (0 - 15)
            Historical Incident Frequency (0 - 10)
            Connectivity & Isolation (0 - 10)
        """
        inside_zone = proximity_eval.get("inside_zone")
        nearest_warning_zone = proximity_eval.get("nearest_warning_zone")
        distance_meters = proximity_eval.get("distance_to_danger_meters", 9999.0)

        # 1. Location Risk (0 - 40)
        location_score = 5
        reasons: List[str] = []

        if inside_zone:
            if inside_zone.risk_level == "critical" or inside_zone.is_restricted:
                location_score = 40
                reasons.append(f"Inside CRITICAL restricted hazard zone: {inside_zone.name}.")
            elif inside_zone.risk_level == "high":
                location_score = 32
                reasons.append(f"Inside HIGH hazard zone: {inside_zone.name}.")
            else:
                location_score = 22
                reasons.append(f"Inside designated caution area: {inside_zone.name}.")
        elif nearest_warning_zone:
            if distance_meters <= 100:
                location_score = 28
                reasons.append(f"Within 100m of dangerous zone ({nearest_warning_zone.name}).")
            elif distance_meters <= 250:
                location_score = 18
                reasons.append(f"Approaching hazard boundary ({int(distance_meters)}m from {nearest_warning_zone.name}).")
            else:
                location_score = 10
                reasons.append("Bordering advisory buffer zone.")
        else:
            reasons.append("Positioned within verified safe tourist corridor.")

        # 2. Environmental & Weather Risk (0 - 25)
        env_score = 5
        rainfall_mm = 0.0
        wind_kmh = 10.0
        if weather_data:
            rainfall_mm = weather_data.get("rainfall_mm", 0.0)
            wind_kmh = weather_data.get("wind_speed_kmh", 10.0)

        if rainfall_mm > 35.0:
            env_score = 25
            reasons.append(f"Torrential rainfall ({rainfall_mm:.1f} mm/hr) substantially elevates landslide/slip risk.")
        elif rainfall_mm > 15.0:
            env_score = 18
            reasons.append(f"Moderate to heavy rain ({rainfall_mm:.1f} mm/hr) causing slippery surface runoff.")
        elif rainfall_mm > 2.0:
            env_score = 10
            reasons.append("Light precipitation reported in Nilgiris ghats.")
        else:
            if wind_kmh > 45.0:
                env_score = 12
                reasons.append(f"High gusts ({wind_kmh} km/h) on exposed ridges.")
            else:
                env_score = 3

        # 3. Terrain & Elevation Risk (0 - 15)
        terrain_score = 4
        if altitude_m > 2400.0:
            terrain_score = 14
            reasons.append(f"High altitude mountain ridge ({int(altitude_m)}m) subject to rapid mist and temperature plunge.")
        elif altitude_m > 2000.0:
            terrain_score = 8
            reasons.append("Steep mountain gradient terrain.")
        else:
            terrain_score = 4

        # 4. Historical Incident Frequency (0 - 10)
        hist_score = min(historical_incidents_count * 3, 10)
        if hist_score >= 6:
            reasons.append(f"Sector has {historical_incidents_count} documented rescue operations in past 90 days.")

        # 5. Connectivity & Isolation (0 - 10)
        hour = datetime.utcnow().hour + 5.5  # Approximate IST
        temporal_isolated = hour > 18 or hour < 6
        conn_score = 2
        if is_isolated_area:
            conn_score += 5
            reasons.append("Intermittent or degraded cellular connectivity in deep valley.")
        if temporal_isolated:
            conn_score += 3
            reasons.append("Nightfall reduces visibility and emergency response transit speed.")

        total_score = min(location_score + env_score + terrain_score + hist_score + conn_score, 100)

        if total_score <= 25:
            category = "SAFE"
            action_advisory = "Enjoy your visit. Keep within marked tourist trails and monitor battery status."
        elif total_score <= 50:
            category = "CAUTION"
            action_advisory = "Stay on main roadways. Avoid venturing close to steep valley edges or water streams."
        elif total_score <= 75:
            category = "HIGH"
            action_advisory = "Caution: Turn back towards safe shelter. Maintain regular communication with emergency contacts."
        else:
            category = "CRITICAL"
            action_advisory = "DANGER: Move immediately away from slopes and drainage ravines. Prepare to trigger Emergency SOS."

        explanation = " ".join(reasons)

        return {
            "total_score": total_score,
            "category": category,
            "factors": {
                "location_proximity_score": location_score,
                "environmental_weather_score": env_score,
                "terrain_elevation_score": terrain_score,
                "historical_frequency_score": hist_score,
                "connectivity_isolation_score": conn_score
            },
            "explanation": explanation,
            "action_advisory": action_advisory
        }

risk_service = RiskEngineService()
