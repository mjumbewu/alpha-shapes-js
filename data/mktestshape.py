"""
Requires shapely, numpy, scipy

python mktestshape.py > ../drawshape/shapes.js
"""

import csv
import json
import sys
from shapely import wkb, geometry
from alphashapes import alpha_shape

# f = open('cluster_test_land_sales.csv')

def mkshape(f):
    reader = csv.DictReader(f)

    points = []

    for row in reader:
        try:
            point = wkb.loads(row['geom_pt'], hex=True)
        except:
            continue
        points.append(point)

    # minx = min(p[0] for p in points)
    # maxx = max(p[0] for p in points)
    # miny = min(p[1] for p in points)
    # maxy = max(p[1] for p in points)

    # # Hard-coded bounding box for consistency.
    # minx = -75.35179138183594
    # maxx = -74.9432373046875
    # miny = 39.88813830918363
    # maxy = 40.07649521197062
    #
    # points = [
    #     geometry.Point([
    #         (p[0] - minx) * 800 / (maxx - minx),
    #         (p[1] - miny) * 600 / (maxy - miny),
    #     ])
    #     for p in points
    # ]

    shape, edge_points = alpha_shape(points, 800)
    return json.dumps(geometry.mapping(shape.buffer(0.0005)))

print('var shapes = {};')
for shapename in ['land_sales', 'new_construction', 'zoning_new']:
    with open(f'cluster_test_{shapename}.csv') as f:
        value = mkshape(f)
    print(f"shapes['{shapename}'] = {value};")
