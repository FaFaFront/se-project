-- Reviews may be submitted with a star rating only.
ALTER TABLE "reviews" ALTER COLUMN "comment" DROP NOT NULL;
