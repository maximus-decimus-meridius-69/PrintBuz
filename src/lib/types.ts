export const CEER_ORDER_AMOUNT = 150;
export const CEER_ORDER_AMOUNT_PAISE = CEER_ORDER_AMOUNT * 100;

export const AZURA_POSTER_WIDTH = 6;
export const AZURA_SIZE_OPTIONS = [30, 35, 40, 45, 50] as const;
export const AZURA_PRICE_MAP = {
  30: 2340,
  35: 2730,
  40: 3120,
  45: 3510,
  50: 3900,
} as const;

export const COURSE_OPTIONS = ["ISI", "EEP", "SIP"] as const;
export const DEPARTMENT_OPTIONS = ["CSE", "CSC", "CSD", "CSE-AIML", "ECE", "EEE", "MECH", "CIVIL"] as const;
export const YEAR_OPTIONS = ["1", "2", "3", "4"] as const;
export const ORDER_EVENT_OPTIONS = ["ceer", "azura"] as const;

export type CourseOption = (typeof COURSE_OPTIONS)[number];
export type DepartmentOption = (typeof DEPARTMENT_OPTIONS)[number];
export type YearOption = (typeof YEAR_OPTIONS)[number];
export type OrderEvent = (typeof ORDER_EVENT_OPTIONS)[number];
export type AzuraHeightOption = (typeof AZURA_SIZE_OPTIONS)[number];

export type CeerPosterFormValues = {
  rollNumber: string;
  department: DepartmentOption | "";
  year: YearOption;
  course: CourseOption;
  email: string;
  section: string;
};

export type AzuraPosterFormValues = {
  name: string;
  phone: string;
  email: string;
  height: AzuraHeightOption;
  gdriveUrl: string;
};

export type OrderStatus = "pending" | "paid";

export type CeerOrderRecord = CeerPosterFormValues & {
  id: string;
  amount: number;
  status: OrderStatus;
  event: OrderEvent;
  downloaded: boolean;
  downloaded_at: string | null;
  downloaded_by: string | null;
  print_done: boolean;
  created_at: string;
  poster_path: string | null;
  poster_url: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  payment_verified_at: string | null;
};

export type CeerOrderDbRecord = {
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
  downloaded: boolean;
  downloaded_at: string | null;
  downloaded_by: string | null;
  print_done: boolean;
  created_at: string;
  poster_path: string | null;
  poster_url: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  payment_verified_at: string | null;
};

export type AzuraOrderDbRecord = {
  id: string;
  name: string;
  phone: string;
  email: string;
  width: number;
  height: AzuraHeightOption;
  gdrive_url: string;
  amount: number;
  status: OrderStatus;
  print_done: boolean;
  created_at: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  payment_verified_at: string | null;
};

export type SortKey = "created_at" | "year" | "department" | "course";