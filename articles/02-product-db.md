# The Product Database: Anatomy of an Atom

If we are to rebuild commerce from first principles, we must start with the atom: The Product.

But what *is* a product? To a shopper, it's a picture and a price. To a warehouse manager, it's a SKU and weight. To us, the architects, it is a graph of relationships.

In this chapter, I will dissect the database structure of our Product Module. I will explain not just *what* tables we made, but *why* we made them.

## The Foundation: Setting Up Bun

Before we look at the schema, we must look at the tools. We are using **Bun**, the all-in-one runtime. It is our compiler, our bundler, our test runner, and our package manager.

### Initialization

To start, you don't need a complex boilerplate. You need a folder and an idea.

```bash
# Install Bun (if you haven't)
curl -fsSL https://bun.sh/install | bash

# Initialize a completely empty project
mkdir my-commerce-core
cd my-commerce-core
bun init
```

### Adding the Capabilities

We strictly limit our dependencies. We are not importing bloat. We are importing power.

In `packages/product/package.json`, you will see we only need one runtime dependency to talk to our database:

```bash
bun add kysely
```

That's it. Kysely is our SQL builder. It allows us to write TypeScript that compiles to raw SQL, giving us the safety of a compiler with the performance of raw queries.

---

## The Information Architecture

Now, let us look at the schema. We have broken the concept of a "Product" into its atomic components.

### 1. The `products` Table: The Identity
This is the root. But notice what is missing: *it has almost no data.*

It contains an `id`, a `title`, a `handle` (for URLs), and a `status` (draft/published). It does **not** contain price, weight, or even the detailed attributes like "Material."

**Why?** Because the "Product" is just a container. It is the folder that holds the file, not the file itself.

### 2. The `product_variants` Table: The Reality
This is where the physical item exists. If you sell a T-Shirt, you never sell "The T-Shirt." You sell "The Red, Size L T-Shirt."

The Variant holds the SKU, the barcode, and the inventory flags. It is linked to the Product, but it is a distinct entity. We removed columns like `weight` and `origin_country` from here too.

**Why?** Because even variants are abstractions. A "Red Shirt" might have different weights depending on the size. We need more flexibility.

### 3. The `product_options` & `product_option_values` Tables: The Configuration
How do you distinguish one variant from another? Options.

*   `product_options`: Defines the dimension (e.g., "Size", "Color").
*   `product_option_values`: Defines the specific point on that dimension (e.g., "Large", "Red").

This structure allows a product to have infinite variations without altering the database schema.

### 4. The Attribute System: The EAV (Entity-Attribute-Value) Hybrid
Here is where we diverge from traditional simplistic schemas. We introduced a robust attribute system.

*   `product_attributes`: Defines a custom field (e.g., "Material", "Bluetooth Version").
*   `product_attribute_values`: Connects an attribute to a **Product**.
*   `variant_attribute_values`: Connects an attribute to a **Variant**.

**Why separate tables?**
Most systems put a JSON blob called `metadata` on the product. This is lazy. It makes filtering impossible (try querying "Find all products where metadata->material = cotton" on 10 million rows).
By normalizing attributes into tables, we can index them. We can filter by "Material" as fast as we filter by "ID."

### 5. The Organization: `collections`, `types`, `tags`, `categories`
These are the taxons we use to group our atoms.

*   **Collections**: The marketing groups ("Summer Sale").
*   **Categories**: The hierarchical tree ("Men > Clothing > Shirts").
*   **Types**: The technical classification ("T-Shirt").
*   **Tags**: The search keywords ("vintage", "cotton").

We use **Pivot Tables** (e.g., `products_tags`, `product_categories_products`) to link these.
**Why Pivot Tables?** Because a product can belong to many collections and many tags. A simple foreign key on the product table implies a product belongs to only *one* thing. That is rarely true.

## The Technical Choice: UUID v7

You will notice every single `id` column is a `uuid`. Specifically, we are targeting **UUID v7**.

**Why not auto-increment integers? (1, 2, 3...)**
*   **Security**: You don't want a competitor guessing you have 50 orders because their order ID is 50.
*   **Distributed Systems**: You can generate a UUID on the client (Bun) without asking the database.

**Why not standard UUID v4?**
*   **Performance**: UUID v4 is random. Inserting random text into a database index causes fragmentation, slowing down writes.
*   **UUID v7** is time-sortable. It sorts like an integer but is unique like a UUID. It gives us the best of both worlds.

---

This schema is not just a storage bucket. It is a map of the commerce domain, drawn with the precision of a master architect.
