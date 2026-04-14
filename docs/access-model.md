## Access model (central rules)

Roles:
- **guest**: not authenticated
- **member**: authenticated, non-admin
- **admin**: authenticated + admin privileges

### Access matrix

| Area / capability                     | guest | member | admin |
|---------------------------------------|:-----:|:------:|:-----:|
| Public landing `/`                    |  ✅   |   ✅    |  ✅   |
| Public discovery `/network`           |  ✅   |   ✅    |  ✅   |
| Public requests `/requests`           |  ✅   |   ✅    |  ✅   |
| Member cockpit `/dashboard`           |  ❌   |   ✅    |  ✅   |
| Member onboarding `/onboarding`       |  ❌   |   ✅    |  ✅   |
| Edit profile `/profile/edit`          |  ❌   |   ✅    |  ✅   |
| Admin space `/admin`                  |  ❌   |   ❌    |  ✅   |

### Implementation pointers

- **Single source of truth**: `src/auth/roleModel.ts`
  - `getAppRole(...)`
  - `routeAccessForPath(...)`
  - `canAccessRoute(...)`
- **Navigation visibility**: `src/routes/primaryNav.ts` uses `getPrimaryNav(role)`
- **Route guards**: `src/App.tsx` uses `canAccessRoute(role, pathname)`

