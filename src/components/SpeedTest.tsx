import React, { useState } from 'react';

// URL of a public 10MB file for download speed test
const TEST_FILE_URL = 'https://speed.hetzner.de/10MB.bin';

export default function SpeedTest() {
  const [downloading, setDownloading] = useState(false);
  const [downloadSpeed, setDownloadSpeed] = useState<string>('');
  const [latency, setLatency] = useState<string>('');

  const runTest = async () => {
    setDownloading(true);
    setDownloadSpeed('');
    setLatency('');

    // Measure latency (ping) using a lightweight request
    const pingStart = performance.now();
    try {
      await fetch('https://api.ipify.org?format=json', { method: 'GET', cache: 'no-store' });
    } catch (_) {}
    const pingEnd = performance.now();
    const latencyMs = Math.round(pingEnd - pingStart);
    setLatency(`${latencyMs} ms`);

    // Measure download speed
    const start = performance.now();
    const response = await fetch(TEST_FILE_URL, { cache: 'no-store' });
    const blob = await response.blob();
    const end = performance.now();
    const durationSec = (end - start) / 1000;
    const bitsLoaded = blob.size * 8;
    const speedMbps = (bitsLoaded / durationSec / (1024 * 1024)).toFixed(2);
    setDownloadSpeed(`${speedMbps} Mbps`);
    setDownloading(false);
  };

  return (
    <div className="speed-test-container">
      <h2 className="speed-test-title">Internet Speed Test</h2>
      <button
        className="speed-test-button"
        onClick={runTest}
        disabled={downloading}
      >
        {downloading ? 'Testing...' : 'Start Test'}
      </button>
      {latency && (
        <p className="speed-test-result">Latency: {latency}</p>
      )}
      {downloadSpeed && (
        <p className="speed-test-result">Download Speed: {downloadSpeed}</p>
      )}
      {/* Upload test placeholder */}
      <p className="speed-test-note">Upload test not implemented.</p>
    </div>
  );
}
