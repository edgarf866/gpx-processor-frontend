import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

// Palette de couleurs pour différencier les parcelles
const COLORS = [
  '#e6194b', '#3cb44b', '#4363d8', '#f58231', '#911eb4',
  '#42d4f4', '#f032e6', '#bfef45', '#fabed4', '#469990',
  '#dcbeff', '#9A6324', '#800000', '#aaffc3', '#808000',
  '#000075', '#a9a9a9', '#e6beff', '#fffac8', '#ffd8b1'
];

/**
 * Carte Leaflet améliorée.
 * 
 * Props :
 * - mergedGeoJSON : FeatureCollection avec tous les polygones (vue globale)
 * - highlightId : ID du fichier à mettre en surbrillance (null = tous)
 * - originalGeoJSON : points d'un seul fichier (vue individuelle)
 * - correctedGeoJSON : polygone d'un seul fichier (vue individuelle)
 * - lineGeoJSON : ligne d'un seul fichier (vue individuelle)
 * - mode : "merged" | "single"
 */
export default function MapView({
  mergedGeoJSON,
  highlightId,
  originalGeoJSON,
  correctedGeoJSON,
  lineGeoJSON,
  mode = "single"
}) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const layersRef = useRef([]);

  useEffect(() => {
    if (mapInstance.current) return;

    mapInstance.current = L.map(mapRef.current, {
      center: [7.5, -5.5],
      zoom: 10,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(mapInstance.current);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    // Nettoyer les anciennes couches
    layersRef.current.forEach(layer => {
      try { map.removeLayer(layer); } catch (e) {}
    });
    layersRef.current = [];

    const bounds = L.latLngBounds([]);

    if (mode === "merged" && mergedGeoJSON) {
      // === VUE FUSIONNÉE : tous les polygones avec couleurs ===
      const features = mergedGeoJSON.features || [];
      
      // Créer un mapping filename → color
      const fileNames = [...new Set(features.map(f => f.properties?.filename || ''))];
      const colorMap = {};
      fileNames.forEach((name, i) => {
        colorMap[name] = COLORS[i % COLORS.length];
      });

      features.forEach((feature, index) => {
        const fname = feature.properties?.filename || '';
        const fid = feature.properties?.id || '';
        const color = colorMap[fname];
        const isHighlighted = !highlightId || highlightId === fid;
        const opacity = highlightId ? (isHighlighted ? 0.9 : 0.2) : 0.7;
        const fillOpacity = highlightId ? (isHighlighted ? 0.35 : 0.05) : 0.2;
        const weight = highlightId && isHighlighted ? 4 : 2;

        const geojsonData = { type: "FeatureCollection", features: [feature] };
        
        const layer = L.geoJSON(geojsonData, {
          style: {
            color: color,
            weight: weight,
            opacity: opacity,
            fillColor: color,
            fillOpacity: fillOpacity,
          },
          onEachFeature: (feat, lyr) => {
            const props = feat.properties || {};
            const areaHa = props.area_hectares ? `${props.area_hectares} ha` : 'N/A';
            lyr.bindPopup(
              `<strong>${props.filename || 'Parcelle'}</strong><br/>` +
              `Superficie : ${areaHa}`
            );
          }
        }).addTo(map);

        try { bounds.extend(layer.getBounds()); } catch (e) {}
        layersRef.current.push(layer);
      });

    } else {
      // === VUE INDIVIDUELLE : un seul fichier ===
      
      if (originalGeoJSON) {
        const layer = L.geoJSON(originalGeoJSON, {
          pointToLayer: (feature, latlng) =>
            L.circleMarker(latlng, {
              radius: 4, fillColor: '#3b82f6', color: '#1d4ed8',
              weight: 1, opacity: 0.8, fillOpacity: 0.6,
            }),
        }).addTo(map);
        try { bounds.extend(layer.getBounds()); } catch (e) {}
        layersRef.current.push(layer);
      }

      if (lineGeoJSON) {
        const layer = L.geoJSON(lineGeoJSON, {
          style: { color: '#8b5cf6', weight: 2, opacity: 0.6, dashArray: '6 4' },
        }).addTo(map);
        layersRef.current.push(layer);
      }

      if (correctedGeoJSON) {
        const layer = L.geoJSON(correctedGeoJSON, {
          style: {
            color: '#16a34a', weight: 3, opacity: 0.9,
            fillColor: '#22c55e', fillOpacity: 0.2,
          },
        }).addTo(map);
        try { bounds.extend(layer.getBounds()); } catch (e) {}
        layersRef.current.push(layer);
      }
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [mergedGeoJSON, highlightId, originalGeoJSON, correctedGeoJSON, lineGeoJSON, mode]);

  return (
    <div>
      <div ref={mapRef} className="map-container" />
      {mode === "merged" ? (
        <div className="map-legend">
          <div className="legend-item">
            <span className="legend-dot" style={{ background: '#e6194b' }} />
            Chaque couleur = une parcelle
          </div>
          {highlightId && (
            <div className="legend-item" style={{ fontWeight: 600, color: 'var(--primary)' }}>
              ◉ Parcelle sélectionnée en surbrillance
            </div>
          )}
        </div>
      ) : (
        <div className="map-legend">
          <div className="legend-item">
            <span className="legend-dot" style={{ background: '#3b82f6' }} />
            Points GPS
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ background: '#8b5cf6' }} />
            Tracé
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ background: '#22c55e' }} />
            Polygone corrigé
          </div>
        </div>
      )}
    </div>
  );
}
