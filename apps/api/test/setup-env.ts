// Set before dotenv loads, which never overrides: a missed fake can't reach a real database.
process.env.DATABASE_URL = "postgresql://test:test@127.0.0.1:1/unit_tests";
process.env.JWT_SECRET = "unit-test-secret";
process.env.REDIS_URL = "";
