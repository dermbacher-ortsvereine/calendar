-- Echte Stammdaten: die sieben Veranstalter und die zwei Räume.
-- Als Migration (nicht im Seed), damit sie mit `supabase db push` auch in Produktion landen.
-- Spätere Änderungen (Farben, Logos, neue Veranstalter) erfolgen über /admin.

insert into public.veranstalter (id, name, kuerzel, farbe, farbe_hg, login_email, sortierung) values
  ('vfl', 'VfL Dermbach',                   'VfL', '#1D5FA8', '#E4EEF9', 'vfl@dermbacher-ortsvereine.de', 10),
  ('mv',  'Musikverein Dermbach',           'MV',  '#0B6670', '#DDF1F2', 'mv@dermbacher-ortsvereine.de',  20),
  ('gv',  'Gesangsverein Dermbach',         'GV',  '#3B6E12', '#E6F2D5', 'gv@dermbacher-ortsvereine.de',  30),
  ('ff',  'Freiwillige Feuerwehr Dermbach', 'FF',  '#B3261E', '#FAE6E4', 'ff@dermbacher-ortsvereine.de',  40),
  ('kfd', 'kfd Dermbach',                   'kfd', '#6B3FA0', '#EFE8F8', 'kfd@dermbacher-ortsvereine.de', 50),
  ('wt',  'Weihnachtstreiben GbR',          'WT',  '#6B3A1E', '#F1E2D6', 'wt@dermbacher-ortsvereine.de',  60),
  ('kar', 'Karnevals GbR',                  'KG',  '#6E5000', '#FFE58A', 'kar@dermbacher-ortsvereine.de', 70)
on conflict (id) do nothing;

insert into public.raeume (id, name, sortierung) values
  ('stueffjen',     'Stüffjen',      10),
  ('schulungsraum', 'Schulungsraum', 20)
on conflict (id) do nothing;
