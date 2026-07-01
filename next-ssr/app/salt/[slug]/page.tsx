import React, { Suspense } from "react";
import { SaltPage } from "../../../legacy/screens/SaltPage/SaltPage";
import { getSalt, searchSaltProducts, fetchHtmlDescription, getPopularSalts } from "../../../lib/api";
import type { Metadata } from "next";

// ISR: revalidate every hour
export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const salts = await getPopularSalts();
    if (salts && Array.isArray(salts)) {
      return salts.map((s) => ({
        slug: s.slug,
      }));
    }
  } catch (error) {
    console.error("Failed to generate static params for salts:", error);
  }
  return [];
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

/* ------------------------------------------------------------------ */
/*  generateMetadata – OpenGraph, Twitter, Canonical                    */
/* ------------------------------------------------------------------ */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const saltName = decodeURIComponent(slug);
  const displayName = saltName
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  try {
    const salt = await getSalt(saltName);
    if (salt) {
      const title = `${salt.composition || displayName} – Uses, Side Effects, Price | Medingen`;
      const description = `Learn about ${salt.composition || displayName}. Find medicines containing this salt, compare prices, and read about uses, side effects, and interactions.`;
      return {
        title,
        description,
        alternates: {
          canonical: `https://medingen.in/salt/${slug}`,
        },
        openGraph: {
          title,
          description,
          url: `https://medingen.in/salt/${slug}`,
          siteName: "Medingen",
          type: "website",
        },
        twitter: {
          card: "summary",
          title,
          description,
        },
      };
    }
  } catch (e) {
    console.error("Error generating salt metadata:", e);
  }

  return {
    title: `${displayName} – Salt Details | Medingen`,
    description: `Find medicines containing ${displayName} at the best prices on Medingen.`,
    alternates: {
      canonical: `https://medingen.in/salt/${slug}`,
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Server Component Page                                               */
/* ------------------------------------------------------------------ */
export default async function SaltDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const saltName = decodeURIComponent(slug);

  let salt: any = null;
  let alternateProducts: any[] = [];
  let descriptionHtml = "";

  try {
    salt = await getSalt(saltName);
    if (salt) {
      if (salt.description_url) {
        try {
          descriptionHtml = await fetchHtmlDescription(salt.description_url, "product_description");
        } catch (err) {
          console.error("Error loading description HTML on server:", err);
        }
      }

      const results = await searchSaltProducts(saltName, 1, false, 1);
      if (results?.results) {
        alternateProducts = results.results.map((prod: any) => ({
          product_name_url: prod.product_name_url,
          originalPrice: prod.product_pricing_old,
          discountedPrice: prod.product_pricing_new,
          discount: Math.round(
            ((parseFloat(prod.product_pricing_old) - parseFloat(prod.product_pricing_new)) /
              parseFloat(prod.product_pricing_old)) *
              100
          ) || 0,
          imageUrl: prod.first_image_url,
          name: prod.product_name,
          manufacturer: prod.manufacturer,
          product_id: prod.product_id,
        }));
      }
    }
  } catch (error) {
    console.error("Error fetching salt page data server-side:", error);
  }

  const saltProps = {
    salt,
    alternateProducts,
    descriptionHtml,
  };

  return (
    <Suspense fallback={null}>
      <SaltPage {...saltProps} />
    </Suspense>
  );
}
