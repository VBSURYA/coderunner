import React, { useState } from 'react';

// Public endpoints for testing
const DOWNLOAD_TEST_URL = 'https://speed.hetzner.de/10MB.bin';
const UPLOAD_TEST_URL = 'https://httpbin.org/post';

type TestStatus = 'idle' | 'pinging' | 'downloading' | 'uploading';

export default function SpeedTest() {
  const [status, setStatus] = useState<TestStatus>('idle');
  const [downloadSpeed, setDownloadSpeed] = useState<string>('');
  const [uploadSpeed, setUploadSpeed] = useState<string>('');
  const [latency, setLatency] = useState<string>('');
  const [error, setError] = useState<string>('');

  const runTest = async () => {
    setStatus('pinging');
    setDownloadSpeed('');
    setUploadSpeed('');
    setLatency('');
    setError('');

    try {
      // 1. Latency
      const pingStart = performance.now();
      await fetch('https://api.ipify.org?format=json', { method: 'GET', cache: 'no-store' });
      const pingEnd = performance.now();
      setLatency(`${Math.round(pingEnd - pingStart)}`);

      // 2. Download
      setStatus('downloading');
      const downStart = performance.now();
      const downResponse = await fetch(DOWNLOAD_TEST_URL, { cache: 'no-store' });
      if (!downResponse.ok) throw new Error('Download failed');
      const blob = await downResponse.blob();
      const downEnd = performance.now();
      const downDurationSec = (downEnd - downStart) / 1000;
      const downSpeedMbps = (blob.size * 8 / downDurationSec / (1024 * 1024)).toFixed(2);
      setDownloadSpeed(downSpeedMbps);

      // 3. Upload
      setStatus('uploading');
      const upStart = performance.now();
      const payload = new Blob([new ArrayBuffer(2 * 1024 * 1024)]);
      const upResponse = await fetch(UPLOAD_TEST_URL, {
        method: 'POST',
        body: payload,
        cache: 'no-store',
      });
      if (!upResponse.ok) throw new Error('Upload failed');
      const upEnd = performance.now();
      const upDurationSec = (upEnd - upStart) / 1000;
      const upSpeedMbps = (payload.size * 8 / upDurationSec / (1024 * 1024)).toFixed(2);
      setUploadSpeed(upSpeedMbps);
    } catch (err) {
      console.error(err);
      setError('Network error. Please try again.');
    } finally {
      setStatus('idle');
    }
  };

  const isRunning = status !== 'idle';

  // The main gauge shows the active/last relevant metric
  const gaugeValue = downloadSpeed || '0';
  const gaugePercent = Math.min(parseFloat(gaugeValue) / 100, 1); // cap at 100 Mbps for visual
  const circumference = 2 * Math.PI * 90;
  const dashOffset = circumference - gaugePercent * circumference * 0.75; // 0.75 for a 270deg arc

  const getStatusLabel = () => {
    switch (status) {
      case 'pinging': return 'Pinging server...';
      case 'downloading': return 'Testing download...';
      case 'uploading': return 'Testing upload...';
      default: return downloadSpeed ? 'Test complete' : 'Ready to test';
    }
  };

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        .st-pulse { animation: pulse 1.5s ease-in-out infinite; }
        .st-fade { animation: fadeIn 0.5s ease forwards; }
        .st-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(59,130,246,0.5); }
        .st-btn:active:not(:disabled) { transform: translateY(0); }
      `}</style>

      <div style={{
        maxWidth: '380px',
        margin: '40px auto',
        padding: '32px',
        borderRadius: '24px',
        background: 'linear-gradient(160deg, #1e293b 0%, #0f172a 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        textAlign: 'center',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <h2 style={{
          margin: '0 0 4px',
          color: '#f8fafc',
          fontSize: '22px',
          fontWeight: 700,
          letterSpacing: '-0.5px',
        }}>
          Speed Test
        </h2>
        <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: '13px' }}>
          {getStatusLabel()}
        </p>

        {/* Circular Gauge */}
        <div style={{ position: 'relative', width: '220px', height: '220px', margin: '0 auto 24px' }}>
          <svg width="220" height="220" style={{ transform: 'rotate(135deg)' }}>
            <defs>
              <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            {/* Track */}
            <circle
              cx="110" cy="110" r="90"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={`${circumference * 0.75} ${circumference}`}
            />
            {/* Progress */}
            <circle
              cx="110" cy="110" r="90"
              fill="none"
              stroke="url(#gaugeGrad)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={`${circumference * 0.75} ${circumference}`}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }}
            />
          </svg>

          {/* Center Content */}
          <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
          }}>
            {isRunning ? (
              <div style={{
                width: '40px', height: '40px',
                border: '3px solid rgba(255,255,255,0.1)',
                borderTopColor: '#3b82f6',
                borderRadius: '50%',
                margin: '0 auto',
                animation: 'spin 0.8s linear infinite',
              }} />
            ) : (
              <>
                <div style={{
                  fontSize: '44px',
                  fontWeight: 800,
                  color: '#f8fafc',
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {downloadSpeed || '0'}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '6px', letterSpacing: '1px' }}>
                  Mbps
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '24px',
        }}>
          {[
            { label: 'PING', value: latency, unit: 'ms', color: '#22c55e' },
            { label: 'DOWNLOAD', value: downloadSpeed, unit: 'Mbps', color: '#3b82f6' },
            { label: 'UPLOAD', value: uploadSpeed, unit: 'Mbps', color: '#8b5cf6' },
          ].map((s) => (
            <div key={s.label} style={{
              flex: 1,
              padding: '12px 6px',
              borderRadius: '14px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{ fontSize: '9px', color: '#64748b', letterSpacing: '1px', marginBottom: '6px' }}>
                {s.label}
              </div>
              <div style={{
                fontSize: '17px',
                fontWeight: 700,
                color: s.value ? s.color : '#334155',
                fontVariantNumeric: 'tabular-nums',
              }} className={s.value ? 'st-fade' : ''}>
                {s.value || '--'}
              </div>
              <div style={{ fontSize: '9px', color: '#475569', marginTop: '2px' }}>{s.unit}</div>
            </div>
          ))}
        </div>

        {error && (
          <p className="st-fade" style={{
            color: '#f87171',
            fontSize: '13px',
            margin: '0 0 16px',
            padding: '10px',
            background: 'rgba(248,113,113,0.1)',
            borderRadius: '10px',
          }}>
            {error}
          </p>
        )}

        {/* Button */}
        <button
          className="st-btn"
          onClick={runTest}
          disabled={isRunning}
          style={{
            width: '100%',
            padding: '14px',
            background: isRunning
              ? 'rgba(255,255,255,0.08)'
              : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            color: isRunning ? '#64748b' : '#fff',
            border: 'none',
            borderRadius: '14px',
            fontSize: '15px',
            fontWeight: 700,
            letterSpacing: '0.3px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            transition: 'all 0.25s ease',
          }}
        >
          {isRunning ? (
            <span className="st-pulse">Testing...</span>
          ) : (
            downloadSpeed ? 'Test Again' : 'Start Test'
          )}
        </button>
      </div>
    </>
  );
}