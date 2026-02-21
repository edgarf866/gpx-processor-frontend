import React, { useState, useEffect } from 'react';
import { getHistory, deleteEntry, getReportUrl, getExportUrl } from '../utils/api';

export default function HistoryPanel() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await getHistory();
      setHistory(data.history || []);
    } catch (err) {
      console.error('Erreur chargement historique:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette entrée ?')) return;
    try {
      await deleteEntry(id);
      fetchHistory();
    } catch (err) {
      console.error('Erreur suppression:', err);
    }
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner" />
        <p>Chargement de l'historique...</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="card">
        <div className="card-body" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.5 }}>📋</div>
          <h3 style={{ marginBottom: 6 }}>Aucun historique</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            Les fichiers GPX traités apparaîtront ici.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Historique des traitements</h2>
        <button className="btn btn-outline btn-sm" onClick={fetchHistory}>
          🔄 Rafraîchir
        </button>
      </div>

      <div className="card">
        <table className="history-table">
          <thead>
            <tr>
              <th>Fichier</th>
              <th>Date</th>
              <th>Statut</th>
              <th>Points</th>
              <th>Superficie</th>
              <th>Corrections</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong style={{ fontSize: 13 }}>{item.filename}</strong>
                  <br />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {item.id}
                  </span>
                </td>
                <td style={{ fontSize: 13 }}>
                  {new Date(item.uploaded_at).toLocaleString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td>
                  <span className={`status-badge ${item.status}`}>
                    {item.status === 'completed' ? '✓ OK' : '✗ Erreur'}
                  </span>
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  {item.total_points || '—'}
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  {item.area_hectares != null ? `${item.area_hectares} ha` : '—'}
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  {item.total_corrections}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {item.status === 'completed' && (
                      <>
                        <a
                          className="btn btn-outline btn-sm"
                          href={getReportUrl(item.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Télécharger le rapport PDF"
                        >
                          📄
                        </a>
                        <a
                          className="btn btn-outline btn-sm"
                          href={getExportUrl(item.id, 'geojson')}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Exporter en GeoJSON"
                        >
                          📦
                        </a>
                      </>
                    )}
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleDelete(item.id)}
                      title="Supprimer"
                      style={{ color: 'var(--danger)' }}
                    >
                      🗑
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
