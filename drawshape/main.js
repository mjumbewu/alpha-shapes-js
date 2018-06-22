mapboxgl.accessToken = 'pk.eyJ1IjoiZml4bGlzdCIsImEiOiJjamlxNjk2eWIwYzdlM2tsbmR3ZWtxNDFxIn0.tPZZ3-nybpVx6eDqKJcZQA';
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v9',
    center: [-75.14717102050781, 39.98238166771571],
    zoom: 12
});

map.on('load', function () {

  map.addLayer({
    'id': 'land_sales',
    'type': 'fill',
    'source': {
      'type': 'geojson',
      'data': shapes['land_sales']
    },
    'paint': {
      'fill-color': '#c80',
      'fill-opacity': 1
    }
  });

  map.addLayer({
    'id': 'zoning_new',
    'type': 'fill',
    'source': {
      'type': 'geojson',
      'data': shapes['zoning_new']
    },
    'paint': {
      'fill-color': '#08c',
      'fill-opacity': 1
    }
  });

  map.addLayer({
    'id': 'new_construction',
    'type': 'fill',
    'source': {
      'type': 'geojson',
      'data': shapes['new_construction']
    },
    'paint': {
      'fill-color': '#80c',
      'fill-opacity': 1
    }
  });

})

function updateLayer() {
  let layerName = this.value;
  if (this.checked) {
    map.setLayoutProperty(layerName, 'visibility', 'visible');
  } else {
    map.setLayoutProperty(layerName, 'visibility', 'none');
  }
}

let layerEls = document.getElementsByName('layer');

for (const el of layerEls) {
  if (el.checked) { layer = el.value; }
  el.addEventListener('change', updateLayer);
}
