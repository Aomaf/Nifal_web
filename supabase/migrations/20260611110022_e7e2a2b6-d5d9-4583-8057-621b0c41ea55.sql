
CREATE POLICY "property_images_public_read" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'property-images');
CREATE POLICY "property_images_admin_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'property-images' AND public.can_manage_properties(auth.uid()));
CREATE POLICY "property_images_admin_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'property-images' AND public.can_manage_properties(auth.uid()));
CREATE POLICY "property_images_admin_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'property-images' AND public.can_manage_properties(auth.uid()));
