export type PaginatedCollection = Awaited<
  ReturnType<(typeof client)["storefront"]["collections"]["get"]>
>["data"];


export type RetrieveCollection = Awaited<
  ReturnType<(typeof client)["storefront"]["collections"]["get"]>
>["data"];


export type DeleteCollection = Awaited<
  ReturnType<(typeof client)["storefront"]["collections"]["delete"]>
>["data"];
