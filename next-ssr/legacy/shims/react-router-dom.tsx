"use client";

import React from "react";
import NextLink from "next/link";
import { useRouter, usePathname, useParams as useNextParams, useSearchParams } from "next/navigation";

// Shim Link component
export const Link = React.forwardRef<HTMLAnchorElement, any>(({ to, href, ...props }, ref) => {
  return <NextLink href={to || href || "#"} {...props} ref={ref} />;
});
Link.displayName = "Link";

// Shim useNavigate hook
export function useNavigate() {
  const router = useRouter();
  return (to: any, options?: { replace?: boolean; state?: any }) => {
    if (typeof to === "number") {
      if (to === -1) {
        router.back();
      }
      return;
    }
    if (options?.replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  };
}

// Shim useLocation hook
export function useLocation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams ? `?${searchParams.toString()}` : "";
  return {
    pathname: pathname || "/",
    search,
    state: {}, // Mock state object
    hash: typeof window !== "undefined" ? window.location.hash : "",
  };
}

// Shim useParams hook
export function useParams() {
  const params = useNextParams();
  if (!params) return {};
  
  if (Array.isArray(params.slug)) {
    return {
      ...params,
      mainCategory: params.slug[0],
      subCategory: params.slug[1],
      slug: params.slug.join("/"),
    };
  }
  
  return params;
}
