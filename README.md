# Party App — Admin Panel

Web-based admin dashboard. Will be built with **React + Next.js / Vite**.

Status: **not yet started** — will be scaffolded after backend Auth feature is verified working.

## Planned Structure (to be implemented)
```
admin-panel/
├── src/
│   ├── pages/              or app/ (Next.js app router)
│   │   ├── auth/           login
│   │   ├── dashboard/
│   │   ├── users/          user management
│   │   └── ...
│   ├── components/
│   ├── lib/
│   │   ├── api.ts          backend API client
│   │   └── auth.ts         token management
│   ├── hooks/
│   └── styles/
├── package.json
└── ...
```

## First Admin Feature (to follow backend Auth)
- Admin login (separate from user auth — uses admin-scoped JWT)
- Admin dashboard (blank placeholder)
- User list (search, filter, view details)
- User actions (ban/unban, adjust balance, force logout)

See [../docs/admin/](../docs/admin/) for full admin panel spec.
