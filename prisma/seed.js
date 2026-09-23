const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL
    }
  }
});

async function main() {
  console.log("🌱 Starting Apex Academy ERP Database Seed...");

  // Clean existing data in reverse order of foreign keys
  console.log("🧹 Cleaning existing database records...");
  try {
    await prisma.auditLog.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.announcement.deleteMany();
    await prisma.document.deleteMany();
    await prisma.studentStudyMaterial.deleteMany();
    await prisma.studyMaterial.deleteMany();
    await prisma.testSeriesResult.deleteMany();
    await prisma.testSeriesRegistration.deleteMany();
    await prisma.testSeriesExam.deleteMany();
    await prisma.testSeries.deleteMany();
    await prisma.marks.deleteMany();
    await prisma.exam.deleteMany();
    await prisma.refundAdjustment.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.feeInstallment.deleteMany();
    await prisma.feePlan.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.timetableSlot.deleteMany();
    await prisma.enrollment.deleteMany();
    await prisma.teacherBatch.deleteMany();
    await prisma.teacherSubject.deleteMany();
    await prisma.courseSubject.deleteMany();
    await prisma.batch.deleteMany();
    await prisma.subject.deleteMany();
    await prisma.course.deleteMany();
    await prisma.student.deleteMany();
    await prisma.parent.deleteMany();
    await prisma.teacher.deleteMany();
    await prisma.user.deleteMany();
    await prisma.academicSession.deleteMany();
    await prisma.institute.deleteMany();
    console.log("✨ Existing records cleaned!");
  } catch (e) {
    console.log("Clean up notice:", e.message);
  }

  // 1. Institute
  const institute = await prisma.institute.create({
    data: {
      name: "Futurex_Learning",
      code: "FL-CAMPUS-01",
      tagline: "Premier Coaching for IIT-JEE, NEET-UG & Competitive Exams",
      address: "Plot 42, Knowledge Park, Central Avenue",
      city: "New Delhi",
      state: "Delhi",
      phone: "+91 98765 43210",
      email: "admissions@futurexlearning.com",
      website: "https://futurexlearning.com",
      currency: "INR",
      currencySymbol: "₹",
      timezone: "Asia/Kolkata",
    },
  });

  // 2. Academic Session
  const session = await prisma.academicSession.create({
    data: {
      instituteId: institute.id,
      name: "2025-2026",
      startDate: new Date("2025-04-01"),
      endDate: new Date("2026-03-31"),
      isCurrent: true,
    },
  });

  // Password hash for all demo users: 'Admin@123'
  const defaultPasswordHash = await bcrypt.hash("Admin@123", 10);

  // 3. Super Admin & Admin & Accountant Users
  const superAdminUser = await prisma.user.create({
    data: {
      instituteId: institute.id,
      name: "Director Dr. S. K. Mehta",
      email: "superadmin@futurexlearning.com",
      passwordHash: defaultPasswordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      instituteId: institute.id,
      name: "Academic Coordinator Ritu Sharma",
      email: "admin@futurexlearning.com",
      passwordHash: defaultPasswordHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  const accountantUser = await prisma.user.create({
    data: {
      instituteId: institute.id,
      name: "Senior Accountant Rashid Ali",
      email: "accounts@futurexlearning.com",
      passwordHash: defaultPasswordHash,
      role: "ACCOUNTANT",
      status: "ACTIVE",
    },
  });

  // 4. Teachers
  const teacherData = [
    {
      name: "Dr. Rajesh Verma",
      email: "rajesh.verma@futurexlearning.com",
      phone: "+91 98110 12345",
      teacherId: "TCH-001",
      gender: "MALE",
      qualification: "Ph.D. IIT Delhi, B.Tech IIT Kharagpur",
      specialization: "Mechanics & Electromagnetism",
    },
    {
      name: "Dr. Preeti Deshmukh",
      email: "preeti.deshmukh@futurexlearning.com",
      phone: "+91 98220 23456",
      teacherId: "TCH-002",
      gender: "FEMALE",
      qualification: "MBBS, M.S. AIIMS New Delhi",
      specialization: "Human Physiology & Genetics",
    },
    {
      name: "Er. Amitav Sen",
      email: "amitav.sen@futurexlearning.com",
      phone: "+91 98330 34567",
      teacherId: "TCH-003",
      gender: "MALE",
      qualification: "M.Sc. Mathematics, ISI Kolkata",
      specialization: "Calculus & Coordinate Geometry",
    },
    {
      name: "Prof. Meenakshi Sundaram",
      email: "m.sundaram@apexacademy.edu",
      phone: "+91 98440 45678",
      teacherId: "TCH-004",
      gender: "FEMALE",
      qualification: "M.Sc. Chemistry, CSIR-NET JRF",
      specialization: "Organic & Physical Chemistry",
    },
  ];

  const teachers = [];
  for (const t of teacherData) {
    const user = await prisma.user.create({
      data: {
        instituteId: institute.id,
        name: t.name,
        email: t.email,
        phone: t.phone,
        passwordHash: defaultPasswordHash,
        role: "TEACHER",
        status: "ACTIVE",
      },
    });

    const teacher = await prisma.teacher.create({
      data: {
        instituteId: institute.id,
        userId: user.id,
        teacherId: t.teacherId,
        name: t.name,
        email: t.email,
        phone: t.phone,
        gender: t.gender,
        qualification: t.qualification,
        specialization: t.specialization,
        address: "Campus Faculty Quarters, New Delhi",
        status: "ACTIVE",
      },
    });
    teachers.push(teacher);
  }

  // 5. Subjects
  const subjectsData = [
    { name: "Physics", code: "PHY-101", description: "Physics for JEE and NEET" },
    { name: "Chemistry", code: "CHM-101", description: "Organic, Inorganic & Physical Chemistry" },
    { name: "Mathematics", code: "MTH-101", description: "Higher Mathematics & Calculus" },
    { name: "Biology", code: "BIO-101", description: "Botany & Zoology for NEET" },
    { name: "General Science", code: "SCI-010", description: "Class 10 CBSE Integrated Science" },
  ];

  const subjects = [];
  for (const s of subjectsData) {
    const subj = await prisma.subject.create({ data: s });
    subjects.push(subj);
  }

  // Assign teachers to subjects
  await prisma.teacherSubject.createMany({
    data: [
      { teacherId: teachers[0].id, subjectId: subjects[0].id }, // Dr. Verma -> Physics
      { teacherId: teachers[1].id, subjectId: subjects[3].id }, // Dr. Deshmukh -> Biology
      { teacherId: teachers[2].id, subjectId: subjects[2].id }, // Er. Sen -> Math
      { teacherId: teachers[3].id, subjectId: subjects[1].id }, // Prof. Sundaram -> Chemistry
    ],
  });

  // 6. Courses
  const coursesData = [
    {
      name: "Class 11th — IIT-JEE 2-Year Target",
      code: "JEE-ADV-2Y",
      description: "Comprehensive 2-year classroom coaching for JEE Main & Advanced",
      duration: "2 Years",
      gradeClass: "Class 11",
      standardFee: 145000,
      registrationFee: 5000,
    },
    {
      name: "Class 12th — NEET Medical Champions",
      code: "NEET-MED-1Y",
      description: "Intensive 1-year coaching for NEET-UG with AIIMS standard test series",
      duration: "1 Year",
      gradeClass: "Class 12",
      standardFee: 150000,
      registrationFee: 5000,
    },
    {
      name: "Class 10th — CBSE Board & NTSE",
      code: "FND-CBSE-10",
      description: "Strong foundational coaching for Board exams and Olympiads",
      duration: "1 Year",
      gradeClass: "Class 10",
      standardFee: 85000,
      registrationFee: 3000,
    },
    {
      name: "JEE Repeater / Dropper Rankers",
      code: "JEE-DROP-1Y",
      description: "High-rigor full-day batch for 12th passed repeaters targeting top 500 AIR",
      duration: "1 Year",
      gradeClass: "Repeater",
      standardFee: 160000,
      registrationFee: 5000,
    },
  ];

  const courses = [];
  for (const c of coursesData) {
    const course = await prisma.course.create({
      data: {
        instituteId: institute.id,
        ...c,
        status: "ACTIVE",
      },
    });
    courses.push(course);
  }

  // Link subjects to courses
  await prisma.courseSubject.createMany({
    data: [
      { courseId: courses[0].id, subjectId: subjects[0].id }, // JEE -> Physics
      { courseId: courses[0].id, subjectId: subjects[1].id }, // JEE -> Chemistry
      { courseId: courses[0].id, subjectId: subjects[2].id }, // JEE -> Math
      { courseId: courses[1].id, subjectId: subjects[0].id }, // NEET -> Physics
      { courseId: courses[1].id, subjectId: subjects[1].id }, // NEET -> Chemistry
      { courseId: courses[1].id, subjectId: subjects[3].id }, // NEET -> Biology
      { courseId: courses[2].id, subjectId: subjects[4].id }, // 10th -> Science
      { courseId: courses[2].id, subjectId: subjects[2].id }, // 10th -> Math
    ],
  });

  // 7. Batches
  const batchesData = [
    {
      name: "Class 11 — JEE Super-30 Batch A",
      code: "BAT-2026-JEE-11A",
      courseId: courses[0].id,
      sessionId: session.id,
      startDate: new Date("2025-05-01"),
      endDate: new Date("2026-03-31"),
      capacity: 40,
      room: "Lecture Hall 101",
    },
    {
      name: "Class 12 — NEET Target Batch B",
      code: "BAT-2026-NEET-12B",
      courseId: courses[1].id,
      sessionId: session.id,
      startDate: new Date("2025-04-15"),
      endDate: new Date("2026-04-30"),
      capacity: 45,
      room: "Lecture Hall 202",
    },
    {
      name: "Class 10 — Foundation Batch C",
      code: "BAT-2026-FND-10C",
      courseId: courses[2].id,
      sessionId: session.id,
      startDate: new Date("2025-04-20"),
      endDate: new Date("2026-02-28"),
      capacity: 35,
      room: "Room 105",
    },
    {
      name: "JEE Droppers — Elite Rankers",
      code: "BAT-2026-DROP-01",
      courseId: courses[3].id,
      sessionId: session.id,
      startDate: new Date("2025-06-01"),
      endDate: new Date("2026-05-15"),
      capacity: 50,
      room: "Auditorium Hall A",
    },
  ];

  const batches = [];
  for (const b of batchesData) {
    const batch = await prisma.batch.create({
      data: {
        instituteId: institute.id,
        ...b,
        status: "ACTIVE",
      },
    });
    batches.push(batch);
  }

  // Assign teachers to batches
  await prisma.teacherBatch.createMany({
    data: [
      { teacherId: teachers[0].id, batchId: batches[0].id, isPrimary: true },
      { teacherId: teachers[2].id, batchId: batches[0].id, isPrimary: false },
      { teacherId: teachers[1].id, batchId: batches[1].id, isPrimary: true },
      { teacherId: teachers[3].id, batchId: batches[1].id, isPrimary: false },
      { teacherId: teachers[2].id, batchId: batches[2].id, isPrimary: true },
      { teacherId: teachers[0].id, batchId: batches[3].id, isPrimary: true },
    ],
  });

  // 8. Timetable Slots
  await prisma.timetableSlot.createMany({
    data: [
      {
        dayOfWeek: "MONDAY",
        startTime: "09:00",
        endTime: "10:30",
        batchId: batches[0].id,
        subjectId: subjects[0].id,
        teacherId: teachers[0].id,
        room: "Lecture Hall 101",
      },
      {
        dayOfWeek: "MONDAY",
        startTime: "10:45",
        endTime: "12:15",
        batchId: batches[0].id,
        subjectId: subjects[2].id,
        teacherId: teachers[2].id,
        room: "Lecture Hall 101",
      },
      {
        dayOfWeek: "TUESDAY",
        startTime: "09:00",
        endTime: "10:30",
        batchId: batches[1].id,
        subjectId: subjects[3].id,
        teacherId: teachers[1].id,
        room: "Lecture Hall 202",
      },
      {
        dayOfWeek: "WEDNESDAY",
        startTime: "14:00",
        endTime: "15:30",
        batchId: batches[2].id,
        subjectId: subjects[2].id,
        teacherId: teachers[2].id,
        room: "Room 105",
      },
    ],
  });

  // 9. Parents & Students
  const studentsRaw = [
    {
      name: "Aarav Sharma",
      email: "aarav.sharma@example.com",
      phone: "+91 98112 23344",
      gender: "MALE",
      dob: new Date("2008-05-14"),
      address: "B-14, Green Park Extension, New Delhi",
      gradeClass: "Class 11",
      schoolCollege: "DPS R.K. Puram",
      batchIdx: 0,
      parentName: "Ramesh Sharma",
      parentPhone: "+91 98112 20001",
      feeDiscount: 15000,
    },
    {
      name: "Ananya Patel",
      email: "ananya.patel@example.com",
      phone: "+91 98223 34455",
      gender: "FEMALE",
      dob: new Date("2007-09-22"),
      address: "Flat 402, Sector 15, Noida",
      gradeClass: "Class 12",
      schoolCollege: "Amity International School",
      batchIdx: 1,
      parentName: "Dr. Kirit Patel",
      parentPhone: "+91 98223 30002",
      feeDiscount: 0,
    },
    {
      name: "Rohan Verma",
      email: "rohan.verma@example.com",
      phone: "+91 98334 45566",
      gender: "MALE",
      dob: new Date("2006-11-05"),
      address: "H.No 78, Mayur Vihar Phase 1, Delhi",
      gradeClass: "Repeater",
      schoolCollege: "Modern School Barakhamba",
      batchIdx: 3,
      parentName: "Sanjay Verma",
      parentPhone: "+91 98334 40003",
      feeDiscount: 20000,
    },
    {
      name: "Priya Iyer",
      email: "priya.iyer@example.com",
      phone: "+91 98445 56677",
      gender: "FEMALE",
      dob: new Date("2007-03-18"),
      address: "Villa 12, South City II, Gurugram",
      gradeClass: "Class 12",
      schoolCollege: "The Heritage School",
      batchIdx: 1,
      parentName: "S. Swaminathan Iyer",
      parentPhone: "+91 98445 50004",
      feeDiscount: 0,
    },
    {
      name: "Vikram Malhotra",
      email: "vikram.m@example.com",
      phone: "+91 98556 67788",
      gender: "MALE",
      dob: new Date("2008-01-30"),
      address: "Pocket C, Sarita Vihar, New Delhi",
      gradeClass: "Class 11",
      schoolCollege: "Springdales School Dhaula Kuan",
      batchIdx: 0,
      parentName: "Rajiv Malhotra",
      parentPhone: "+91 98556 60005",
      feeDiscount: 10000,
    },
    {
      name: "Sneha Kulkarni",
      email: "sneha.k@example.com",
      phone: "+91 98667 78899",
      gender: "FEMALE",
      dob: new Date("2009-08-11"),
      address: "Flat 204, Vasant Kunj Enclave, New Delhi",
      gradeClass: "Class 10",
      schoolCollege: "Sanskriti School Chanakyapuri",
      batchIdx: 2,
      parentName: "Anand Kulkarni",
      parentPhone: "+91 98667 70006",
      feeDiscount: 5000,
    },
  ];

  const students = [];
  for (let i = 0; i < studentsRaw.length; i++) {
    const s = studentsRaw[i];
    const studentIdCode = `STU-2026-${String(i + 1).padStart(4, "0")}`;
    const admissionNoCode = `ADM-2026-${String(i + 1).padStart(4, "0")}`;

    // User for student portal
    const stuUser = await prisma.user.create({
      data: {
        instituteId: institute.id,
        name: s.name,
        email: s.email,
        phone: s.phone,
        passwordHash: defaultPasswordHash,
        role: "STUDENT",
        status: "ACTIVE",
      },
    });

    // Parent
    const parent = await prisma.parent.create({
      data: {
        name: s.parentName,
        phone: s.parentPhone,
        email: `parent.${s.email}`,
        relation: "Father",
        address: s.address,
      },
    });

    const student = await prisma.student.create({
      data: {
        instituteId: institute.id,
        userId: stuUser.id,
        parentId: parent.id,
        sessionId: session.id,
        studentId: studentIdCode,
        admissionNo: admissionNoCode,
        name: s.name,
        email: s.email,
        phone: s.phone,
        dob: s.dob,
        gender: s.gender,
        address: s.address,
        city: "New Delhi",
        state: "Delhi",
        schoolCollege: s.schoolCollege,
        gradeClass: s.gradeClass,
        admissionDate: new Date("2025-04-10"),
        status: "ACTIVE",
      },
    });
    students.push(student);

    // Enrollment
    const targetBatch = batches[s.batchIdx];
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId: student.id,
        courseId: targetBatch.courseId,
        batchId: targetBatch.id,
        startDate: new Date("2025-04-15"),
        status: "ACTIVE",
        source: "DIRECT_ADMISSION",
        notes: `Admitted to ${targetBatch.name}`,
      },
    });

    // Fee Plan
    const targetCourse = courses.find((c) => c.id === targetBatch.courseId);
    const standardFee = targetCourse.standardFee;
    const discount = s.feeDiscount;
    const finalFee = standardFee - discount;
    const initialPaid = i % 2 === 0 ? 50000 : finalFee; // some full, some partial
    const balance = Math.max(0, finalFee - initialPaid);

    const feePlan = await prisma.feePlan.create({
      data: {
        studentId: student.id,
        enrollmentId: enrollment.id,
        title: `${targetCourse.name} Fee Plan`,
        admissionFee: 10000,
        tuitionFee: standardFee - 25000,
        materialFee: 10000,
        examFee: 5000,
        totalAmount: standardFee,
        discountAmount: discount,
        discountReason: discount > 0 ? "Merit Scholarship / Early Bird" : null,
        finalAmount: finalFee,
        paidAmount: initialPaid,
        balanceAmount: balance,
        status: balance === 0 ? "PAID" : "PARTIAL",
      },
    });

    // Installments
    const inst1 = await prisma.feeInstallment.create({
      data: {
        feePlanId: feePlan.id,
        installmentNumber: 1,
        title: "Installment 1 (At Admission)",
        dueDate: new Date("2025-04-15"),
        amount: Math.round(finalFee / 2),
        paidAmount: Math.min(initialPaid, Math.round(finalFee / 2)),
        remainingAmount: Math.max(0, Math.round(finalFee / 2) - initialPaid),
        status: initialPaid >= Math.round(finalFee / 2) ? "PAID" : "PARTIAL",
      },
    });

    const inst2 = await prisma.feeInstallment.create({
      data: {
        feePlanId: feePlan.id,
        installmentNumber: 2,
        title: "Installment 2 (Mid-Session)",
        dueDate: new Date("2025-10-15"),
        amount: Math.round(finalFee / 2),
        paidAmount: initialPaid > Math.round(finalFee / 2) ? initialPaid - Math.round(finalFee / 2) : 0,
        remainingAmount: balance,
        status: balance === 0 ? "PAID" : "DUE",
      },
    });

    // Payment Record
    if (initialPaid > 0) {
      await prisma.payment.create({
        data: {
          receiptNo: `REC-2026-${String(i + 1).padStart(4, "0")}`,
          studentId: student.id,
          feePlanId: feePlan.id,
          installmentId: inst1.id,
          amount: initialPaid,
          paymentMethod: i % 2 === 0 ? "UPI" : "BANK_TRANSFER",
          paymentDate: new Date(),
          collectedBy: "Senior Accountant Rashid Ali",
          referenceNo: `UTR-${Math.floor(100000000000 + Math.random() * 900000000000)}`,
          notes: "Initial admission installment verified and cleared",
          status: "SUCCESS",
        },
      });
    }

    // Attendance records (past 5 days)
    for (let d = 1; d <= 5; d++) {
      const attDate = new Date();
      attDate.setDate(attDate.getDate() - d);

      await prisma.attendance.create({
        data: {
          studentId: student.id,
          batchId: targetBatch.id,
          date: attDate,
          status: i === 2 && d === 1 ? "ABSENT" : i === 4 && d === 2 ? "LATE" : "PRESENT",
          markedBy: "Dr. Rajesh Verma",
        },
      });
    }
  }

  // 10. Exams & Marks
  const exam1 = await prisma.exam.create({
    data: {
      title: "JEE Phase Assessment 01 — Mechanics & Vectors",
      code: "EXAM-2026-JEE-P1",
      type: "TEST",
      batchId: batches[0].id,
      subjectId: subjects[0].id,
      examDate: new Date("2025-08-20"),
      maxMarks: 100,
      passingMarks: 40,
      durationMinutes: 180,
      instructions: "Standard JEE Advanced marking pattern (+4, -1)",
      status: "PUBLISHED",
    },
  });

  // Marks for batch 0 students (Aarav, Vikram)
  await prisma.marks.create({
    data: {
      examId: exam1.id,
      studentId: students[0].id,
      marksObtained: 92,
      percentage: 92,
      grade: "A+",
      isPassed: true,
      remarks: "Outstanding analytical speed in Rotational Dynamics",
    },
  });

  await prisma.marks.create({
    data: {
      examId: exam1.id,
      studentId: students[4].id,
      marksObtained: 76,
      percentage: 76,
      grade: "B+",
      isPassed: true,
      remarks: "Good effort; focus on Newton's Laws edge cases",
    },
  });

  // 11. Announcements
  await prisma.announcement.create({
    data: {
      title: "All-India Grand Mock Test Series Announced",
      message: "The first All-India Open Mock Test for JEE & NEET will be held on the upcoming Sunday at 10:00 AM. Attendance is mandatory for all enrolled students.",
      priority: "HIGH",
      targetRole: "ALL",
      publishDate: new Date(),
      createdById: superAdminUser.id,
    },
  });

  await prisma.announcement.create({
    data: {
      title: "Parent-Teacher Review Meeting (PTM) Scheduled",
      message: "Quarterly PTM for Class 11 and Class 12 batches is scheduled for Saturday between 2:00 PM and 6:00 PM.",
      priority: "MEDIUM",
      targetRole: "PARENT",
      publishDate: new Date(),
      createdById: adminUser.id,
    },
  });

  // 12. Initial Audit Log
  await prisma.auditLog.create({
    data: {
      instituteId: institute.id,
      userId: superAdminUser.id,
      userName: superAdminUser.name,
      userRole: superAdminUser.role,
      action: "SYSTEM_INITIALIZED",
      entity: "Institute",
      entityId: institute.id,
      details: "Database successfully seeded with realistic Indian coaching institute academic, financial, and batch data.",
    },
  });

  // 13. Offline Test Series & Mock Exams
  console.log("🌱 Seeding Offline Test Series & Exam Schedules...");
  const neetSeries = await prisma.testSeries.upsert({
    where: { code: "TS-2026-NEET-MAJOR" },
    update: {},
    create: {
      instituteId: institute.id,
      title: "All India NEET 2026 Major Mock Drill Series",
      code: "TS-2026-NEET-MAJOR",
      description: "Comprehensive full-syllabus offline pen-paper mock tests with nationwide ranking, OMR evaluation, and video/PDF solutions.",
      targetExam: "NEET",
      fee: 3500,
      totalTests: 8,
      startDate: new Date("2026-03-01"),
      endDate: new Date("2026-05-01"),
      testCenterVenue: "Main Campus Auditorium & Hall A, Knowledge Park",
      status: "ACTIVE",
    },
  });

  const jeeSeries = await prisma.testSeries.upsert({
    where: { code: "TS-2026-JEE-ADV" },
    update: {},
    create: {
      instituteId: institute.id,
      title: "JEE Advanced 2026 Benchmark Offline Mock Series",
      code: "TS-2026-JEE-ADV",
      description: "Rigorous paper 1 and paper 2 offline simulation strictly on actual JEE Advanced pattern with detailed diagnostic reports.",
      targetExam: "JEE_ADVANCED",
      fee: 4000,
      totalTests: 6,
      startDate: new Date("2026-03-15"),
      endDate: new Date("2026-05-20"),
      testCenterVenue: "Tech Block, Lecture Theater 1 & 2",
      status: "ACTIVE",
    },
  });

  const test1 = await prisma.testSeriesExam.upsert({
    where: { code: "TS-NEET-MOCK-01" },
    update: {},
    create: {
      testSeriesId: neetSeries.id,
      testNumber: 1,
      title: "Major Test 01 - Full Class 11 (Physics, Chemistry & Biology)",
      code: "TS-NEET-MOCK-01",
      examDate: new Date("2026-03-10T10:00:00.000Z"),
      durationMinutes: 200,
      maxMarks: 720,
      passingMarks: 250,
      syllabus: "Physics: Kinematics, Laws of Motion, Thermodynamics | Chemistry: Chemical Bonding, Periodic Table, Equilibrium | Biology: Cell Biology, Plant Physiology, Biomolecules",
      venueRoom: "Hall A, Row 1-20 (OMR Sheet Based)",
      paperType: "OMR Pen-Paper Offline",
      answerKeyUrl: "https://example.com/solutions/neet-mock-01.pdf",
      status: "RESULTS_PUBLISHED",
    },
  });

  await prisma.testSeriesExam.upsert({
    where: { code: "TS-NEET-MOCK-02" },
    update: {},
    create: {
      testSeriesId: neetSeries.id,
      testNumber: 2,
      title: "Major Test 02 - Full Class 12 (Physics, Chemistry & Biology)",
      code: "TS-NEET-MOCK-02",
      examDate: new Date("2026-04-05T10:00:00.000Z"),
      durationMinutes: 200,
      maxMarks: 720,
      passingMarks: 250,
      syllabus: "Physics: Electrostatics, Magnetism, Optics | Chemistry: Coordination Compounds, Organic Chemistry | Biology: Genetics, Evolution, Biotechnology",
      venueRoom: "Hall A & B (OMR Sheet Based)",
      paperType: "OMR Pen-Paper Offline",
      status: "SCHEDULED",
    },
  });

  const studentsList = await prisma.student.findMany({ take: 5 });
  let regIdx = 1;
  const createdRegs = [];

  for (const stu of studentsList) {
    const rollNumber = `TS-2026-ROLL-000${regIdx}`;
    const receiptNo = `TS-REC-2026-000${regIdx}`;

    const reg = await prisma.testSeriesRegistration.upsert({
      where: { rollNumber },
      update: {},
      create: {
        testSeriesId: neetSeries.id,
        studentId: stu.id,
        rollNumber,
        feeAmount: 3500,
        paymentStatus: "PAID",
        paymentMethod: regIdx % 2 === 0 ? "UPI" : "CASH",
        receiptNo,
        paidAt: new Date(),
        status: "CONFIRMED",
        remarks: "Enrolled in NEET Major offline series. Fee received in full.",
      },
    });

    createdRegs.push(reg);
    regIdx++;
  }

  const extRoll = `TS-2026-ROLL-000${regIdx}`;
  const extReceipt = `TS-REC-2026-000${regIdx}`;
  const extReg = await prisma.testSeriesRegistration.upsert({
    where: { rollNumber: extRoll },
    update: {},
    create: {
      testSeriesId: neetSeries.id,
      externalStudentName: "Rohan V. Kulkarni",
      externalStudentPhone: "+91 98220 11223",
      externalStudentEmail: "rohan.kulkarni@external.com",
      rollNumber: extRoll,
      feeAmount: 3500,
      paymentStatus: "PAID",
      paymentMethod: "UPI",
      receiptNo: extReceipt,
      paidAt: new Date(),
      status: "CONFIRMED",
      remarks: "External guest student from Apex Public School.",
    },
  });
  createdRegs.push(extReg);

  const sampleMarks = [645, 612, 584, 550, 520, 485];
  for (let i = 0; i < createdRegs.length; i++) {
    const reg = createdRegs[i];
    const marks = sampleMarks[i] || 450;
    const rank = i + 1;
    const percentile = Number((((createdRegs.length - rank) / createdRegs.length) * 100).toFixed(2));
    const percentage = Number(((marks / 720) * 100).toFixed(2));

    await prisma.testSeriesResult.upsert({
      where: {
        testSeriesExamId_registrationId: {
          testSeriesExamId: test1.id,
          registrationId: reg.id,
        },
      },
      update: {},
      create: {
        testSeriesExamId: test1.id,
        registrationId: reg.id,
        marksObtained: marks,
        maxMarks: 720,
        percentage,
        rank,
        percentile,
        attendance: "PRESENT",
        subjectBreakup: JSON.stringify({
          Physics: Math.round(marks * 0.25),
          Chemistry: Math.round(marks * 0.25),
          Biology: Math.round(marks * 0.5),
        }),
        negativeMarks: 12,
        correctCount: Math.round(marks / 4) + 3,
        incorrectCount: 12,
        unattemptedCount: 180 - (Math.round(marks / 4) + 15),
        remarks: rank <= 3 ? "Outstanding performance in Biology and Organic Chemistry." : "Consistent preparation, revise physical chemistry formulas.",
      },
    });
  }

  // 14. Granular RBAC Permissions & System Roles
  console.log("🌱 Seeding Permissions and RBAC Roles...");
  const STANDARD_PERMISSIONS = [
    { code: "users.view", name: "View Users", module: "users", description: "View system user accounts, roles and profiles" },
    { code: "users.create", name: "Create Users", module: "users", description: "Add new administrative, faculty, and student user accounts" },
    { code: "users.update", name: "Update Users", module: "users", description: "Edit user profile information, contact details, and branches" },
    { code: "users.status", name: "Manage User Status", module: "users", description: "Activate, suspend or deactivate user accounts" },
    { code: "users.role", name: "Manage Roles & Permissions", module: "users", description: "Configure system roles, custom roles, and permission assignments" },
    { code: "users.permissions", name: "Direct Permissions", module: "users", description: "Assign direct user-level permission overrides" },
    { code: "users.delete", name: "Delete Users", module: "users", description: "Archive or permanently remove user accounts" },
    { code: "users.activity", name: "View User Activity", module: "users", description: "Inspect user activity logs, login history, and audit trails" },
    { code: "students.view", name: "View Students", module: "students", description: "Access student directory, academic profiles, and enrollments" },
    { code: "students.create", name: "Admit Students", module: "students", description: "Register new student admissions and allocate enrollment numbers" },
    { code: "students.update", name: "Update Students", module: "students", description: "Modify student personal details, parents, and academic info" },
    { code: "students.delete", name: "Archive Students", module: "students", description: "Archive or delete student admission records" },
    { code: "teachers.view", name: "View Faculty", module: "teachers", description: "View faculty directory, profiles, and qualifications" },
    { code: "teachers.create", name: "Add Faculty", module: "teachers", description: "Onboard new teachers and faculty members" },
    { code: "teachers.update", name: "Update Faculty", module: "teachers", description: "Edit teacher subject specializations, bios, and assignments" },
    { code: "courses.view", name: "View Courses", module: "academics", description: "View courses, curriculum structures, and subject syllabi" },
    { code: "courses.manage", name: "Manage Courses", module: "academics", description: "Create, edit, or archive academic courses and subjects" },
    { code: "batches.view", name: "View Batches", module: "academics", description: "Browse class batches, timings, and enrolled students" },
    { code: "batches.manage", name: "Manage Batches", module: "academics", description: "Create class batches, assign faculty, and set room capacities" },
    { code: "timetable.view", name: "View Timetable", module: "academics", description: "View master lecture schedule and weekly classroom timetables" },
    { code: "timetable.manage", name: "Manage Timetable", module: "academics", description: "Schedule class periods, assign lecture rooms, and adjust slots" },
    { code: "attendance.view", name: "View Attendance", module: "attendance", description: "Review daily student and faculty attendance records and percentages" },
    { code: "attendance.manage", name: "Mark Attendance", module: "attendance", description: "Mark, update, and submit daily batch attendance registers" },
    { code: "fees.view", name: "View Fees", module: "finance", description: "Access fee structures, student dues, ledger, and transaction logs" },
    { code: "fees.create", name: "Collect Fees", module: "finance", description: "Record fee payments, issue receipts, and print invoices" },
    { code: "fees.update", name: "Manage Fee Plans", module: "finance", description: "Configure course fee plans, installment schedules, and discounts" },
    { code: "exams.view", name: "View Exams", module: "exams", description: "View offline test series, exam schedules, and test papers" },
    { code: "exams.create", name: "Create Exams", module: "exams", description: "Schedule exams, assessments, and offline test series" },
    { code: "exams.update", name: "Edit Exams", module: "exams", description: "Modify exam syllabus, duration, marks weighting, and test dates" },
    { code: "results.view", name: "View Results", module: "exams", description: "View scorecards, merit lists, percentile ranks, and analysis" },
    { code: "results.manage", name: "Enter Marks & Results", module: "exams", description: "Enter student marks, generate rank sheets, and publish results" },
    { code: "reports.view", name: "View Reports", module: "reports", description: "Access analytics dashboards, financial summaries, and data exports" },
    { code: "settings.view", name: "View Settings", module: "settings", description: "View institute configuration, campus profile, and system audit logs" },
    { code: "settings.manage", name: "Manage Settings", module: "settings", description: "Configure institute preferences, academic sessions, and campuses" },
  ];

  for (const perm of STANDARD_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: { name: perm.name, module: perm.module, description: perm.description },
      create: { code: perm.code, name: perm.name, module: perm.module, description: perm.description },
    });
  }

  const STANDARD_ROLES = [
    { name: "SUPER_ADMIN", displayName: "Super Administrator", description: "Full master administrative control across all campuses and modules.", isSystem: true },
    { name: "ADMIN", displayName: "Campus Administrator", description: "Operational management for students, faculty, academics, and exams.", isSystem: true },
    { name: "ACCOUNTANT", displayName: "Finance & Accounts", description: "Fee collections, payment entries, invoice receipts, and reports.", isSystem: true },
    { name: "TEACHER", displayName: "Faculty / Teacher", description: "Class batches, attendance, exams, and marks entry.", isSystem: true },
    { name: "COUNSELOR", displayName: "Admission Counselor", description: "Student inquiries, follow-up CRM leads, and prospective admissions.", isSystem: true },
    { name: "STAFF", displayName: "Support Staff", description: "General operational staff with view access.", isSystem: true },
    { name: "STUDENT", displayName: "Student", description: "Student access to course schedule, attendance, marks, and fees.", isSystem: true },
    { name: "PARENT", displayName: "Parent / Guardian", description: "Guardian portal to monitor attendance, fee dues, and progress.", isSystem: true },
  ];

  for (const r of STANDARD_ROLES) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: { displayName: r.displayName, description: r.description, isSystem: r.isSystem },
      create: { name: r.name, displayName: r.displayName, description: r.description, isSystem: r.isSystem },
    });
  }

  const ROLE_PERMISSIONS_MAP = {
    SUPER_ADMIN: STANDARD_PERMISSIONS.map((p) => p.code),
    ADMIN: [
      "users.view", "users.create", "users.update", "users.status", "users.activity",
      "students.view", "students.create", "students.update", "students.delete",
      "teachers.view", "teachers.create", "teachers.update",
      "courses.view", "courses.manage", "batches.view", "batches.manage",
      "timetable.view", "timetable.manage",
      "attendance.view", "attendance.manage",
      "fees.view", "fees.create", "fees.update",
      "exams.view", "exams.create", "exams.update", "results.view", "results.manage",
      "reports.view", "settings.view", "settings.manage"
    ],
    ACCOUNTANT: ["users.view", "students.view", "fees.view", "fees.create", "fees.update", "reports.view"],
    TEACHER: [
      "users.view", "students.view", "courses.view", "batches.view", "timetable.view",
      "attendance.view", "attendance.manage", "exams.view", "exams.update", "results.view", "results.manage"
    ],
    COUNSELOR: ["students.view", "courses.view", "batches.view"],
    STAFF: ["students.view", "attendance.view", "batches.view"],
    STUDENT: ["courses.view", "batches.view", "timetable.view", "attendance.view", "fees.view", "results.view"],
    PARENT: ["attendance.view", "fees.view", "results.view"],
  };

  const allDbPerms = await prisma.permission.findMany();
  const permMap = new Map(allDbPerms.map((p) => [p.code, p.id]));
  const allRoles = await prisma.role.findMany();

  for (const role of allRoles) {
    const codes = ROLE_PERMISSIONS_MAP[role.name] || [];
    for (const code of codes) {
      const permId = permMap.get(code);
      if (permId) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: role.id, permissionId: permId } },
          update: {},
          create: { roleId: role.id, permissionId: permId },
        });
      }
    }
  }

  // Link all created users to their roles
  const allUsers = await prisma.user.findMany({ select: { id: true, role: true } });
  const roleNameMap = new Map(allRoles.map((r) => [r.name, r.id]));
  for (const u of allUsers) {
    const rId = roleNameMap.get(u.role);
    if (rId) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: u.id, roleId: rId } },
        update: {},
        create: { userId: u.id, roleId: rId },
      });
    }
  }

  console.log("✅ Seed completed successfully!");
  console.log("-----------------------------------------");
  console.log("Credentials:");
  console.log("Super Admin : superadmin@futurexlearning.com / Admin@123");
  console.log("Admin       : admin@futurexlearning.com / Admin@123");
  console.log("Accountant  : accounts@futurexlearning.com / Admin@123");
  console.log("Teacher     : rajesh.verma@futurexlearning.com / Admin@123");
  console.log("Student     : aarav.sharma@example.com / Admin@123");
  console.log("-----------------------------------------");
}

main()
  .catch((e) => {
    console.error("❌ Seed Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

