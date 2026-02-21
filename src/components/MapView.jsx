import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

/**
 * Composant carte Leaflet.
 * 
 * On utilise Leaflet en vanilla JS plutôt que react-leaflet
 * pour plus de contrôle sur les couches GeoJSON.
 */
export default function MapView({ originalGeoJSON, correctedGeoJSON, lineGeoJSON }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    if (mapInstance.current) return; // Déjà initialisé

    // Créer la carte
    mapInstance.current = L.map(mapRef.current, {
      center: [7.5, -5.5], // Centre de la Côte d'Ivoire
      zoom: 10,
    });

    // Ajouter la couche de tuiles OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
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
    map.eachLayer((layer) => {
      if (layer instanceof L.GeoJSON) {
        map.removeLayer(layer);
      }
    });

    const bounds = L.latLngBounds([]);

    // Couche des points originaux
    if (originalGeoJSON) {
      const pointsLayer = L.geoJSON(originalGeoJSON, {
        pointToLayer: (feature, latlng) =>
          L.circleMarker(latlng, {
            radius: 4,
            fillColor: '#3b82f6',
            color: '#1d4ed8',
            weight: 1,
            opacity: 0.8,
            fillOpacity: 0.6,
          }),
      }).addTo(map);

      try { bounds.extend(pointsLayer.getBounds()); } catch (e) {}
    }

    // Couche de la ligne
    if (lineGeoJSON) {
      L.geoJSON(lineGeoJSON, {
        style: {
          color: '#8b5cf6',
          weight: 2,
          opacity: 0.6,
          dashArray: '6 4',
        },
      }).addTo(map);
    }

    // Couche du polygone corrigé
    if (correctedGeoJSON) {
      const polyLayer = L.geoJSON(correctedGeoJSON, {
        style: {
          color: '#16a34a',
          weight: 3,
          opacity: 0.9,
          fillColor: '#22c55e',
          fillOpacity: 0.2,
        },
      }).addTo(map);

      try { bounds.extend(polyLayer.getBounds()); } catch (e) {}
    }

    // Zoomer sur les données
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [originalGeoJSON, correctedGeoJSON, lineGeoJSON]);

  return (
    <div>
      <div ref={mapRef} className="map-container" />
      <div className="map-legend">
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#3b82f6' }} />
          Points GPS originaux
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#8b5cf6' }} />
          Tracé (ligne)
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#22c55e' }} />
          Polygone corrigé
        </div>
      </div>
    </div>
  );
}
