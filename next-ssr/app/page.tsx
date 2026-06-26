import { 
  getBanner, 
  getCategories, 
  getMainCategories, 
  getAllCategories, 
  getFooterProducts, 
  getAllBlogs, 
  getTestimonials 
} from "@/lib/api";
import { Dashboard } from "@/legacy/Dashboard/Dashboard";

export const revalidate = 600; // Revalidate page every 10 minutes

export default async function HomePage() {
  // Fetch everything concurrently on the server
  const [
    categories, 
    allCategories, 
    mainCategories, 
    bannerSlides, 
    footerProducts, 
    blogs, 
    testimonials
  ] = await Promise.all([
    getCategories().catch(() => []),
    getAllCategories().catch(() => []),
    getMainCategories().catch(() => []),
    getBanner("home_banner").catch(() => []),
    getFooterProducts().catch(() => ({})),
    getAllBlogs(false).catch(() => []),
    getTestimonials().catch(() => null)
  ]);

  return (
    <Dashboard 
      initialCategories={categories}
      initialAllCategories={allCategories}
      initialMainCategories={mainCategories}
      initialBannerSlides={bannerSlides}
      initialFooterProducts={footerProducts}
      initialBlogs={blogs}
      initialTestimonials={testimonials}
    />
  );
}
