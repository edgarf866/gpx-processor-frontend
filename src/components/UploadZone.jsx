import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

export default function UploadZone({ onUpload, loading, uploadProgress }) {
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      onUpload(acceptedFiles);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/gpx+xml': ['.gpx'], 'text/xml': ['.gpx'] },
    // PAS de maxFiles → accepte plusieurs fichiers !
    disabled: loading,
    multiple: true,
  });

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner" />
        <p style={{ fontWeight: 600, fontSize: 16 }}>Traitement en cours...</p>
        {uploadProgress !== null && uploadProgress < 100 && (
          <div style={{ width: 250, marginTop: 8 }}>
            <div style={{
              height: 6,
              background: 'var(--border)',
              borderRadius: 3,
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${uploadProgress}%`,
                background: 'var(--primary)',
                borderRadius: 3,
                transition: 'width 0.3s ease',
              }} />
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, textAlign: 'center' }}>
              Upload : {uploadProgress}%
            </p>
          </div>
        )}
        {uploadProgress >= 100 && (
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            Validation → Transformation → Corrections → Calcul de superficie...
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="dropzone-container">
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="dropzone-icon">🗺️</div>
        <h3>
          {isDragActive
            ? 'Déposez les fichiers ici...'
            : 'Glissez-déposez vos fichiers GPX'}
        </h3>
        <p>Un ou plusieurs fichiers .gpx — Traitement en parallèle</p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
          Maximum 50 fichiers par lot
        </p>
      </div>
    </div>
  );
}
