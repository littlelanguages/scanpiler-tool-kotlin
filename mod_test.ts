import * as Assert from "https://deno.land/std@0.71.0/testing/asserts.ts";
import { exec, OutputMode } from "https://deno.land/x/exec@0.0.5/mod.ts";

import { denoCommand } from "./mod.ts";

Deno.test("scanpiler-tool-kotlin", async () => {
  await scanpiler(
    "./test/src/main/kotlin",
    "simple.Scanner",
    "./test/src/main/kotlin/simple/simple.ll",
  );
  await gradle();
});

async function scanpiler(directory: string, name: string, fileName: string) {
  await denoCommand(
    fileName,
    { directory, name, force: true, verbose: true },
  );
}

async function gradle() {
  const result = await exec(
    '/bin/bash -c "cd test ; ./gradlew test"',
    { output: OutputMode.StdOut },
  );

  Assert.assertEquals(result.status.code, 0);
}