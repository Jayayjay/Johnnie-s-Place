"""One-time offline build of the delivery road-distance artifact.

Reads the Tanzania OSM extract, filters to Unguja (Zanzibar main island), builds the
driving road network, and precomputes the road distance from the bar to every reachable
node (single-source Dijkstra). The result is saved as a small pickle that the Django
request path loads via delivery/routing.py — so no .pbf parsing happens at runtime.

Run once (after any road-data or bar-location change):

    python manage.py build_delivery_graph

Needs pyrosm + networkx (heavy; only required for this command, not at runtime).
"""
import pickle
from pathlib import Path

import numpy as np
from django.conf import settings
from django.core.management.base import BaseCommand

# Bar location (Unguja, Zanzibar) — resolved from the owner's Apple Maps pin.
BAR_LAT, BAR_LNG = -6.272989, 39.254765

# Bounding box around Unguja: [min_lon, min_lat, max_lon, max_lat] (W, S, E, N).
UNGUJA_BBOX = [39.10, -6.55, 39.65, -5.70]

REPO_ROOT = Path(settings.BASE_DIR).parent.parent  # .../Bar
DEFAULT_PBF = REPO_ROOT / "tanzania-261108.osm.pbf"
OUT = Path(settings.BASE_DIR) / "delivery" / "data" / "delivery_graph.pkl"


class Command(BaseCommand):
    help = "Precompute road distances from the bar over the Unguja driving network."

    def add_arguments(self, parser):
        parser.add_argument("--pbf", default=str(DEFAULT_PBF), help="Path to the .osm.pbf extract.")

    def handle(self, *args, **options):
        from pyrosm import OSM  # imported here so runtime never needs pyrosm
        import networkx as nx

        pbf = Path(options["pbf"])
        if not pbf.exists():
            self.stderr.write(self.style.ERROR(f"PBF not found: {pbf}"))
            return

        self.stdout.write(f"Reading driving network from {pbf.name} (Unguja bbox)…")
        osm = OSM(str(pbf), bounding_box=UNGUJA_BBOX)
        nodes, edges = osm.get_network(network_type="driving", nodes=True)
        graph = osm.to_graph(nodes, edges, graph_type="networkx")
        self.stdout.write(f"Graph: {graph.number_of_nodes()} nodes, {graph.number_of_edges()} edges.")

        # Node coordinates (lon, lat). pyrosm uses x/lon, y/lat.
        def coord(data):
            lon = data.get("lon", data.get("x"))
            lat = data.get("lat", data.get("y"))
            return lon, lat

        ids, lons, lats = [], [], []
        for nid, data in graph.nodes(data=True):
            lon, lat = coord(data)
            if lon is None or lat is None:
                continue
            ids.append(nid)
            lons.append(float(lon))
            lats.append(float(lat))
        lons = np.asarray(lons)
        lats = np.asarray(lats)

        # Snap the bar to its nearest node (planar approx over this small area is fine).
        d2 = (lons - BAR_LNG) ** 2 + (lats - BAR_LAT) ** 2
        bar_idx = int(np.argmin(d2))
        bar_node = ids[bar_idx]
        self.stdout.write(f"Bar snapped to node {bar_node}.")

        # Road distance (metres) from the bar to every reachable node.
        self.stdout.write("Computing single-source shortest paths from the bar…")
        dist = nx.single_source_dijkstra_path_length(graph, bar_node, weight="length")

        keep_lon, keep_lat, keep_m = [], [], []
        for i, nid in enumerate(ids):
            m = dist.get(nid)
            if m is None:
                continue  # unreachable from the bar — drop it
            keep_lon.append(lons[i])
            keep_lat.append(lats[i])
            keep_m.append(float(m))

        node_xy = np.column_stack([keep_lon, keep_lat]).astype("float64")
        dist_m = np.asarray(keep_m, dtype="float64")

        OUT.parent.mkdir(parents=True, exist_ok=True)
        with OUT.open("wb") as fh:
            pickle.dump(
                {
                    "node_xy": node_xy,       # (N, 2) lon, lat
                    "dist_m": dist_m,         # (N,) metres from bar via roads
                    "bar": (BAR_LAT, BAR_LNG),
                    "bbox": UNGUJA_BBOX,
                },
                fh,
                protocol=pickle.HIGHEST_PROTOCOL,
            )

        self.stdout.write(self.style.SUCCESS(
            f"Saved {OUT.relative_to(settings.BASE_DIR)} — {len(dist_m)} reachable nodes, "
            f"max {dist_m.max()/1000:.1f} km from the bar."
        ))
