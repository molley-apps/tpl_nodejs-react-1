# Weave AI assisted code guide

## Read all the rules:

@.claude/rules/critical-rules-for-api-development.md

@.claude/rules/api-unit-testing.md


## Shell command style

- Run ONE command per Bash call. Do not chain commands with `&&`, `||`, `;`,
  or pipes (`|`) unless a single logical operation genuinely requires it.
- Never wrap commands in a `for … do … done` loop or other shell control
  structures. Issue each command as its own separate Bash call instead.
- To read files, use the Read tool — not `cat`/`tail`/`head` in a loop. To read
  several files, make separate Read calls (or a single `cat file1 file2 …`).
- Reason: compound commands, pipes, and loops force a permission prompt even
  when every individual command is pre-approved, because each subcommand has to
  match an allow rule independently and shell keywords (`for`, `do`, `done`) and
  pipelines don't match. One command per call keeps things prompt-free and
  auditable.
- If you think you need a pipeline (e.g. `grep | wc -l`), prefer a tool flag
  that avoids the pipe (`grep -c`), or run the steps separately.