export interface BenefitItem {
  title: string;
  description: string;
  icon?: string;
}

export interface SideEffectItem {
  type: string;
  effect: string;
  severity: string;
}

export interface HowToUseItem {
  title: string;
  description: string;
  icon?: string;
}

export interface SafetyAdviceItem {
  title: string;
  description: string;
  icon?: string;
}

export interface DrugInteractionItem {
  drug: string;
  interaction: string;
  severity: string;
}

export interface FaqItem {
  question?: string;
  q?: string;
  answer?: string;
  a?: string;
}

export interface Product {
  product_id: string | number;
  product_name: string;
  product_name_url: string;
  product_pricing_old: string | number;
  product_pricing_new: string | number;
  pack_size?: string;
  composition?: string;
  salt_name?: string;
  manufacturer?: string;
  first_image_url?: string;
  category_outline_url?: string;
  slides?: string[];
  productDescription?: string;
  pharmacistNote?: string;
  benefits?: BenefitItem[];
  sideEffects?: SideEffectItem[];
  howToUse?: HowToUseItem[];
  howItWorks?: string;
  safetyAdvice?: SafetyAdviceItem[];
  drugInteractions?: DrugInteractionItem[];
  faq?: FaqItem[];
  references?: string;
  rc?: number;
  product_available?: number;
  se_type_options?: { value: string; label: string; dot: string }[];
  se_severity_options?: { value: string; label: string; dot: string }[];
  di_severity_options?: { value: string; label: string; dot: string }[];
}

export interface Category {
  id: string | number;
  category_name: string;
  display_name: string;
  category_image_url?: string;
  show_on_home?: number;
}

export interface CategoryHierarchy {
  title: string;
  category_name: string;
  display_name: string;
  id: string | number;
  items: (string | { name: string; image: string | null })[];
}

export interface Salt {
  salt_id?: number | string;
  composition: string;
  description_url?: string;
}

export interface AveragePriceInfo {
  avg_price: number | string;
  max_price?: number | string;
  min_price?: number | string;
}
