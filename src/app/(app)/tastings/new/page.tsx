"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/i18n-context";
import { api } from "@/lib/api-client";

interface NewTastingForm {
  name: string;
  date: string;
  time: string;
  venue: string;
  participants: string;
  notes: string;
}

export default function NewTastingPage() {
  const router = useRouter();
  const { beverageType } = useAuth();
  const { t } = useTranslation();
  const isBeer = beverageType === "beer";
  const [formData, setFormData] = useState<NewTastingForm>(() => {
    const now = new Date();
    const dateString = now.toISOString().split("T")[0];
    const timeString = now.toTimeString().slice(0, 5);
    return {
      name: "",
      date: dateString,
      time: timeString,
      venue: "",
      participants: "",
      notes: "",
    };
  });

  const [errors, setErrors] = useState<Partial<Record<keyof NewTastingForm, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name as keyof NewTastingForm]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof NewTastingForm, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = t("tastings.error_name_required");
    }

    if (!formData.date) {
      newErrors.date = t("tastings.error_date_required");
    }

    if (!formData.time) {
      newErrors.time = t("tastings.error_time_required");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const combinedDateTime = `${formData.date}T${formData.time}:00`;

      const payload = {
        name: formData.name.trim(),
        date: combinedDateTime,
        venue: formData.venue.trim() || undefined,
        participants: formData.participants.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      };

      const response = await api.post("/tastings", payload);
      const tastingId = response.id;

      router.push(`/tastings/${tastingId}`);
    } catch (err) {
      console.error("Failed to create tasting:", err);
      setSubmitError(t("tastings.error_create_failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <PageHeader title={t("tastings.new_title")} showBack variant="wine" />

      <div className="p-4 sm:p-6 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {submitError && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-200">
              {submitError}
            </div>
          )}

          <div>
            <Input
              label={t("tastings.session_name")}
              name="name"
              placeholder={t("tastings.session_placeholder")}
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Input
                label={t("tastings.date")}
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                error={errors.date}
                required
              />
            </div>

            <div>
              <Input
                label={t("tastings.time")}
                name="time"
                type="time"
                value={formData.time}
                onChange={handleChange}
                error={errors.time}
                required
              />
            </div>
          </div>

          <div>
            <Input
              label={t("tastings.venue")}
              name="venue"
              placeholder={t("tastings.venue_placeholder")}
              value={formData.venue}
              onChange={handleChange}
            />
          </div>

          <div>
            <Input
              label={t("tastings.participants")}
              name="participants"
              placeholder={t("tastings.participants_placeholder")}
              value={formData.participants}
              onChange={handleChange}
            />
          </div>

          <div className="flex flex-col gap-2.5">
            <label className="text-sm font-semibold text-wine-950">
              {t("tastings.notes")}
            </label>
            <textarea
              name="notes"
              placeholder={t("tastings.notes_placeholder")}
              value={formData.notes}
              onChange={handleChange}
              className="flex min-h-32 w-full rounded-xl border-2 border-warm-border bg-white px-4 py-3 text-sm text-wine-950 placeholder:text-wine-500 transition-all duration-200 focus:outline-none focus:border-wine-800 focus:ring-2 focus:ring-wine-800/20 disabled:cursor-not-allowed disabled:bg-cream-dark disabled:text-wine-600"
            />
          </div>

          <div className="flex gap-3 pt-6">
            <Button
              type="submit"
              variant="gold"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              className="flex-1 rounded-xl"
            >
              {t("tastings.create")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="flex-1 rounded-xl"
            >
              {t("common.cancel")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
