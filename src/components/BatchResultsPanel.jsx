import React, { useState } from 'react';
import MapView from './MapView';
import { getExportUrl, getReportUrl, exportBatch } from '../utils/api';

export default function BatchResultsPanel({ batch, onNewUpload }) {
  const { batch_summary, results, skipped_files } = batch;
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [exporting, setExporting] = useState(false);

  const completed = results.filter(r => r.status === 'completed');
  const errors = results.filter(r => r.status === 'error');
  const selectedResult = selectedIndex !== null ? results[selectedIndex] : null;

  const handleExportAll = async () => {
    setExporting(true);
    try {
      const ids = completed.map(r => r.id);
      await exportBatch(ids);
    } catch (err) {
      alert('Erreur export : ' + (err.message || 'inconnue'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>
            Résultats Batch — {batch_summary.total_files} fichiers
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
            {batch_summary.processed} traité(s) • {batch_summary.errors} erreur(s) • {batch_summary.skipped} ignoré(s)
          </p>
        </div>
        <div className="actions-bar">
          <button className="btn btn-outline" onClick={onNewUpload}>➕ Nouveau lot</button>
          {completed.length > 0 && (
            <button
              className="btn btn-primary"
              onClick={handleExportAll}
              disabled={exporting}
            >
              {exporting ? '⏳ Export...' : `📦 Exporter tout (${completed.length} GeoJSON)`}
            </button>
          )}
        </div>
      </div>

      {/* Stats globales */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-item">
          <div className="stat-value">{batch_summary.total_files}</div>
          <div className="stat-label">Fichiers</div>
        </div>
        <div className="stat-item">
          <div className="stat-value" style={{ color: 'var(--success)' }}>{batch_summary.processed}</div>
          <div className="stat-label">Traités OK</div>
        </div>
        <div className="stat-item">
          <div className="stat-value" style={{ color: batch_summary.errors > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
            {batch_summary.errors}
          </div>
          <div className="stat-label">Erreurs</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{batch_summary.total_area_hectares}</div>
          <div className="stat-label">Hectares (total)</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{batch_summary.total_corrections}</div>
          <div className="stat-label">Corrections (total)</div>
        </div>
      </div>

      {/* Tableau des résultats */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <h3>📋 Détail par fichier</h3>
        </div>
        <table className="history-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Fichier</th>
              <th>Statut</th>
              <th>Points</th>
              <th>Superficie (ha)</th>
              <th>Corrections</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => {
              const corr = r.corrections;
              const totalCorr = corr
                ? (corr.artifacts_removed || 0) + (corr.duplicate_vertices_removed || 0) +
                  (corr.spikes_removed || 0) + (corr.self_intersections_fixed || 0) +
                  (corr.invalid_geometries_fixed || 0)
                : 0;

              return (
                <tr
                  key={r.id || i}
                  style={{
                    cursor: 'pointer',
                    background: selectedIndex === i ? 'var(--primary-lighter)' : undefined,
                  }}
                  onClick={() => setSelectedIndex(selectedIndex === i ? null : i)}
                >
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-muted)' }}>
                    {i + 1}
                  </td>
                  <td>
                    <strong style={{ fontSize: 13 }}>{r.filename}</strong>
                    <br />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {r.id}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${r.status}`}>
                      {r.status === 'completed' ? '✓ OK' : '✗ Erreur'}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {r.validation?.total_points || '—'}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {r.area ? r.area.area_hectares : '—'}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {totalCorr}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                      {r.status === 'completed' && (
                        <>
                          <a className="btn btn-outline btn-sm" href={getReportUrl(r.id)} target="_blank" rel="noopener noreferrer" title="PDF">📄</a>
                          <a className="btn btn-outline btn-sm" href={getExportUrl(r.id, 'geojson')} target="_blank" rel="noopener noreferrer" title="GeoJSON">📦</a>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Fichiers ignorés */}
      {skipped_files && skipped_files.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <h3>⚠️ Fichiers ignorés ({skipped_files.length})</h3>
          </div>
          <div className="card-body">
            {skipped_files.map((sf, i) => (
              <div key={i} className="message-item warning">
                <span>⚠️</span>
                <span><strong>{sf.filename}</strong> — {sf.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Détail du fichier sélectionné */}
      {selectedResult && selectedResult.status === 'completed' && (
        <div style={{ marginTop: 8 }}>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <h3>🗺️ Carte — {selectedResult.filename}</h3>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setSelectedIndex(null)}
              >
                ✕ Fermer
              </button>
            </div>
            <div className="card-body">
              <MapView
                key={selectedResult.id}
                originalGeoJSON={selectedResult.original_geojson}
                correctedGeoJSON={selectedResult.corrected_geojson}
                lineGeoJSON={selectedResult.line_geojson}
              />
            </div>
          </div>

          <div className="results-grid">
            {/* Corrections */}
            {selectedResult.corrections && (
              <div className="card">
                <div className="card-header"><h3>🔧 Corrections — {selectedResult.filename}</h3></div>
                <div className="card-body">
                  <ul className="correction-list">
                    <CorrItem label="Artefacts" value={selectedResult.corrections.artifacts_removed} />
                    <CorrItem label="Vertices double" value={selectedResult.corrections.duplicate_vertices_removed} />
                    <CorrItem label="Spikes" value={selectedResult.corrections.spikes_removed} />
                    <CorrItem label="Auto-intersections" value={selectedResult.corrections.self_intersections_fixed} />
                    <CorrItem label="Géométries réparées" value={selectedResult.corrections.invalid_geometries_fixed} />
                  </ul>
                  {selectedResult.corrections.details?.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      {selectedResult.corrections.details.map((d, i) => (
                        <div key={i} className="correction-detail">{d}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Superficie */}
            {selectedResult.area && (
              <div className="card">
                <div className="card-header"><h3>📐 Superficie — {selectedResult.filename}</h3></div>
                <div className="card-body">
                  <div className="stats-grid">
                    <div className="stat-item"><div className="stat-value">{selectedResult.area.area_hectares}</div><div className="stat-label">Hectares</div></div>
                    <div className="stat-item"><div className="stat-value" style={{ fontSize: 16 }}>{selectedResult.area.area_sq_meters.toLocaleString('fr-FR')}</div><div className="stat-label">m²</div></div>
                    <div className="stat-item"><div className="stat-value" style={{ fontSize: 16 }}>{selectedResult.area.perimeter_meters.toLocaleString('fr-FR')}</div><div className="stat-label">Périmètre (m)</div></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Erreur sélectionnée */}
      {selectedResult && selectedResult.status === 'error' && (
        <div className="card" style={{ marginTop: 8 }}>
          <div className="card-header">
            <h3>❌ Erreur — {selectedResult.filename}</h3>
            <button className="btn btn-outline btn-sm" onClick={() => setSelectedIndex(null)}>✕</button>
          </div>
          <div className="card-body">
            {selectedResult.validation?.errors?.map((err, i) => (
              <div key={i} className="message-item error"><span>❌</span> <span>{err}</span></div>
            ))}
            {selectedResult.error_message && (
              <div className="message-item error"><span>❌</span> <span>{selectedResult.error_message}</span></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CorrItem({ label, value }) {
  return (
    <li className="correction-item">
      <span className="label">{label}</span>
      <span className={`value ${value > 0 ? 'positive' : 'zero'}`}>{value}</span>
    </li>
  );
}
