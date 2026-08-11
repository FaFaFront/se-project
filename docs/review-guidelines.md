# Review Guidelines

## API conventions (apps/api)

### Layer separation

Each resource has one file in each of `router/`, `controller/`, `service/`,
`repository/`. A layer must only call into the layer directly below it:
router → controller → service → repository. Flag any router that talks to a
service/repository directly, or any controller that calls Prisma directly.

### Validation

Input must be validated with a zod schema in the controller before it reaches the
service layer — there is no separate `dto/` layer. Flag any controller that reads
`req.body`/`req.params`/`req.query` without validating it first, and any service or
repository that imports `zod`.

### Response shape

All responses must use `successResponse()` / `errorResponse()` from
`common/utils/response.ts`. Flag any handler that returns a raw object via
`res.json({...})` without these helpers.

### Error handling

Throw typed errors (`NotFoundError`, `ForbiddenError`, `UnauthorizedError`,
`BadRequestError`, `ConflictError`) from the service layer and let the central
`error-handler.middleware.ts` translate them. Flag any service that returns `null` or
a plain error object instead of throwing.

### API docs

Every route must have a `@swagger` JSDoc block above it in `router/`. Flag any new
endpoint without one.

## Frontend conventions (apps/web)

### Data fetching

Data fetching goes through `lib/api-client.ts`. Flag any component that calls
`fetch()` directly against the API instead of going through the client.

### Structure

Everything lives flat under `src/` — `components/`, `lib/`, `hooks/`, `types/`. Shared
types (API response shapes, domain models) go in `types/`, one file per resource, so
components import them instead of redeclaring them.
