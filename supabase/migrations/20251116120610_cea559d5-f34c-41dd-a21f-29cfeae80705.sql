begin;
-- Reset badges to only the three simplified ones
delete from public.user_badges;
delete from public.badges;

insert into public.badges (name, description, icon, requirement_type, requirement_value)
values
  ('3 Apps Completed', 'Complete 3 app tasks', 'Zap', 'tasks_completed', 3),
  ('5 Apps Verified', 'Complete 5 verified app tasks', 'Award', 'tasks_completed', 5),
  ('10 Apps Verified', 'Complete 10 verified app tasks', 'Crown', 'tasks_completed', 10);
commit;