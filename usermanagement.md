# MAMS Governance & Multi-Tenancy Roadmap

This roadmap details the strategic upgrades for the **User Management** system and the implementation of **Company-Scoped Data Isolation** (Multi-Tenancy) to ensure secure, per-entity administrative control.

---

## 1. Governance Center Evolution (`/admin/users`)

To support organizational scaling, the User Management interface will transition from a simple list to a high-density "Control Center."

### 🎨 UI/UX Excellence
*   **Unified Filter Ribbon**: A sleek, sticky header containing:
    *   **Live Search**: Instant lookup by `Name`, `Username`, or `Email` using debounced input.
    *   **Role-Based Filters**: Segment users by `Admin`, `HR`, `IT`, or `ReadOnly`.
    *   **Subsidiary Switcher**: Filter the roster by business units (e.g., MPL, 50Hertz).
*   **Visual Identity System**:
    *   **Dynamic Avatars**: Initials-based avatars with color-coded borders representing the user's primary company.
    *   **High-Contrast Badges**: Distinct HSL-based colors for roles and account statuses (Active/Inactive).
    *   **Permission Matrix Tooltips**: Quick-view icons in the table rows showing authorized modules (HR/IT/Assets).

### ⚡ Functional Power-Ups
*   **Atomic Actions**: 
    *   **Status Toggle**: Switch `isActive` state directly from the table using a modern switch component.
    *   **Rapid Password Reset**: A dedicated action that triggers a secure reset modal without page navigation.
*   **Bulk Orchestration**: Select multiple users for mass deactivation or role updates.
*   **Session Insight**: View real-time "Last Active" indicators and direct links to the user's specific audit trail.

---

## 2. Multi-Tenancy: "The 50Hertz Protocol"

We are implementing a "Siloed Data" architecture where HR and IT personnel only access data pertinent to their assigned Subsidiary.

### 🛠 Technical Implementation Strategy

### Phase 1: Authentication & Session Context
Inject the `companyName` metadata into the secure session layer.
*   **Target**: `src/app/api/auth/[...nextauth]/route.ts`
*   **Logic**:
    ```typescript
    // In callbacks.session
    session.user.companyName = token.companyName;
    session.user.role = token.role;
    ```

### Phase 2: Scoped Query Injection (Prisma)
Implement a middleware or utility pattern to automatically scope all database reads.
*   **Scoped Entities**: `Employee`, `Asset`, `UpcomingJoining`, `ProvisioningRequest`.
*   **Technical Logic**:
    ```typescript
    const scopeFilter = session.user.role === 'admin' 
        ? {} 
        : { companyName: session.user.companyName };

    // Standard Query Pattern
    const data = await prisma.employee.findMany({
        where: {
            ...activeFilters,
            ...scopeFilter
        }
    });
    ```

### Phase 3: Form Governance & Auto-Provisioning
Prevent cross-tenant data pollution during entry.
*   **Strict Enrollment**: For non-admins, the "Company/Subsidiary" field in the New Employee form will be **auto-locked** to the user's company.
*   **Validation**: Server-side checks to reject records belonging to unauthorized subsidiaries.

### Phase 4: Scoped Intelligence (Dashboard)
Aggregate analytics based on the user's context.
*   **HR Executive (50Hertz)**: Dashboard stats reflect only 50Hertz workforce.
*   **Super Admin**: Retains the "Global View" with aggregate counts across all entities.

---

## 3. Execution Roadmap

- [ ] **Auth Layer Update**: Extend NextAuth session structure.
- [ ] **API Scoping**: Roll out `where` clause filtering across `/api/employees` and `/api/joiners`.
- [ ] **UI Logic**: Hide/Lock company selectors in forms for non-admin users.
- [ ] **Testing**: Verify that a 50Hertz user cannot access MPL records via direct URL ID access.

> [!IMPORTANT]
> To ensure consistency, we will move from free-text company names to a master `Subsidiary` table or a strictly enforced Enum to prevent typos like "50Hertz" vs "50-Hertz" breaking the filter logic.

