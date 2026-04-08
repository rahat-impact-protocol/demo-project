# Demo Project API

NestJS + Prisma backend for beneficiary onboarding, wallet key storage, and disbursement request forwarding.

## Local URLs

- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/swagger`

## Environment Variables

Set these before running the app:

- `DATABASE_URL` - PostgreSQL connection string
- `PUBLIC_KEY` - ECIES public key used to encrypt generated wallet details
- `PROJECT_ID` - project id used in disbursement request payload
- `CORE_URL` - core service base URL; disbursement request is sent to `${CORE_URL}/request`
- `BENEFICIARY_UPLOAD_CONCURRENCY` - optional; max number of CSV rows processed in parallel during upload. Default: `10`. Benchmarked local sweet spot: `12`.


## API Endpoints

### Beneficiaries (`/beneficiaries`)

#### `POST /beneficiaries`
Creates a beneficiary. If `walletAddress` is not provided, the service generates a new wallet and stores encrypted wallet key details in `tbl_beneficiary_wallet`.

Request body (`CreateBeneficiaryDto`):

```json
{
  "walletAddress": "0x1234...",
  "name": "Joe",
  "phone": "+9779800000000",
  "email": "joe@email.com",
  "extras": { "id": "123" }
}
```

Field notes:
- `walletAddress` optional
- `phone` required and unique in beneficiary PII table
- `extras` optional JSON object

Creates records in:
- `tbl_beneficiary`
- `tbl_beneficiary_pii`

#### `GET /beneficiaries`
Returns paginated beneficiaries. Query params: `page`, `perPage`.

#### `POST /beneficiaries/upload`
Uploads beneficiaries from a CSV file.

Validation and behavior:
- Accepts multipart form-data with file field name `file`
- Enforced file size limit: `10MB`
- CSV headers must include `name` and `phone`
- Uploaded file is decoded from the uploaded buffer as UTF-8 text
- Phone numbers are checked in bulk before row creation; existing phone numbers are skipped before wallet generation starts
- Rows are processed with bounded parallelism using `BENEFICIARY_UPLOAD_CONCURRENCY`
- If a row does not include `walletAddress`, a wallet is generated and encrypted key details are stored in `tbl_beneficiary_wallet`

Supported CSV columns:
- `name` required
- `phone` required
- `email` optional
- `walletAddress` optional
- `age` optional; stored inside `extras.age`

Upload response shape:

```json
{
  "total": 1000,
  "created": 940,
  "skipped": 45,
  "failedCount": 15,
  "errors": [
    "row 12: phone +9779800000000 already exists, skipped",
    "row 34: Unique constraint failed on the fields: (`phone`)"
  ],
  "meta": {
    "concurrency": 12,
    "durationMs": 14382
  }
}
```

Notes:
- `skipped` means the phone number already existed in the database before processing started
- `failedCount` excludes skipped rows and counts only actual processing failures
- Large uploads such as `500-1000` rows are processed in waves according to the configured concurrency limit, not all at once

#### `DELETE /beneficiaries/:id`
Deletes by beneficiary `uuid` (not numeric `id`).

#### `POST /beneficiaries/group`
Creates a beneficiary group.

#### `GET /beneficiaries/group`
Lists beneficiary groups.

#### `GET /beneficiaries/group/:id`
Returns a beneficiary group by numeric id.

---

### Vendor (`/vendor`)

#### `POST /vendor`
Creates a vendor. If `walletAddress` is not provided, generates a wallet and stores encrypted wallet key details in `tbl_beneficiary_wallet`.

Request body (`CreateVendorDto`):

```json
{
  "name": "Vendor Name",
  "phoneNumber": "+9779800000000",
  "email": "vendor@email.com",
  "walletAddress": "0x1234..." // optional
}
```

#### `GET /vendor`
Returns paginated vendors. Query params: `page`, `perPage`.

#### `GET /vendor/:id`
Find vendor by uuid.

#### `PATCH /vendor/update/:id`
Update vendor by uuid. Request body: partial fields of `CreateVendorDto`.

#### `DELETE /vendor/:id`
Delete vendor by uuid.

---

### Disbursement (`/disbursement`)

#### `POST /disbursement`
Marks beneficiaries for disbursement.

Request body (`CreateDisbursementDto`):

```json
{
  "benAddress": ["0xa6BCB9C5Dee351c53a877bf42188D28d52CB59eA"],
  "amount": 100
}
```

Behavior:
- Finds beneficiaries by `walletAddress in benAddress`
- Sets `disbursementAmount = amount`
- Sets `disbursementStatus = CREATED`

#### `POST /disbursement/disburse`
Builds a registry payload from created beneficiaries, updates their status to PENDING, and sends the request to core.

Current behavior:
- Reads `PROJECT_ID` and `CORE_URL` from env
- **Uses a Prisma transaction to atomically:**
  - Query beneficiaries with `disbursementStatus = CREATED` and `disbursementAmount > 0`
  - Update matching beneficiaries status from `CREATED` → `PENDING`
  - Return the beneficiary data for payload building
- Uses `serviceTags` from `@rahat/token-disbursement-actions` (`ACTIONS.DISBURSEMENT.name`)
- Sends request to `${CORE_URL}/request` using `axios`
- **On error:** reverts matched beneficiaries status back to `CREATED` for retry

Payload format:

```json
{
  "projectId": "23456",
  "requestData": {
    "data": {
      "tokenAddress": "0x92a437290E6AE7477955624859C6D15CDb324eD4",
      "benAddress": ["0x..."],
      "amount": [100],
      "totalAmount": 100
    }
  },
  "serviceTags": ["disbursement"]
}
```

#### `GET /disbursement`
Returns paginated disbursement candidates. Query params: `status`, `minAmount`, `page`, `perPage`.

## Data Models (high level)

- `tbl_beneficiary`: beneficiary core record (`id`, `uuid`, wallet/disbursement fields)
- `tbl_beneficiary_pii`: beneficiary personal fields (`name`, `phone`, `email`, `extras`)
- `tbl_beneficiary_wallet`: encrypted wallet key material by wallet address
- `tbl_vendor`: vendor record (`uuid`, `name`, `phoneNumber`, `email`, `walletAddress`)
- `tbl_registry`: registry configuration
- `tbl_settings`: app settings (including contract settings)

## Notes

- Wallet key encryption uses `eciesjs` with secp256k1-compatible keys.
- If `PUBLIC_KEY` is not a valid ECIES public key, beneficiary/vendor wallet creation will fail during encryption.
- **Disbursement status flow:** `NOTSTARTED` → (optional intermediate states) → `CREATED` (via `POST /disbursement`) → `PENDING` (via `POST /disbursement/disburse`) → `DISBURSED` or `FAILED`
- **Transaction safety:** `POST /disbursement/disburse` uses a database transaction to atomically update matching beneficiaries from `CREATED` to `PENDING`. If the request to core fails, the status reverts to `CREATED` for safe retry.
