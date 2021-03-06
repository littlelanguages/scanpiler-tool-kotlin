import * as Path from "https://deno.land/std@0.76.0/path/mod.ts";
import {
  asDoc,
  BlockComment,
  Definition,
  dfaForNestedBlockComment,
  dfaForNonNestedBlockComment,
  dfaForTopLevel,
  FA,
  LineComment,
  Node,
  translate,
} from "https://raw.githubusercontent.com/littlelanguages/scanpiler/0.3.0/mod.ts";

import * as PP from "https://raw.githubusercontent.com/littlelanguages/deno-lib-text-prettyprint/0.3.2/mod.ts";
import * as Set from "https://raw.githubusercontent.com/littlelanguages/deno-lib-data-set/0.1.1/mod.ts";

export type CommandOptions = {
  directory: string | undefined;
  name: string;
  force: boolean;
  verbose: boolean;
};

export const command = async (
  fileName: string,
  options: CommandOptions,
): Promise<void> => {
  const [packageName, name] = splitName(options.name);
  const directory = `${options.directory}/${packageName.replaceAll(".", "/")}`;
  const scannerOutputFileName = `${directory}/${name}.kt`;

  await translateScanner(
    fileName,
    directory,
    scannerOutputFileName,
    packageName,
    options,
  );
  return await copyLibrary(options);
};

export const translateScanner = (
  fileName: string,
  directory: string,
  scannerOutfileFileName: string,
  packageName: string,
  options: CommandOptions,
): Promise<void> => {
  if (
    options.force ||
    fileDateTime(fileName) > fileDateTime(scannerOutfileFileName)
  ) {
    const decoder = new TextDecoder("utf-8");
    const src = decoder.decode(Deno.readFileSync(fileName));
    const parseResult = translate(src);

    return parseResult.either((es) =>
      PP.render(
        PP.vcat(
          es.map((e) => PP.hcat(["Error: ", asDoc(e)])).concat(PP.blank),
        ),
        Deno.stdout,
      ), (definition) => {
      if (options.verbose) {
        console.log(`Writing scanner.ts`);
      }
      return Deno.mkdir(directory, { recursive: true }).then((_) =>
        writeScanner(scannerOutfileFileName, packageName, definition)
      );
    });
  } else {
    return Promise.resolve();
  }
};

export const copyLibrary = async (
  options: CommandOptions,
): Promise<void> => {
  const copyFile = async (
    srcName: string,
    targetName: string,
  ): Promise<void> => {
    const outputFileName = `${options.directory}/${targetName}`;

    if (options.force || fileDateTime(outputFileName) === 0) {
      const srcFileName = `${Path.dirname(import.meta.url)}/${srcName}`;

      console.log(`Copy ${srcName}`);

      return Deno.mkdir(Path.dirname(outputFileName), { recursive: true })
        .then((_) =>
          (srcFileName.startsWith("file://"))
            ? Deno.copyFile(
              srcFileName.substr(7),
              outputFileName,
            )
            : srcFileName.startsWith("http://") ||
                srcFileName.startsWith("https://")
            ? fetch(srcFileName).then((response) => response.text()).then((
              t: string,
            ) => Deno.writeFile(outputFileName, new TextEncoder().encode(t)))
            : Deno.copyFile(
              srcFileName,
              outputFileName,
            )
        );
    } else {
      return Promise.resolve();
    }
  };

  await copyFile(
    "lib/kotlin/AbstractScanner.kt",
    "io/littlelanguages/scanpiler/AbstractScanner.kt",
  );
  await copyFile(
    "lib/kotlin/Location.kt",
    "io/littlelanguages/scanpiler/Location.kt",
  );
  await copyFile(
    "lib/kotlin/ScannerReader.kt",
    "io/littlelanguages/scanpiler/ScannerReader.kt",
  );
  return await copyFile(
    "lib/kotlin/Yammable.kt",
    "io/littlelanguages/data/Yammable.kt",
  );
};

