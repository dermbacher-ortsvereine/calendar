-- NUR FÜR DIE LOKALE ENTWICKLUNG: Beispieltermine und -belegungen aus den Designs.
-- Wird von `supabase db reset` lokal eingespielt, aber NICHT von `supabase db push`.
-- Platzhalter in eckigen Klammern sind Beispieldaten. Keine echten Kontaktdaten eintragen!

insert into public.termine (veranstalter_id, titel, datum, beginn, ende, ort, beschreibung) values
  ('vfl', 'Herbstwanderung',                 '2026-10-03', '14:00', '17:30', 'Treffpunkt Turnhalle', 'Rundweg ca. 8 km mit Einkehr. Gäste sind herzlich willkommen.'),
  ('ff',  'Übungsabend',                     '2026-10-07', '19:30', '21:30', 'Feuerwehrgerätehaus',  'Reguläre Übung der aktiven Wehr.'),
  ('gv',  'Herbstlicher Liederabend',        '2026-10-10', '19:00', null,    'Turnhalle',            'Mit Gastchören aus der Region. Eintritt [Preis].'),
  ('mv',  'Herbst-Frühschoppen',             '2026-10-11', '11:00', '15:00', 'Turnhalle',            'Frühschoppen mit Blasmusik und Mittagstisch.'),
  ('vfl', 'Tischtennis-Heimspieltag',        '2026-10-17', '15:00', null,    'Turnhalle',            'Zuschauer willkommen.'),
  ('mv',  'Jahreshauptversammlung',          '2026-10-21', '19:00', '21:00', 'Stüffjen',             'Die Tagesordnung folgt mit der Einladung.'),
  ('wt',  'Helfertreffen Weihnachtstreiben', '2026-10-24', '10:00', '12:00', 'Schulungsraum',        'Planung von Ständen, Aufbau und Helferschichten.'),
  ('vfl', 'Tischtennis-Heimspieltag',        '2026-10-24', '15:00', null,    'Turnhalle',            'Zuschauer willkommen.'),
  ('kfd', 'Seniorencafé',                    '2026-10-28', '15:00', '17:30', 'Stüffjen',             'Kaffee und Kuchen für alle Seniorinnen und Senioren.'),
  ('kar', 'Halloween-Kinderdisco',           '2026-10-31', '16:00', '19:00', 'Turnhalle',            'Für Kinder bis 12 Jahre. Kostüme erwünscht.'),
  ('mv',  'Herbstkonzert',                   '2026-11-07', '19:00', null,    'Turnhalle',            'Einlass ab 18:30 Uhr.'),
  ('kfd', 'Martinsumzug',                    '2026-11-11', '17:30', '18:45', 'Start an der Kirche',  'Umzug durch den Ort mit Martinsfeuer.'),
  ('kar', 'Sessionseröffnung',               '2026-11-11', '19:11', null,    'Stüffjen',             'Start in die neue Karnevalssession.'),
  ('ff',  'Altpapiersammlung',               '2026-11-14', '09:00', '13:00', 'Ganzer Ort',           'Bitte Papier gebündelt bis 9 Uhr an die Straße stellen.'),
  ('gv',  'Gedenkfeier Volkstrauertag',      '2026-11-15', '11:30', null,    '[Ort]',                'Mit Beiträgen des Gesangsvereins.'),
  ('kfd', 'Weinabend',                       '2026-11-21', '19:00', null,    'Stüffjen',             'Anmeldung bis [Datum].'),
  ('wt',  'Dermbacher Weihnachtstreiben',    '2026-11-28', '16:00', '22:00', '[Ort]',                'Stände der Ortsvereine, Glühwein und Kinderprogramm.'),
  ('kfd', 'Nikolausfeier',                   '2026-12-05', '15:00', '17:00', 'Turnhalle',            'Der Nikolaus kommt um 16 Uhr.'),
  ('ff',  'Weihnachtsfeier',                 '2026-12-12', '19:00', null,    'Feuerwehrgerätehaus',  'Für Aktive, Alterskameraden und Partner.'),
  ('gv',  'Adventskonzert',                  '2026-12-19', '17:00', null,    'Kirche',               'Gemeinsam mit dem Musikverein. Eintritt frei, Spenden erbeten.');

insert into public.reservierungen (raum_id, veranstalter_id, zeitraum, zweck) values
  ('stueffjen',     'mv',  tstzrange('2026-10-21 19:00 Europe/Berlin', '2026-10-21 22:00 Europe/Berlin'), 'Jahreshauptversammlung'),
  ('stueffjen',     'gv',  tstzrange('2026-10-22 15:00 Europe/Berlin', '2026-10-22 17:00 Europe/Berlin'), 'Chorprobe'),
  ('stueffjen',     'kar', tstzrange('2026-10-24 18:00 Europe/Berlin', '2026-10-24 23:00 Europe/Berlin'), 'Elferratssitzung'),
  ('stueffjen',     'kfd', tstzrange('2026-10-28 15:00 Europe/Berlin', '2026-10-28 17:30 Europe/Berlin'), 'Seniorencafé'),
  ('stueffjen',     'ff',  tstzrange('2026-10-30 19:00 Europe/Berlin', '2026-10-30 22:00 Europe/Berlin'), 'Kameradschaftsabend'),
  ('schulungsraum', 'ff',  tstzrange('2026-10-19 19:00 Europe/Berlin', '2026-10-19 21:00 Europe/Berlin'), 'Erste-Hilfe-Kurs'),
  ('schulungsraum', 'vfl', tstzrange('2026-10-20 18:00 Europe/Berlin', '2026-10-20 20:00 Europe/Berlin'), 'Vorstandssitzung'),
  ('schulungsraum', 'wt',  tstzrange('2026-10-23 16:00 Europe/Berlin', '2026-10-23 17:30 Europe/Berlin'), 'Helfertreffen'),
  ('schulungsraum', 'gv',  tstzrange('2026-10-26 19:00 Europe/Berlin', '2026-10-26 21:30 Europe/Berlin'), 'Vorstandssitzung'),
  ('schulungsraum', 'ff',  tstzrange('2026-10-27 19:00 Europe/Berlin', '2026-10-27 21:00 Europe/Berlin'), 'Atemschutz-Theorie');
