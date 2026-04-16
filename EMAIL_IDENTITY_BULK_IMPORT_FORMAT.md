# Email Identity Bulk Import Format

Use `public/templates/email-identity-bulk-import-template.csv`.

## Required columns

- `emailAddress` (unique, valid email)
- `displayName`
- `employeeCode` (account holder by employee code)

## Optional columns

- `accountType` (`personal`, `shared`, `alias`, `distribution`, `service`)
- `platform` (`google_workspace`, `microsoft_365`, `zoho`, `other`)
- `status` (`active`, `suspended`, `deactivated`, `deleted`)
- `passwordHash`
- `forwardingAddresses` (separate multiple emails using `;`)
- `notes` (for your import script tracking, not stored by current API)

## How account holder works

- The API now supports account holder by `employeeCode`.
- It resolves `employeeCode` to internal `employeeId` before creating the email identity.
- If employee code does not exist, that row should fail with a clear error.

