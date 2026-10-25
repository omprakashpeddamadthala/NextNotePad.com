import assert from "node:assert/strict";
import test from "node:test";
import { applySpokenRules, finishSentences } from "./dictationRules";
import { fixGrammar } from "./grammarFix";

const clean = (raw: string) => finishSentences(applySpokenRules(raw));

test("filler words are removed", () => {
  assert.equal(clean("um so uh the plan is ready"), "So the plan is ready.");
  assert.equal(clean("hmm I think erm we should go"), "I think we should go.");
});

test("spoken punctuation becomes symbols", () => {
  assert.equal(clean("hello comma how are you question mark"), "Hello, how are you?");
  assert.equal(clean("that is great exclamation mark"), "That is great!");
  assert.equal(clean("buy milk full stop then eggs"), "Buy milk. Then eggs.");
});

test("period is only punctuation at the end", () => {
  assert.equal(clean("the trial period ended period"), "The trial period ended.");
});

test("new line and new paragraph insert breaks", () => {
  assert.equal(clean("groceries new line milk new line eggs"), "Groceries\nMilk\nEggs.");
  assert.equal(clean("first part new paragraph second part"), "First part\n\nSecond part.");
});

test("scratch that removes the previous sentence", () => {
  assert.equal(
    clean("call mom full stop meet at noon scratch that meet at one"),
    "Call mom. Meet at one.",
  );
  assert.equal(clean("send the email scratch that call him instead"), "Call him instead.");
});

test("sentence starts are capitalised and i becomes I", () => {
  assert.equal(clean("i know. i will go"), "I know. I will go.");
});

test("existing end punctuation is kept", () => {
  assert.equal(clean("is it ready question mark"), "Is it ready?");
});

test("empty and filler-only input produce nothing", () => {
  assert.equal(applySpokenRules("   "), "");
  assert.equal(applySpokenRules("um uh"), "");
});

test("Harper fixes grammar without touching names", async () => {
  // harper.js is ESM-only; load it dynamically from this CommonJS test.
  const { LocalLinter } = await import("harper.js");
  const { binaryInlined } = await import("harper.js/binaryInlined");
  const linter = new LocalLinter({ binary: binaryInlined });
  await linter.setup();
  const fix = async (raw: string) => finishSentences(await fixGrammar(applySpokenRules(raw), linter));

  assert.equal(
    await fix("so the meeting is at 3 pm and we needs to bring the the report"),
    "So the meeting is at 3 pm and we need to bring the report.",
  );
  assert.equal(await fix("this is a example with alot of mistakes"), "This is an example with a lot of mistakes.");
  assert.equal(await fix("she dont know about it"), "She doesn't know about it.");
  assert.equal(await fix("remind john to send the slides to Priya"), "Remind john to send the slides to Priya.");
});
