-- Create profiles table
create table public.profile (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table public.profile enable row level security;

-- Policies
create policy "Public profiles are viewable by everyone"
  on public.profile for select
  using ( true );

create policy "Users can insert their own profile"
  on public.profile for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile"
  on public.profile for update
  using ( auth.uid() = id );

-- Function to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profile (id, username, full_name)
  values (new.id, 'user_' || substr(new.id::text, 1, 6), null);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new signups
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
