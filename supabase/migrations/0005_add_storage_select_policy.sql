-- Fix: image cleanup on catalog delete left orphaned files.
--
-- The product-images bucket is public, so image *downloads* bypass RLS — but
-- the Storage LIST/metadata API still goes through an RLS SELECT policy on
-- storage.objects, and there wasn't one. Without it, `storage.list()` returns
-- nothing for the owner, so deleteCatalogCompletely() (src/lib/api/catalogs.ts)
-- couldn't enumerate a catalog's images to remove them: the catalog row was
-- deleted but its files stayed in Storage forever (cost + still reachable by
-- URL). This adds a SELECT policy scoped to the owner's own uid folder, mirroring
-- the existing insert/update/delete policies (see 0001_init.sql).

create policy product_images_select_own on storage.objects
  for select to authenticated using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
