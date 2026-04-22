-- =========================================================
-- OPTIONAL SIMPLIFICATION
-- Use this after confirming survey_responses is working.
--
-- Keeps the dynamic form structure tables:
-- surveys, survey_sections, questions, question_options
--
-- Removes old normalized answer/progress tables:
-- respondents, respondent_sections, answer_values, answer_selected_options
-- =========================================================

drop table if exists public.answer_selected_options cascade;
drop table if exists public.answer_values cascade;
drop table if exists public.respondent_sections cascade;
drop table if exists public.respondents cascade;

create table if not exists public.survey_responses (
    id uuid primary key default gen_random_uuid(),
    survey_id uuid references public.surveys(id) on delete set null,
    survey_slug text not null,
    responses jsonb not null,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists idx_survey_responses_survey_slug on public.survey_responses(survey_slug);
create index if not exists idx_survey_responses_created_at on public.survey_responses(created_at);
create index if not exists idx_survey_responses_responses_gin on public.survey_responses using gin (responses);
