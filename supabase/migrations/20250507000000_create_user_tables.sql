
-- Create user profiles table that extends the auth.users table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  name text,
  age integer,
  height float,
  weight float,
  gender text check (gender in ('male', 'female', 'other')),
  disease text,
  diet_preference text check (diet_preference in ('vegetarian', 'non-vegetarian', 'vegan')),
  budget text check (budget in ('low', 'medium', 'high')),
  goal text check (goal in ('weight loss', 'weight gain', 'maintenance')),
  cuisine text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Create daily records table
create table public.daily_records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date default current_date not null,
  day_number integer not null,
  exercise boolean default false,
  diet_followed boolean default false,
  new_weight float not null,
  created_at timestamp with time zone default now() not null
);

-- Create chat messages table
create table public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  is_bot boolean not null,
  content text not null,
  created_at timestamp with time zone default now() not null
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.daily_records enable row level security;
alter table public.chat_messages enable row level security;

-- Create policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can view their own daily records"
  on public.daily_records for select
  using (auth.uid() = user_id);

create policy "Users can insert their own daily records"
  on public.daily_records for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own chat messages"
  on public.chat_messages for select
  using (auth.uid() = user_id);

create policy "Users can insert their own chat messages"
  on public.chat_messages for insert
  with check (auth.uid() = user_id);

-- Create a function to handle new user signups
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Create a trigger that calls the function every time a user is created
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
