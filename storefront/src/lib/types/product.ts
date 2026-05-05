export type PaginatedProduct = Awaited<
  ReturnType<(typeof client)["storefront"]["products"]["get"]>
>["data"];


export type RetrieveProduct = Awaited<
  ReturnType<(typeof client)["storefront"]["products"]["get"]>
>["data"];


export type DeleteProduct = Awaited<
  ReturnType<(typeof client)["storefront"]["products"]["delete"]>
>["data"];
