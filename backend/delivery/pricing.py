"""Delivery-fee and eligibility rules. All knobs are settings-driven (env-tunable).

Fee rises with both road distance and order value (a bigger spend is a bigger, heavier
run), after a small free radius:

    fee = round_to_500( BASE_FEE
                        + PER_KM * max(0, distance_km - FREE_KM)
                        + VALUE_RATE * subtotal )
"""
from django.conf import settings


def _round_to(value, step=500):
    return int(round(value / step) * step)


def compute_fee(subtotal, distance_km):
    base = settings.DELIVERY_BASE_FEE
    per_km = settings.DELIVERY_PER_KM
    free_km = settings.DELIVERY_FREE_KM
    value_rate = settings.DELIVERY_VALUE_RATE
    fee = base + per_km * max(0.0, distance_km - free_km) + value_rate * subtotal
    return _round_to(fee)
