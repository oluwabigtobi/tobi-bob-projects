# Working preferences & operating notes

Persistent context for Claude Code sessions on this account (sessions don't
share memory, so durable preferences live here).

## Calendar / scheduling
- **Never delete calendar events to "fix" or reschedule them.** Deletions send
  cancellation emails that spam attendees' inboxes. Edit (update) events in
  place instead. Only delete with explicit, case-by-case permission — never to
  external contacts as a workaround.
- **Sharing ONE Google Meet link across multiple events** (e.g. a master block
  plus per-team sub-meetings, so nobody jumps between rooms):
  - Do NOT rely on the MCP `googleMeetUrl` parameter to attach an existing
    room — `create_event`/`update_event` ignore it and still mint a brand-new
    Meet room (verified 2026-06).
  - Correct pattern:
    1. Create ONE master event with `addGoogleMeetUrl: true`.
    2. Read its `conferenceUrl`.
    3. Create every other event WITHOUT `addGoogleMeetUrl`, and put the
       master's Meet URL in the `location` field (and/or top of description).
  - Result: all events share the same room, no duplicate auto-rooms, no
    deletions needed.
- Default timezone: America/Los_Angeles (Pacific).
- Confirm full draft (attendees, times, description) before sending invites.

## Contacts
- Saved contacts live in `contacts.md`.
