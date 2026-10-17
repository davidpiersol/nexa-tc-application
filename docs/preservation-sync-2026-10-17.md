# Preservation sync — October 17, 2026

The application baseline is v4.40.0-uat, previously at 80349de on
p17-generated-documents-p19-start. Main was at 7f10852, 38 commits behind.
The previously untracked docs/design/claude-reworked.html is now preserved in Git.
This sync advances main without rewriting or discarding existing history.

Validation in an isolated copy: lint passed with the existing refresh-hook
warning; typecheck passed; 142 unit tests passed; production build passed.
No database seed, reset, migration, or live-provider test was performed.
This is a preservation checkpoint, not production release approval.

The sync commit uses [skip ci] and [skip netlify] deliberately: deploy.yml
runs the UAT seed against configured GitHub secrets before production deploy.
Confirm database isolation and deployment configuration before any future
push without these markers; such a push can trigger the full deployment flow.
No workflow or security setting was changed.

Hosting evidence: local Netlify site linkage exists, but netlify.toml still
contains a placeholder production URL. On this date choralpoint.com responded
with GoDaddy DPS headers. The May 11 GitHub Deploy run 25690817480 failed at
UAT testing and skipped deployment. A separate manual Netlify deployment
has not been ruled out; authenticated Netlify inspection is still needed.

The older README, session-next, and wiki progress summaries lag behind the
VERSION and .progress/project-plan.json records. P39/P40 are implemented;
P41-P43 remain planned and P18 remains blocked in that tracker.

Local environment files, test authentication state, databases, uploads, and
ignored local history are not included in this source-control sync.
