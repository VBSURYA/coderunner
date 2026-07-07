import React, { useState, useRef } from 'react';
import Seo from './Seo';
type TestStatus = 'idle' | 'pinging' | 'downloading' | 'uploading' | 'complete';

export default function SpeedTest() {
  const [status, setStatus] = useState<TestStatus>('idle');
  const [downloadSpeed, setDownloadSpeed] = useState<string>('');
  const [uploadSpeed, setUploadSpeed] = useState<string>('');
  const [latency, setLatency] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const abortRef = useRef<AbortController | null>(null);

  // Multiple ping endpoints for reliability
  const PING_URLS = [
    'https://api.ipify.org?format=json',
    'https://httpbin.org/get',
    'https://jsonplaceholder.typicode.com/posts/1',
  ];

  // Measure latency with multiple pings and average
  const measureLatency = async (signal: AbortSignal): Promise<number> => {
    const pings: number[] = [];
    for (const url of PING_URLS) {
      try {
        const start = performance.now();
        await fetch(url, { method: 'GET', cache: 'no-store', signal });
        const end = performance.now();
        pings.push(end - start);
        break; // one successful ping is enough
      } catch {
        continue;
      }
    }

    if (pings.length === 0) {
      // Fallback: measure with multiple attempts to first working URL
      for (let i = 0; i < 3; i++) {
        try {
          const start = performance.now();
          await fetch(PING_URLS[2], { method: 'GET', cache: 'no-store', signal });
          const end = performance.now();
          pings.push(end - start);
        } catch {
          break;
        }
      }
    }

    if (pings.length === 0) throw new Error('Ping failed');
    return Math.round(pings.reduce((a, b) => a + b, 0) / pings.length);
  };

  // Download speed using generated data from CORS-friendly endpoints
  const measureDownload = async (signal: AbortSignal): Promise<number> => {
    const urls = [
      // Use multiple chunk downloads to estimate speed
      'https://jsonplaceholder.typicode.com/photos', // ~30KB JSON
      'https://jsonplaceholder.typicode.com/comments', // ~90KB JSON
    ];

    let totalBytes = 0;
    const start = performance.now();

    // Download multiple resources in parallel for better measurement
    const promises = [];
    for (let i = 0; i < 5; i++) {
      for (const url of urls) {
        promises.push(
          fetch(`${url}?_cache=${Date.now()}_${i}`, { cache: 'no-store', signal })
            .then(r => r.blob())
            .then(b => { totalBytes += b.size; })
            .catch(() => {})
        );
      }
    }

    await Promise.all(promises);
    const end = performance.now();

    if (totalBytes === 0) throw new Error('Download failed');

    const durationSec = (end - start) / 1000;
    const bitsLoaded = totalBytes * 8;
    return parseFloat((bitsLoaded / durationSec / (1024 * 1024)).toFixed(2));
  };

  // Upload speed measurement
  const measureUpload = async (signal: AbortSignal): Promise<number> => {
    const uploadUrls = [
      'https://httpbin.org/post',
      'https://jsonplaceholder.typicode.com/posts',
    ];

    const payloadSize = 512 * 1024; // 512KB
    const payload = new Blob([new ArrayBuffer(payloadSize)]);
    let successfulUpload = false;
    let speedMbps = 0;

    for (const url of uploadUrls) {
      try {
        const start = performance.now();
        const response = await fetch(url, {
          method: 'POST',
          body: payload,
          cache: 'no-store',
          signal,
        });
        if (!response.ok) continue;
        const end = performance.now();
        const durationSec = (end - start) / 1000;
        const bitsLoaded = payloadSize * 8;
        speedMbps = parseFloat((bitsLoaded / durationSec / (1024 * 1024)).toFixed(2));
        successfulUpload = true;
        break;
      } catch {
        continue;
      }
    }

    if (!successfulUpload) throw new Error('Upload failed');
    return speedMbps;
  };

  const runTest = async () => {
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    setStatus('pinging');
    setDownloadSpeed('');
    setUploadSpeed('');
    setLatency('');
    setError('');
    setProgress(0);

    try {
      // 1. Latency
      setProgress(10);
      const ping = await measureLatency(signal);
      setLatency(`${ping}`);
      setProgress(25);

      // 2. Download
      setStatus('downloading');
      setProgress(30);
      const downSpeed = await measureDownload(signal);
      setDownloadSpeed(`${downSpeed}`);
      setProgress(65);

      // 3. Upload
      setStatus('uploading');
      setProgress(70);
      const upSpeed = await measureUpload(signal);
      setUploadSpeed(`${upSpeed}`);
      setProgress(100);

      setStatus('complete');
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setError('Test cancelled.');
      } else {
        console.error(err);
        setError('Test failed. Check your connection and try again.');
      }
      setStatus('idle');
    }
  };

  const cancelTest = () => {
    abortRef.current?.abort();
    setStatus('idle');
    setProgress(0);
  };

  const isRunning = status !== 'idle' && status !== 'complete';

  const gaugeValue = downloadSpeed || '0';
  const gaugePercent = Math.min(parseFloat(gaugeValue) / 100, 1);
  const circumference = 2 * Math.PI * 90;
  const dashOffset = circumference - gaugePercent * circumference * 0.75;

  const getStatusLabel = () => {
    switch (status) {
      case 'pinging': return '🔍 Measuring latency...';
      case 'downloading': return '⬇️ Testing download speed...';
      case 'uploading': return '⬆️ Testing upload speed...';
      case 'complete': return '✅ Test complete';
      default: return 'Press Start to begin';
    }
  };

  const getSpeedRating = (speed: string): string => {
    const s = parseFloat(speed);
    if (s >= 50) return 'Excellent';
    if (s >= 25) return 'Very Good';
    if (s >= 10) return 'Good';
    if (s >= 5) return 'Fair';
    return 'Poor';
  };

  const getLatencyRating = (ms: string): string => {
    const l = parseInt(ms);
    if (l <= 20) return 'Excellent';
    if (l <= 50) return 'Great';
    if (l <= 100) return 'Good';
    if (l <= 200) return 'Fair';
    return 'Poor';
  };

  const getRatingColor = (rating: string): string => {
    switch (rating) {
      case 'Excellent': return '#22c55e';
      case 'Very Good':
      case 'Great': return '#4ade80';
      case 'Good': return '#facc15';
      case 'Fair': return '#fb923c';
      case 'Poor': return '#ef4444';
      default: return '#64748b';
    }
  };

  return (
    <>
      <Seo title="Speed Test – CodeRunner" description="Measure your internet speed (download, upload, latency) with CodeRunner's accurate web‑based speed test." keywords="speed test,internet speed test, internet, download, upload, latency, CodeRunner" canonical="https://zeroconfigide.netlify.app/speedtest" />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes glow { 0%,100% { filter: drop-shadow(0 0 6px rgba(59,130,246,0.3)); } 50% { filter: drop-shadow(0 0 14px rgba(139,92,246,0.5)); } }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .st-pulse { animation: pulse 1.5s ease-in-out infinite; }
        .st-fadeUp { animation: fadeInUp 0.6s ease forwards; }
        .st-glow { animation: glow 2s ease-in-out infinite; }
        .st-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(59,130,246,0.4);
        }
        .st-btn:active:not(:disabled) { transform: translateY(0); }
        .st-cancel:hover { background: rgba(239,68,68,0.2) !important; }
        .st-card:hover { background: rgba(255,255,255,0.07) !important; border-color: rgba(255,255,255,0.1) !important; }
      `}</style>

      <div style={{
        maxWidth: '420px',
        margin: '40px auto',
        padding: '36px 32px',
        borderRadius: '28px',
        background: 'linear-gradient(160deg, #1e293b 0%, #0f172a 50%, #1a1a2e 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        textAlign: 'center',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.06)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle top accent line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '15%',
          right: '15%',
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #3b82f6, #8b5cf6, transparent)',
          borderRadius: '0 0 4px 4px',
          opacity: 0.6,
        }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '4px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: isRunning ? '#3b82f6' : status === 'complete' ? '#22c55e' : '#64748b',
            boxShadow: isRunning ? '0 0 8px #3b82f6' : status === 'complete' ? '0 0 8px #22c55e' : 'none',
            transition: 'all 0.3s',
          }} />
          <h2 style={{
            margin: 0,
            color: '#f8fafc',
            fontSize: '24px',
            fontWeight: 800,
            letterSpacing: '-0.5px',
          }}>
            Speed Test
          </h2>
        </div>
        <p style={{
          margin: '0 0 28px',
          color: '#94a3b8',
          fontSize: '13px',
          transition: 'all 0.3s',
        }}>
          {getStatusLabel()}
        </p>

        {/* Progress Bar */}
        {isRunning && (
          <div style={{
            width: '100%',
            height: '3px',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: '4px',
            marginBottom: '24px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
              borderRadius: '4px',
              transition: 'width 0.5s ease',
            }} />
          </div>
        )}

        {/* Circular Gauge */}
        <div style={{
          position: 'relative',
          width: '230px',
          height: '230px',
          margin: '0 auto 28px',
        }}>
          <svg
            width="230"
            height="230"
            style={{ transform: 'rotate(135deg)' }}
            className={isRunning ? 'st-glow' : ''}
          >
            <defs>
              <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
              <filter id="gaugeGlow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Tick marks */}
            {Array.from({ length: 27 }, (_, i) => {
              const angle = (i / 26) * 270 * (Math.PI / 180);
              const isMajor = i % 5 === 0;
              const innerR = isMajor ? 70 : 74;
              const outerR = 78;
              return (
                <line
                  key={i}
                  x1={115 + innerR * Math.cos(angle)}
                  y1={115 + innerR * Math.sin(angle)}
                  x2={115 + outerR * Math.cos(angle)}
                  y2={115 + outerR * Math.sin(angle)}
                  stroke={
                    i / 26 <= gaugePercent
                      ? 'rgba(99,102,241,0.5)'
                      : 'rgba(255,255,255,0.08)'
                  }
                  strokeWidth={isMajor ? 2 : 1}
                  strokeLinecap="round"
                  style={{ transition: 'stroke 0.5s ease' }}
                />
              );
            })}

            {/* Track */}
            <circle
              cx="115" cy="115" r="90"
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${circumference * 0.75} ${circumference}`}
            />
            {/* Progress arc */}
            <circle
              cx="115" cy="115" r="90"
              fill="none"
              stroke="url(#gaugeGrad)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${circumference * 0.75} ${circumference}`}
              strokeDashoffset={dashOffset}
              filter="url(#gaugeGlow)"
              style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)' }}
            />
          </svg>

          {/* Center Content */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -55%)',
          }}>
            {isRunning ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  border: '3px solid rgba(255,255,255,0.08)',
                  borderTopColor: '#3b82f6',
                  borderRightColor: '#8b5cf6',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }} />
                <div style={{ fontSize: '11px', color: '#64748b', letterSpacing: '1px' }}>
                  {status.toUpperCase()}
                </div>
              </div>
            ) : (
              <div className={downloadSpeed ? 'st-fadeUp' : ''}>
                <div style={{
                  fontSize: '48px',
                  fontWeight: 800,
                  color: '#f8fafc',
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                  textShadow: downloadSpeed ? '0 0 20px rgba(99,102,241,0.3)' : 'none',
                }}>
                  {downloadSpeed || '0'}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#64748b',
                  marginTop: '8px',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                }}>
                  Mbps
                </div>
                {downloadSpeed && (
                  <div style={{
                    fontSize: '11px',
                    color: getRatingColor(getSpeedRating(downloadSpeed)),
                    marginTop: '4px',
                    fontWeight: 600,
                  }}>
                    {getSpeedRating(downloadSpeed)}
                  </div>
                )}
              </div>
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
            {
              label: 'PING',
              icon: '📡',
              value: latency,
              unit: 'ms',
              color: '#22c55e',
              rating: latency ? getLatencyRating(latency) : '',
            },
            {
              label: 'DOWNLOAD',
              icon: '⬇️',
              value: downloadSpeed,
              unit: 'Mbps',
              color: '#3b82f6',
              rating: downloadSpeed ? getSpeedRating(downloadSpeed) : '',
            },
            {
              label: 'UPLOAD',
              icon: '⬆️',
              value: uploadSpeed,
              unit: 'Mbps',
              color: '#8b5cf6',
              rating: uploadSpeed ? getSpeedRating(uploadSpeed) : '',
            },
          ].map((s) => (
            <div
              key={s.label}
              className="st-card"
              style={{
                flex: 1,
                padding: '14px 8px',
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.05)',
                transition: 'all 0.3s ease',
                cursor: 'default',
              }}
            >
              <div style={{ fontSize: '14px', marginBottom: '4px' }}>{s.icon}</div>
              <div style={{
                fontSize: '9px',
                color: '#64748b',
                letterSpacing: '1.2px',
                marginBottom: '8px',
                fontWeight: 600,
              }}>
                {s.label}
              </div>
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  color: s.value ? s.color : '#2a2a3a',
                  fontVariantNumeric: 'tabular-nums',
                  transition: 'color 0.3s',
                  minHeight: '24px',
                }}
                className={s.value ? 'st-fadeUp' : ''}
              >
                {s.value || '--'}
              </div>
              <div style={{
                fontSize: '9px',
                color: '#475569',
                marginTop: '3px',
              }}>
                {s.unit}
              </div>
              {s.rating && (
                <div
                  className="st-fadeUp"
                  style={{
                    fontSize: '8px',
                    color: getRatingColor(s.rating),
                    marginTop: '6px',
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                    padding: '2px 8px',
                    background: `${getRatingColor(s.rating)}15`,
                    borderRadius: '6px',
                    display: 'inline-block',
                  }}
                >
                  {s.rating.toUpperCase()}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="st-fadeUp" style={{
            color: '#f87171',
            fontSize: '13px',
            margin: '0 0 16px',
            padding: '12px 16px',
            background: 'rgba(248,113,113,0.08)',
            borderRadius: '12px',
            border: '1px solid rgba(248,113,113,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            justifyContent: 'center',
          }}>
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {isRunning ? (
            <button
              className="st-cancel"
              onClick={cancelTest}
              style={{
                flex: 1,
                padding: '14px',
                background: 'rgba(239,68,68,0.1)',
                color: '#f87171',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '14px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.25s ease',
              }}
            >
              Cancel
            </button>
          ) : (
            <button
              className="st-btn"
              onClick={runTest}
              style={{
                flex: 1,
                padding: '16px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)',
                backgroundSize: '200% 200%',
                color: '#fff',
                border: 'none',
                borderRadius: '14px',
                fontSize: '15px',
                fontWeight: 700,
                letterSpacing: '0.3px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
              }}
            >
              {status === 'complete' ? '🔄 Test Again' : '🚀 Start Test'}
            </button>
          )}
        </div>

        {/* Footer */}
        <p style={{
          margin: '20px 0 0',
          color: '#334155',
          fontSize: '10px',
          letterSpacing: '0.5px',
        }}>
          Results may vary based on network conditions
        </p>
      </div>
    </>
  );
}