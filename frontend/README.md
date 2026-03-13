# PowerBeacon Frontend

React + Vite + TypeScript frontend for PowerBeacon.

## Main UI areas

- Dashboard for device management and per-device wake actions
- Clusters pages for grouping devices and agents, plus cluster wake actions
- Agents page for inventory, health, and cluster visibility
- Users and Settings for auth and platform administration

## Getting Started

```bash
npm install
npm run dev
```

## Building

```bash
npm run build
```

## Structure

- `src/api/` - API client and endpoints
- `src/auth/` - Authentication hooks and components
- `src/components/` - React components
- `src/routes/` - Dashboard, clusters, agents, users, settings, onboarding, and login pages
- `src/types.ts` - TypeScript type definitions

## Cluster-aware behavior

- Devices show all associated agents instead of a single assigned agent
- Device forms allow selecting both a cluster and multiple associated agents
- Cluster detail pages support whole-cluster and per-device wake flows
