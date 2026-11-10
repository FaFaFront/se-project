# End-to-end tests

Run all commands from the `se-project` repository root. These tests use the real
Next.js frontend, Express API, and PostgreSQL database. They do not mock API responses.
Playwright MCP was used to inspect the forms; the repeatable suite runs with Playwright Test.

## Run

Requires Node.js, Yarn, and a running Docker engine.

```powershell
yarn install
yarn db:generate
yarn exec playwright install chromium
yarn test:e2e:db
yarn test:e2e
```

On Windows, use `yarn.cmd` if PowerShell blocks `yarn.ps1`.

Playwright starts and stops its API at `http://127.0.0.1:4100` and web app at
`http://127.0.0.1:3100`. Leave these ports free. Existing development servers on ports
3000 and 4000 can keep running. The API startup applies the Prisma schema to the test database.

The separate Docker Compose project in `compose.e2e.yml` provides PostgreSQL on
`127.0.0.1:55432`, database `se_project_e2e`, with local test credentials `e2e` / `e2e`.
The suite never reads the development database connection for test data setup or cleanup.
Do not point the application used by real users at this test database.

```powershell
yarn test:e2e --headed
yarn test:e2e --grep TC1-3
yarn test:e2e:ui
yarn test:e2e:report
yarn test:e2e:check
yarn test:e2e:db:stop
```

HTML reports are written to `playwright-report/`. Failed tests keep traces, screenshots,
and videos in `test-results/`. Generated output is ignored by Git and format/lint checks.

## Test cases

| ID    | Scenario                                                        | Expected result                                            |
| ----- | --------------------------------------------------------------- | ---------------------------------------------------------- |
| TC1-1 | Student, `test123@gmail.com`, `P@ssw0rd`, matching confirmation | Account created; redirected to student profile setup       |
| TC1-2 | Tutor with all credential fields empty                          | Required-field messages; no registration request           |
| TC1-3 | Tutor, existing `nat.silp@gmail.com`, matching `newpassword123` | HTTP 409 and duplicate-email message                       |
| TC1-4 | Student, `test123#gmail.com`, matching `12345`                  | Email/password messages; no registration request           |
| TC1-5 | Tutor, `test123@gmail.com`, `password123` / `password999`       | Password mismatch; no registration request                 |
| TC2-1 | `nat.silp@gmail.com` / `selab2026`                              | Login succeeds; session survives protected-page navigation |
| TC2-2 | Empty login credentials                                         | Required-field messages; no login request                  |
| TC2-3 | Missing `newuser@gmail.com` / `selab1999`                       | HTTP 401; remains signed out                               |
| TC3-1 | Ryu, Grade 12, Prepare for university entrance exam             | Student profile persisted and protected profile accessible |
| TC3-2 | Student profile with all required fields empty                  | All required-field messages; profile stays incomplete      |
| TC4-1 | Fonn, hourly rate 10                                            | Tutor profile persisted and protected profile accessible   |
| TC4-2 | Empty tutor name, hourly rate 25                                | Name error; profile stays incomplete                       |
| TC4-3 | Fonn, hourly rate -10                                           | Rate error; profile stays incomplete                       |

**TC1-3 correction:** the supplied test case says “valid”, while its duplicate-email
equivalence class says “invalid”. The test expects rejection, matching the API's
unique-email constraint. It does not treat creating a duplicate account as success.

Before each run, setup recreates `nat.silp@gmail.com` with password `selab2026` and a
completed student profile in the isolated database. The unused addresses are cleared
before and after every test. Profile cases create a separate incomplete account for
each case through the real registration API, establish its API-issued browser session,
and remove that account afterward. The tests run with one worker to preserve the exact
shared email addresses from the plan and can also run individually or repeatedly.

In Playwright UI mode, rerun global setup by restarting the UI if you manually change
the existing test account.
