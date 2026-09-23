import StudentLoginPage, { metadata as studentMetadata } from "../student-login/page";

export const dynamic = "force-dynamic";

export const metadata = {
  ...studentMetadata,
  title: "Home - Futurex Learning",
};

export default StudentLoginPage;
