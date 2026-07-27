import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("https://gambl-poker.fantomzone.app/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the finished Gambl Poker menu", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Gambl Poker — Texas Hold’em<\/title>/i);
  assert.match(html, /Play vs\. CPU/);
  assert.match(html, /Multiplayer/);
  assert.match(html, /How to play/);
  assert.match(html, /Guided tutorial/);
  assert.match(html, /Settings/);
  assert.match(html, /Sit down\./);
  assert.match(html, /Own the pot\./);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|react-loading-skeleton/i);
});

test("keeps the PRD menu, gameplay, and mobile-visibility contract", async () => {
  const [page, css, layout, packageJson, agentFile] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../.agent", import.meta.url), "utf8"),
  ]);

  for (const requiredCopy of [
    "Play vs. CPU",
    "Multiplayer",
    "How to play",
    "Guided tutorial",
    "In-game hints",
    "All-in",
    "Dealer asks",
    "are answering",
    "Deal next hand",
  ]) {
    assert.match(page, new RegExp(requiredCopy, "i"));
  }

  assert.match(page, /bestHand/);
  assert.match(page, /makeDeck/);
  assert.match(page, /phaseOrder/);
  assert.match(page, /smallBlindIndex/);
  assert.match(page, /bigBlindIndex/);
  assert.match(page, /hintsOn, setHintsOn\] = useState\(false\)/);

  assert.match(css, /@media \(max-width:\s*680px\)/);
  assert.match(css, /\.poker-table/);
  assert.match(css, /\.board-cards/);
  assert.match(css, /\.decision-dock/);
  assert.match(css, /min-width:\s*320px/);

  assert.match(layout, /\/og\.png/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.match(agentFile, /320px wide/);

  await access(new URL("../public/og.png", import.meta.url));
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
});
