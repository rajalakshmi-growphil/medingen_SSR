import React, { Suspense } from "react";
import SearchViewMedicine from "../../../legacy/screens/SearchViewMedicine/SearchViewMedicine";
import { getProductDetails, searchAltProducts, getAveragePrice, getPopularProducts } from "../../../lib/api";
import type { Metadata } from "next";

// ISR: revalidate every hour
export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const products = await getPopularProducts();
    if (products && Array.isArray(products)) {
      return products.map((p) => ({
        slug: p.slug,
      }));
    }
  } catch (error) {
    console.error("Failed to generate static params for products:", error);
  }
  return [];
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

/* ------------------------------------------------------------------ */
/*  generateMetadata – OpenGraph, Twitter, Canonical, Keywords         */
/* ------------------------------------------------------------------ */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const result = await getProductDetails(0, slug);
    if (result) {
      const productName = result.productName || result.product_name || slug;
      const description =
        result.meta_description ||
        `Buy ${productName} online at the best price on Medingen. ${result.composition ? `Contains ${result.composition}.` : ""} Free shipping on all orders.`;
      const title = result.meta_title || `${productName} – Price, Uses, Side Effects | Medingen`;
      const imageUrl =
        result.images?.[0]?.img
          ? `/cloudfront-cdn/products/${result.images[0].img}`
          : "https://medingen.in/medicine-details.png";

      return {
        title,
        description,
        keywords: result.meta_keywords || `${productName}, buy ${productName}, ${result.composition || ""}, generic medicine, Medingen`,
        alternates: {
          canonical: `https://medingen.in/product/${slug}`,
        },
        openGraph: {
          title,
          description,
          url: `https://medingen.in/product/${slug}`,
          siteName: "Medingen",
          type: "website",
          images: [
            {
              url: imageUrl,
              width: 600,
              height: 600,
              alt: productName,
            },
          ],
        },
        twitter: {
          card: "summary_large_image",
          title,
          description,
          images: [imageUrl],
        },
      };
    }
  } catch (e) {
    console.error("Error generating metadata:", e);
  }
  return {
    title: "Product Details | Medingen",
    description: "Buy Generic & Branded Medicines Online at Medingen",
    alternates: {
      canonical: `https://medingen.in/product/${slug}`,
    },
  };
}

/* ------------------------------------------------------------------ */
/*  JSON-LD Structured Data Component                                   */
/* ------------------------------------------------------------------ */
function ProductJsonLd({ product }: { product: any }) {
  if (!product) return null;

  const jsonLd: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description:
      product.meta_description ||
      product.productDescription ||
      `${product.name} manufactured by ${product.manufacturer}`,
    image: product.imageSrc || "https://medingen.in/medicine-details.png",
    brand: {
      "@type": "Brand",
      name: product.manufacturer || "Generic",
    },
    sku: String(product.product_id),
    offers: {
      "@type": "Offer",
      url: `https://medingen.in/product/${product.product_name_url}`,
      price: String(product.ourPrice || 0),
      priceCurrency: "INR",
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "Medingen",
      },
    },
  };

  // Add aggregate rating if reviews/rc exist
  if (product.rc && product.rc > 0) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: "4.5",
      reviewCount: String(product.rc),
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Server Component Page                                               */
/* ------------------------------------------------------------------ */
export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;

  let product: any = null;
  let alternates: any[] = [];

  try {
    const result = await getProductDetails(0, slug);
    if (result) {
      const imgList = (result.images || []).map((img: any) => ({
        url: `/cloudfront-cdn/products/${img.img}`,
      }));
      product = {
        ...result,
        product_id: result.product_id,
        name: result.productName,
        meta_title: result.meta_title,
        meta_description: result.meta_description,
        meta_keywords: result.meta_keywords,
        manufacturer: result.manufacturer || "",
        genericName: result.composition || "",
        ourPrice: parseFloat(result.productPriceNew) || 0,
        mrp: parseFloat(result.productPriceOld) || 0,
        composition: result.composition || "",
        product_available: result.product_available,
        inStock:
          result.inStock === true ||
          result.inStock === 1 ||
          result.in_stock === 1 ||
          result.in_stock === true,
        product_request: result.product_request,
        product_name_url: result.product_name_url,
        packaging: result.packaging || "",
        prescription_required: result.prescription_required || "",
        selectedCategory: result.selectedCategory || "",
        formulation: result.formulation || "",
        consumeType: result.consumeType || "",
        schedule_category: result.schedule_category || "",
        used_for: result.used_for || "",
        benefits: result.benefits || null,
        drugInteractions: result.drugInteractions || null,
        howItWorks: result.howItWorks || null,
        howToUse: result.howToUse || null,
        productDescription: result.productDescription || null,
        pharmacistNote: result.pharmacistNote || null,
        sideEffects: result.sideEffects || null,
        safetyAdvice: result.safetyAdvice || null,
        faq: result.faq || null,
        references: result.references || null,
        di_severity_options: result.di_severity_options || [],
        se_severity_options: result.se_severity_options || [],
        se_type_options: result.se_type_options || [],
        imageSrc: imgList[0]?.url || "/medicine-details.png",
        rc: result.rc === undefined ? 1 : Number(result.rc),
        recommended_products: result.recommended_products || [],
        descriptionLegacyUrl: result.descriptionLegacyUrl || null,
      };

      if (product.composition) {
        const [altRes, avgRes] = await Promise.all([
          searchAltProducts({
            page: 1,
            composition: product.composition,
            excludeProductId: product.product_id,
            rc: 1,
          }),
          getAveragePrice(product.composition),
        ]);
        const avgVal = avgRes?.avg_price;
        const avg = typeof avgVal === "number" ? avgVal : parseFloat(String(avgVal || 0));
        if (altRes?.results?.length) {
          alternates = altRes.results
            .filter((x: any) => x.product_pricing_new)
            .map((x: any) => {
              let imgs: string[] = [];
              try {
                const parsed =
                  typeof x.images === "string" ? JSON.parse(x.images) : x.images;
                if (Array.isArray(parsed)) {
                  imgs = parsed
                    .map((i: any) => i.img)
                    .map((u: string) =>
                      u.startsWith("http")
                        ? u.replace("https://d1dh0rr5xj2p49.cloudfront.net", "/cloudfront-cdn")
                        : "/cloudfront-cdn/products/" + u
                    );
                }
              } catch (e) {}

              if (!imgs.length && x.first_image_url) {
                imgs = [
                  x.first_image_url.startsWith("http")
                    ? x.first_image_url.replace("https://d1dh0rr5xj2p49.cloudfront.net", "/cloudfront-cdn")
                    : "/cloudfront-cdn/products/" +
                      x.first_image_url,
                ];
              }

              return {
                name: x.product_name,
                manufacturer: x.manufacturer,
                discountedPrice: x.product_pricing_new,
                originalPrice: x.product_pricing_old,
                discount: avg
                  ? Math.max(
                      0,
                      Math.round(
                        ((avg - parseFloat(x.product_pricing_new)) / avg) * 100
                      )
                    )
                  : 0,
                imageUrl: imgs[0] || "",
                product_name_url: x.product_name_url,
                product_id: x.product_id,
              };
            });
        }
      }
    }
  } catch (error) {
    console.error("Error fetching product data server-side:", error);
  }

  return (
    <>
      <ProductJsonLd product={product} />
      <Suspense fallback={null}>
        <SearchViewMedicine product={product} alternates={alternates} />
      </Suspense>
    </>
  );
}
