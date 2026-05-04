export type ProductPageProduct = Awaited<
  ReturnType<(typeof client)["storefront"]["products"]["get"]>
>["data"];
