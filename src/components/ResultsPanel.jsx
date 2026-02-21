import React from 'react';
import MapView from './MapView';
import { getExportUrl, getReportUrl } from '../utils/api';

export default function ResultsPanel({ result, onNewUpload }) {
  const { validation, corrections, area, original_geojson, corrected_geojson, line_geojson, id, filename } = result;

  const totalCorrections = corrections
    ? (corrections.artifacts_removed || 0) +
      (corrections.duplicate_vertices_removed || 0) +
      (corrections.spikes_removed || 0) +
      (corrections.self_intersections_fixed || 0) +
      (corrections.invalid_geometries_fixed || 0)
    : 0;

  return (
    <div>
      {/* Actions Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Résultats — {filename}</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
            ID : {id} • {new Date(result.uploaded_at).toLocaleString('fr-FR')}
          </p>
        </div>
        <div className="actions-bar">
          <button className="btn btn-outline" onClick={onNewUpload}>➕ Nouveau fichier</button>
          <a className="btn btn-outline" href={getExportUrl(id, 'geojson')} target="_blank" rel="noopener noreferrer">📦 GeoJSON</a>
          <a className="btn btn-outline" href={getExportUrl(id, 'shapefile')} target="_blank" rel="noopener noreferrer">📦 Shapefile</a>
          <a className="btn btn-primary" href={getReportUrl(id)} target="_blank" rel="noopener noreferrer">📄 Rapport PDF</a>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-item">
          <div className="stat-value">{validation?.total_points || 0}</div>
          <div className="stat-label">Points GPS</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{totalCorrections}</div>
          <div className="stat-label">Corrections</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{area ? area.area_hectares : '—'}</div>
          <div className="stat-label">Hectares</div>
        </div>
        <div className="stat-item">
          <div className="stat-value" style={{ fontSize: 18 }}>{area ? `${(area.perimeter_meters / 1000).toFixed(2)}` : '—'}</div>
          <div className="stat-label">Périmètre (km)</div>
        </div>
      </div>

      {/* Map */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><h3>🗺️ Carte interactive</h3></div>
        <div className="card-body">
          <MapView originalGeoJSON={original_geojson} correctedGeoJSON={corrected_geojson} lineGeoJSON={line_geojson} />
        </div>
      </div>

      <div className="results-grid">
        {/* Validation */}
        <div className="card">
          <div className="card-header"><h3>✅ Validation</h3></div>
          <div className="card-body">
            <div className={`validation-status ${validation?.is_valid ? 'valid' : 'invalid'}`}>
              {validation?.is_valid ? '✓ Fichier GPX valide' : '✗ Fichier GPX invalide'}
            </div>
            {validation?.errors?.length > 0 && (
              <div className="message-list">
                {validation.errors.map((err, i) => (
                  <div key={i} className="message-item error"><span>❌</span> <span>{err}</span></div>
                ))}
              </div>
            )}
            {validation?.warnings?.length > 0 && (
              <div className="message-list">
                {validation.warnings.map((warn, i) => (
                  <div key={i} className="message-item warning"><span>⚠️</span> <span>{warn}</span></div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Corrections */}
        <div className="card">
          <div className="card-header">
            <h3>🔧 Corrections</h3>
            <span className="status-badge completed">{totalCorrections}</span>
          </div>
          <div className="card-body">
            {corrections ? (
              <>
                <ul className="correction-list">
                  <CorrectionItem label="Artefacts supprimés" value={corrections.artifacts_removed} />
                  <CorrectionItem label="Vertices en double" value={corrections.duplicate_vertices_removed} />
                  <CorrectionItem label="Spikes corrigés" value={corrections.spikes_removed} />
                  <CorrectionItem label="Auto-intersections" value={corrections.self_intersections_fixed} />
                  <CorrectionItem label="Géométries réparées" value={corrections.invalid_geometries_fixed} />
                </ul>
                {corrections.details?.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    {corrections.details.map((d, i) => (
                      <div key={i} className="correction-detail">{d}</div>
                    ))}
                  </div>
                )}
              </>
            ) : <p style={{ color: 'var(--text-muted)' }}>Aucune correction</p>}
          </div>
        </div>

        {/* Superficie */}
        {area && (
          <div className="card">
            <div className="card-header"><h3>📐 Superficie</h3></div>
            <div className="card-body">
              <div className="stats-grid">
                <div className="stat-item"><div className="stat-value">{area.area_hectares}</div><div className="stat-label">Hectares</div></div>
                <div className="stat-item"><div className="stat-value" style={{ fontSize: 16 }}>{area.area_sq_meters.toLocaleString('fr-FR')}</div><div className="stat-label">m²</div></div>
                <div className="stat-item"><div className="stat-value">{area.area_sq_km}</div><div className="stat-label">km²</div></div>
                <div className="stat-item"><div className="stat-value" style={{ fontSize: 16 }}>{area.perimeter_meters.toLocaleString('fr-FR')}</div><div className="stat-label">Périmètre (m)</div></div>
              </div>
              <p style={{ marginTop: 14, fontSize: 12, color: 'var(--text-muted)' }}>Projection : {area.projection_used}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CorrectionItem({ label, value }) {
  return (
    <li className="correction-item">
      <span className="label">{label}</span>
      <span className={`value ${value > 0 ? 'positive' : 'zero'}`}>{value}</span>
    </li>
  );
}
