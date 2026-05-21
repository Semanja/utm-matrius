"use client";

import { useState } from "react";
import type { Company, CompanyData } from "@/db/queries";
import ManualUtmForm from "./ManualUtmForm";
import BranchAnonse from "./BranchAnonse";
import BranchSmm from "./BranchSmm";
import BranchGuide from "./BranchGuide";
import BranchAds from "./BranchAds";
import BranchSimple from "./BranchSimple";
import ThemeSwitcher from "./ThemeSwitcher";

type Step = "company" | "task-type" | "branch" | "empty";

type TaskType =
  | "announce"
  | "smm"
  | "guide"
  | "ads"
  | "funnel"
  | "external"
  | "blog"
  | "getcourse"
  | "custom";

const ALL_TASK_TYPES: {
  value: TaskType;
  label: string;
  description: string;
  // null = доступен всем компаниям; массив — только перечисленным slug'ам
  companies: string[] | null;
}[] = [
  { value: "announce", label: "Анонс", description: "Рассылка, бот, канал", companies: null },
  { value: "smm", label: "СММ", description: "Пост в соцсетях", companies: ["matrius"] },
  { value: "funnel", label: "Воронка вебинара", description: "Письма, входы, шальной трафик", companies: ["zerocoder"] },
  { value: "external", label: "Внешние выступления", description: "Спикерство, подкасты", companies: ["zerocoder"] },
  { value: "blog", label: "Блог", description: "Статья, баннер, поп-ап в магазине", companies: ["zerocoder"] },
  { value: "getcourse", label: "В Геткурсе", description: "Тренинги, вебинары, уроки, баннер", companies: ["zerocoder"] },
  { value: "guide", label: "Гайд", description: "PDF с QR / ссылкой / картинкой", companies: null },
  { value: "ads", label: "Реклама", description: "Я.Директ, ВК, внешние сервисы", companies: null },
  { value: "custom", label: "Свой вариант", description: "Заполнить всё руками", companies: null },
];

function taskTypesFor(companySlug: string) {
  return ALL_TASK_TYPES.filter(
    (t) => t.companies === null || t.companies.includes(companySlug)
  );
}

const TASK_TYPES = ALL_TASK_TYPES;

type Props = {
  companies: Company[];
  data: Record<string, CompanyData>;
};

