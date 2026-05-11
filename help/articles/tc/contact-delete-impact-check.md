## Contact Delete Impact Check

Before deleting a contact, NEXA now runs a quick impact scan so you can see where that person is still referenced.

### What is scanned

1. Transaction `intake_data` text fields (names, broker details, emails).
2. Transaction party rows (`display_name`, `contact_email`).

### What happens if you delete anyway

1. The contact profile, categories, broker profile, and company links are removed.
2. Existing transaction snapshots are **not** rewritten automatically.
3. You can still open transactions normally after deletion.

### Recommended workflow

1. Review the impact warning examples.
2. If the contact should be retained historically, update transaction intake first.
3. Delete only after confirming you are not removing an active canonical CRM record by mistake.
