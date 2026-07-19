import { WorkerHub } from "@/components/worker-hub";

export default async function WorkerHubPage({
  params,
}: {
  params: Promise<{ section: "stops" | "history" | "profile" }>;
}) {
  const { section } = await params;
  return (
    <WorkerHub
      view={section === "history" || section === "profile" ? section : "stops"}
    />
  );
}
