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
go build ./cmd/lyra-lsp
```

Then either put the resulting `lyra-lsp` on your `$PATH`, or point the extension
at it with the setting below.

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
