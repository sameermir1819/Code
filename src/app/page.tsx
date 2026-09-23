import { db } from "@/lib/db";
import { HomeLandingPage } from "@/components/public/home-landing-page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Futurex Learning - Premier Coaching for NEET, JEE & Foundation | Srinagar",
  description:
    "Official Institute Portal & Online Admissions for Session 2026-2027. Dual campuses in Hawal & Parraypora Srinagar.",
};

export default async function HomePage() {
  const [institute, campuses, courses, studentCount] = await Promise.all([
    db.institute.findFirst({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        tagline: true,
        phone: true,
        email: true,
        city: true,
        address: true,
      },
    }),
    db.institute.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        city: true,
        phone: true,
        address: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    db.course.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        code: true,
        gradeClass: true,
        duration: true,
        standardFee: true,
        description: true,
      },
      orderBy: { name: "asc" },
      take: 6,
    }),
    db.student.count(),
  ]);

  return (
    <HomeLandingPage
      institute={institute}
      campuses={campuses}
      courses={courses}
      studentCount={studentCount}
    />
  );
}
