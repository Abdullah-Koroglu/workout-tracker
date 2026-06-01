# FitCoach Media Storage Strategy

## Problem

FitCoach currently stores user media under `public/uploads`. This works for local development, but it is not production-safe on serverless or multi-instance deployments because files can disappear between deploys, instances, or container restarts.

Production media classes:

- Coach avatar images
- Coach transformation before/after photos
- Client meal photos
- Client body check-in photos
- Movement and form-analysis videos

## Decision

Use a shared media storage abstraction in `lib/media-storage.ts`.

Current driver:

- `local`: writes to `public/uploads` and serves files through `/uploads/...`

Production target:

- S3-compatible object storage, preferably Cloudflare R2 or AWS S3
- Public CDN URLs for marketplace-safe media
- Private/signed URLs later for sensitive client progress media if needed

## Required Environment Variables

```env
MEDIA_STORAGE_DRIVER=local
MEDIA_PUBLIC_BASE_URL=
```

Future S3/R2 variables:

```env
MEDIA_STORAGE_DRIVER=s3
MEDIA_S3_BUCKET=
MEDIA_S3_REGION=
MEDIA_S3_ENDPOINT=
MEDIA_S3_ACCESS_KEY_ID=
MEDIA_S3_SECRET_ACCESS_KEY=
MEDIA_PUBLIC_BASE_URL=
```

## Migration Plan

1. Move all write/delete code behind `lib/media-storage.ts`.
2. Keep existing `/uploads/...` URLs working for local development.
3. Refactor avatar and transformation uploads first because they affect public marketplace trust.
4. Refactor meal photos and body check-ins next because they are client-sensitive.
5. Refactor movement videos last and decide whether videos should be private/signed.
6. Add object storage driver and production env validation before launch.

## Current Implementation Status

- Shared local storage helper: implemented.
- Avatar upload route: migrated to helper.
- Transformation upload/delete route: migrated to helper.
- Meal photo, body check-in, movement video, and form-analysis routes: still local; must migrate before production launch.
