import path from "node:path";

const [, , portArg = "9223", videoArg = "qa-artifacts/sample-30s-360p.mp4"] = process.argv;
const videoPath = path.resolve(videoArg);
const cdpPort = Number(portArg);

const tabs = await fetch(`http://127.0.0.1:${cdpPort}/json/list`).then((response) => response.json());
const tab = tabs.find((item) => item.type === "page") ?? tabs[0];

if (!tab?.webSocketDebuggerUrl) {
  throw new Error(`No Chrome page target found on port ${cdpPort}.`);
}

const ws = new WebSocket(tab.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const events = [];

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) {
      reject(new Error(JSON.stringify(msg.error)));
    } else {
      resolve(msg.result);
    }
  } else if (msg.method) {
    events.push(msg);
  }
};

await new Promise((resolve, reject) => {
  ws.onopen = resolve;
  ws.onerror = reject;
});

function send(method, params = {}) {
  const callId = ++id;
  ws.send(JSON.stringify({ id: callId, method, params }));
  return new Promise((resolve, reject) => pending.set(callId, { resolve, reject }));
}

async function evaluate(expression, timeout = 30000) {
  const result = await send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
    timeout,
  });

  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
  }

  return result.result?.value;
}

async function waitFor(expression, timeoutMs = 30000, intervalMs = 500) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const value = await evaluate(expression).catch(() => false);
    if (value) return value;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(`Timed out waiting for: ${expression}`);
}

try {
  await send("Runtime.enable");
  await send("DOM.enable");
  await send("Page.enable");
  await send("Page.bringToFront");

  const documentNode = await send("DOM.getDocument", { depth: -1, pierce: true });
  const input = await send("DOM.querySelector", {
    nodeId: documentNode.root.nodeId,
    selector: "input[type=file]",
  });

  if (!input.nodeId) throw new Error("File input not found.");

  await send("DOM.setFileInputFiles", { nodeId: input.nodeId, files: [videoPath] });
  await waitFor("document.body.innerText.includes('Exporting to')", 20000);

  const setupState = await evaluate(`(() => {
    const fill = [...document.querySelectorAll('button')].find((button) => button.innerText.includes('Fill'));
    fill?.click();
    const ai = document.querySelector('input[aria-label="Enable AI subject tracking"]');
    if (ai && !ai.checked && !ai.disabled) ai.click();
    return {
      fillFound: Boolean(fill),
      aiDisabled: ai?.disabled ?? null,
      aiChecked: ai?.checked ?? null,
      summary: [...document.querySelectorAll('p')].map((p) => p.innerText).find((text) => text.includes('Exporting to')) ?? null,
    };
  })()`);

  console.log(`STATE ${JSON.stringify(setupState)}`);

  await evaluate("document.querySelector('#export-button')?.click()");
  await waitFor(
    "document.body.innerText.includes('Finding subject') || document.body.innerText.includes('Loading engine') || document.body.innerText.includes('Exporting')",
    15000
  );

  const startedAt = Date.now();
  let lastProgress = "";
  let completed = false;

  while (Date.now() - startedAt < 420000) {
    const status = await evaluate(`(() => {
      const text = document.body.innerText;
      const progress = (text.match(/(\\d+)%/) ?? [])[1] ?? null;
      return {
        done: text.includes('Download') && text.includes('Export complete'),
        error: text.includes('Export failed') || text.includes('Error'),
        progress,
        text: text.slice(0, 1500),
      };
    })()`);

    if (status.progress && status.progress !== lastProgress) {
      lastProgress = status.progress;
      console.log(`PROGRESS ${status.progress}%`);
    }

    if (status.done) {
      completed = true;
      break;
    }

    if (status.error) {
      throw new Error(`Export error: ${status.text}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  if (!completed) {
    throw new Error("Export did not complete within the QA timeout.");
  }

  const result = await evaluate(`(async () => {
    const link = document.querySelector('a[download]');
    if (!link) return { error: 'download link missing', text: document.body.innerText.slice(-1500) };
    const blob = await fetch(link.href).then((response) => response.blob());
    return await new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        const metadata = {
          size: blob.size,
          width: video.videoWidth,
          height: video.videoHeight,
          duration: video.duration,
          download: link.getAttribute('download'),
        };
        URL.revokeObjectURL(url);
        resolve(metadata);
      };
      video.onerror = () => reject(new Error('Exported video metadata failed.'));
      video.src = url;
    });
  })()`, 60000);

  console.log(`RESULT ${JSON.stringify(result)}`);
  const interestingEvents = events
    .filter((event) => event.method.includes("exception") || event.method.includes("Log"))
    .slice(-10);
  console.log(`EVENTS ${JSON.stringify(interestingEvents)}`);
} finally {
  ws.close();
}
