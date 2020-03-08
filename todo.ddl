create table product (
  id serial primary key,
  slug text not null,
  title text not null,
  completed boolean not null
);
