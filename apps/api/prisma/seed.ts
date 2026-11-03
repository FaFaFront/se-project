import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;
const TUTOR_PASSWORD = "Tutor123!";
const STUDENT_PASSWORD = "Student123!";
const USER_COUNT = 50;

const SUBJECT_NAMES = [
  "Mathematics",
  "English",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "Thai Language",
  "Economics",
  "History",
  "Art",
] as const;

const FIRST_NAMES = [
  "Ava",
  "Liam",
  "Mia",
  "Noah",
  "Emma",
  "Ethan",
  "Sophia",
  "Lucas",
  "Isabella",
  "Mason",
  "Chanida",
  "Nattapong",
  "Suda",
  "Kittipong",
  "Pimchanok",
  "Anan",
  "Siriporn",
  "Thanakorn",
  "Napat",
  "Waraporn",
  "Oliver",
  "Charlotte",
  "James",
  "Amelia",
  "Benjamin",
] as const;

const LAST_NAMES = [
  "Carter",
  "Bennett",
  "Hayes",
  "Foster",
  "Reed",
  "Simmons",
  "Wattana",
  "Suksawat",
  "Charoensuk",
  "Thongchai",
  "Phetchara",
  "Kittisak",
  "Rattanakul",
  "Chaiyaporn",
  "Boonmee",
] as const;

const GRADE_LEVELS = [
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
  "Year 1 University",
  "Year 2 University",
] as const;

const REVIEW_COMMENTS = [
  "Great tutor, explained everything clearly!",
  "Very patient and helpful throughout our sessions.",
  "My grades improved a lot after a few lessons.",
  "Clear explanations and useful practice problems.",
  "Highly recommend — always on time and well prepared.",
  "Helped me understand concepts I'd struggled with for months.",
  "Friendly and knowledgeable, would definitely book again.",
  "Good tutor, though sessions sometimes ran a bit short.",
  "Really engaging teaching style, made the subject fun.",
  "Made a difficult topic much easier to understand.",
  null,
] as const;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(items: readonly T[]): T {
  return items[randomInt(0, items.length - 1)];
}

/** Fisher-Yates shuffle; does not mutate the input. */
function shuffled<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Skewed toward positive ratings, like a real tutoring platform. */
function randomRating(): number {
  const weights = [1, 1, 2, 4, 6]; // ratings 1..5
  let roll = Math.random() * weights.reduce((sum, weight) => sum + weight, 0);
  for (let rating = 1; rating <= weights.length; rating++) {
    roll -= weights[rating - 1];
    if (roll <= 0) return rating;
  }
  return weights.length;
}

function nameFor(index: number): string {
  const first = FIRST_NAMES[index % FIRST_NAMES.length];
  const last = LAST_NAMES[(index * 7 + 3) % LAST_NAMES.length];
  return `${first} ${last}`;
}

/** Real human headshots (not AI-generated placeholders); 1–70 are valid. */
function profileUrlFor(seedOffset: number, index: number): string {
  const imageNumber = ((seedOffset + index) % 70) + 1;
  return `https://i.pravatar.cc/300?img=${imageNumber}`;
}

function subjectsFor(index: number): string[] {
  const first = SUBJECT_NAMES[index % SUBJECT_NAMES.length];
  const second = SUBJECT_NAMES[(index + 3) % SUBJECT_NAMES.length];
  const subjects = [first, second];
  if (index % 3 === 0) subjects.push(SUBJECT_NAMES[(index + 6) % SUBJECT_NAMES.length]);
  return Array.from(new Set(subjects));
}

