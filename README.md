# Demo Project API

NestJS + Prisma API for managing beneficiaries and disbursement requests.

## Base URL

When running locally:

- `http://localhost:3000`

## Modules and Routes

### 1) Beneficiaries

Controller prefix: `/beneficiaries`

#### `POST /beneficiaries`
Create a beneficiary.

Request body (`CreateBeneficiaryDto`):

```json
{
  "walletAddress": "0xa6BCB9C5Dee351c53a877bf42188D28d52CB59eA",
}
```

Field details:

- `walletAddress` (string, required)
- `requestId` (string, optional)
- `disbursementStatus` (enum/string, optional) one of:
  - `PENDING`
  - `FAILED`
  - `DISBURSED`
  - `NOTSTARTED`

#### `GET /beneficiaries`
List all beneficiaries.

#### `DELETE /beneficiaries/:id`
Delete a beneficiary by database `id`.

---

### 2) Disbursement

Controller prefix: `/disbursement`

#### `POST /disbursement`
Mark selected beneficiaries for disbursement by:

- setting `disbursementAmount`
- setting `disbursementStatus` to `PENDING`

Request body (`CreateDisbursementDto`):

```json
{
  "benAddress": [
    "0xa6BCB9C5Dee351c53a877bf42188D28d52CB59eA"
  ],
  "amount": 100
}
```

Field details:

- `benAddress` (string[], required): list of beneficiary wallet addresses
- `amount` (number, required): amount applied to all matching beneficiaries

#### `POST /disbursement/disburse`
Build and forward a disbursement request to the registry service.

Current behavior in service:

- Uses dynamic `projectId` from the .env
- Fetches pending beneficiaries with `disbursementAmount > 0`
- Builds request payload in this format:

```json
{
  "projectId": "projectId_value",
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

- Posts to: `http://localhost:3336/request`

#### `GET /disbursement/data?status=<STATUS>&minAmount=<NUMBER>`
Fetch beneficiaries filtered by:

- `disbursementStatus = status`
- `disbursementAmount > minAmount`

Query parameters:

- `status` (required): one of `PENDING | FAILED | DISBURSED | NOTSTARTED`
- `minAmount` (optional, default `0`)

Example:

- `GET /disbursement/data?status=PENDING&minAmount=0`

## Notes

- Beneficiary and disbursement records are stored via Prisma models (`tbl_beneficiary`, `tbl_registry`, `tbl_settings`).
- Disbursement forwarding uses `axios` for outbound HTTP calls.
