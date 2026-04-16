# Asset Bulk Import Format

Use `public/templates/asset-bulk-import-template-v2.csv` as your Excel template.

## Required columns

- `assetTag` (required, unique)
- `type` (required, one of: `laptop`, `desktop`, `zero_client`, `nuc`, `server`, `other`)

## Optional columns

- `make`, `model`
- `serialNumber` (unique if provided)
- `macAddress` (unique if provided)
- `ipAddress`
- `cpu`, `ramGb`, `ramType`
- `ssdGb` (number), `ssdType`
- `hddGb` (number), `hddType`
- `os`, `osVersion`
- `antivirusStatus` (`yes`, `no`, `expired`)
- `antivirusName`
- `warrantyExpiry` (format `YYYY-MM-DD`)
- `purchaseDate` (format `YYYY-MM-DD`)
- `cost` (number)
- `status` (`available`, `assigned`, `in_repair`, `retired`, `lost`)
- `employeeCode` (recommended when `status=assigned`)
- `seatNumber` (employee seat reference, optional)
- `notes`

## Excel entry rules

- Keep header names exactly the same as template.
- Dates must be `YYYY-MM-DD`.
- Leave optional fields empty if unknown.
- Do not duplicate `assetTag`, `serialNumber`, or `macAddress`.
- For Zero Client, set `type` to `zero_client`.
- If both are provided, `employeeCode` should match the employee who owns `seatNumber`.

## Suggested import flow

1. Fill the CSV template in Excel.
2. Save as CSV UTF-8.
3. Parse each row and send as JSON to `POST /api/assets`.
4. Stop and show row-level errors for invalid rows.