export const writeScanner = (
  fileName: string,
  packageName: string,
  definition: Definition,
): Promise<void> => {
  const scannerDoc = PP.vcat([
    PP.hcat(["package ", packageName]),
    PP.blank,
    "import java.io.Reader",
    "import io.littlelanguages.scanpiler.AbstractScanner",
    "import io.littlelanguages.scanpiler.AbstractToken",
    "import io.littlelanguages.scanpiler.Location",
    PP.blank,
    emitScanner(definition),
    PP.blank,
    emitTToken(definition),
    PP.blank,
    emitToken(),
  ]);

  return Deno
    .create(fileName)
    .then((w) => PP.render(scannerDoc, w).then((_) => w.close()))
    .then((_) => {});
};

const emitScanner = (definition: Definition): PP.Doc =>
  PP.vcat([
    "class Scanner(input: Reader): AbstractScanner<TToken>(input, TToken.TERROR) {",
    nestvcat([
      "override fun newToken(ttoken: TToken, location: Location, lexeme: String): AbstractToken<TToken> =",
      nestvcat(["Token(ttoken, location, lexeme)"]),
      PP.blank,
      "override fun next() {",
      nestvcat([
        "if (currentToken.tToken != TToken.TEOS) {",
        nestvcat([
          `while (${writeInSet("nextCh", definition.whitespace)}) {`,
          nest("nextChar()"),
          "}",
          PP.blank,
          "var state = 0",
          emitStateTransitionLoop(
            definition,
            {
              markForState0: true,
              dfa: dfaForTopLevel(definition),
              emitEnd: emitTopLevelEndState,
              stateVariable: "state",
            },
          ),
        ]),
        "}",
      ]),
      "}",
    ]),
    "}",
  ]);

type EmitOnEndState = {
  markForState0: boolean;
  dfa: FA<number>;
  emitEnd: (
    definition: Definition,
    dfa: FA<number>,
    node: Node,
  ) => Array<PP.Doc | string>;
  stateVariable: string;
};

const emitStateTransitionLoop = (
  definition: Definition,
  options: EmitOnEndState,
): PP.Doc =>
  PP.vcat([
    "while (true) {",
    nestvcat([
      `when (${options.stateVariable}) {`,
      nestvcat(emitStates(definition, options)),
      "}",
    ]),
    "}",
  ]);

const emitStates = (
  definition: Definition,
  options: EmitOnEndState,
): Array<PP.Doc> => {
  const dfa = options.dfa;

  return dfa.nodes.flatMap((node) =>
    PP.vcat([
      `${node.id} -> {`,
      nestvcat(
        node.transitions.length === 0
          ? options.emitEnd(definition, dfa, node)
          : [
            PP.vcat(
              node.transitions.flatMap((transition, idx) => [
                `${idx === 0 ? "if " : "} else if "}(${
                  writeInSet("nextCh", transition[0])
                }) {`,
                nestvcat([
                  dfa.endNodes.has(node.id) &&
                    !dfa.endNodes.has(transition[1].id)
                    ? `markBacktrackPoint(TToken.${
                      tokenName(definition, dfa.endNodes.get(node.id)!)
                    })`
                    : PP.empty,
                  (node.id === 0 && options.markForState0)
                    ? "markAndNextChar()"
                    : "nextChar()",
                  `${options.stateVariable} = ${transition[1].id}`,
                ]),
              ]),
            ),
            "} else {",
            nestvcat(options.emitEnd(definition, dfa, node)),
            "}",
          ],
      ),
      "}",
    ])
  );
};

