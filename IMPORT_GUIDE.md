# Email Import Guide

## CSV Format Understanding

Your `Email.csv` has these columns:

```
emailAddress         → Email address (e.g., marketing.d@manikaranpowerltd.in)
displayName          → Person's name (e.g., Sonu Bhagat)
employeeCode         → Code with prefix (e.g., EMP-1915)
accountType          → personal | shared | distribution
platform             → Email platform (usually empty)
status               → active | inactive
passwordHash         → Hashed password
forwardingAddresses  → Semicolon-separated list (e.g., a@...; b@...; c@...)
notes                → Any additional notes
```

## The Mapping Problem

**CSV stores:** `EMP-1915`
**Database expects:** `1915` (just the number)

The import script automatically:

1. Extracts the number from `EMP-1915` → `1915`
2. Looks up employee record by this code
3. Links email to the employee

## Example Mappings

### Example 1: Personal Email

```csv
emailAddress:     marketing.d@manikaranpowerltd.in
displayName:      Sonu Bhagat
employeeCode:     EMP-1915
accountType:      personal
forwardingAddresses: (empty)
status:           active
```

**Import Result:**

- Email created for employee ID 1915
- Account type: personal
- No forwarding

### Example 2: Distribution List

```csv
emailAddress:     approval@manikaranpowerltd.in
displayName:      (empty)
employeeCode:     EMP-
accountType:      distribution
forwardingAddresses: auditor2@manikaranpowerltd.in;auditor@manikaranpowerltd.in;bilateral.del@...
status:           active
```

**Import Result:**

- Email created (no employee assigned - it's a distribution list)
- Account type: distribution
- Forwards to 8 email addresses

### Example 3: Personal with Forwarding

```csv
emailAddress:     bd.d24@manikaranpowerltd.in
displayName:      Shilajit Patranabish
employeeCode:     EMP-2103
accountType:      personal
forwardingAddresses: b.rahul@manikaranpowerltd.in
status:           active
```

**Import Result:**

- Email created for employee ID 2103
- Also forwards to b.rahul@...

## How to Run Import

```bash
# Install dependencies if needed
npm install csv-parse

# Run the import script
npx ts-node scripts/import-emails.ts
```

## What Happens

The script will:

1. Read all 149 email records from CSV
2. Extract employee codes (remove "EMP-" prefix)
3. Match with employee records in database
4. Create EmailAccount records with:
   - Email address
   - Display name
   - Employee ID (if matched)
   - Account type (personal/shared/distribution)
   - Forwarding addresses (parsed from semicolon-separated list)
   - Status

## Output Example

```
📧 Starting email import...

✅ abhinav@manikaranpowerltd.in → ABHINAV BHARGAVA (Employee: 1652)
✅ acc.admin@manikaranpowerltd.in → Manoj Kumar (Employee: 2137)
⚠️  bd.d@manikaranpowerltd.in → No employee found (Code: EMP-)
✅ approval@manikaranpowerltd.in → distribution (No employee assigned)

📊 Import Summary:
   ✅ Imported: 145
   ⏭️  Skipped: 2 (already exist)
   ❌ Errors: 2
```

## Database Schema

### EmailAccount Table

```prisma
model EmailAccount {
  id                String    @id @default(cuid())
  emailAddress      String    @unique
  displayName       String
  password          String?   // ACTUAL PASSWORD (plain text, not hashed)
  employeeId        String?   @db.Uuid  // Links to Employee (optional)
  accountType       String    // personal | shared | distribution
  status            String    // active | inactive
  platform          String    // office365 | gmail | etc
  forwardingEnabled Boolean   // true if has forwarding addresses
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}
```

### EmailForwarding Table (Separate Records)

```prisma
model EmailForwarding {
  id               String    @id
  emailAccountId   String    // Links to EmailAccount
  forwardToAddress String    // Email to forward to
  forwardType      String    // copy | forward | redirect
  isActive         Boolean   // true if active
  createdAt        DateTime  @default(now())
}
```

**Important:**

- Passwords are stored **plain text** (not hashed)
- Each forwarding address becomes a separate record
- Example: If email has 3 forwards, 3 EmailForwarding records are created

## After Import

Once imported, you can:

1. View emails on `/it/email` page
2. Filter by account type
3. See which employee owns each email
4. Manage forwarding addresses
5. Update email status (active/inactive)

## Key Changes Made

1. ✅ **Schema Updated:**
   - Changed `employeeId` from REQUIRED to OPTIONAL (distribution lists don't need employees)
   - Renamed `passwordHash` to `password` (stores actual passwords, not hashes)
   - Increased password field size to 500 chars (store complex passwords)
   - Added `forwardingEnabled` boolean flag

2. ✅ **Database Synced:**
   - Ran `prisma db push`
   - All tables indexed and foreign keys created
   - EmailAccount and EmailForwarding tables ready

3. ✅ **Import Script Ready:**
   - Handles all 3 email types (personal, shared, distribution)
   - Stores **actual passwords** (not hashed)
   - Creates EmailForwarding records for each forward address
   - Auto-matches employees by code extraction

## Security Note

⚠️ **Passwords are stored in plain text!** This is a security risk.

Consider:

- Using encryption (e.g., bcrypt for storage)
- Restricting database access
- Only showing to authorized users
- Regular security audits

For now, passwords are stored as-is for your import needs.
