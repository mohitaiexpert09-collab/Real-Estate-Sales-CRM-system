import PageHeader from "@/components/PageHeader";
import BroadcastComposer from "@/components/BroadcastComposer";

export const dynamic = "force-dynamic";

export default function BroadcastPage() {
  return (
    <>
      <PageHeader title="Broadcast" subtitle="Send a WhatsApp message to a filtered audience — personalised to every lead" />
      <div className="p-8">
        <BroadcastComposer />
      </div>
    </>
  );
}
