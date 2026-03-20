"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type AdminOrderActionsProps = {
  orderId: string;
  orderKind: "ceer" | "azura";
  variant: "print" | "delete" | "download" | "downloaded";
  printDone?: boolean;
  downloaded?: boolean;
  recordLabel?: string;
};

const endpointMap = {
  ceer: {
    print: "/api/admin/orders/print-status",
    delete: "/api/admin/orders/delete",
    download: "/api/admin/orders/download",
  },
  azura: {
    print: "/api/admin/azura/orders/print-status",
    delete: "/api/admin/azura/orders/delete",
  },
} as const;

export function AdminOrderActions({
  orderId,
  orderKind,
  printDone = false,
  downloaded = false,
  recordLabel,
  variant,
}: AdminOrderActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [checked, setChecked] = useState(printDone);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (variant === "downloaded") {
    return (
      <label className="inline-flex items-center justify-center gap-2 text-sm text-stone-700">
        <input
          checked={downloaded}
          className="h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
          disabled
          type="checkbox"
        />
        <span>Downloaded</span>
      </label>
    );
  }

  if (variant === "download") {
    return (
      <button
        className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isDownloading}
        onClick={async () => {
          setIsDownloading(true);

          const response = await fetch(endpointMap.ceer.download, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ orderId }),
          });

          setIsDownloading(false);

          if (!response.ok) {
            alert("Unable to prepare the download.");
            return;
          }

          const payload = (await response.json()) as { url?: string; error?: string };

          if (!payload.url) {
            alert(payload.error || "Unable to open the download.");
            return;
          }

          window.open(payload.url, "_blank", "noopener,noreferrer");
          router.refresh();
        }}
        type="button"
      >
        {isDownloading ? "Opening..." : "Download"}
      </button>
    );
  }

  if (variant === "print") {
    return (
      <label className="inline-flex items-center gap-2 text-sm text-stone-700">
        <input
          checked={checked}
          className="h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
          disabled={isPending}
          onChange={(event) => {
            const nextChecked = event.target.checked;
            setChecked(nextChecked);

            startTransition(async () => {
              const response = await fetch(endpointMap[orderKind].print, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ orderId, printDone: nextChecked }),
              });

              if (!response.ok) {
                setChecked(!nextChecked);
                alert("Unable to update print status.");
                return;
              }

              router.refresh();
            });
          }}
          type="checkbox"
        />
        <span>Printed</span>
      </label>
    );
  }

  return (
    <button
      className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={isDeleting}
      onClick={async () => {
        const confirmed = window.confirm(
          `Delete record${recordLabel ? ` for ${recordLabel}` : ""}?${orderKind === "ceer" ? " This will also delete the poster file." : ""}`,
        );

        if (!confirmed) {
          return;
        }

        setIsDeleting(true);

        const response = await fetch(endpointMap[orderKind].delete, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ orderId }),
        });

        setIsDeleting(false);

        if (!response.ok) {
          alert("Unable to delete record.");
          return;
        }

        router.refresh();
      }}
      type="button"
    >
      {isDeleting ? "Deleting..." : "Delete"}
    </button>
  );
}