export default function Wizard({ companies, data }: Props) {
  const [step, setStep] = useState<Step>("company");
  const [company, setCompany] = useState<Company | null>(null);
  const [taskType, setTaskType] = useState<TaskType | null>(null);

  function selectCompany(c: Company) {
    setCompany(c);
    if (!c.configured) {
      setStep("empty");
    } else {
      setStep("task-type");
    }
  }

  function selectTaskType(t: TaskType) {
    setTaskType(t);
    if (t === "custom") {
      setStep("empty");
    } else {
      setStep("branch");
    }
  }

  function reset() {
    setCompany(null);
    setTaskType(null);
    setStep("company");
  }

  function back() {
    if (step === "task-type" || (step === "empty" && !company?.configured)) {
      setCompany(null);
      setStep("company");
    } else if (step === "branch" || (step === "empty" && company?.configured)) {
      setTaskType(null);
      setStep("task-type");
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <header className="mb-10 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">UTM-генератор</h1>
          <Breadcrumbs company={company} taskType={taskType} />
        </div>
        <div className="flex flex-col items-end gap-3">
          <a
            href="/admin"
            className="text-xs px-2.5 py-1 rounded border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--text)] transition"
          >
            Админка
          </a>
          <ThemeSwitcher />
        </div>
      </header>

      {step === "company" && (
        <StepCompany companies={companies} onSelect={selectCompany} />
      )}

      {step === "task-type" && company && (
        <StepTaskType
          companySlug={company.slug}
          onSelect={selectTaskType}
          onBack={back}
        />
      )}

      {step === "empty" && company && (
        <StepEmpty company={company} onBack={back} onReset={reset} />
      )}

      {step === "branch" && company && taskType === "announce" && (
        <BranchAnonse
          channels={data[company.slug]?.channels ?? []}
          sites={data[company.slug]?.sites ?? []}
          companySlug={company.slug}
          onBack={back}
          onReset={reset}
        />
      )}

      {step === "branch" && company && taskType === "smm" && (
        <BranchSmm
          channels={data[company.slug]?.channels ?? []}
          sites={data[company.slug]?.sites ?? []}
          companySlug={company.slug}
          onBack={back}
          onReset={reset}
        />
      )}

      {step === "branch" && company && taskType === "guide" && (
        <BranchGuide
          sites={data[company.slug]?.sites ?? []}
          placements={data[company.slug]?.placements ?? []}
          companySlug={company.slug}
          onBack={back}
          onReset={reset}
        />
      )}

      {step === "branch" && company && taskType === "ads" && (
        <BranchAds
          channels={data[company.slug]?.channels ?? []}
          sites={data[company.slug]?.sites ?? []}
          companySlug={company.slug}
          onBack={back}
          onReset={reset}
        />
      )}

      {step === "branch" &&
        company &&
        (taskType === "funnel" ||
          taskType === "external" ||
          taskType === "blog" ||
          taskType === "getcourse") && (
          <BranchSimple
            branch={taskType}
            branchLabel={
              ALL_TASK_TYPES.find((t) => t.value === taskType)!.label
            }
            channels={data[company.slug]?.channels ?? []}
            sites={data[company.slug]?.sites ?? []}
            companySlug={company.slug}
            onBack={back}
            onReset={reset}
          />
        )}

      {step === "branch" &&
        company &&
        taskType &&
        taskType !== "announce" &&
        taskType !== "smm" &&
        taskType !== "guide" &&
        taskType !== "ads" &&
        taskType !== "funnel" &&
        taskType !== "external" &&
        taskType !== "blog" &&
        taskType !== "getcourse" && (
          <StepBranchPlaceholder
            company={company}
            taskType={taskType}
            onBack={back}
            onReset={reset}
          />
        )}
    </div>
  );
}

function Breadcrumbs({
  company,
  taskType,
}: {
  company: Company | null;
  taskType: TaskType | null;
}) {
  const parts: string[] = [];
  if (company) parts.push(company.name);
  if (taskType) parts.push(TASK_TYPES.find((t) => t.value === taskType)!.label);

  if (parts.length === 0) {
    return <p className="text-sm text-[var(--text-muted)]">Шаг 0: выбор компании</p>;
  }

  return <p className="text-sm text-[var(--text-muted)]">{parts.join(" → ")}</p>;
}

function StepCompany({
  companies,
  onSelect,
}: {
  companies: Company[];
  onSelect: (c: Company) => void;
}) {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">Выбери компанию</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {companies.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c)}
            className="border border-[var(--border)] rounded-lg px-5 py-4 text-left hover:border-[var(--accent)] hover:bg-[var(--bg)] transition"
          >
            <div className="font-semibold">{c.name}</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">
              {c.configured ? c.slug : `${c.slug} · правила не настроены`}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function StepTaskType({
  companySlug,
  onSelect,
  onBack,
}: {
  companySlug: string;
  onSelect: (t: TaskType) => void;
  onBack: () => void;
}) {
  const types = taskTypesFor(companySlug);
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">Тип задачи</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {types.map((t) => (
          <button
            key={t.value}
            onClick={() => onSelect(t.value)}
            className="border border-[var(--border)] rounded-lg px-5 py-4 text-left hover:border-[var(--accent)] hover:bg-[var(--bg)] transition"
          >
            <div className="font-semibold">{t.label}</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">{t.description}</div>
          </button>
        ))}
      </div>
      <button
        onClick={onBack}
        className="mt-6 text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
      >
        ← назад
      </button>
    </section>
  );
}

function StepEmpty({
  company,
  onBack,
  onReset,
}: {
  company: Company;
  onBack: () => void;
  onReset: () => void;
}) {
  const isUnconfigured = !company.configured;
  return (
    <section>
      {isUnconfigured ? (
        <div className="border border-amber-500/40 bg-amber-500/10 rounded-lg p-4 mb-6 text-sm text-amber-700 dark:text-amber-300">
          <p className="font-semibold mb-1">
            Правила для {company.name} ещё не настроены
          </p>
          <p>
            Настрой справочники в админке или собери метку вручную ниже.
          </p>
        </div>
      ) : (
        <div className="border border-[var(--border)] bg-[var(--bg)] rounded-lg p-4 mb-6 text-sm text-[var(--text)]">
          <p>Ручная сборка UTM для {company.name}.</p>
        </div>
      )}

      <ManualUtmForm />

      <div className="flex gap-3 mt-6">
        <button
          onClick={onBack}
          className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          ← назад
        </button>
        <button
          onClick={onReset}
          className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          ↺ начать заново
        </button>
      </div>
    </section>
  );
}

function StepBranchPlaceholder({
  company,
  taskType,
  onBack,
  onReset,
}: {
  company: Company;
  taskType: TaskType;
  onBack: () => void;
  onReset: () => void;
}) {
  const taskLabel = TASK_TYPES.find((t) => t.value === taskType)!.label;

  return (
    <section>
      <div className="border border-[var(--border)] rounded-lg p-6 bg-[var(--bg)]">
        <p className="text-sm text-[var(--text-muted)] mb-1">Выбрано:</p>
        <p className="font-semibold mb-3">
          {company.name} → {taskLabel}
        </p>
        <p className="text-sm text-[var(--text-muted)]">
          Ветка пока не реализована. Будет следующим шагом.
        </p>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={onBack}
          className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          ← назад
        </button>
        <button
          onClick={onReset}
          className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          ↺ начать заново
        </button>
      </div>
    </section>
  );
}