/** Clears every user and everything that depends on one, in FK-safe order. */
async function clearUserData() {
  await prisma.transaction.deleteMany();
  await prisma.meetSession.deleteMany();
  await prisma.classroomDocument.deleteMany();
  await prisma.review.deleteMany();
  await prisma.classroom.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.tutorSubject.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  await prisma.subject.createMany({
    data: SUBJECT_NAMES.map((name) => ({ name })),
    skipDuplicates: true,
  });
  const subjects = await prisma.subject.findMany();
  const subjectIdByName = new Map(subjects.map((subject) => [subject.name, subject.id]));

  console.log("Clearing existing student/tutor data...");
  await clearUserData();

  const [tutorPasswordHash, studentPasswordHash] = await Promise.all([
    bcrypt.hash(TUTOR_PASSWORD, SALT_ROUNDS),
    bcrypt.hash(STUDENT_PASSWORD, SALT_ROUNDS),
  ]);

  console.log(`Creating ${USER_COUNT} tutors...`);
  const tutors: { id: string; hourlyRate: number; subjectIds: string[] }[] = [];
  for (let i = 1; i <= USER_COUNT; i++) {
    const name = nameFor(i);
    const taughtSubjects = subjectsFor(i);
    const hourlyRate = 200 + (i % 8) * 50;

    const tutor = await prisma.user.create({
      data: {
        name,
        email: `tutor${pad(i)}@gmail.com`,
        passwordHash: tutorPasswordHash,
        role: Role.tutor,
        accountStatus: "ACTIVE",
        profileUrl: profileUrlFor(0, i),
        bio: `Experienced ${taughtSubjects.join(" and ")} tutor with ${1 + (i % 15)} years of teaching experience. Patient, friendly, and focused on helping students build real understanding.`,
        hourlyRate,
        walletBalance: 0,
        profileComplete: true,
      },
    });

    const subjectIds = taughtSubjects.map((subjectName) => subjectIdByName.get(subjectName)!);
    await prisma.tutorSubject.createMany({
      data: subjectIds.map((subjectId) => ({ tutorId: tutor.id, subjectId })),
      skipDuplicates: true,
    });
    tutors.push({ id: tutor.id, hourlyRate, subjectIds });
  }

  console.log(`Creating ${USER_COUNT} students...`);
  const studentIds: string[] = [];
  for (let i = 1; i <= USER_COUNT; i++) {
    const name = nameFor(i + USER_COUNT);
    const gradeLevel = GRADE_LEVELS[i % GRADE_LEVELS.length];
    const goalSubject = SUBJECT_NAMES[(i + 2) % SUBJECT_NAMES.length];

    const student = await prisma.user.create({
      data: {
        name,
        email: `student${pad(i)}@gmail.com`,
        passwordHash: studentPasswordHash,
        role: Role.student,
        accountStatus: "ACTIVE",
        profileUrl: profileUrlFor(70, i),
        gradeLevel,
        goals: `Improve my ${goalSubject} grades and get ready for upcoming exams.`,
        walletBalance: 0,
        profileComplete: true,
      },
    });
    studentIds.push(student.id);
  }

  console.log("Creating mock classrooms and reviews...");
  // Sequential on purpose: Supabase's pooler caps concurrent connections,
  // and this only runs once as a seed script.
  for (const tutor of tutors) {
    // Each tutor gets a random handful of past/current students, mostly reviewed.
    const pastStudentIds = shuffled(studentIds).slice(0, randomInt(0, 20));

    for (const studentId of pastStudentIds) {
      const willReview = Math.random() < 0.7;
      const classroom = await prisma.classroom.create({
        data: {
          tutorId: tutor.id,
          studentId,
          subjectId: pick(tutor.subjectIds),
          pricePerHour: tutor.hourlyRate,
          status: willReview || Math.random() < 0.5 ? "completed" : "active",
        },
      });

      if (willReview) {
        await prisma.review.create({
          data: {
            classroomId: classroom.id,
            studentId,
            tutorId: tutor.id,
            rating: randomRating(),
            comment: pick(REVIEW_COMMENTS),
          },
        });
      }
    }
  }

  console.log("Seed complete:");
  console.table([
    { role: "tutor", emails: "tutor01@gmail.com – tutor50@gmail.com", password: TUTOR_PASSWORD },
    {
      role: "student",
      emails: "student01@gmail.com – student50@gmail.com",
      password: STUDENT_PASSWORD,
    },
  ]);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
