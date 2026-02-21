import React, { useState } from 'react';
import MapView from './MapView';
import {
  getExportUrl, getReportUrl, getMergedExportUrl,
  exportBatchIndividual, downloadBatchReport
} from '../utils/api';

export default function BatchResultsPanel({ batch, onNewUpload }) {
  const { batch_id, batch_summary, results, skipped_files, merged_geojson } = batch;
  const [mapMode, setMapMode] = useState('merged'); // 'merged' | 'single'
  const [highlightId, setHighlightId] = useState(null);
  const [selectedResult, setSelectedResult] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showReportMenu, setShowReportMenu] = useState(false);
  const [loading, setLoading] = useState(false);

  const completed = results.filter(r => r.status === 'completed');
  const completedIds = completed.map(r => r.id);

  // --- Actions export ---
  const handleExportIndividual = async () => {
    setLoading(true);
    try { await exportBatchIndividual(completedIds); }
    catch (e) { alert('Erreur: ' + e.message); }
    finally { setLoading(false); setShowExportMenu(false); }
  };

  const handleBatchReport = async () => {
    setLoading(true);
    try { await downloadBatchReport(completedIds); }
    catch (e) { alert('Erreur: ' + e.message); }
    finally { setLoading(false); setShowReportMenu(false); }
  };

  // --- Clic sur l'œil (voir sur la carte) ---
  const handleEyeClick = (r) => {
    if (highlightId === r.id && mapMode === 'merged') {
      // Déjà sélectionné en mode merged → basculer en vue single
      setMapMode('single');
      setSelectedResult(r);
      setHighlightId(null);
    } else if (mapMode === 'single' && selectedResult?.id === r.id) {
      // Déjà en vue single de ce fichier → revenir en merged
      setMapMode('merged');
      setSelectedResult(null);
      setHighlightId(null);
    } else {
      // Premier clic → highlight en mode merged
      setMapMode('merged');
      setHighlightId(r.id);
      setSelectedResult(r);
    }
  };

  // --- Revenir à la vue globale ---
  const handleShowAll = () => {
    setMapMode('merged');
    setHighlightId(null);
    setSelectedResult(null);
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
          
          {/* Menu Export */}
          <div style={{ position: 'relative' }}>
            <button className="btn btn-primary" onClick={() => { setShowExportMenu(!showExportMenu); setShowReportMenu(false); }}>
              📦 Exporter ▾
            </button>
            {showExportMenu && (
              <div style={dropdownStyle}>
                <div style={dropdownTitle}>Fusionné (1 fichier)</div>
                <a style={dropdownItem} href={getMergedExportUrl(batch_id, 'geojson')} target="_blank" rel="noopener noreferrer">
                  📦 GeoJSON fusionné
                </a>
                <a style={dropdownItem} href={getMergedExportUrl(batch_id, 'shapefile')} target="_blank" rel="noopener noreferrer">
                  📦 Shapefile fusionné
                </a>
                <div style={{ ...dropdownTitle, borderTop: '1px solid var(--border)' }}>Individuels (ZIP)</div>
                <button style={dropdownItem} onClick={handleExportIndividual} disabled={loading}>
                  {loading ? '⏳...' : '📦 Chaque fichier séparément'}
                </button>
                <div style={{ padding: '4px 14px', fontSize: 11, color: 'var(--text-muted)' }}>
                  Ou cliquez 📦 dans le tableau pour un fichier seul
                </div>
              </div>
            )}
          </div>

          {/* Menu Rapport */}
          <div style={{ position: 'relative' }}>
            <button className="btn btn-accent" onClick={() => { setShowReportMenu(!showReportMenu); setShowExportMenu(false); }}>
              📄 Rapport PDF ▾
            </button>
            {showReportMenu && (
              <div style={dropdownStyle}>
                <button style={dropdownItem} onClick={handleBatchReport} disabled={loading}>
                  {loading ? '⏳...' : '📄 Rapport global (tout le batch)'}
                </button>
                <div style={{ padding: '4px 14px', fontSize: 11, color: 'var(--text-muted)' }}>
                  Ou cliquez 📄 dans le tableau pour un rapport individuel
                </div>
              </div>
            )}
          </div>
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
          <div className="stat-label">Corrections</div>
        </div>
      </div>

      {/* Carte */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <h3>
            🗺️ {mapMode === 'merged' 
              ? (highlightId ? `Vue globale — ${selectedResult?.filename} en surbrillance` : 'Vue globale — Toutes les parcelles')
              : `Vue détaillée — ${selectedResult?.filename}`
            }
          </h3>
          <div style={{ display: 'flex', gap: 6 }}>
            {(highlightId || mapMode === 'single') && (
              <button className="btn btn-outline btn-sm" onClick={handleShowAll}>
                🔄 Voir tout
              </button>
            )}
            {mapMode === 'merged' && highlightId && (
              <button className="btn btn-primary btn-sm" onClick={() => { setMapMode('single'); }}>
                🔍 Vue détaillée
              </button>
            )}
          </div>
        </div>
        <div className="card-body">
          {mapMode === 'merged' ? (
            <MapView
              key={`merged-${highlightId || 'all'}`}
              mergedGeoJSON={merged_geojson}
              highlightId={highlightId}
              mode="merged"
            />
          ) : (
            <MapView
              key={`single-${selectedResult?.id}`}
              originalGeoJSON={selectedResult?.original_geojson}
              correctedGeoJSON={selectedResult?.corrected_geojson}
              lineGeoJSON={selectedResult?.line_geojson}
              mode="single"
            />
          )}
        </div>
      </div>

      {/* Tableau des résultats */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <h3>📋 Détail par fichier</h3>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            👁 = voir sur carte | 📄 = rapport PDF | 📦 = export GeoJSON
          </span>
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
              const isActive = highlightId === r.id || selectedResult?.id === r.id;

              return (
                <tr key={r.id || i} style={{
                  background: isActive ? 'var(--primary-lighter)' : undefined,
                }}>
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
                    <div style={{ display: 'flex', gap: 4 }}>
                      {r.status === 'completed' && (
                        <>
                          {/* Bouton œil - voir sur la carte */}
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => handleEyeClick(r)}
                            title="Voir sur la carte"
                            style={{
                              background: isActive ? 'var(--primary)' : undefined,
                              color: isActive ? 'white' : undefined,
                            }}
                          >
                            👁
                          </button>
                          <a className="btn btn-outline btn-sm" href={getReportUrl(r.id)}
                            target="_blank" rel="noopener noreferrer" title="Rapport PDF">📄</a>
                          <a className="btn btn-outline btn-sm" href={getExportUrl(r.id, 'geojson')}
                            target="_blank" rel="noopener noreferrer" title="Export GeoJSON">📦</a>
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

      {/* Détail corrections du fichier sélectionné */}
      {selectedResult && selectedResult.status === 'completed' && (
        <div className="results-grid">
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
      )}

      {/* Fichiers ignorés */}
      {skipped_files?.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header"><h3>⚠️ Fichiers ignorés ({skipped_files.length})</h3></div>
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

// --- Styles dropdown ---
const dropdownStyle = {
  position: 'absolute',
  top: '100%',
  right: 0,
  marginTop: 4,
  background: 'white',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  boxShadow: 'var(--shadow-lg)',
  zIndex: 100,
  minWidth: 240,
  overflow: 'hidden',
};

const dropdownTitle = {
  padding: '8px 14px',
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: 'var(--text-muted)',
  background: 'var(--bg)',
};

const dropdownItem = {
  display: 'block',
  width: '100%',
  padding: '10px 14px',
  fontSize: 13,
  textAlign: 'left',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  color: 'var(--text)',
  textDecoration: 'none',
  transition: 'background 0.15s',
};
