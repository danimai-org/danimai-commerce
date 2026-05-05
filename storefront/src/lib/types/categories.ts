export type PaginatedCategories = Awaited<
  ReturnType<(typeof client)["storefront"]["categories"]["get"]>
>["data"];


export type RetrieveCategory = Awaited<
  ReturnType<(typeof client)["storefront"]["categories"]["get"]>
>["data"];


export type DeleteCategory = Awaited<
  ReturnType<(typeof client)["storefront"]["categories"]["delete"]>
>["data"];
