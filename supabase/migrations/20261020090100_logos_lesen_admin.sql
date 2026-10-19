-- Storage braucht zum Löschen/Ersetzen auch ein Leserecht auf storage.objects.
-- (Die öffentliche Auslieferung der Logos läuft über den public Bucket und braucht keine Policy.)
create policy "logos admin lesen" on storage.objects
  for select to authenticated
  using (bucket_id = 'logos' and (select private.ist_admin()));
