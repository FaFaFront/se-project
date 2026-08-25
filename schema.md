# Database Schema

SQL schema (PostgreSQL dialect) derived from the current MongoDB data model in
[lib/types.ts](lib/types.ts) and [lib/store.ts](lib/store.ts). IDs are kept as
`TEXT` to match the app's existing `nextId(prefix)` string-id scheme; switch to
`UUID` if the ID generator changes.

## Entity Overview

- `users` — students and tutors (single table, discriminated by `role`)
- `subjects` — catalog of subjects tutors can teach / students can request
- `tutor_subjects` — many-to-many between tutors (`users`) and `subjects`
- `conversations` / `messages` — 1:1 direct messaging between two users
- `classrooms` — a tutor/student pairing for a subject
- `classroom_documents` — files attached to a classroom
- `meet_sessions` — scheduled/ongoing/completed sessions within a classroom
- `transactions` — wallet ledger (top-ups, charges, earnings)
- `reviews` — one review per completed classroom

## DDL

```sql
CREATE TYPE role AS ENUM ('student', 'tutor');
CREATE TYPE classroom_status AS ENUM ('active', 'completed');
CREATE TYPE meet_session_status AS ENUM ('scheduled', 'ongoing', 'completed', 'cancelled');
CREATE TYPE transaction_type AS ENUM ('topup', 'session_charge', 'earning');

CREATE TABLE users (
    id                TEXT PRIMARY KEY,
    name              TEXT NOT NULL,
    email             TEXT NOT NULL UNIQUE,
    password_hash     TEXT NOT NULL,
    role              role NOT NULL,
    profile_url       TEXT NOT NULL,               -- avatar image URL
    bio               TEXT,
    hourly_rate       NUMERIC(10, 2),                -- tutor only, THB
    grade_level       TEXT,                          -- student only
    goals             TEXT,                          -- student only
    wallet_balance    NUMERIC(12, 2) NOT NULL DEFAULT 0, -- THB
    profile_complete  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_tutor_fields CHECK (
        role <> 'tutor' OR hourly_rate IS NOT NULL
    ),
    CONSTRAINT chk_student_fields CHECK (
        role <> 'student' OR grade_level IS NOT NULL
    )
);

CREATE TABLE subjects (
    id    TEXT PRIMARY KEY,
    name  TEXT NOT NULL UNIQUE
);

CREATE TABLE tutor_subjects (
    tutor_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id  TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,

    PRIMARY KEY (tutor_id, subject_id)
);
CREATE INDEX idx_tutor_subjects_subject ON tutor_subjects(subject_id);

CREATE TABLE conversations (
    id             TEXT PRIMARY KEY,
    participant_a  TEXT NOT NULL REFERENCES users(id),
    participant_b  TEXT NOT NULL REFERENCES users(id),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_distinct_participants CHECK (participant_a <> participant_b),
    CONSTRAINT uq_conversation_pair UNIQUE (participant_a, participant_b)
);

CREATE TABLE messages (
    id               TEXT PRIMARY KEY,
    conversation_id  TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id        TEXT NOT NULL REFERENCES users(id),
    text             TEXT NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);

CREATE TABLE classrooms (
    id              TEXT PRIMARY KEY,
    tutor_id        TEXT NOT NULL REFERENCES users(id),
    student_id      TEXT NOT NULL REFERENCES users(id),
    subject_id      TEXT NOT NULL REFERENCES subjects(id),
    price_per_hour  NUMERIC(10, 2) NOT NULL,
    status          classroom_status NOT NULL DEFAULT 'active',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_classrooms_tutor ON classrooms(tutor_id);
CREATE INDEX idx_classrooms_student ON classrooms(student_id);

CREATE TABLE classroom_documents (
    id            TEXT PRIMARY KEY,
    classroom_id  TEXT NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    uploaded_by   TEXT NOT NULL REFERENCES users(id),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_documents_classroom ON classroom_documents(classroom_id);

CREATE TABLE meet_sessions (
    id               TEXT PRIMARY KEY,
    classroom_id     TEXT NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    scheduled_at     TIMESTAMPTZ NOT NULL,
    duration_hours   NUMERIC(4, 2) NOT NULL,
    status           meet_session_status NOT NULL DEFAULT 'scheduled',
    meet_link        TEXT NOT NULL,
    started_at       TIMESTAMPTZ,
    ended_at         TIMESTAMPTZ,
    amount_charged   NUMERIC(10, 2)
);
CREATE INDEX idx_sessions_classroom ON meet_sessions(classroom_id);

CREATE TABLE transactions (
    id                 TEXT PRIMARY KEY,
    user_id            TEXT NOT NULL REFERENCES users(id),
    type               transaction_type NOT NULL,
    amount             NUMERIC(12, 2) NOT NULL CHECK (amount > 0), -- sign implied by type
    related_session_id TEXT REFERENCES meet_sessions(id),
    note               TEXT,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_transactions_user ON transactions(user_id, created_at);

CREATE TABLE reviews (
    id            TEXT PRIMARY KEY,
    classroom_id  TEXT NOT NULL REFERENCES classrooms(id),
    student_id    TEXT NOT NULL REFERENCES users(id),
    tutor_id      TEXT NOT NULL REFERENCES users(id),
    rating        SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment       TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_review_per_classroom UNIQUE (classroom_id)
);
CREATE INDEX idx_reviews_tutor ON reviews(tutor_id);
```

## Notes / Deviations from the Mongo Model

- `conversations.participant_ids` (a 2-tuple in Mongo) is split into
  `participant_a` / `participant_b` columns since SQL has no native tuple type;
  `uq_conversation_pair` enforces one conversation per unordered pair (insert
  with a consistent ordering, e.g. lexicographically smaller id first).
- `reviews` is constrained to one review per classroom via `uq_review_per_classroom`,
  matching `getReviewForClassroom`'s single-result lookup in [lib/store.ts:475](lib/store.ts#L475).
- Role-specific optional fields on `users` (hourly_rate vs grade_level/goals)
  are kept nullable with `CHECK` constraints rather than split into
  `tutors`/`students` subtype tables — mirrors the single-collection shape of
  `User` today. Split into subtype tables if these fields grow.
- `users.avatar` (a free-text emoji field) is renamed to `profile_url` and
  now stores a profile image URL instead of an emoji.
- `users.subjects` (a `TEXT[]` on the tutor row) is replaced by a dedicated
  `subjects` table plus a `tutor_subjects` join table, so subjects are a
  shared, normalized catalog instead of free-text per tutor.
  `classrooms.subject` now references `subjects(id)` for the same reason.
