import { fetchCached } from "./client";

export async function getCouponDetails(code: string, options?: RequestInit): Promise<any> {
  return fetchCached<any>(`coupon_details/${code}`, 3600, options);
}
