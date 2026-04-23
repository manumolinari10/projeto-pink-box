-- =========================================================
-- PINKBOX SURVEY / SUPABASE STRUCTURE
-- Anonymous normalized survey schema
-- =========================================================

create extension if not exists pgcrypto;

-- Optional cleanup, only use if you want to recreate everything.
-- drop table if exists public.answer_selected_options cascade;
-- drop table if exists public.answer_values cascade;
-- drop table if exists public.respondent_sections cascade;
-- drop table if exists public.respondents cascade;
-- drop table if exists public.question_options cascade;
-- drop table if exists public.questions cascade;
-- drop table if exists public.survey_sections cascade;
-- drop table if exists public.surveys cascade;

create table if not exists public.surveys (
    id uuid primary key default gen_random_uuid(),
    slug text not null unique,
    internal_name text not null,
    public_title text,
    description text,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.survey_sections (
    id uuid primary key default gen_random_uuid(),
    survey_id uuid not null references public.surveys(id) on delete cascade,
    section_key text not null,
    section_title text,
    section_description text,
    display_order integer not null,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (survey_id, section_key),
    unique (survey_id, display_order)
);

create table if not exists public.questions (
    id uuid primary key default gen_random_uuid(),
    section_id uuid not null references public.survey_sections(id) on delete cascade,
    question_key text not null,
    question_title text not null,
    help_text text,
    question_type text not null check (
        question_type in ('single_choice', 'multiple_choice', 'text', 'textarea', 'rating')
    ),
    is_required boolean not null default false,
    display_order integer not null,
    placeholder_text text,
    min_selections integer,
    max_selections integer,
    min_value numeric,
    max_value numeric,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (section_id, question_key),
    unique (section_id, display_order)
);

create table if not exists public.question_options (
    id uuid primary key default gen_random_uuid(),
    question_id uuid not null references public.questions(id) on delete cascade,
    option_key text not null,
    option_label text not null,
    option_value text not null,
    numeric_value numeric,
    display_order integer not null,
    allows_free_text boolean not null default false,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (question_id, option_key),
    unique (question_id, display_order)
);

-- Anonymous participant. No name, email, phone, IP or other direct identifier.
create table if not exists public.respondents (
    id uuid primary key default gen_random_uuid(),
    survey_id uuid not null references public.surveys(id) on delete cascade,
    session_token text unique,
    metadata jsonb not null default '{}'::jsonb,
    status text not null default 'in_progress' check (
        status in ('in_progress', 'completed', 'abandoned')
    ),
    started_at timestamptz not null default now(),
    completed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Migration safety if an older version with identifiable fields was already created.
alter table public.respondents drop column if exists respondent_name;
alter table public.respondents drop column if exists email;
alter table public.respondents drop column if exists phone;
alter table public.respondents drop column if exists city;
alter table public.respondents drop column if exists state;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'question_options_question_id_option_key_key'
    ) then
        alter table public.question_options
        add constraint question_options_question_id_option_key_key unique (question_id, option_key);
    end if;
end;
$$;

create table if not exists public.respondent_sections (
    id uuid primary key default gen_random_uuid(),
    respondent_id uuid not null references public.respondents(id) on delete cascade,
    section_id uuid not null references public.survey_sections(id) on delete cascade,
    is_completed boolean not null default false,
    completed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (respondent_id, section_id)
);

create table if not exists public.answer_values (
    id uuid primary key default gen_random_uuid(),
    respondent_id uuid not null references public.respondents(id) on delete cascade,
    question_id uuid not null references public.questions(id) on delete cascade,
    selected_option_id uuid references public.question_options(id) on delete set null,
    answer_text text,
    answer_numeric numeric,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (respondent_id, question_id)
);

create table if not exists public.answer_selected_options (
    id uuid primary key default gen_random_uuid(),
    respondent_id uuid not null references public.respondents(id) on delete cascade,
    question_id uuid not null references public.questions(id) on delete cascade,
    option_id uuid not null references public.question_options(id) on delete cascade,
    free_text text,
    created_at timestamptz not null default now(),
    unique (respondent_id, question_id, option_id)
);

-- One anonymous submission per row. This is the table used by the current PHP endpoint.
create table if not exists public.survey_responses (
    id uuid primary key default gen_random_uuid(),
    survey_id uuid references public.surveys(id) on delete set null,
    survey_slug text not null,
    responses jsonb not null,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists idx_survey_sections_survey_id on public.survey_sections(survey_id);
create index if not exists idx_questions_section_id on public.questions(section_id);
create index if not exists idx_question_options_question_id on public.question_options(question_id);
create index if not exists idx_respondents_survey_id on public.respondents(survey_id);
create index if not exists idx_respondents_session_token on public.respondents(session_token);
create index if not exists idx_respondents_status on public.respondents(status);
create index if not exists idx_answer_values_respondent_id on public.answer_values(respondent_id);
create index if not exists idx_answer_values_question_id on public.answer_values(question_id);
create index if not exists idx_answer_selected_options_respondent_id on public.answer_selected_options(respondent_id);
create index if not exists idx_answer_selected_options_question_id on public.answer_selected_options(question_id);
create index if not exists idx_survey_responses_survey_slug on public.survey_responses(survey_slug);
create index if not exists idx_survey_responses_created_at on public.survey_responses(created_at);
create index if not exists idx_survey_responses_responses_gin on public.survey_responses using gin (responses);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_surveys_updated_at on public.surveys;
create trigger trg_surveys_updated_at before update on public.surveys
for each row execute function public.set_updated_at();

drop trigger if exists trg_survey_sections_updated_at on public.survey_sections;
create trigger trg_survey_sections_updated_at before update on public.survey_sections
for each row execute function public.set_updated_at();

drop trigger if exists trg_questions_updated_at on public.questions;
create trigger trg_questions_updated_at before update on public.questions
for each row execute function public.set_updated_at();

drop trigger if exists trg_question_options_updated_at on public.question_options;
create trigger trg_question_options_updated_at before update on public.question_options
for each row execute function public.set_updated_at();

drop trigger if exists trg_respondents_updated_at on public.respondents;
create trigger trg_respondents_updated_at before update on public.respondents
for each row execute function public.set_updated_at();

drop trigger if exists trg_respondent_sections_updated_at on public.respondent_sections;
create trigger trg_respondent_sections_updated_at before update on public.respondent_sections
for each row execute function public.set_updated_at();

drop trigger if exists trg_answer_values_updated_at on public.answer_values;
create trigger trg_answer_values_updated_at before update on public.answer_values
for each row execute function public.set_updated_at();

insert into public.surveys (slug, internal_name, public_title, description)
values (
    'mary-kay-management-survey',
    'PinkBox Mary Kay Management Survey',
    'Pesquisa de Gestão para Consultoras',
    'Pesquisa anônima sobre perfil, rotina, dificuldades e percepção sobre sistema de gestão.'
)
on conflict (slug) do update set
    internal_name = excluded.internal_name,
    public_title = excluded.public_title,
    description = excluded.description;

with survey_ref as (
    select id from public.surveys where slug = 'mary-kay-management-survey'
)
insert into public.survey_sections (survey_id, section_key, section_title, section_description, display_order)
select survey_ref.id, x.section_key, x.section_title, x.section_description, x.display_order
from survey_ref
cross join (
    values
        ('profile', 'Perfil da respondente', 'Dados gerais não identificáveis da consultora.', 1),
        ('routine', 'Rotina de trabalho e ferramentas utilizadas', 'Como a consultora organiza clientes, estoque, vendas e pós-venda.', 2),
        ('needs', 'Dificuldades e necessidades', 'Principais fricções na gestão do negócio.', 3),
        ('perception', 'Percepção sobre um sistema digital', 'Percepção sobre uma possível solução web gratuita.', 4)
) as x(section_key, section_title, section_description, display_order)
on conflict (survey_id, section_key) do update set
    section_title = excluded.section_title,
    section_description = excluded.section_description,
    display_order = excluded.display_order;

with sections as (
    select s.id as section_id, s.section_key
    from public.survey_sections s
    join public.surveys sv on sv.id = s.survey_id
    where sv.slug = 'mary-kay-management-survey'
)
insert into public.questions (
    section_id, question_key, question_title, help_text, question_type, is_required,
    display_order, placeholder_text, min_selections, max_selections, min_value, max_value
)
select sec.section_id, q.question_key, q.question_title, q.help_text, q.question_type,
    q.is_required, q.display_order, q.placeholder_text, q.min_selections,
    q.max_selections, q.min_value, q.max_value
from sections sec
join (
    values
    ('profile', 'career_time', '1. Há quanto tempo você atua como consultora independente da Mary Kay?', null::text, 'single_choice', true, 1, null::text, null::integer, null::integer, null::numeric, null::numeric),
    ('profile', 'activity_region', '2. Em qual cidade/região você exerce sua atividade?', null::text, 'text', true, 2, 'Ex: São Paulo, SP', null::integer, null::integer, null::numeric, null::numeric),
    ('profile', 'education_level', '3. Qual é o seu nível de escolaridade?', 'Selecione a opção que melhor descreve seu momento atual.', 'single_choice', true, 3, null::text, null::integer, null::integer, null::numeric, null::numeric),
    ('profile', 'primary_income_source', '4. Você realiza essa atividade como sua principal fonte de renda?', null::text, 'single_choice', true, 4, null::text, null::integer, null::integer, null::numeric, null::numeric),
    ('routine', 'customer_control_method', '1. Como você realiza atualmente o controle de clientes?', null::text, 'single_choice', true, 1, null::text, null::integer, null::integer, null::numeric, null::numeric),
    ('routine', 'inventory_control_method', '2. Como você controla o seu estoque de produtos?', null::text, 'single_choice', true, 2, null::text, null::integer, null::integer, null::numeric, null::numeric),
    ('routine', 'sales_tracking_method', '3. Como você registra e acompanha suas vendas?', null::text, 'single_choice', true, 3, null::text, null::integer, null::integer, null::numeric, null::numeric),
    ('routine', 'post_sale_follow_up', '4. Você realiza acompanhamento pós-venda com suas clientes (lembretes, reposição de produtos)?', null::text, 'single_choice', true, 4, null::text, null::integer, null::integer, null::numeric, null::numeric),
    ('needs', 'main_difficulties', '1. Quais são as principais dificuldades que você enfrenta na gestão do seu negócio?', 'Selecione todas as opções que se aplicam.', 'multiple_choice', true, 1, null::text, 1, null::integer, null::numeric, null::numeric),
    ('needs', 'difficulty_level', '2. Em uma escala de 1 a 5, qual o grau de dificuldade que você sente na organização das suas atividades comerciais?', null::text, 'rating', true, 2, null::text, null::integer, 1, 1, 5),
    ('needs', 'loss_due_to_disorganization', '3. Você já deixou de realizar uma venda ou perdeu uma cliente por falta de organização das informações?', null::text, 'single_choice', true, 3, null::text, null::integer, null::integer, null::numeric, null::numeric),
    ('perception', 'would_use_free_system', '1. Você utilizaria um sistema web gratuito para gerenciar suas clientes, vendas e estoque?', null::text, 'single_choice', true, 1, null::text, null::integer, null::integer, null::numeric, null::numeric),
    ('perception', 'important_features', '2. Quais funcionalidades você considera mais importantes em um sistema de gestão?', 'Selecione até 3 opções.', 'multiple_choice', true, 2, null::text, null::integer, 3, null::numeric, null::numeric),
    ('perception', 'technology_confidence', '3. Você possui facilidade em utilizar computadores ou celulares para atividades do seu negócio?', null::text, 'single_choice', true, 3, null::text, null::integer, null::integer, null::numeric, null::numeric),
    ('perception', 'suggestions_comments', '4. Você tem alguma sugestão ou comentário sobre o que um sistema de gestão para consultoras Mary Kay deveria ter?', null::text, 'textarea', false, 4, 'Descreva aqui sua sugestão ou necessidade principal.', null::integer, null::integer, null::numeric, null::numeric)
) as q(section_key, question_key, question_title, help_text, question_type, is_required, display_order, placeholder_text, min_selections, max_selections, min_value, max_value)
on sec.section_key = q.section_key
on conflict (section_id, question_key) do update set
    question_title = excluded.question_title,
    help_text = excluded.help_text,
    question_type = excluded.question_type,
    is_required = excluded.is_required,
    display_order = excluded.display_order,
    placeholder_text = excluded.placeholder_text,
    min_selections = excluded.min_selections,
    max_selections = excluded.max_selections,
    min_value = excluded.min_value,
    max_value = excluded.max_value;

with question_ref as (
    select q.id as question_id, q.question_key
    from public.questions q
    join public.survey_sections s on s.id = q.section_id
    join public.surveys sv on sv.id = s.survey_id
    where sv.slug = 'mary-kay-management-survey'
)
insert into public.question_options (
    question_id, option_key, option_label, option_value, numeric_value, display_order, allows_free_text
)
select qr.question_id, o.option_key, o.option_label, o.option_value, o.numeric_value, o.display_order, o.allows_free_text
from question_ref qr
join (
    values
    ('career_time', 'less_than_1_year', 'Menos de 1 ano', 'Menos de 1 ano', null::numeric, 1, false),
    ('career_time', 'from_1_to_3_years', 'De 1 a 3 anos', 'De 1 a 3 anos', null::numeric, 2, false),
    ('career_time', 'from_3_to_5_years', 'De 3 a 5 anos', 'De 3 a 5 anos', null::numeric, 3, false),
    ('career_time', 'more_than_5_years', 'Mais de 5 anos', 'Mais de 5 anos', null::numeric, 4, false),
    ('education_level', 'high_school_completed', 'Ensino Médio Completo', 'Ensino Médio Completo', null::numeric, 1, false),
    ('education_level', 'higher_education_incomplete', 'Ensino Superior Incompleto', 'Ensino Superior Incompleto', null::numeric, 2, false),
    ('education_level', 'higher_education_completed', 'Ensino Superior Completo', 'Ensino Superior Completo', null::numeric, 3, false),
    ('education_level', 'postgraduate', 'Pós-Graduação', 'Pós-Graduação', null::numeric, 4, false),
    ('primary_income_source', 'yes_primary_income', 'Sim', 'Sim', null::numeric, 1, false),
    ('primary_income_source', 'no_supplementary_income', 'Não, é uma renda complementar', 'Não, é uma renda complementar', null::numeric, 2, false),
    ('customer_control_method', 'notebook_agenda', 'Anotações em caderno/agenda', 'Anotações em caderno/agenda', null::numeric, 1, false),
    ('customer_control_method', 'spreadsheets', 'Planilhas (Excel, Google Sheets)', 'Planilhas (Excel, Google Sheets)', null::numeric, 2, false),
    ('customer_control_method', 'mobile_app', 'Aplicativo de celular (WhatsApp, outros)', 'Aplicativo de celular (WhatsApp, outros)', null::numeric, 3, false),
    ('customer_control_method', 'specific_software', 'Sistema/software específico', 'Sistema/software específico', null::numeric, 4, false),
    ('customer_control_method', 'no_formal_control', 'Não realizo controle formal', 'Não realizo controle formal', null::numeric, 5, false),
    ('inventory_control_method', 'notebook', 'Anotações em caderno', 'Anotações em caderno', null::numeric, 1, false),
    ('inventory_control_method', 'spreadsheets', 'Planilhas (Excel, Google Sheets)', 'Planilhas (Excel, Google Sheets)', null::numeric, 2, false),
    ('inventory_control_method', 'specific_software', 'Sistema/software específico', 'Sistema/software específico', null::numeric, 3, false),
    ('inventory_control_method', 'no_inventory_control', 'Não realizo controle de estoque', 'Não realizo controle de estoque', null::numeric, 4, false),
    ('sales_tracking_method', 'notebook', 'Anotações em caderno', 'Anotações em caderno', null::numeric, 1, false),
    ('sales_tracking_method', 'spreadsheets', 'Planilhas (Excel, Google Sheets)', 'Planilhas (Excel, Google Sheets)', null::numeric, 2, false),
    ('sales_tracking_method', 'manual_receipts', 'Recibos/notas manuais', 'Recibos/notas manuais', null::numeric, 3, false),
    ('sales_tracking_method', 'digital_system', 'Sistema digital', 'Sistema digital', null::numeric, 4, false),
    ('sales_tracking_method', 'not_formally_recorded', 'Não registro formalmente', 'Não registro formalmente', null::numeric, 5, false),
    ('post_sale_follow_up', 'yes_regularly', 'Sim, regularmente', 'Sim, regularmente', null::numeric, 1, false),
    ('post_sale_follow_up', 'yes_sporadically', 'Sim, mas de forma esporádica', 'Sim, mas de forma esporádica', null::numeric, 2, false),
    ('post_sale_follow_up', 'no_follow_up', 'Não realizo acompanhamento pós-venda', 'Não realizo acompanhamento pós-venda', null::numeric, 3, false),
    ('main_difficulties', 'client_info_search', 'Dificuldade em localizar informações de clientes rapidamente', 'Dificuldade em localizar informações de clientes rapidamente', null::numeric, 1, false),
    ('main_difficulties', 'data_loss', 'Perda de dados por falta de organização', 'Perda de dados por falta de organização', null::numeric, 2, false),
    ('main_difficulties', 'inventory_control', 'Falta de controle eficiente do estoque', 'Falta de controle eficiente do estoque', null::numeric, 3, false),
    ('main_difficulties', 'sales_history_tracking', 'Dificuldade em registrar e acompanhar o histórico de vendas', 'Dificuldade em registrar e acompanhar o histórico de vendas', null::numeric, 4, false),
    ('main_difficulties', 'post_sale_tracking', 'Dificuldade em realizar acompanhamento pós-venda', 'Dificuldade em realizar acompanhamento pós-venda', null::numeric, 5, false),
    ('main_difficulties', 'other', 'Outra', 'Outra', null::numeric, 6, true),
    ('difficulty_level', 'level_1', '1 - Nenhuma dificuldade', '1 - Nenhuma dificuldade', 1, 1, false),
    ('difficulty_level', 'level_2', '2 - Pouca dificuldade', '2 - Pouca dificuldade', 2, 2, false),
    ('difficulty_level', 'level_3', '3 - Dificuldade moderada', '3 - Dificuldade moderada', 3, 3, false),
    ('difficulty_level', 'level_4', '4 - Grande dificuldade', '4 - Grande dificuldade', 4, 4, false),
    ('difficulty_level', 'level_5', '5 - Dificuldade extrema', '5 - Dificuldade extrema', 5, 5, false),
    ('loss_due_to_disorganization', 'yes', 'Sim', 'Sim', null::numeric, 1, false),
    ('loss_due_to_disorganization', 'no', 'Não', 'Não', null::numeric, 2, false),
    ('loss_due_to_disorganization', 'dont_know', 'Não sei informar', 'Não sei informar', null::numeric, 3, false),
    ('would_use_free_system', 'yes_definitely', 'Sim, com certeza', 'Sim, com certeza', null::numeric, 1, false),
    ('would_use_free_system', 'yes_probably', 'Sim, provavelmente', 'Sim, provavelmente', null::numeric, 2, false),
    ('would_use_free_system', 'maybe', 'Talvez', 'Talvez', null::numeric, 3, false),
    ('would_use_free_system', 'probably_not', 'Provavelmente não', 'Provavelmente não', null::numeric, 4, false),
    ('would_use_free_system', 'no', 'Não', 'Não', null::numeric, 5, false),
    ('important_features', 'customer_registration_search', 'Cadastro e busca de clientes', 'Cadastro e busca de clientes', null::numeric, 1, false),
    ('important_features', 'purchase_history', 'Histórico de compras por cliente', 'Histórico de compras por cliente', null::numeric, 2, false),
    ('important_features', 'inventory_control', 'Controle de estoque de produtos', 'Controle de estoque de produtos', null::numeric, 3, false),
    ('important_features', 'sales_reports', 'Registro e relatório de vendas', 'Registro e relatório de vendas', null::numeric, 4, false),
    ('important_features', 'automatic_post_sale_reminders', 'Lembretes automáticos de acompanhamento pós-venda', 'Lembretes automáticos de acompanhamento pós-venda', null::numeric, 5, false),
    ('important_features', 'goals_and_performance', 'Visualização de metas e desempenho', 'Visualização de metas e desempenho', null::numeric, 6, false),
    ('technology_confidence', 'high', 'Sim, muita facilidade', 'Sim, muita facilidade', null::numeric, 1, false),
    ('technology_confidence', 'moderate', 'Sim, facilidade moderada', 'Sim, facilidade moderada', null::numeric, 2, false),
    ('technology_confidence', 'low', 'Pouca facilidade', 'Pouca facilidade', null::numeric, 3, false),
    ('technology_confidence', 'none', 'Nenhuma facilidade', 'Nenhuma facilidade', null::numeric, 4, false)
) as o(question_key, option_key, option_label, option_value, numeric_value, display_order, allows_free_text)
on qr.question_key = o.question_key
on conflict (question_id, option_key) do update set
    option_label = excluded.option_label,
    option_value = excluded.option_value,
    numeric_value = excluded.numeric_value,
    display_order = excluded.display_order,
    allows_free_text = excluded.allows_free_text;

-- Business rule: every question is required except the final textarea.
update public.questions q
set is_required = (q.question_key <> 'suggestions_comments')
from public.survey_sections s
join public.surveys sv on sv.id = s.survey_id
where q.section_id = s.id
  and sv.slug = 'mary-kay-management-survey';
