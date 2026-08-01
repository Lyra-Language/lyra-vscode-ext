# Change Log

All notable changes to the "lyra-vscode-ext" extension are documented in this file.

The format follows [Keep a Changelog](http://keepachangelog.com/), and this project adheres
to [Semantic Versioning](https://semver.org/). Being pre-1.0, anything may still change.

## [0.1.0] — 2026-08-01

First entry. `0.0.1` was the scaffold's placeholder version and was never published, so
everything the extension does is listed here rather than split across releases.

### Added

- **Language server client.** Spawns `lyra-lsp` over stdio and registers it for `.lyra`
  files, so diagnostics, hover, completion, definition, rename, references, folding,
  semantic tokens, signature help and code actions all come from the compiler itself
  rather than being reimplemented here.
- **`lyra.languageServerPath` setting**, with **`${workspaceFolder}` expansion** done by
  the extension. VS Code substitutes that variable in tasks and launch configs but not in
  arbitrary extension settings, so without it the only workable value is an absolute path
  — and `lyra.code-workspace` is checked in, where a hardcoded home directory is wrong for
  everyone else. The workspace is multi-root, so each folder is tried and the first whose
  expansion exists on disk wins. Empty falls back to `lyra-lsp` on `PATH`.
- **Syntax highlighting** (TextMate, hand-written rather than generated from the
  tree-sitter grammar): comments including nested block comments, attributes, keywords,
  primitive types, storage modifiers, strings with `${…}` interpolation, raw strings in
  all three backtick forms, regex literals, numeric literals in every base, operators, and
  PascalCase type names.
- Highlighting for two additions the language made on 2026-07-31: the **`type` keyword** of
  a type alias, and **`;`**, the explicit statement separator. `type` is matched only when
  a PascalCase name follows it, because the language does not reserve the word — `let type
  = 5` is a legal binding and must not be coloured as a keyword.
- Sample `.lyra` files under `test/`, for exercising the language server and for eyeballing
  highlighting. There is no automated test suite yet.
- Packaging metadata required to publish: `publisher` (`Lyra-Language`, making the
  extension id `Lyra-Language.lyra-vscode-ext`), `repository`, and the `license` field to
  match the MIT LICENSE already in the repo. `vsce` refuses to package without a
  publisher, so until now the extension could be run from source but never shipped.

### Fixed

- **Regex literals are `r"…"`.** The rule still matched the `r/…/` form the language
  dropped on 2026-07-29, which made the editor wrong rather than merely out of date:
  `let ratio = r/2 + a/b` was painted as a string running from `r/` to the next `/`. That
  is the very ambiguity the language changed the syntax to remove. The rule is now bounded
  to a single line, so an unterminated literal cannot swallow the rest of the file.
- **The primitive type list matches the language again**: `int`, `uint` and `float` are no
  longer highlighted as types (the first two were removed for determinism, and `float`
  was never a keyword — `f16`/`f32`/`f64` are), `Void` is spelled `void`, and `i128`,
  `u128` and `rune` are recognised.
