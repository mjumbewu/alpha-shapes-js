var canvas = document.getElementById('thecanvas');
let width = canvas.width;
let height = canvas.height;

var points = [];

// for (let _ = 0; _ < 5000; ++_) {
//   let point = [Math.random() * width,
//                Math.random() * height];
//   points.push(point);
// }

// const delaunay = Delaunator.from(points);
const edgekey = function(eis) { return Math.min(...eis) + ',' + Math.max(...eis); };

function drawTriangulation(points, triangles, ctx) {
  let edges = {};

  for (let i = 0; i < triangles.length; i += 3) {
    // Grab the three point indicies that represent the triangle vertices.
    let pi1 = triangles[i];
    let pi2 = triangles[i + 1];
    let pi3 = triangles[i + 2];

    // Create edges using adjacent point indices. Always start with the smaller
    // point index so that we don't duplicate edges (e.g., [pi1, pi2] is the
    // same as [pi2, pi1]).
    let eis1 = [Math.min(pi1, pi2), Math.max(pi1, pi2)];
    let eis2 = [Math.min(pi2, pi3), Math.max(pi2, pi3)];
    let eis3 = [Math.min(pi3, pi1), Math.max(pi3, pi1)];

    // Create a string key from each set of edge point indices.
    let k1 = edgekey(eis1);
    let k2 = edgekey(eis2);
    let k3 = edgekey(eis3);

    // Store the actual edge corresponding to the indices.
    edges[k1] = [points[eis1[0]], points[eis1[1]]];
    edges[k2] = [points[eis2[0]], points[eis2[1]]];
    edges[k3] = [points[eis3[0]], points[eis3[1]]];
  }

  let orderedEdges = []
  for (const k in edges) {
    orderedEdges.push(edges[k]);
  }

  function drawedge(e, ctx) {
    ctx.beginPath();
    ctx.moveTo(...e[0]);
    ctx.lineTo(...e[1]);
    ctx.stroke();
  }

  function scheduleNextEdge(orderedEdges, ctx, ei=0) {
    setTimeout(function() {
      let edge = orderedEdges[ei];
      drawedge(edge, ctx);
      ++ei;

      if (ei < orderedEdges.length) {
        scheduleNextEdge(orderedEdges, ctx, ei);
      }
    }, 0);
  }

  scheduleNextEdge(orderedEdges, ctx)
}

// drawTriangulation(points, delaunay.triangles, canvas.getContext('2d'));



//------------------------------------------------------------------------------

function stringkey(i) {
  return i.toString();
}

class set {
  constructor(items, key=stringkey) {
    this.key = key;
    this.data = {};
    for (const i of items) {
      this.add(i);
    }
  }

  add(i) {
    this.data[this.key(i)] = i;
  }

  remove(i) {
    delete this.data[this.key(i)];
  }

  contains(i) {
    return this.key(i) in this.data;
  }

  values(i) {
    let values = [];
    for (let k in this.data) {
      values.push(this.data[k]);
    }
    return values;
  }
}

function makeTriangles(pointIndices) {
  let triangles = []
  for (let i = 0; i < pointIndices.length; i += 3) {
    triangles.push([pointIndices[i],
                    pointIndices[i + 1],
                    pointIndices[i + 2]])
  }
  return triangles
}

