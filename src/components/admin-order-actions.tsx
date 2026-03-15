"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type AdminOrderActionsProps = {
  orderId: string;
  printDone: boolean;
  rollNumber?: string;
  variant: "print" | "delete";
};

export function AdminOrderActions({ orderId, printDone, rollNumber, variant }: AdminOrderActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [checked, setChecked] = useState(printDone);
  const [isDeleting, setIsDeleting] = useState(false);

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
              const response = await fetch("/api/admin/orders/print-status", {
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
        <span>{checked ? "Done" : "Pending"}</span>
      </label>
    );
  }

  return (
    <button
      className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={isDeleting}
      onClick={async () => {
        const confirmed = window.confirm(
          `Delete record${rollNumber ? ` for ${rollNumber}` : ""}? This will also delete the poster file.`,
        );

        if (!confirmed) {
          return;
        }

        setIsDeleting(true);

        const response = await fetch("/api/admin/orders/delete", {
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