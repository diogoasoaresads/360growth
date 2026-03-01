import { redirect } from "next/navigation";
import { SetupClient } from "./setup-client";

export const metadata = {
  title: "Setup | 360growth",
};

export default function SetupPage() {
  const qaEnabled =
    process.env.QA_TOOLS_ENABLED === "true" ||
    process.env.NODE_ENV === "development";

  if (!qaEnabled) {
    redirect("/login");
  }

  return <SetupClient />;
}
