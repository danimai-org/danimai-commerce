import type { Generated, Selectable, Insertable, Updateable } from "kysely";

type ProductStatus = "draft" | "proposed" | "published" | "rejected";

export interface Database {
  products: ProductTable;
  product_images: ProductImageTable;
  product_categories: ProductCategoryTable;
  product_collections: ProductCollectionTable;
  product_collection_relations: ProductCollectionRelationTable;

  product_attributes: ProductAttributeTable;
  product_attribute_values: ProductAttributeValueTable;

  product_options: ProductOptionTable;
  product_option_values: ProductOptionValueTable;

  product_variants: ProductVariantTable;
  variant_attribute_values: VariantAttributeValueTable;
  product_variant_option_relations: ProductVariantOptionRelationTable;

  product_tags: ProductTagTable;
  product_tag_relations: ProductTagRelationTable;
}

// table products
export interface ProductTable {
  id: string;
  title: string;
  handle: string;
  subtitle: string | null;
  description: string | null;
  is_giftcard: boolean;
  status: ProductStatus;
  thumbnail: string | null;
  discountable: boolean;
  external_id: string | null;
  metadata: unknown | null;
  category_id: string | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type Product = Selectable<ProductTable>;
export type NewProduct = Insertable<ProductTable>;
export type ProductUpdate = Updateable<ProductTable>;

// table product_attributes
export interface ProductAttributeTable {
  id: string;
  title: string;
  type: string;
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type ProductAttribute = Selectable<ProductAttributeTable>;
export type NewProductAttribute = Insertable<ProductAttributeTable>;
export type ProductAttributeUpdate = Updateable<ProductAttributeTable>;

// table product_attribute_values
export interface ProductAttributeValueTable {
  id: string;
  value: string;
  attribute_id: string | null;
  product_id: string | null;
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type ProductAttributeValue = Selectable<ProductAttributeValueTable>;
export type NewProductAttributeValue = Insertable<ProductAttributeValueTable>;
export type ProductAttributeValueUpdate =
  Updateable<ProductAttributeValueTable>;

// table variant_attribute_values
export interface VariantAttributeValueTable {
  id: string;
  value: string;
  attribute_id: string | null;
  variant_id: string | null;
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type VariantAttributeValue = Selectable<VariantAttributeValueTable>;
export type NewVariantAttributeValue = Insertable<VariantAttributeValueTable>;
export type VariantAttributeValueUpdate =
  Updateable<VariantAttributeValueTable>;

// table product_variants
export interface ProductVariantTable {
  id: string;
  title: string;
  sku: string | null;
  barcode: string | null;
  ean: string | null;
  upc: string | null;
  allow_backorder: boolean;
  manage_inventory: boolean;
  metadata: unknown | null;
  variant_rank: number | null;
  thumbnail: string | null;
  product_id: string | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type ProductVariant = Selectable<ProductVariantTable>;
export type NewProductVariant = Insertable<ProductVariantTable>;
export type ProductVariantUpdate = Updateable<ProductVariantTable>;

// table product_options
export interface ProductOptionTable {
  id: string;
  title: string;
  metadata: unknown | null;
  product_id: string | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type ProductOption = Selectable<ProductOptionTable>;
export type NewProductOption = Insertable<ProductOptionTable>;
export type ProductOptionUpdate = Updateable<ProductOptionTable>;

// table product_option_values
export interface ProductOptionValueTable {
  id: string;
  value: string;
  metadata: unknown | null;
  option_id: string | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type ProductOptionValue = Selectable<ProductOptionValueTable>;
export type NewProductOptionValue = Insertable<ProductOptionValueTable>;
export type ProductOptionValueUpdate = Updateable<ProductOptionValueTable>;

// table product_collections
export interface ProductCollectionTable {
  id: string;
  title: string;
  handle: string;
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type ProductCollection = Selectable<ProductCollectionTable>;
export type NewProductCollection = Insertable<ProductCollectionTable>;
export type ProductCollectionUpdate = Updateable<ProductCollectionTable>;

// table product_categories
export interface ProductCategoryTable {
  id: string;
  value: string;
  metadata: unknown | null;
  parent_id: string | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type ProductCategory = Selectable<ProductCategoryTable>;
export type NewProductCategory = Insertable<ProductCategoryTable>;
export type ProductCategoryUpdate = Updateable<ProductCategoryTable>;

// table product_tags
export interface ProductTagTable {
  id: string;
  value: string;
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type ProductTag = Selectable<ProductTagTable>;
export type NewProductTag = Insertable<ProductTagTable>;
export type ProductTagUpdate = Updateable<ProductTagTable>;

// table product_images
export interface ProductImageTable {
  id: string;
  url: string;
  metadata: unknown | null;
  rank: number;
  product_id: string;
  variant_id: string | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type ProductImage = Selectable<ProductImageTable>;
export type NewProductImage = Insertable<ProductImageTable>;
export type ProductImageUpdate = Updateable<ProductImageTable>;

// Pivot Tables

// table product_tag_relations
export interface ProductTagRelationTable {
  product_id: string;
  product_tag_id: string;
}
export type ProductTagRelation = Selectable<ProductTagRelationTable>;
export type NewProductTagRelation = Insertable<ProductTagRelationTable>;
export type ProductTagRelationUpdate = Updateable<ProductTagRelationTable>;

// table product_variant_option_relations
export interface ProductVariantOptionRelationTable {
  variant_id: string;
  option_value_id: string;
}
export type ProductVariantOptionRelation =
  Selectable<ProductVariantOptionRelationTable>;
export type NewProductVariantOptionRelation =
  Insertable<ProductVariantOptionRelationTable>;
export type ProductVariantOptionRelationUpdate =
  Updateable<ProductVariantOptionRelationTable>;

// table product_collection_relations
export interface ProductCollectionRelationTable {
  product_id: string;
  product_collection_id: string;
  created_at: Generated<string>;
}
export type ProductCollectionRelation =
  Selectable<ProductCollectionRelationTable>;
export type NewProductCollectionRelation =
  Insertable<ProductCollectionRelationTable>;
export type ProductCollectionRelationUpdate =
  Updateable<ProductCollectionRelationTable>;