/*
Compute the alpha shape (concave hull) of a set
of points.
@param points: Iterable container of points.
@param alpha: alpha value to influence the
    gooeyness of the border. Smaller numbers
    don't fall inward as much as larger numbers.
    Too large, and you lose everything!
*/
function alpha_shape(points, alpha) {
  if (points.length < 4) {
    // When you have a triangle, there is no sense
    // in computing an alpha shape.
    return points
  }

  function add_edge(edges, edge_points, coords, i, j) {
      // Add a line between the i-th and j-th points,
      // if not in the list already
      if (edges.contains([i, j])) {
        // already added
        return
      }
      edges.add([i, j])
      edge_points.push(coords[i]);
      edge_points.push(coords[j]);
  }

  function add_triangle(polygons, coords, ia, ib, ic) {
    try {
      var a = coords[ia];
      var b = coords[ib];
      var c = coords[ic];

      if (!(a && b && c)) {
        debugger;
      }

      let triangle = turf.polygon([[ a, b, c, a ]])
      polygons.push(triangle)
    } catch {
      debugger;
    }
  }

  const coords = points;
  const delaunay = Delaunator.from(coords)
  const tris = makeTriangles(delaunay.triangles);

  let edges = new set([], key=edgekey)
  let edge_points = []
  let inner_triangles = [];
  // loop over triangles:
  // ia, ib, ic = indices of corner points of the
  // triangle
  for (const t of tris) {
    let [ia, ib, ic] = t;
    let pa = coords[ia]
    let pb = coords[ib]
    let pc = coords[ic]
    // Lengths of sides of triangle
    let a = Math.sqrt((pa[0]-pb[0])**2 + (pa[1]-pb[1])**2)
    let b = Math.sqrt((pb[0]-pc[0])**2 + (pb[1]-pc[1])**2)
    let c = Math.sqrt((pc[0]-pa[0])**2 + (pc[1]-pa[1])**2)
    // Semiperimeter of triangle
    let s = (a + b + c) / 2.0
    // Area of triangle by Heron's formula
    let area = Math.sqrt(s * (s - a) * (s - b) * (s - c))
    let circum_r = a * b * c / (4.0 * area)
    // Here's the radius filter.
    if (circum_r < 1.0/alpha) {
      add_edge(edges, edge_points, coords, ia, ib)
      add_edge(edges, edge_points, coords, ib, ic)
      add_edge(edges, edge_points, coords, ic, ia)
      add_triangle(inner_triangles, coords, ia, ib, ic)
    }
  }

  return [inner_triangles, edge_points]
}

function drawAsTriangles(ctx, edge_points) {
  for (let i = 0; i < edge_points.length; i += 2) {
    ctx.beginPath();
    ctx.moveTo(...edge_points[i]);
    ctx.lineTo(...edge_points[i+1]);
    ctx.stroke();
  }
}

function drawAsPolygons(ctx, inner_triangles) {
  let shape = turf.union(...inner_triangles);
  // debugger;
  shape = turf.buffer(shape.geometry, 0.1, {units: 'miles'})
  console.log(shape);

  function drawPolygon(rings) {
    for (const ring of rings) {
      ctx.beginPath();
      ctx.moveTo(...ring[0]);
      for (const coord of ring) {
        if (coord == ring[0]) continue;
        ctx.lineTo(...coord);
      }
      ctx.stroke();
    }
  }

  if (shape.geometry.type == 'Polygon') {
    drawPolygon(shape.geometry.coordinates);
  } else if (shape.geometry.type == 'MultiPolygon') {
    for (const polygon of shape.geometry.coordinates) {
      drawPolygon(polygon);
    }
  }
}

function drawShape(alpha=0.00001, shapeType='triangles') {
  console.log('redrawing')
  let [inner_triangles, edge_points] = alpha_shape(points, alpha);
  let ctx = canvas.getContext('2d');

  ctx.clearRect(0,0,width,height);

  if (shapeType == 'triangles') {
    // -- this is fast.
    drawAsTriangles(ctx, edge_points);
  }

  if (shapeType == 'polygons') {
    // -- this is slooooow.
    drawAsPolygons(ctx, inner_triangles);
  }
}

var shapeType;

function updateAlpha() {
  alphaDisplayEl.innerHTML = alphaEl.value;
  drawShape(alphaEl.value, shapeType)
}

function updateShapeType() {
  if (this.checked) {
    shapeType = this.value;
    drawShape(alphaEl.value, shapeType);
  }
}

let alphaEl = document.getElementById('alpha');
let alphaDisplayEl = document.getElementById('alpha-display');
let shapeTypeEls = document.getElementsByName('shape-type');

alphaEl.addEventListener('input', updateAlpha)

for (const el of shapeTypeEls) {
  if (el.checked) { shapeType = el.value; }
  el.addEventListener('change', updateShapeType);
}

updateAlpha();
