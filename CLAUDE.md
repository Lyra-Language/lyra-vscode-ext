# lyra-vscode-ext — Project Context

This is the official VS Code extension for the Lyra programming language. It is a thin LSP client wrapper — almost all language intelligence lives in the `lyra-lsp` binary from the sibling `lyra/` Go project.

## Structure

```
src/extension.ts          — the entire extension (activate/deactivate)
syntaxes/lyra.tmLanguage.json  — TextMate grammar for syntax highlighting
test/*.lyra               — sample files for eyeballing highlighting and LSP behaviour
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
- Comments: `//`, `///` (documents the declaration below it), `//!` (documents the enclosing module), `/* */` (nested). **`////` and longer must be matched first**, as an ordinary comment: it is a divider rule, and `///.*$` would otherwise paint a section rule as documentation. The tree-sitter grammar goes to the same trouble for the same input (`include/comments.js`, where `comment` outbids `doc_comment` at `prec(2)`), so the two highlighters agree about what a rule of slashes is.
- Attributes: `@name`, `@name(args)`
- Keywords: `if`, `else`, `for`, `match`, `return`, `break`, `continue`, `with`, `given`, `import`, `module`, `as`, `var`, `let`, `const`, `impl`, `trait`, `struct`, `data`, `tuple`, `newtype`, `where`, `async`, `await`, `yield`, `unsafe`, `pure`, `gen`, `rec`
- `type` (type aliases) — **matched only when followed by a PascalCase name.** `type` is not reserved in Lyra; the tree-sitter grammar makes it a keyword only in declaration position, so `let type = 5` is a legal binding and a bare `\btype\b` would paint it as a keyword. The lookahead is what separates the two.
- Punctuation: `;`, the explicit statement separator (a line break is the ordinary one). Also the separator inside a C-style `for` and an array repeat `[value; count]` — one scope for all three, as C and JavaScript grammars do.
- Storage types: `i8`–`i128`, `u8`–`u128`, `f16`/`f32`/`f64`, `string`, `bool`, `rune`, `fixed`, `void`. Kept in step with tree-sitter-lyra's `_primitive_type`: `int`/`uint` are gone (the language dropped platform-dependent widths for determinism), `float` was never a keyword, `Void` is spelled lowercase, and `never` — the bottom type — is compiler-internal with no syntax, so it is deliberately absent.
- Storage modifiers: `stack`, `shared`, `weak`, `mut`, `ref`, `own`, `pub`
- Operators: arithmetic, comparison, logical, range, compose (`->>`), null-coalesce (`??`), try (`?`), deref (`^`), address-of (`&`)
- Range operators: `..<` `..<=` (ascending) and `..>` `..>=` (descending), plus a bare `..` for the open-ended forms (`range(0..)`, the pattern `10..`) — one rule, `\.\.(<=|>=|<|>)?`. The end operator is a **separate token after `..`** in the tree-sitter grammar (`rangeBounds`, `include/helpers.js`), which is why it is optional here too. Two ordering constraints hold it in place: the longer alternatives come first, or `..<=` matches as `..<` plus a stray `=`; and the rule must stay ahead of the comparison rule, which it is by matching at the earlier `.`. **A range spelling that falls behind the language paints as a range plus a stray comparison**, which is this file's recurring failure mode.
- Bitwise and shift: `<<` `>>` (own rule, `keyword.operator.shift.lyra`), `|`, `~` (xor, and the same token as the prefix complement). `&` is left to the address-of rule — one character, two meanings, and both render as an operator.
- String interpolation: `${...}` inside double-quoted strings
- Raw strings: backtick variants (`` ` ``, `` #` ``, `` ##` ``)
- Regex literals: `r"pattern"`. A single line-bounded `match`, not begin/end, so an unterminated literal degrades to a stray identifier instead of swallowing the file. The old `r/…/` spelling must not come back: `let ratio = r/2 + a/b` paints a string from `r/` to the next `/`, reproducing in the editor the exact ambiguity the language change removed.
- Numeric literals: decimal, hex (`0x`), binary (`0b`), octal (`0o`)
- Type names: any `PascalCase` identifier

### Rule order is a three-way constraint, not a preference

TextMate takes the **earliest** match, and on a tie the **first-listed** rule. Three pairs
in `operators` overlap at the same position, and their constraints form a cycle:

| Must come first | Or else |
|---|---|
| comparison, before logical | `!=` matches as logical `!` plus an unscoped `=` |
| logical, before bitwise | `\|\|` splits into two bitwise `\|` |
| shift, before comparison | `<<` splits into two comparisons `<` `<` |

No ordering satisfies all three, which is why **the shifts are their own rule** ahead of
comparison while `\|`/`~` stay after logical. Moving them back together silently re-breaks
whichever end you move them to — silently because every one of these scopes begins
`keyword.operator`, so most themes paint the wrong answer the same color as the right one,
and a mis-scoped operator can sit for weeks under a comment claiming otherwise.

The residue: the `>>` closing a nested generic (`Maybe<Result<i64, string>>`) paints as a
shift. Unavoidable without a parser — it was two comparisons before, equally wrong — and
both readings are `keyword.operator`, so nothing visible changed.

**Check a change against `test/bitwise.lyra` and `test/ranges.lyra`**, which exist to make
these adjacent cases visible on one screen.

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

- **`lyra/`** (Go) — builds the `lyra-lsp` binary this extension spawns. After changing the Go code, rebuild with `./build.sh` (not a bare `go build`: the script also symlinks `std/` beside the binaries, which is how the prelude is found) and ensure the binary is on `$PATH` or pointed to by the setting.

  The same build produces `lyrac`, the compiler CLI — `check`, `build` (a native executable) and `run`. **The extension contributes no build or run task**, deliberately: it is a language client, and compiling is a terminal command. Worth knowing when a user reports "it type-checks in the editor but I can't run it" — there is nothing in the editor to run it with.
- **`tree-sitter-lyra/`** — the grammar used by the Go parser. No direct dependency from this extension; syntax highlighting uses the separate TextMate grammar.

## Server path resolution

`lyra.languageServerPath` supports **`${workspaceFolder}`**, expanded by the extension
itself (`expandWorkspaceFolder`). VS Code substitutes that variable in tasks and launch
configs but *not* in arbitrary extension settings, so without this the only workable
value is an absolute path — and `lyra.code-workspace` is checked in, so a hardcoded
`/Users/<someone>/...` is wrong for everyone else who opens it.

This is a **multi-root** workspace (compiler, extension, grammar, site), so
`${workspaceFolder}` is genuinely ambiguous. Rather than inventing a rule about which
folder wins, each is tried and the first whose expansion exists on disk is used — a path
that resolves is the one that was meant. When none exist, the first folder's expansion is
returned so the error names a real path rather than an unexpanded variable.

The workspace ships `${workspaceFolder}/build/lyra-lsp`, which is what the compiler
repo's `./build.sh` produces (binaries in `build/`, with `std` beside them so `lyrac`
finds the standard library). An empty setting still falls back to `lyra-lsp` on `PATH`.
