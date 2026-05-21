"use client";

import { useEffect, useState } from "react";
import ButtonLink from "@/components/button-link";
import PageContainer from "@/components/page-container";
import { supabase } from "@/lib/supabase";

// --- Types -----------------------------------------------------------------

type FormDetail = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  whatsapp_number: string;
};

type FormResponse = {
  id: string;
  form_id: string;
  data_json: Record<string, string>;
  whatsapp_message: string | null;
  submitted_at: string;
};

type FormField = {
  id: string;
  form_id: string;
  label: string;
  field_key: string;
  field_type: string;
  required: boolean;
  sort_order: number;
};

// --- Page ------------------------------------------------------------------

type ResponsesPageProps = {
  params: { id: string };
};

export default function ResponsesPage({ params }: ResponsesPageProps) {
  const formId = params?.id ?? "";

  const [form, setForm] = useState<FormDetail | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      setIsLoading(true);
      setError("");
      setForm(null);
      setFields([]);
      setResponses([]);

      // 0. Resolve current user — only the owner may view responses.
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (userError || !user) {
        console.error("Failed to resolve auth user", userError);
        setError("Failed to load responses.");
        setIsLoading(false);
        return;
      }

      // 1. Form (scoped to current user via user_id)
      const { data: formData, error: formErr } = await supabase
        .from("forms")
        .select("id, title, slug, description, whatsapp_number")
        .eq("id", formId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (formErr) {
        console.error("Failed to load form", formErr);
        setError("Failed to load responses.");
        setIsLoading(false);
        return;
      }

      if (!formData) {
        setIsLoading(false);
        return;
      }

      setForm(formData as FormDetail);

      // 2. Fields + responses (parallel)
      const [fieldsResult, responsesResult] = await Promise.all([
        supabase
          .from("form_fields")
          .select(
            "id, form_id, label, field_key, field_type, required, sort_order",
          )
          .eq("form_id", formId)
          .order("sort_order", { ascending: true }),
        supabase
          .from("responses")
          .select("id, form_id, data_json, whatsapp_message, submitted_at")
          .eq("form_id", formId)
          .order("submitted_at", { ascending: false }),
      ]);

      if (cancelled) return;

      if (fieldsResult.error || responsesResult.error) {
        console.error(
          "Failed to load fields/responses",
          fieldsResult.error,
          responsesResult.error,
        );
        setError("Failed to load responses.");
        setIsLoading(false);
        return;
      }

      setFields((fieldsResult.data ?? []) as FormField[]);
      setResponses((responsesResult.data ?? []) as FormResponse[]);
      setIsLoading(false);
    }

    loadAll();

    return () => {
      cancelled = true;
    };
  }, [formId]);

  // --- Render branches ----------------------------------------------------

  if (isLoading) {
    return (
      <PageContainer>
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500 shadow-sm">
          Loading responses...
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-600"
        >
          {error}
        </div>
      </PageContainer>
    );
  }

  if (!form) {
    return (
      <PageContainer>
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-black">Form not found.</h1>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black">
            Responses
          </h1>
          <p className="mt-2 text-gray-600">
            View customer submissions for{" "}
            <span className="font-medium text-black">{form.title}</span>.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/dashboard" variant="secondary">
            Back to Dashboard
          </ButtonLink>
          <ButtonLink href={`/form/${form.slug}`} variant="primary">
            View Public Form
          </ButtonLink>
        </div>
      </header>

      {/* Body */}
      <div className="mt-10">
        {responses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
            No responses yet.
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {responses.map((response, index) => (
              <li
                key={response.id}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-7"
              >
                {/* Top row */}
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-base font-semibold text-black">
                    Response #{responses.length - index}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {new Date(response.submitted_at).toLocaleString()}
                  </p>
                </div>

                {/* Answers */}
                <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {fields.length === 0 ? (
                    <p className="text-sm text-gray-500 sm:col-span-2">
                      This form has no fields.
                    </p>
                  ) : (
                    fields.map((field) => {
                      const raw = response.data_json?.[field.id] ?? "";
                      const value =
                        typeof raw === "string" && raw.trim() !== ""
                          ? raw
                          : "-";
                      return (
                        <div key={field.id} className="min-w-0">
                          <dt className="text-xs font-medium text-gray-500">
                            {field.label}
                          </dt>
                          <dd className="mt-0.5 break-words text-sm text-black">
                            {value}
                          </dd>
                        </div>
                      );
                    })
                  )}
                </dl>

                {/* WhatsApp message */}
                {response.whatsapp_message && (
                  <div className="mt-5">
                    <p className="text-xs font-medium text-gray-500">
                      WhatsApp Message
                    </p>
                    <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-black">
                        {response.whatsapp_message}
                      </pre>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageContainer>
  );
}
