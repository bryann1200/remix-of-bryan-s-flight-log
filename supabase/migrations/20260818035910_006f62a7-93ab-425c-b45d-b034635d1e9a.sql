CREATE POLICY "Public can read media" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "Owners can upload media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media');
CREATE POLICY "Owners can update media" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'media') WITH CHECK (bucket_id = 'media');
CREATE POLICY "Owners can delete media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'media');