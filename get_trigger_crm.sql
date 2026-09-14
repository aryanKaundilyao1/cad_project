SELECT tgname, proname, prosrc 
FROM pg_trigger t 
JOIN pg_proc p ON t.tgfoid = p.oid 
WHERE tgrelid = 'leads'::regclass;
