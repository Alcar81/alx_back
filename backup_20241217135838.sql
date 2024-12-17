--
-- PostgreSQL database dump
--

-- Dumped from database version 13.18 (Debian 13.18-1.pgdg120+1)
-- Dumped by pg_dump version 13.18 (Debian 13.18-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: User; Type: TABLE; Schema: public; Owner: usr_db_dev
--

CREATE TABLE public."User" (
    id integer NOT NULL,
    email text NOT NULL,
    name text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    password text NOT NULL
);


ALTER TABLE public."User" OWNER TO usr_db_dev;

--
-- Name: User_id_seq; Type: SEQUENCE; Schema: public; Owner: usr_db_dev
--

CREATE SEQUENCE public."User_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."User_id_seq" OWNER TO usr_db_dev;

--
-- Name: User_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: usr_db_dev
--

ALTER SEQUENCE public."User_id_seq" OWNED BY public."User".id;


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: usr_db_dev
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO usr_db_dev;

--
-- Name: User id; Type: DEFAULT; Schema: public; Owner: usr_db_dev
--

ALTER TABLE ONLY public."User" ALTER COLUMN id SET DEFAULT nextval('public."User_id_seq"'::regclass);


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: usr_db_dev
--

COPY public."User" (id, email, name, "createdAt", password) FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: usr_db_dev
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
379d56d2-4a2b-4974-adb7-f570673d25a2	107c91d824bffb158f5c014822b922fa1776e0e58190e703a40fc1ef4e8f1a03	2024-12-17 03:13:35.208252+00	20241108005223_init	\N	\N	2024-12-17 03:13:35.196426+00	1
08d70350-6eb3-4674-96ca-47754c2412f9	eb7b8daec0ee36044749897ffa29c96c41df26fac64762d6285882b2cbf3c99d	2024-12-17 03:13:35.211583+00	20241108011602_add_password_field	\N	\N	2024-12-17 03:13:35.20951+00	1
\.


--
-- Name: User_id_seq; Type: SEQUENCE SET; Schema: public; Owner: usr_db_dev
--

SELECT pg_catalog.setval('public."User_id_seq"', 1, false);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: usr_db_dev
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: usr_db_dev
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: usr_db_dev
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- PostgreSQL database dump complete
--

