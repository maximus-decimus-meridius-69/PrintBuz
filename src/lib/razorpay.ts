import Razorpay from "razorpay";
import { getServerEnv } from "@/lib/env";

export const createRazorpayClient = () => {
  const serverEnv = getServerEnv();

  return new Razorpay({
    key_id: serverEnv.razorpayKeyId,
    key_secret: serverEnv.razorpayKeySecret,
  });
};