export const CEER_ORDER_AMOUNT = 122;
export const CEER_ORDER_AMOUNT_PAISE = CEER_ORDER_AMOUNT * 100;

export const PLATFORM_FEE_RATE = 0.025;

export const getPlatformFee = (amountInRupees: number): number =>
  Math.round(amountInRupees * PLATFORM_FEE_RATE);

export const CEER_ORDER_TOTAL_AMOUNT = CEER_ORDER_AMOUNT + getPlatformFee(CEER_ORDER_AMOUNT);
export const CEER_ORDER_TOTAL_AMOUNT_PAISE = CEER_ORDER_TOTAL_AMOUNT * 100;

export const AZURA_ORDER_CATEGORY_OPTIONS = ["dept-wise", "stall", "customised"] as const;

export const AZURA_CATEGORY_LABELS = {
  "dept-wise": "Dept Wise Posters",
  stall: "Stall Posters",
  customised: "Customised",
} as const;

export const AZURA_DEPT_WISE_POSTER_OPTIONS = [
  { key: "6x30", width: 6, height: 30, price: 2340 },
  { key: "6x35", width: 6, height: 35, price: 2730 },
  { key: "6x40", width: 6, height: 40, price: 3120 },
  { key: "6x45", width: 6, height: 45, price: 3510 },
  { key: "6x50", width: 6, height: 50, price: 3900 },
] as const;

export const AZURA_STALL_POSTER_OPTIONS = [
  { key: "2x3", width: 2, height: 3, price: 122 },
  { key: "3x4", width: 3, height: 4, price: 200 },
] as const;

export const AZURA_CUSTOM_MIN_DIMENSION = 3;
export const AZURA_CUSTOM_MIN_AREA = 100;
export const AZURA_CUSTOM_PRICE_PER_SQ_FT = 13;

export const COURSE_OPTIONS = ["ISI", "EEP", "SIP"] as const;
export const DEPARTMENT_OPTIONS = ["CSE", "CSC", "CSD", "CSE-AIML", "ECE", "EEE", "MECH", "CIVIL"] as const;
export const YEAR_OPTIONS = ["1", "2", "3", "4"] as const;
export const ORDER_EVENT_OPTIONS = ["ceer", "azura"] as const;

export type CourseOption = (typeof COURSE_OPTIONS)[number];
export type DepartmentOption = (typeof DEPARTMENT_OPTIONS)[number];
export type YearOption = (typeof YEAR_OPTIONS)[number];
export type OrderEvent = (typeof ORDER_EVENT_OPTIONS)[number];
export type AzuraOrderCategory = (typeof AZURA_ORDER_CATEGORY_OPTIONS)[number];
export type AzuraDeptWisePosterOption = (typeof AZURA_DEPT_WISE_POSTER_OPTIONS)[number];
export type AzuraStallPosterOption = (typeof AZURA_STALL_POSTER_OPTIONS)[number];
export type AzuraDeptWiseSizeKey = AzuraDeptWisePosterOption["key"];
export type AzuraStallSizeKey = AzuraStallPosterOption["key"];

export type CeerPosterFormValues = {
  rollNumber: string;
  department: DepartmentOption | "";
  year: YearOption;
  course: CourseOption;
  email: string;
  section: string;
};

type AzuraContactFields = {
  name: string;
  phone: string;
  email: string;
  gdriveUrl: string;
};

export type AzuraDeptWisePosterFormValues = AzuraContactFields & {
  orderCategory: "dept-wise";
  sizeKey: AzuraDeptWiseSizeKey;
};

export type AzuraStallPosterFormValues = AzuraContactFields & {
  orderCategory: "stall";
  sizeKey: AzuraStallSizeKey;
};

export type AzuraCustomPosterFormValues = AzuraContactFields & {
  orderCategory: "customised";
  width: number;
  height: number;
};

export type AzuraPosterFormValues =
  | AzuraDeptWisePosterFormValues
  | AzuraStallPosterFormValues
  | AzuraCustomPosterFormValues;

export type AzuraOrderPricingInput =
  | Pick<AzuraDeptWisePosterFormValues, "orderCategory" | "sizeKey">
  | Pick<AzuraStallPosterFormValues, "orderCategory" | "sizeKey">
  | Pick<AzuraCustomPosterFormValues, "orderCategory" | "width" | "height">;

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
  order_category: AzuraOrderCategory | null;
  size_key: string | null;
  width: number;
  height: number;
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

