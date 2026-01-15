# Specification: Module-Level AI Configuration

## 1. Database Schema
A new table `module_ai_settings` will store configuration securely.

### `module_ai_settings`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `module_id` | text | PK, FK -> `modules.id` | The target module (e.g., "CS01"). |
| `provider` | text | Not Null | The AI provider (e.g., "gemini"). |
| `model` | text | Nullable | Preferred model (e.g., "gemini-2.0-flash"). |
| `encrypted_api_key` | text | Nullable | The API key for this module. |
| `updated_at` | timestamptz | Default `now()` | Audit trail. |

**Security:**
*   RLS enabled.
*   **Read:** Only accessible by Service Role (API Gateway) or Admin users.
*   **Write:** Only accessible by Admin users (initially).

## 2. API Gateway Logic (`providerResolver.ts`)
The resolution logic will be updated to the following hierarchy:

1.  **User Override:** Check `user_ai_providers` (Personal Key).
2.  **Module Config:** Check `module_ai_settings` (Developer Key).
3.  **System Default:** Fallback to `process.env`.

## 3. Admin UI (`/admin/modules/[moduleId]/ai`)
A secure dashboard for admins to configure these settings.

*   **Authentication:** Must verify `isAdminEmail`.
*   **Form:**
    *   Select Provider (currently locked to "Google Gemini").
    *   Input API Key (password field).
    *   Input Model Name (text field, default "gemini-2.0-flash").
    *   "Save" button -> Upsert to `module_ai_settings`.

## 4. Navigation
Add an "Admin" link to the main header or dashboard, visible only to admins.
