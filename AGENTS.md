# AI collaboration guide

These instructions apply to every AI coding assistant working in this
repository.

## Read before acting

Before changing product behaviour, architecture, or project process, read:

- `PRODUCT.md` for the product direction and staged progression;
- `CREATIVE_CHARTER.md` for the experience and authorship principles;
- `docs/architecture.md` for current technical decisions and open questions;
- `docs/source-material.md` for source rights, provenance, and attribution;
- `LICENSING.md` before introducing code, documentation, assets, dependencies,
  source material, or terms affecting maker-created work;
- `docs/project-workflow.md` for issue, board, branch, and review practice;
- the issue being implemented, including its acceptance criteria and comments.

If these authorities disagree, stop and surface the conflict rather than
choosing one silently.

## Collaboration style

- Treat the maintainer as a collaborator who retains product authority.
- Explain purpose and important trade-offs in plain language.
- Prefer small, inspectable steps over speculative implementation.
- Do not add later-stage infrastructure before its decision gate is met.
- Ask before making a material product, architecture, privacy, licensing, or
  operational decision not already settled in the project record.
- Record decisions that constrain later work in the relevant issue or project
  document; do not leave them only in conversation.

## Board-driven work

The GitHub project board drives delivery once it has been configured and linked
from `docs/project-workflow.md`.

- **Backlog** means captured, not committed.
- **Ready** means agreed and executable.
- **In progress** means implementation has begun.
- **In review** means a pull request is being verified and reviewed.
- **Done** means merged, verified, documented, closed, and delivered.

When asked to select or continue project work:

1. inspect the board and repository state;
2. select autonomously only from Ready;
3. respect priority, dependencies, stages, and existing work in progress;
4. state which issue is being selected and why;
5. keep the issue and board status accurate throughout delivery;
6. work against the issue's acceptance criteria;
7. report what completion unblocks.

Keep work in progress to one issue by default. Do not move consequential work
from Backlog to Ready without an explicit maintainer decision.

## Implementation boundaries

- Build only for the current agreed stage.
- Treat future stages as direction, not already committed implementation.
- Keep stage boundaries and promotion criteria documented.
- Prefer understandable code and explicit state transitions over clever
  abstractions and premature generalisation.
- Do not select a framework, persistence layer, hosting platform, account
  model, analytics service, or similar foundation until the relevant decision
  is recorded.
- Do not assume that repository access or one material's licence applies to
  code, documentation, branding, visual assets, source texts, third-party
  material, or maker-created work as a whole.

## Branches and pull requests

- Do not push implementation work directly to `main`.
- Use a focused branch and pull request for agreed work.
- After implementing and verifying a change, stop and present it to the
  maintainer. Do not commit, push, or open a pull request until the maintainer
  explicitly approves those actions.
- Follow the naming convention in `docs/project-workflow.md`.
- Link the pull request to its issue and keep unrelated changes out.
- Update the appropriate document when behaviour or a constraint changes.

## Verification

Run the smallest checks that substantiate the change. Report what was actually
verified and what was not; do not present source inspection as runtime evidence
or automated interaction as human acceptance.

## Definition of done

Work is Done only when it is merged to `main`, relevant checks pass, acceptance
criteria are satisfied, affected documentation is accurate, and its issue is
closed. A declined or cancelled issue may be closed, but must not be represented
as delivered.
