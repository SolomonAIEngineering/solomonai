import config from "@/config";
import { getInboxEmail } from "@midday/inbox";
import { Icons } from "@midday/ui/icons";
import { CopyInput } from "./copy-input";

type Props = {
  inboxId: string;
};

export function InboxEmpty({ inboxId }: Props) {
  return (
    <div className="h-[calc(100vh-150px)] flex items-center justify-center">
      <div className="flex flex-col items-center max-w-[380px] w-full">
        <Icons.InboxEmpty className="mb-4 w-[35px] h-[35px]" />
        <div className="text-center mb-6 space-y-2">
          <h2 className="font-medium text-xl">Reconciliation Inbox</h2>
          <p className="text-[#606060] text-sm">
            Upload receipts by simply dragging and dropping them here.
            <br />
          </p>
        </div>

        <CopyInput value={getInboxEmail(inboxId)} />
      </div>
    </div>
  );
}
