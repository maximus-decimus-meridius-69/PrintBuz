export const ORDER_AMOUNT = 150;
export const ORDER_AMOUNT_PAISE = ORDER_AMOUNT * 100;

export const COURSE_OPTIONS = ["ISI", "EEP", "SIP"] as const;
export const YEAR_OPTIONS = ["1", "2", "3", "4"] as const;
export const ORDER_EVENT_OPTIONS = ["ceer", "azura"] as const;

export type CourseOption = (typeof COURSE_OPTIONS)[number];
export type YearOption = (typeof YEAR_OPTIONS)[number];
export type OrderEvent = (typeof ORDER_EVENT_OPTIONS)[number];

export type PosterFormValues = {
  rollNumber: string;
  department: string;
  year: YearOption;
  course: CourseOption;
  email: string;
  section: string;
};

export type OrderStatus = "pending" | "paid";

export type PosterOrderRecord = PosterFormValues & {
  id: string;
  amount: number;
  status: OrderStatus;
  event: OrderEvent;
  print_done: boolean;
  created_at: string;
  poster_path: string | null;
  poster_url: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  payment_verified_at: string | null;
};

export type PosterOrderDbRecord = {
  id: string;
  event: OrderEvent;
  roll_number: string;
  department: string;
  year: YearOption;
  course: CourseOption;
  email: string;
  section: string;
  amount: number;
  status: OrderStatus;
  print_done: boolean;
  created_at: string;
  poster_path: string | null;
  poster_url: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  payment_verified_at: string | null;
};

export type SortKey = "created_at" | "year" | "department" | "course";