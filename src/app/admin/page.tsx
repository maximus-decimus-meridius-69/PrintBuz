import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminOrderActions } from "@/components/admin-order-actions";
import { getServerEnv } from "@/lib/env";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import {
  AZURA_POSTER_WIDTH,
  COURSE_OPTIONS,
  YEAR_OPTIONS,
  type AzuraOrderDbRecord,
  type CeerOrderDbRecord,
  type OrderEvent,
} from "@/lib/types";

type AdminPageProps = {
  searchParams: Promise<{
    event?: string;
    course?: string;
    department?: string;
    section?: string;
    year?: string;
  }>;
};

export const dynamic = "force-dynamic";

const normalizeFilter = (value?: string) => (value && value !== "all" ? value : "all");
const normalizeEvent = (value?: string): OrderEvent => (value === "azura" ? "azura" : "ceer");

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const serverEnv = getServerEnv();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const normalizedEmail = user.email?.toLowerCase() ?? "";

  if (!serverEnv.adminEmails.includes(normalizedEmail)) {
    return (
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-6 py-16 text-center">
        <p className="display-font text-xs uppercase tracking-[0.5em] text-amber-700">Restricted</p>
        <h1 className="display-font mt-4 text-5xl text-stone-950">Access denied.</h1>
      </main>
    );
  }

  const params = await searchParams;
  const currentEvent = normalizeEvent(params.event);
  const currentCourse = normalizeFilter(params.course);
  const currentDepartment = normalizeFilter(params.department);
  const currentSection = normalizeFilter(params.section);
  const currentYear = normalizeFilter(params.year);

  const adminClient = createSupabaseAdminClient();
  const { data: ceerData, error: ceerError } = await adminClient
    .from("poster_orders")
    .select("*")
    .eq("status", "paid");
  const { data: azuraData, error: azuraError } = await adminClient
    .from("azura_orders")
    .select("*")
    .eq("status", "paid");

  const allOrders = ((ceerData ?? []) as Array<Partial<CeerOrderDbRecord>>).map((order) => ({
    ...order,
    event: order.event ?? "ceer",
    downloaded: order.downloaded ?? false,
    print_done: order.print_done ?? false,
  })) as CeerOrderDbRecord[];
  const azuraOrders = ((azuraData ?? []) as Array<Partial<AzuraOrderDbRecord>>).map((order) => ({
    ...order,
    print_done: order.print_done ?? false,
  })) as AzuraOrderDbRecord[];
  const departmentOptions = Array.from(new Set(allOrders.map((order) => order.department))).sort((left, right) =>
    left.localeCompare(right, undefined, { sensitivity: "base" }),
  );
  const sectionSourceOrders = allOrders.filter((order) => {
    const eventMatches = order.event === currentEvent;
    const courseMatches = currentCourse === "all" || order.course === currentCourse;
    const departmentMatches = currentDepartment === "all" || order.department === currentDepartment;
    return eventMatches && courseMatches && departmentMatches;
  });
  const sectionOptions = Array.from(new Set(sectionSourceOrders.map((order) => order.section))).sort((left, right) =>
    left.localeCompare(right, undefined, { sensitivity: "base" }),
  );
  const filteredOrders = allOrders.filter((order) => {
    const eventMatches = order.event === currentEvent;
    const courseMatches = currentCourse === "all" || order.course === currentCourse;
    const departmentMatches = currentDepartment === "all" || order.department === currentDepartment;
    const sectionMatches = currentSection === "all" || order.section === currentSection;
    const yearMatches = currentYear === "all" || order.year === currentYear;

    return eventMatches && courseMatches && departmentMatches && sectionMatches && yearMatches;
  });
  const orders = [...filteredOrders].sort(
    (left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime(),
  );
  const hasError = currentEvent === "ceer" ? ceerError : azuraError;

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-8 md:px-10">
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="display-font text-xs uppercase tracking-[0.5em] text-amber-700">Admin interface</p>
          <h1 className="display-font mt-3 text-5xl text-stone-950">Poster orders</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <form action="/api/admin/sign-out" method="post">
            <button
              className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm text-stone-700"
              type="submit"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          className={`rounded-full px-5 py-3 text-sm font-medium ${
            currentEvent === "azura"
              ? "border border-amber-300 bg-amber-100 text-amber-900"
              : "border border-stone-300 bg-white text-stone-700"
          }`}
          href="/admin?event=azura"
        >
          Azura Orders
        </Link>
        <Link
          className={`rounded-full px-5 py-3 text-sm font-medium ${
            currentEvent === "ceer"
              ? "border border-amber-300 bg-amber-100 text-amber-900"
              : "border border-stone-300 bg-white text-stone-700"
          }`}
          href="/admin?event=ceer"
        >
          Ceer Orders
        </Link>
      </div>

      {hasError ? (
        <div className="rounded-4xl bg-rose-100 px-5 py-4 text-rose-700">
          Unable to load orders.
        </div>
      ) : null}

      {currentEvent === "ceer" ? (
        <>
          <form className="mb-6 grid gap-4 rounded-4xl border border-stone-200 bg-white/85 p-5 shadow-[0_20px_80px_rgba(28,25,23,0.06)] md:grid-cols-[1fr_1fr_1fr_1fr_auto_auto]" method="get">
            <input name="event" type="hidden" value={currentEvent} />
            <label className="space-y-2 text-sm text-stone-700">
              <span>Course</span>
              <select className="field" defaultValue={currentCourse} name="course">
                <option value="all">All courses</option>
                {COURSE_OPTIONS.map((course) => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm text-stone-700">
              <span>Department</span>
              <select className="field" defaultValue={currentDepartment} name="department">
                <option value="all">All departments</option>
                {departmentOptions.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm text-stone-700">
              <span>Section</span>
              <select className="field" defaultValue={currentSection} name="section">
                <option value="all">All sections</option>
                {sectionOptions.map((section) => (
                  <option key={section} value={section}>
                    {section}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm text-stone-700">
              <span>Year</span>
              <select className="field" defaultValue={currentYear} name="year">
                <option value="all">All years</option>
                {YEAR_OPTIONS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>

            <button className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800 md:self-end" type="submit">
              Apply
            </button>

            <Link className="rounded-full border border-stone-300 bg-white px-5 py-3 text-center text-sm text-stone-700 md:self-end" href="/admin">
              Reset
            </Link>
          </form>

          <div className="mb-4 flex items-center justify-between px-1 text-sm text-stone-600">
            <span>{orders.length} order{orders.length === 1 ? "" : "s"} shown</span>
            <span>
              Ceer
              {" · "}
              {currentCourse === "all" ? "All courses" : currentCourse}
              {" · "}
              {currentDepartment === "all" ? "All departments" : currentDepartment}
              {" · "}
              {currentSection === "all" ? "All sections" : currentSection}
              {" · "}
              {currentYear === "all" ? "All years" : `Year ${currentYear}`}
            </span>
          </div>

          <div className="overflow-hidden rounded-4xl border border-stone-200 bg-white shadow-[0_20px_80px_rgba(28,25,23,0.08)]">
            <div className="grid grid-cols-[0.7fr_1fr_0.8fr_0.7fr_0.8fr_0.8fr_1.1fr_0.9fr_1fr_1fr_1fr_1fr] gap-4 border-b border-stone-200 bg-stone-950 px-5 py-4 text-xs uppercase tracking-[0.2em] text-stone-300">
              <span>#</span>
              <span>Roll number</span>
              <span>Dept</span>
              <span>Year</span>
              <span>Course</span>
              <span>Section</span>
              <span>Email</span>
              <span>File</span>
              <span>Download</span>
              <span>Downloaded</span>
              <span>Printed</span>
              <span>Actions</span>
            </div>
            {orders.length ? (
              orders.map((order, index) => (
                <div key={order.id} className="grid grid-cols-[0.7fr_1fr_0.8fr_0.7fr_0.8fr_0.8fr_1.1fr_0.9fr_1fr_1fr_1fr_1fr] gap-4 border-b border-stone-100 px-5 py-4 text-sm text-stone-700 last:border-b-0">
                  <span>{index + 1}</span>
                  <span>{order.roll_number}</span>
                  <span>{order.department}</span>
                  <span>{order.year}</span>
                  <span>{order.course}</span>
                  <span>{order.section}</span>
                  <span className="truncate">{order.email}</span>
                  <span>{order.poster_url ? "Ready" : "-"}</span>
                  <span>
                    <AdminOrderActions orderId={order.id} orderKind="ceer" variant="download" />
                  </span>
                  <span>
                    <AdminOrderActions
                      downloaded={order.downloaded}
                      orderId={order.id}
                      orderKind="ceer"
                      variant="downloaded"
                    />
                  </span>
                  <span>
                    <AdminOrderActions
                      orderId={order.id}
                      orderKind="ceer"
                      printDone={order.print_done}
                      variant="print"
                    />
                  </span>
                  <span>
                    <AdminOrderActions
                      orderId={order.id}
                      orderKind="ceer"
                      recordLabel={order.roll_number}
                      variant="delete"
                    />
                  </span>
                </div>
              ))
            ) : (
              <div className="px-5 py-16 text-center text-stone-500">No paid CEER orders yet.</div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between px-1 text-sm text-stone-600">
            <span>{azuraOrders.length} order{azuraOrders.length === 1 ? "" : "s"} shown</span>
            <span>Azura orders</span>
          </div>

          <div className="overflow-hidden rounded-4xl border border-stone-200 bg-white shadow-[0_20px_80px_rgba(28,25,23,0.08)]">
            <div className="grid grid-cols-[0.7fr_1.1fr_1fr_1.2fr_0.9fr_0.8fr_0.9fr_0.9fr_1fr] gap-4 border-b border-stone-200 bg-stone-950 px-5 py-4 text-xs uppercase tracking-[0.2em] text-stone-300">
              <span>#</span>
              <span>Name</span>
              <span>Phone</span>
              <span>Email</span>
              <span>Size</span>
              <span>Amount</span>
              <span>Link</span>
              <span>Printed</span>
              <span>Actions</span>
            </div>
            {azuraOrders.length ? (
              azuraOrders.map((order, index) => (
                <div key={order.id} className="grid grid-cols-[0.7fr_1.1fr_1fr_1.2fr_0.9fr_0.8fr_0.9fr_0.9fr_1fr] gap-4 border-b border-stone-100 px-5 py-4 text-sm text-stone-700 last:border-b-0">
                  <span>{index + 1}</span>
                  <span>{order.name}</span>
                  <span>{order.phone}</span>
                  <span className="truncate">{order.email}</span>
                  <span>{AZURA_POSTER_WIDTH} x {order.height}</span>
                  <span>Rs. {order.amount / 100}</span>
                  <span>
                    <a className="text-amber-700 underline-offset-4 hover:underline" href={order.gdrive_url} rel="noreferrer" target="_blank">
                      Open link
                    </a>
                  </span>
                  <span>
                    <AdminOrderActions
                      orderId={order.id}
                      orderKind="azura"
                      printDone={order.print_done}
                      variant="print"
                    />
                  </span>
                  <span>
                    <AdminOrderActions
                      orderId={order.id}
                      orderKind="azura"
                      recordLabel={order.name}
                      variant="delete"
                    />
                  </span>
                </div>
              ))
            ) : (
              <div className="px-5 py-16 text-center text-stone-500">No paid Azura orders yet.</div>
            )}
          </div>
        </>
      )}
    </main>
  );
}