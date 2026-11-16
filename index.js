const { performance } = require("node:perf_hooks");

const REQUEST_COUNT = 10;
const REQUEST_TIMEOUT = 30_000;

async function download(url) {
  const startTime = performance.now();

  const response = await fetch(url, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT),
  });

  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  if (!response.body) {
    throw new Error("Response has no body");
  }

  let bytesDownloaded = 0;

  // Дожидаемся полного получения тела ответа
  for await (const chunk of response.body) {
    bytesDownloaded += chunk.length;
  }

  if (bytesDownloaded === 0) {
    throw new Error("Response body is empty");
  }

  const duration = performance.now() - startTime;

  return {
    duration,
    bytesDownloaded,
  };
}

/**
 * @param {{
 *  totalRequests: number,
 *  totalBytes: number,
 *  averageTime: number,
 *  totalTimeSeconds: number,
 *  speedMbps: number
 * }} result
 */

function resultOutput(result) {
  console.log("\n========== RESULTS ==========");
  console.log(`Total requests: ${result.totalRequests}`);
  console.log(
    `Total downloaded: ${(result.totalBytes / 1024 / 1024).toFixed(2)} MB`,
  );
  console.log(`Average request time: ${result.averageTime.toFixed(2)} ms`);
  console.log(`Total time: ${result.totalTimeSeconds.toFixed(2)} sec`);
  console.log(`Download speed: ${result.speedMbps.toFixed(2)} Mbps`);
}

function parseUrl(url) {
  try {
    const parsedUrl = new URL(url);
    const supportedProtocols = ["http:", "https:"];

    if (!supportedProtocols.includes(parsedUrl.protocol)) {
      throw new Error("Only HTTP and HTTPS URLs are supported");
    }

    return parsedUrl;
  } catch (error) {
    throw new Error(
      `${error.message === "Invalid URL" ? "Invalid URL" : error.message}`,
    );
  }
}

async function main() {
  const urlInput = process.argv[2];

  if (!urlInput) {
    throw new Error("Usage: node index.js <URL>");
  }

  const url = parseUrl(urlInput);

  const results = [];

  console.log(`Starting speed test: ${url}`);
  console.log(`Number of requests: ${REQUEST_COUNT}\n`);

  const checkStart = performance.now();

  for (let i = 1; i <= REQUEST_COUNT; i++) {
    try {
      const result = await download(url.href);

      results.push(result);

      console.log(
        `Request ${i}/${REQUEST_COUNT}: ` +
          `${result.duration.toFixed(2)} ms, ` +
          `${(result.bytesDownloaded / 1024).toFixed(2)} KB`,
      );
    } catch (error) {
      throw new Error(
        `Request ${i}/${REQUEST_COUNT} failed: ${error.message}`,
        { cause: error },
      );
    }
  }

  const totalDuration = performance.now() - checkStart;
  const totalTimeSeconds = totalDuration / 1000;

  const totalBytes = results.reduce(
    (sum, result) => sum + result.bytesDownloaded,
    0,
  );

  const speedMbps = (totalBytes * 8) / totalTimeSeconds / 1_000_000;

  const requestTimes = results.map((result) => result.duration);
  const averageTime =
    requestTimes.reduce((sum, time) => sum + time, 0) / REQUEST_COUNT;

  resultOutput({
    totalRequests: REQUEST_COUNT,
    totalBytes,
    averageTime,
    totalTimeSeconds,
    speedMbps,
  });
}

main().catch((error) => {
  console.error(`Check failed: ${error.message}`);
  process.exitCode = 1;
});
