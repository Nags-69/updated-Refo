-- Grant admin role to the specified user
INSERT INTO public.user_roles (user_id, role)
VALUES ('9c5c24ec-1459-429c-a14f-99832e0fc214', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
