import React, { useState } from 'react';
import UploadZone from './components/UploadZone';
import ResultsPanel from './components/ResultsPanel';
import BatchResultsPanel from './components/BatchResultsPanel';
import HistoryPanel from './components/HistoryPanel';
import { uploadGPX, uploadBatchGPX } from './utils/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [singleResult, setSingleResult] = useState(null);
  const [batchResult, setBatchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [error, setError] = useState(null);

  const handleUpload = async (files) => {
    setLoading(true);
    setError(null);
    setSingleResult(null);
    setBatchResult(null);
    setUploadProgress(0);

    try {
      if (files.length === 1) {
        // Un seul fichier → route simple
        const data = await uploadGPX(files[0]);
        setSingleResult(data);
        setActiveTab('results');
      } else {
        // Plusieurs fichiers → route batch
        const data = await uploadBatchGPX(files, (percent) => {
          setUploadProgress(percent);
        });
        setBatchResult(data);
        setActiveTab('results');
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Erreur inconnue';
      setError(msg);
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  };

  const handleNewUpload = () => {
    setSingleResult(null);
    setBatchResult(null);
    setError(null);
    setActiveTab('upload');
  };

  const hasResults = singleResult || batchResult;

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <h1>
          <span className="logo-icon">📍</span>
          GPX Processor
        </h1>
        <nav className="header-nav">
          <button
            className={`nav-tab ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            Upload
          </button>
          <button
            className={`nav-tab ${activeTab === 'results' ? 'active' : ''}`}
            onClick={() => setActiveTab('results')}
            disabled={!hasResults}
          >
            Résultats
          </button>
          <button
            className={`nav-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Historique
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {activeTab === 'upload' && (
          <>
            <UploadZone
              onUpload={handleUpload}
              loading={loading}
              uploadProgress={uploadProgress}
            />
            {error && (
              <div className="card" style={{ marginTop: 20 }}>
                <div className="card-body">
                  <div className="message-item error">
                    <span>❌</span>
                    <span>{error}</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'results' && singleResult && (
          <ResultsPanel result={singleResult} onNewUpload={handleNewUpload} />
        )}

        {activeTab === 'results' && batchResult && (
          <BatchResultsPanel batch={batchResult} onNewUpload={handleNewUpload} />
        )}

        {activeTab === 'history' && <HistoryPanel />}
      </main>
    </div>
  );
}
