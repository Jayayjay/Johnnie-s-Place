"""Runtime road-distance lookup + delivery quote.

Loads the precomputed artifact built by `manage.py build_delivery_graph` (node
coordinates + road distance from the bar) and answers two things fast, per request:
  - road_distance_km(lat, lng): snap the drop-off to the nearest road node and return
    its precomputed road distance from the bar (or None if off the serviceable network).
  - quote(subtotal, lat, lng): the full eligibility + fee decision for checkout.

Only numpy is needed here (no scipy/pyrosm/networkx), to keep the serverless runtime small.
"""
import math
import pickle
from pathlib import Path

import numpy as np
from django.conf import settings

from . import pricing

ARTIFACT = Path(settings.BASE_DIR) / "delivery" / "data" / "delivery_graph.pkl"

# A drop-off farther than this from any known road node is treated as off-network
# (ocean, unmapped track, mainland) → not serviceable.
SNAP_MAX_KM = 2.0
EARTH_KM = 6371.0


def _haversine_km(lat1, lon1, lat2, lon2):
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * EARTH_KM * math.asin(math.sqrt(a))


class RoadGraph:
    """Lazy singleton wrapping the precomputed artifact. Nearest-node lookup is a
    vectorised numpy argmin over ~22k points — fast enough per request and keeps the
    runtime dependency-light (numpy only, no scipy)."""

    _instance = None

    def __init__(self):
        with ARTIFACT.open("rb") as fh:
            data = pickle.load(fh)
        self.node_lon = np.ascontiguousarray(data["node_xy"][:, 0])
        self.node_lat = np.ascontiguousarray(data["node_xy"][:, 1])
        self.dist_m = data["dist_m"]            # (N,) metres from bar
        self.bar = data["bar"]                  # (lat, lng)

    @classmethod
    def get(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    @classmethod
    def available(cls):
        return ARTIFACT.exists()

    def road_distance_km(self, lat, lng):
        """Road distance (km) from the bar to the nearest node of (lat, lng), or None
        if the point is off the serviceable network."""
        d2 = (self.node_lon - lng) ** 2 + (self.node_lat - lat) ** 2
        idx = int(np.argmin(d2))
        if _haversine_km(lat, lng, self.node_lat[idx], self.node_lon[idx]) > SNAP_MAX_KM:
            return None
        return float(self.dist_m[idx]) / 1000.0


def quote(subtotal, lat, lng):
    """Eligibility + fee for a potential delivery. Never raises on bad geo input."""
    subtotal = int(subtotal or 0)
    min_order = settings.MIN_ONLINE_ORDER
    result = {
        "min_order": min_order,
        "meets_minimum": subtotal >= min_order,
        "serviceable": False,
        "distance_km": None,
        "delivery_fee": None,
        "total": None,
        "orderable": False,
        "reason": None,
    }

    if not RoadGraph.available():
        result["reason"] = "Delivery area isn't configured yet."
        return result

    if lat is None or lng is None:
        result["reason"] = "Set your delivery location on the map."
        return result

    distance_km = RoadGraph.get().road_distance_km(float(lat), float(lng))
    if distance_km is None:
        result["reason"] = "That spot is outside our delivery area — please order on WhatsApp."
        return result
    if distance_km > settings.MAX_DELIVERY_KM:
        result["serviceable"] = False
        result["distance_km"] = round(distance_km, 1)
        result["reason"] = "That's too far for delivery — please order on WhatsApp."
        return result

    result["serviceable"] = True
    result["distance_km"] = round(distance_km, 1)

    if not result["meets_minimum"]:
        result["reason"] = (
            f"Minimum online order is TZS {min_order:,}. Add a bit more, or order on WhatsApp."
        )
        return result

    fee = pricing.compute_fee(subtotal, distance_km)
    result["delivery_fee"] = fee
    result["total"] = subtotal + fee
    result["orderable"] = True
    return result
