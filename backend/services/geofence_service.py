import json
import math
from typing import List, Tuple, Dict, Any, Optional

class GeofenceService:
    @staticmethod
    def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate great-circle distance between two points in meters."""
        R = 6371000.0  # Earth radius in meters
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)

        a = (math.sin(delta_phi / 2.0) ** 2 +
             math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2))
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return R * c

    @staticmethod
    def point_in_polygon(point_lat: float, point_lng: float, polygon_coords: List[List[float]]) -> bool:
        """
        Ray-casting algorithm to determine if a point is inside a polygon.
        polygon_coords is expected to be a list of [lat, lng] or [lng, lat] pairs.
        Standardizing here to [lat, lng].
        """
        num_vertices = len(polygon_coords)
        if num_vertices < 3:
            return False

        inside = False
        p1_lat, p1_lng = polygon_coords[0][0], polygon_coords[0][1]

        for i in range(1, num_vertices + 1):
            p2_lat, p2_lng = polygon_coords[i % num_vertices][0], polygon_coords[i % num_vertices][1]
            if point_lng > min(p1_lng, p2_lng):
                if point_lng <= max(p1_lng, p2_lng):
                    if point_lat <= max(p1_lat, p2_lat):
                        if p1_lng != p2_lng:
                            x_inters = (point_lng - p1_lng) * (p2_lat - p1_lat) / (p2_lng - p1_lng) + p1_lat
                            if p1_lat == p2_lat or point_lat <= x_inters:
                                inside = not inside
            p1_lat, p1_lng = p2_lat, p2_lng

        return inside

    @classmethod
    def min_distance_to_polygon_meters(cls, point_lat: float, point_lng: float, polygon_coords: List[List[float]]) -> float:
        """Calculate minimum distance in meters from a point to polygon perimeter vertices."""
        if not polygon_coords:
            return float('inf')
        min_dist = float('inf')
        for vertex in polygon_coords:
            dist = cls.haversine_distance_meters(point_lat, point_lng, vertex[0], vertex[1])
            if dist < min_dist:
                min_dist = dist
        return min_dist

    @classmethod
    def evaluate_location(cls, point_lat: float, point_lng: float, zones: List[Any]) -> Dict[str, Any]:
        """
        Evaluates a point against a list of RiskZone models.
        Returns:
            - inside_zone: RiskZone if inside, else None
            - nearest_warning_zone: RiskZone if within warning distance
            - min_distance_meters: distance to nearest danger
            - alert_severity: None, "warning", "critical"
            - instructions: safety guidance text
        """
        inside_zone = None
        nearest_warning_zone = None
        min_distance = float('inf')

        for zone in zones:
            coords = []
            try:
                coords = json.loads(zone.coordinates_json)
            except Exception:
                continue

            if zone.geometry_type == "circle":
                # Circle zone: coords is [center_lat, center_lng]
                center_lat, center_lng = coords[0], coords[1]
                dist = cls.haversine_distance_meters(point_lat, point_lng, center_lat, center_lng)
                effective_radius = zone.radius_meters or 200.0

                if dist <= effective_radius:
                    inside_zone = zone
                    min_distance = 0.0
                    break
                else:
                    dist_to_edge = dist - effective_radius
                    if dist_to_edge < min_distance:
                        min_distance = dist_to_edge
                    if dist_to_edge <= zone.warning_distance_meters:
                        nearest_warning_zone = zone

            elif zone.geometry_type == "polygon":
                is_inside = cls.point_in_polygon(point_lat, point_lng, coords)
                if is_inside:
                    inside_zone = zone
                    min_distance = 0.0
                    break
                else:
                    dist = cls.min_distance_to_polygon_meters(point_lat, point_lng, coords)
                    if dist < min_distance:
                        min_distance = dist
                    if dist <= zone.warning_distance_meters:
                        nearest_warning_zone = zone

        if inside_zone:
            severity = "critical" if (inside_zone.risk_level == "critical" or inside_zone.is_restricted) else "warning"
            return {
                "inside_zone": inside_zone,
                "nearest_warning_zone": inside_zone,
                "distance_to_danger_meters": 0.0,
                "alert_severity": severity,
                "instructions": inside_zone.safety_instructions or f"You have entered {inside_zone.name}. Please exercise extreme caution or evacuate immediately."
            }

        if nearest_warning_zone:
            return {
                "inside_zone": None,
                "nearest_warning_zone": nearest_warning_zone,
                "distance_to_danger_meters": round(min_distance, 1),
                "alert_severity": "warning",
                "instructions": f"Warning: Approaching {nearest_warning_zone.name} (~{int(min_distance)}m). {nearest_warning_zone.safety_instructions or 'Prepare to divert route.'}"
            }

        return {
            "inside_zone": None,
            "nearest_warning_zone": None,
            "distance_to_danger_meters": round(min_distance if min_distance != float('inf') else 9999.0, 1),
            "alert_severity": None,
            "instructions": "All clear. You are currently in a designated safe corridor."
        }

geofence_service = GeofenceService()
