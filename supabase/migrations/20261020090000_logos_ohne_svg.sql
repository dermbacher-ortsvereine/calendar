-- SVG-Dateien können Skripte enthalten; Logos daher nur als Rasterbilder.
update storage.buckets
set allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp']
where id = 'logos';