export type AzuraOrderDetails = {
  orderCategory: AzuraOrderCategory;
  orderLabel: string;
  width: number;
  height: number;
  sizeLabel: string;
  area: number;
  baseAmount: number;
  platformFee: number;
  totalAmount: number;
};

const azuraFixedPosterOptions = {
  "dept-wise": AZURA_DEPT_WISE_POSTER_OPTIONS,
  stall: AZURA_STALL_POSTER_OPTIONS,
} as const;

const formatNumericValue = (value: number) => {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(2).replace(/\.00$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
};

export const formatPosterSize = (width: number, height: number) =>
  `${formatNumericValue(width)} x ${formatNumericValue(height)}`;

export const formatCurrencyAmount = (amount: number) =>
  Number.isInteger(amount) ? amount.toString() : amount.toFixed(2);

export const getAzuraCategoryLabel = (orderCategory: AzuraOrderCategory) =>
  AZURA_CATEGORY_LABELS[orderCategory];

export const getAzuraFixedPosterOption = (
  orderCategory: "dept-wise" | "stall",
  sizeKey: string,
) => azuraFixedPosterOptions[orderCategory].find((option) => option.key === sizeKey);

export const calculateAzuraOrderDetails = (
  input: AzuraOrderPricingInput,
): AzuraOrderDetails => {
  if (input.orderCategory === "customised") {
    const width = input.width;
    const height = input.height;
    const area = width * height;
    const baseAmount = area * AZURA_CUSTOM_PRICE_PER_SQ_FT;
    const platformFee = getPlatformFee(baseAmount);

    return {
      orderCategory: input.orderCategory,
      orderLabel: getAzuraCategoryLabel(input.orderCategory),
      width,
      height,
      sizeLabel: formatPosterSize(width, height),
      area,
      baseAmount,
      platformFee,
      totalAmount: baseAmount + platformFee,
    };
  }

  const selectedOption = getAzuraFixedPosterOption(input.orderCategory, input.sizeKey);

  if (!selectedOption) {
    throw new Error("Invalid Azura poster size.");
  }

  const area = selectedOption.width * selectedOption.height;
  const platformFee = getPlatformFee(selectedOption.price);

  return {
    orderCategory: input.orderCategory,
    orderLabel: getAzuraCategoryLabel(input.orderCategory),
    width: selectedOption.width,
    height: selectedOption.height,
    sizeLabel: formatPosterSize(selectedOption.width, selectedOption.height),
    area,
    baseAmount: selectedOption.price,
    platformFee,
    totalAmount: selectedOption.price + platformFee,
  };
};

export const getAzuraPricingInputFromOrderRecord = (
  order: Pick<AzuraOrderDbRecord, "order_category" | "size_key" | "width" | "height">,
): AzuraOrderPricingInput => {
  const orderCategory = order.order_category ?? "dept-wise";

  if (orderCategory === "customised") {
    return {
      orderCategory,
      width: Number(order.width),
      height: Number(order.height),
    };
  }

  if (orderCategory === "dept-wise") {
    if (order.size_key) {
      const matchedOptionByKey = AZURA_DEPT_WISE_POSTER_OPTIONS.find(
        (option) => option.key === order.size_key,
      );

      if (!matchedOptionByKey) {
        throw new Error("Unable to resolve Azura order size.");
      }

      return {
        orderCategory,
        sizeKey: matchedOptionByKey.key,
      };
    }

    const matchedOption = AZURA_DEPT_WISE_POSTER_OPTIONS.find(
      (option) => option.width === Number(order.width) && option.height === Number(order.height),
    );

    if (!matchedOption) {
      throw new Error("Unable to resolve Azura order size.");
    }

    return {
      orderCategory,
      sizeKey: matchedOption.key,
    };
  }

  if (order.size_key) {
    const matchedOptionByKey = AZURA_STALL_POSTER_OPTIONS.find(
      (option) => option.key === order.size_key,
    );

    if (!matchedOptionByKey) {
      throw new Error("Unable to resolve Azura order size.");
    }

    return {
      orderCategory,
      sizeKey: matchedOptionByKey.key,
    };
  }

  const matchedOption = AZURA_STALL_POSTER_OPTIONS.find(
    (option) => option.width === Number(order.width) && option.height === Number(order.height),
  );

  if (!matchedOption) {
    throw new Error("Unable to resolve Azura order size.");
  }

  return {
    orderCategory,
    sizeKey: matchedOption.key,
  };
};