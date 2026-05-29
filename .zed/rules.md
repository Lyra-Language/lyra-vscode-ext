# lyra-vscode-ext — Project Context for Zed AI

This is the official VS Code extension for the Lyra programming language. It is a thin LSP client wrapper — almost all language intelligence lives in the `lyra-lsp` binary from the sibling `lyra/` Go project.

## Structure

```
src/extension.ts          — the entire extension (activate/deactivate)
syntaxes/lyra.tmLanguage.json  — TextMate grammar for syntax highlighting
language-configuration.json    — bracket pairs, comment tokens, auto-close rules
dist/                     — compiled output (tsc → JS, gitignored)
```

There is no test suite yet.

## How It Works

`activate()` in `src/extension.ts`:
1. Reads the `lyra.languageServerPath` VS Code setting (defaults to `"lyra-lsp"` on `$PATH`)
2. Creates a `LanguageClient` (from `vscode-languageclient/node`) configured to spawn that binary via **stdio**
3. Registers the client for documents with language ID `lyra` (file extension `.lyra`)
4. Starts the client

`deactivate()` stops the client cleanly.

The extension contributes one VS Code setting:

| Setting | Type | Default | Description |
|---|---|---|---|
| `lyra.languageServerPath` | string | `""` (→ `lyra-lsp`) | Absolute path to the `lyra-lsp` binary |

## Language Registration

- Language ID: `lyra`
- File extension: `.lyra`
- Aliases: `Lyra`, `lyra`
- Scope name: `source.lyra`

## Syntax Highlighting (`syntaxes/lyra.tmLanguage.json`)

TextMate grammar — not generated from tree-sitter. Covers:
- Comments: `//`, `///` (doc), `/* */` (nested)
- Attributes: `@name`, `@name(args)`
- Keywords: `if`, `else`, `for`, `match`, `return`, `break`, `continue`, `with`, `given`, `import`, `module`, `as`, `var`, `let`, `const`, `impl`, `trait`, `struct`, `data`, `tuple`, `newtype`, `where`, `async`, `await`, `yield`, `unsafe`, `pure`, `gen`, `rec`
- Storage types: `int`, `i8`–`i64`, `uint`, `u8`–`u64`, `f16`/`f32`/`f64`, `string`, `bool`, `fixed`
- Storage modifiers: `stack`, `shared`, `weak`, `mut`, `ref`, `own`, `pub`
- Operators: arithmetic, comparison, logical, range (`..`, `..=`), compose (`->>`), null-coalesce (`??`), try (`?`), deref (`^`), address-of (`&`)
- String interpolation: `${...}` inside double-quoted strings
- Raw strings: backtick variants (`` ` ``, `` #` ``, `` ##` ``)
- Regex literals: `r/pattern/`
- Numeric literals: decimal, hex (`0x`), binary (`0b`), octal (`0o`)
- Type names: any `PascalCase` identifier

## Commands

```bash
npm run compile    # tsc one-shot build → dist/
npm run watch      # tsc in watch mode
```

To test the extension locally, press **F5** in VS Code with this folder open (launches an Extension Development Host). The `lyra-lsp` binary must be on `$PATH` or configured via `lyra.languageServerPath`.

## Dependencies

- `vscode-languageclient` ^9.0.1 — LSP client library
- `@types/vscode` ^1.118.0 — VS Code API types
- `typescript` ^5.0.0 — compiler (dev only)

## Relationship to Other Sub-Projects

- **`lyra/`** (Go) — builds the `lyra-lsp` binary this extension spawns. After changing the Go code, rebuild with `go build ./cmd/lyra-lsp` and ensure the binary is on `$PATH` or pointed to by the setting.
- **`tree-sitter-lyra/`** — the grammar used by the Go parser. No direct dependency from this extension; syntax highlighting uses the separate TextMate grammar.
