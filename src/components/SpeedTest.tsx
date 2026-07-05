'use client';

import React, { useState } from 'react';

// URL of a public 10MB file for download speed test
const TEST_FILE_URL = 'https://speed.hetzner.de/10MB.bin';

// Public upload endpoint
const UPLOAD_TEST_URL = 'https://speed.cloudflare.com/__up';

const DOWNLOAD_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const UPLOAD_FILE_SIZE_BYTES = 2 * 1024 * 1024;

export default function SpeedTest() {
  const [downloading, setDownloading] = useState(false);
  const [downloadSpeed, setDownloadSpeed] = useState<string>('');
  const [uploadSpeed, setUploadSpeed] = useState<string>('');
  const [latency, setLatency] = useState<string>('');
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');

  const addCacheBuster = (url: string) => {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${Date.now()}`;
  };

  const formatMbps = (bytes: number, durationMs: number) => {
    const durationSec = durationMs / 1000;
    if (durationSec <= 0) return '0.00';

    return ((bytes * 8) / durationSec / (1024 * 1024)).toFixed(2);
  };

  const wait = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const getErrorMessage = (err: unknown) => {
    if (err instanceof Error && err.name === 'AbortError') {
      return 'Request timed out.';
    }

    return err instanceof Error ? err.message : 'Something went wrong.';
  };

  const appendError = (message: string) => {
    setError((prev) => (prev ? `${prev}\n${message}` : message));
  };

  const fetchWithTimeout = async (
    url: string,
    options: RequestInit = {},
    timeoutMs = 10000
  ) => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(url, {
        ...options,
        signal: controller.signal,
      });
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const measureLatency = async () => {
    const samples: number[] = [];

    for (let i = 0; i < 3; i += 1) {
      const start = performance.now();

      try {
        const response = await fetchWithTimeout(
          addCacheBuster('https://api.ipify.org?format=json'),
          { method: 'GET', cache: 'no-store' },
          8000
        );

        if (!response.ok) {
          throw new Error(`Ping failed (${response.status}).`);
        }

        await response.text();

        samples.push(performance.now() - start);
      } catch (_) {
        // Ignore single failed ping
      }

      if (i < 2) {
        await wait(150);
      }
    }

    if (!samples.length) {
      throw new Error('Latency test failed.');
    }

    const average =
      samples.reduce((total, sample) => total + sample, 0) / samples.length;

    return Math.round(average);
  };

  const measureDownloadSpeed = async () => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(addCacheBuster(TEST_FILE_URL), {
        cache: 'no-store',
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Download failed (${response.status}).`);
      }

      const contentLength =
        Number(response.headers.get('content-length')) || DOWNLOAD_FILE_SIZE_BYTES;

      let loadedBytes = 0;
      const start = performance.now();

      if (response.body) {
        const reader = response.body.getReader();

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          loadedBytes += value.byteLength;

          setDownloadProgress(
            Math.min(100, Math.round((loadedBytes / contentLength) * 100))
          );
        }
      } else {
        const blob = await response.blob();
        loadedBytes = blob.size;
      }

      const end = performance.now();

      setDownloadProgress(100);

      return formatMbps(loadedBytes, end - start);
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const createUploadBlob = (size: number) => {
    const data = new Uint8Array(size);
    const chunkSize = 65536;

    for (let i = 0; i < size; i += chunkSize) {
      const chunk = data.subarray(i, Math.min(i + chunkSize, size));

      if (window.crypto?.getRandomValues) {
        window.crypto.getRandomValues(chunk);
      } else {
        for (let j = 0; j < chunk.length; j += 1) {
          chunk[j] = Math.floor(Math.random() * 256);
        }
      }
    }

    return new Blob([data.buffer as ArrayBuffer]);
  };

  const measureUploadSpeed = () => {
    const uploadBlob = createUploadBlob(UPLOAD_FILE_SIZE_BYTES);

    return new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let start = 0;

      xhr.open('POST', UPLOAD_TEST_URL, true);
      xhr.timeout = 60000;

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setUploadProgress(
            Math.min(100, Math.round((event.loaded / event.total) * 100))
          );
        }
      };

      xhr.onload = () => {
        const end = performance.now();

        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadProgress(100);
          resolve(formatMbps(uploadBlob.size, end - start));
        } else {
          reject(new Error(`Upload failed (${xhr.status}).`));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Upload failed. Please check CORS or endpoint access.'));
      };

      xhr.ontimeout = () => {
        reject(new Error('Upload timed out.'));
      };

      start = performance.now();
      xhr.send(uploadBlob);
    });
  };

  const runTest = async () => {
    setDownloading(true);
    setDownloadSpeed('');
    setUploadSpeed('');
    setLatency('');
    setDownloadProgress(0);
    setUploadProgress(0);
    setStatus('');
    setError('');

    try {
      try {
        setStatus('Checking latency...');
        const latencyMs = await measureLatency();
        setLatency(`${latencyMs} ms`);
      } catch (err) {
        setLatency('Failed');
        appendError(getErrorMessage(err));
      }

      try {
        setStatus('Measuring download speed...');
        const speedMbps = await measureDownloadSpeed();
        setDownloadSpeed(`${speedMbps} Mbps`);
      } catch (err) {
        setDownloadSpeed('Failed');
        appendError(getErrorMessage(err));
      }

      try {
        setStatus('Measuring upload speed...');
        const speedMbps = await measureUploadSpeed();
        setUploadSpeed(`${speedMbps} Mbps`);
      } catch (err) {
        setUploadSpeed('Failed');
        appendError(getErrorMessage(err));
      }
    } finally {
      setStatus('');
      setDownloading(false);
    }
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

      {status && (
        <p className="speed-test-note">{status}</p>
      )}

      {latency && (
        <p className="speed-test-result">Latency: {latency}</p>
      )}

      {(status === 'Measuring download speed...' || downloadProgress > 0) && (
        <p className="speed-test-result">
          Download Progress: {downloadProgress}%
        </p>
      )}

      {downloadSpeed && (
        <p className="speed-test-result">
          Download Speed: {downloadSpeed}
        </p>
      )}

      {(status === 'Measuring upload speed...' || uploadProgress > 0) && (
        <p className="speed-test-result">
          Upload Progress: {uploadProgress}%
        </p>
      )}

      {uploadSpeed && (
        <p className="speed-test-result">
          Upload Speed: {uploadSpeed}
        </p>
      )}

      {error && (
        <p className="speed-test-note" style={{ whiteSpace: 'pre-line' }}>
          {error}
        </p>
      )}

      <p className="speed-test-note">
        Results are approximate and may vary depending on server and network conditions.
      </p>
    </div>
  );
}