const emitTopLevelEndState = (
  definition: Definition,
  dfa: FA<number>,
  node: Node,
): Array<PP.Doc | string> => {
  const finalToken: number | undefined = dfa.endNodes.get(node.id);

  if (finalToken !== undefined && finalToken > definition.tokens.length) {
    const comment =
      definition.comments[finalToken - definition.tokens.length - 2];

    if (comment instanceof LineComment) {
      return ["next()", "return"];
    } else if (comment instanceof BlockComment) {
      if (comment.nested) {
        return [
          "var nstate = 0",
          "var nesting = 1",
          emitStateTransitionLoop(definition, {
            markForState0: false,
            dfa: dfaForNestedBlockComment(comment.open, comment.close),
            emitEnd: emitNestedCommentEndState,
            stateVariable: "nstate",
          }),
        ];
      } else {
        return [
          "var nstate = 0",
          emitStateTransitionLoop(definition, {
            markForState0: false,
            dfa: dfaForNonNestedBlockComment(comment.close),
            emitEnd: emitNonNestedCommentEndState,
            stateVariable: "nstate",
          }),
        ];
      }
    } else {
      return [];
    }
  } else if (finalToken !== undefined) {
    return [
      `setToken(TToken.${tokenName(definition, finalToken)})`,
      "return",
    ];
  } else if (node.id === 0) {
    return [
      "markAndNextChar()",
      "attemptBacktrackOtherwise(TToken.TERROR)",
      "return",
    ];
  } else {
    return [
      "attemptBacktrackOtherwise(TToken.TERROR)",
      "return",
    ];
  }
};

const emitNestedCommentEndState = (
  _: Definition,
  dfa: FA<number>,
  node: Node,
): Array<PP.Doc | string> => {
  const finalToken: number | undefined = dfa.endNodes.get(node.id);

  if (finalToken === undefined) {
    return [
      "attemptBacktrackOtherwise(TToken.TERROR)",
      "return",
    ];
  } else if (finalToken === 0) {
    return [
      "nstate = 0",
    ];
  } else if (finalToken === 1) {
    return [
      "nesting += 1",
      "nstate = 0",
    ];
  } else {
    return [
      "nesting -= 1",
      "if (nesting == 0) {",
      nestvcat([
        "next()",
        "return",
      ]),
      "} else {",
      nestvcat([
        "nstate = 0",
      ]),
      "}",
    ];
  }
};

const emitNonNestedCommentEndState = (
  _: Definition,
  dfa: FA<number>,
  node: Node,
): Array<PP.Doc | string> => {
  const finalToken: number | undefined = dfa.endNodes.get(node.id);

  if (finalToken === undefined) {
    return [
      "attemptBacktrackOtherwise(TToken.TERROR)",
      "return",
    ];
  } else if (finalToken === 0) {
    return [
      "nstate = 0",
    ];
  } else {
    return [
      "next()",
      "return",
    ];
  }
};

const emitTToken = (definition: Definition): PP.Doc =>
  PP.vcat([
    "enum class TToken {",
    nestvcat(
      definition.tokens
        .map((t) => t[0]).concat(["EOS", "ERROR"])
        .map((t) => `T${t},`),
    ),
    "}",
  ]);

const emitToken = (): PP.Doc =>
  PP.vcat([
    "typealias Token = AbstractToken<TToken>",
  ]);

const tokenName = (definition: Definition, n: number): string => {
  const numberOfTokens = definition.tokens.length;

  if (n < numberOfTokens) {
    return `T${definition.tokens[n][0]}`;
  } else if (n === numberOfTokens) {
    return "TEOS";
  } else {
    return "TERROR";
  }
};

const nest = (doc: PP.Doc | string): PP.Doc => PP.nest(2, doc);

const nestvcat = (docs: Array<PP.Doc | string>): PP.Doc =>
  PP.nest(2, PP.vcat(docs));

const writeInSet = (selector: string, s: Set<number>): string =>
  (Set.isEmpty(s))
    ? "false"
    : Set.asRanges(s).map((r) =>
      (r instanceof Array)
        ? `${selector} in ${r[0]}..${r[1]}`
        : `${selector} == ${r}`
    ).join(" || ");

const splitName = (name: string): [string, string] => {
  const lastIndexOfPeriod = name.lastIndexOf(".");

  return (lastIndexOfPeriod === -1) ? ["", name] : [
    name.substr(0, lastIndexOfPeriod),
    name.substr(lastIndexOfPeriod + 1),
  ];
};

const fileDateTime = (name: string): number => {
  try {
    return Deno.lstatSync(name)?.mtime?.getTime() || 0;
  } catch (_) {
    return 0;
  }
};
