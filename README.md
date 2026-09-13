# Lyra for VS Code

The official VS Code extension for the [Lyra](../lyra) programming language.

> **Status:** pre-release (v0.0.1), tracking the language as it evolves.

## Features

- **Syntax highlighting** for `.lyra` (TextMate grammar), bracket matching, comment toggling
  and auto-closing pairs.
- **Language server features** via `lyra-lsp`: completion, hover, go-to-definition,
  references, rename, semantic tokens, folding, inlay hints, symbols, signature help and
  diagnostics.

## Requirements

Build `lyra-lsp` from the Go project:

```bash
cd ../lyra
./build.sh
```

This writes `build/lyra-lsp` and `build/lyrac` with `std/` symlinked beside them — a
`lyra-lsp` copied elsewhere on its own cannot find the prelude. Point
`lyra.languageServerPath` at `build/lyra-lsp` (`${workspaceFolder}` is supported), or put it
on `$PATH`.

| Setting | Default | Description |
|---|---|---|
| `lyra.languageServerPath` | `""` (→ `lyra-lsp` on `$PATH`) | Path to the `lyra-lsp` binary |

## Compiling and running Lyra programs

The extension contributes no build task. Use `lyrac` from a terminal:

```bash
lyrac check prog.lyra   # diagnostics only
lyrac build prog.lyra   # native executable (./prog); needs clang
lyrac run prog.lyra     # build to a temp location and execute
```

`lyrac build --emit-llvm` stops at LLVM IR and needs no C toolchain.

## Developing

```bash
npm install
npm run compile      # one-shot build → dist/
npm run watch        # rebuild on change
```

Press **F5** in VS Code to launch an Extension Development Host. See [`CLAUDE.md`](CLAUDE.md).

## License

[MIT](LICENSE) © Avram Eisner
