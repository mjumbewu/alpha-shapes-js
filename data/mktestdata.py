import csv
import sys
from shapely import wkb

# f = open('cluster_test_land_sales.csv')
reader = csv.DictReader(sys.stdin)

points = []

for row in reader:
    try:
        point = wkb.loads(row['geom_pt'], hex=True)
    except:
        continue
    points.append([point.x, point.y])

minx = min(p[0] for p in points)
maxx = max(p[0] for p in points)
miny = min(p[1] for p in points)
maxy = max(p[1] for p in points)

points = [
    [
        (p[0] - minx) * 800 / (maxx - minx),
        (p[1] - miny) * 400 / (maxy - miny),
    ]
    for p in points
]

print(points)
