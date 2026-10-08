# lyra-vscode-ext — Project Context

VS Code extension for Lyra: a thin LSP client for `lyra-lsp` (from `lyra/`), plus a
hand-written TextMate grammar.

## Structure

```
src/extension.ts               — the entire extension (activate/deactivate)
syntaxes/lyra.tmLanguage.json  — TextMate grammar (not generated from tree-sitter)
syntaxes/glsl.tmLanguage.json  — bundled GLSL for `/* glsl */` raw strings (MIT, LICENSE-GLSL)
language-configuration.json    — brackets, comment tokens, auto-close
test/*.lyra                    — samples for eyeballing highlighting/LSP
dist/                          — tsc output (gitignored)
```

No test suite.

**Formatting is the server's**, not this extension's: `lyra-lsp` implements
`textDocument/formatting` by running `lyrafmt`, so `Format Document` needs no client code
here and no setting. See `lyra/cmd/lyra-lsp/README.md`.

## Commands

```bash
npm run compile    # tsc → dist/
npm run watch
```

**F5** launches an Extension Development Host. Deps: `vscode-languageclient` ^9.0.1,
`@types/vscode` ^1.118.0, `typescript` ^5.0.0 (dev).

## How It Works

`activate()` reads `lyra.languageServerPath`, spawns it over **stdio** via `LanguageClient`,
and registers for language `lyra` (`.lyra`, aliases `Lyra`/`lyra`, scope `source.lyra`).
`deactivate()` stops the client.

| Setting | Default | Description |
|---|---|---|
| `lyra.languageServerPath` | `""` (→ `lyra-lsp` on `PATH`) | Path to `lyra-lsp` |

**`${workspaceFolder}` is expanded by the extension** (`expandWorkspaceFolder`) — VS Code
doesn't substitute it in extension settings. The workspace is multi-root, so each folder is
tried and the first expansion that exists on disk wins; if none exist, the first folder's
expansion is returned so the error names a real path. `lyra.code-workspace` ships
`${workspaceFolder}/build/lyra-lsp`.

## TextMate Grammar Rules

Covers comments, attributes (`@name`, `@name(args)`), keywords, storage types/modifiers,
operators, interpolation `${…}`, raw strings (`` ` ``, `` #` ``, `` ##` ``), `r"…"` regex,
numeric literals (dec/`0x`/`0b`/`0o`), PascalCase type names. Keywords: `if else loop while for match
return break continue with given import module as var let const impl trait struct data tuple
where async await yield unsafe pure gen rec`, and `type`/`alias` by their own rule (below). Operators include compose `->>`, `??`,
try `?`, deref `^`, address-of `&`. Constraints to preserve:

- **Comments:** `////`+ must match first as an ordinary comment (divider), before `///.*$`
  (doc). `//!` is a module doc; `/* */` nests. Matches the grammar's `include/comments.js`.
- **`type`** (nominal) and **`alias`** (transparent) are keywords only when followed by a
  PascalCase name — `let type = 5` and a parameter named `alias` are legal. (They were
  `newtype` and `type` until 10/08.)
- **`;`** — one scope for statement separator and `[value; count]`.
- **Storage types** track tree-sitter-lyra's `_primitive_type`: `i8`–`i128`, `u8`–`u128`,
  `f16`/`f32`/`f64`, `string`, `bool`, `rune`, `fixed`, `void`. No `int`/`uint`/`float`;
  `never` has no syntax and is deliberately absent. Modifiers: `stack`, `shared`, `weak`,
  `mut`, `ref`, `own`, `pub`.
- **Ranges:** one rule `\.\.(<=|>=|<|>)?` — longer alternatives first (else `..<=` is `..<`
  + `=`), and ahead of comparison. A range spelling missing here paints as range + stray
  comparison.
- **Bitwise:** `<<`/`>>` are their own rule (`keyword.operator.shift.lyra`); `|`, `~` (xor and
  complement); `&` is left to the address-of rule.
- **Regex** `r"…"` is a single line-bounded `match` (not begin/end), so an unterminated one
  can't swallow the file. Never reintroduce `r/…/` (`r/2 + a/b` would paint as a string).

### Operator rule order is a cycle

TextMate takes the earliest match, first-listed on a tie:

| Must come first | Or else |
|---|---|
| comparison before logical | `!=` → `!` + unscoped `=` |
| logical before bitwise | `\|\|` → two `\|` |
| shift before comparison | `<<` → two `<` |

No order satisfies all three, hence shifts are a separate rule ahead of comparison while
`\|`/`~` stay after logical. Don't merge them back. Mistakes are hard to see — all scopes
start `keyword.operator`, so themes paint them alike. Known residue: `>>` closing nested
generics paints as a shift.

**Check changes against `test/bitwise.lyra` and `test/ranges.lyra`.**

### Embedded GLSL

`#embedded-glsl` paints a `` /* glsl */ `…` `` raw string's content with the bundled
`syntaxes/glsl.tmLanguage.json` (from stef-levesque/vscode-shader, MIT). Same rule as
`tree-sitter-lyra/queries/injections.scm`.

- The bundle's scope is **private, `source.glsl.lyra`**, and it contributes no language or file
  extension. It can't collide with a GLSL extension the user installs, and never claims
  `.glsl` files. Converted from plist unchanged apart from the scope name.

- Listed **ahead of `#comments`**, top level and in `#function-parameters`: both start at `/*`,
  and the first-listed rule wins the tie.
- The marker and the opening backtick must share a line (a `begin` can't span lines).
- The closer repeats the opener's `#`s through a back-reference (`\3`).
- `#function-parameters` (every `(…)`) also includes `#raw-strings`. Without it, a raw string
  argument went unpainted and a `)` inside one closed the parens.

## Relationship to Other Sub-Projects

- **`lyra/`** — rebuild `lyra-lsp` with `./build.sh` (not bare `go build`: it symlinks `std/`
  beside the binaries, which is how the prelude is found). It also builds `lyrac`
  (`check`/`build`/`run`); the extension deliberately contributes no build or run task.
- **`tree-sitter-lyra/`** — not used here; highlighting is the TextMate grammar.
