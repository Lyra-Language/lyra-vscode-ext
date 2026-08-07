# Lyra for VS Code

The official Visual Studio Code extension for the [Lyra](../lyra) programming
language. It provides syntax highlighting and connects the editor to the Lyra
language server for rich language features.

> **Status:** pre-release (v0.0.1), tracking the language as it evolves.

## Features

- **Syntax highlighting** for `.lyra` files (TextMate grammar in
  `syntaxes/lyra.tmLanguage.json`), plus bracket matching, comment toggling, and
  auto-closing pairs (`language-configuration.json`).
- **Language server features** via the `lyra-lsp` binary: completion, hover,
  go-to-definition, find references, rename, semantic tokens, folding ranges,
  inlay hints, document/workspace symbols, signature help, and diagnostics.

The extension itself is a thin LSP client — almost all language intelligence
lives in `lyra-lsp`, built from the sibling [`lyra/`](../lyra) Go project.

## Requirements

You need the **`lyra-lsp`** binary. Build it from the Go project:

```bash
cd ../lyra
./build.sh
```

That writes `build/lyra-lsp` (and `build/lyrac`) with `std/` symlinked beside
them, which is how the standard library is found — a `lyra-lsp` copied somewhere
on its own, with no `std/` next to it, cannot resolve the prelude. Point the
extension at `build/lyra-lsp` with the setting below, or put it on your `$PATH`.

## Compiling and running Lyra programs

The extension is an editor client only — it reports diagnostics as you type but
contributes no build task. Use the compiler CLI, `lyrac`, from a terminal:

```bash
lyrac check prog.lyra   # diagnostics only, no output file
lyrac build prog.lyra   # compile to a native executable (./prog)
lyrac run prog.lyra     # build to a temp location and execute it
```

`lyrac build` links with `clang`, so a C toolchain must be installed; `lyrac
build --emit-llvm` stops at the LLVM IR and needs none.

## Extension settings

| Setting | Default | Description |
|---|---|---|
| `lyra.languageServerPath` | `""` (→ `lyra-lsp` on `$PATH`) | Absolute path to the `lyra-lsp` binary |

## Developing

```bash
npm install
npm run compile      # one-shot TypeScript build → dist/
npm run watch        # rebuild on change
```

To try it out, open this folder in VS Code and press **F5** to launch an
Extension Development Host with the extension loaded. Open a `.lyra` file; make
sure `lyra-lsp` is on your `$PATH` or configured via `lyra.languageServerPath`.

The entire extension is `src/extension.ts` (`activate` spawns the language server
over stdio and registers the client for the `lyra` language). See
[`CLAUDE.md`](CLAUDE.md) for more detail.

## License

[MIT](LICENSE) © Avram Eisner
