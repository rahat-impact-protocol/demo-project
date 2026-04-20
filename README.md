# Demo Project API

NestJS + Prisma backend for beneficiary onboarding, group management, wallet key storage, disbursement request forwarding, vendor management, and  communication.

## Local URLs

- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/swagger`

## Environment Variables

Set these before running the app:

- `DATABASE_URL` - PostgreSQL connection string
- `PUBLIC_KEY` - ECIES public key used to encrypt generated wallet details
- `PROJECT_ID` - project ID used in disbursement request payload
- `CORE_URL` - core service base URL; disbursement request is sent to `${CORE_URL}/request`
- `REDIS_HOST` - Redis host (default: `localhost`)
- `REDIS_PORT` - Redis port (default: `6380`)
- `REDIS_PASSWORD` - Redis password (optional)
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

#### `POST /beneficiaries/upload/group`
Uploads a CSV and registers all valid rows as a new beneficiary group in a single operation.

#### `DELETE /beneficiaries/:id`
Deletes by beneficiary `uuid` (not numeric `id`).

#### `POST /beneficiaries/group`
Creates a beneficiary group.

Request body (`CreateBeneficiaryGroupDto`):

```json
{
  "name": "Group A",
  "description": "First distribution group",
  "beneficiariesId": [1, 2, 3]
}
```

#### `GET /beneficiaries/group`
Lists all beneficiary groups.

#### `GET /beneficiaries/group/:id`
Returns a beneficiary group by numeric id.

#### `PATCH /beneficiaries/group/update/:id`
Updates a beneficiary group by uuid.

---

### Communication (`/communication`)

#### `POST /communication`
Creates a communication record (SMS or IVR) targeting a set of beneficiaries or a group.

Request body (`CreateCommunication`):

```json
{
  "benIds": ["uuid-1", "uuid-2"],
  "groupId": ["group-uuid-1"],
  "message": "Your payment has been processed.",
  "type": "SMS"
}
```

Field notes:
- **Either `benIds` or `groupId` must be provided**; omitting both returns a `400 Bad Request`
- `type` must be one of: `SMS`, `IVR`

#### `GET /communication`
Lists communications with optional filtering and pagination.

Query params:
- `page` (default: `1`)
- `limit` (default: `20`)
- `type` — filter by `SMS` or `IVR`
- `status` — filter by `CREATED`, `SENDING`, `DELIVERED`, or `FAILED`

#### `PATCH /communication/send/:id`
Sends the communication identified by `id` to all linked beneficiaries.

#### `GET /communication/:id`
Returns the full details of a communication record including linked beneficiaries.

#### `GET /communication/:benId/history`
Returns the communication history for a specific beneficiary with pagination.

---

### Disbursement (`/disbursement`)

#### `POST /disbursement`
Marks individual beneficiaries for disbursement by wallet address.

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

#### `POST /disbursement/group`
Creates a disbursement for all members of a beneficiary group.

Request body (`CreateGroupDisbursementDto`):

```json
{
  "groupId": 1,
  "amount": 100
}
```

#### `POST /disbursement/disburse/:uuid`
Builds a registry payload from created disbursements, updates their status to `PENDING`, and sends the request to core.

Behavior:
- Reads `PROJECT_ID` and `CORE_URL` from env
- Uses a Prisma transaction to atomically query and update beneficiaries from `CREATED` → `PENDING`
- Sends request to `${CORE_URL}/request` via axios
- **On error:** reverts matched beneficiaries status back to `CREATED` for safe retry

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
Returns paginated disbursement records. Query params: `status`, `minAmount`, `page`, `perPage`.

#### `GET /disbursement/:id`
Returns a single disbursement record by id.

---

### Vendor (`/vendor`)

#### `POST /vendor`
Creates a vendor. If `walletAddress` is not provided, generates a wallet and stores encrypted key details in `tbl_beneficiary_wallet`.

Request body (`CreateVendorDto`):

```json
{
  "name": "Vendor Name",
  "phoneNumber": "+9779800000000",
  "email": "vendor@email.com",
  "walletAddress": "0x1234..."
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

### Response (`/response`)

#### `POST /response`
Webhook endpoint to receive async responses from the core service (e.g., disbursement confirmations). Responses are processed via a BullMQ queue.

---

## Data Models (high level)

| Table | Description |
|-------|-------------|
| `tbl_beneficiary` | Beneficiary core record (`id`, `uuid`, wallet/disbursement fields) |
| `tbl_beneficiary_pii` | Sensitive personal fields (`name`, `phone`, `email`, `extras`) |
| `tbl_beneficiary_wallet` | Encrypted wallet key material by wallet address |
| `tbl_beneficiary_group` | Named groups of beneficiaries |
| `tbl_beneficiary_group_member` | Join table linking beneficiaries to groups |
| `tbl_vendor` | Vendor record (`uuid`, `name`, `phoneNumber`, `email`, `walletAddress`) |
| `tbl_communication` | Communication record (`message`, `type`, `status`) |
| `tbl_ben_communication` | Join table linking communications to beneficiaries |
| `tbl_registry` | Registry configuration |
| `tbl_settings` | App settings including contract configuration |

---

## Notes

- Wallet key encryption uses `eciesjs` with secp256k1-compatible keys. If `PUBLIC_KEY` is not a valid ECIES public key, beneficiary/vendor wallet creation will fail.
- **Disbursement status flow:** `NOTSTARTED` → `CREATED` (via `POST /disbursement`) → `PENDING` (via `POST /disbursement/disburse/:uuid`) → `DISBURSED` or `FAILED`
- **Communication validation:** `POST /communication` requires at least one of `benIds` or `groupId`; both being absent or empty throws a `400 Bad Request`.
- **Communication status flow:** `CREATED` → `SENDING` → `DELIVERED` or `FAILED`
- **Async processing:** Disbursement responses are handled asynchronously via BullMQ (Redis-backed) through the `ResponseProcessor`.
