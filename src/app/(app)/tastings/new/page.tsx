"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
      newErrors.name = "Name is required";
    }

    if (!formData.date) {
      newErrors.date = "Date is required";
    }

    if (!formData.time) {
      newErrors.time = "Time is required";
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
      setSubmitError("Failed to create tasting. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <PageHeader title="New Tasting" showBack />

      <div className="p-4 sm:p-6 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {submitError && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {submitError}
            </div>
          )}

          <Input
            label="Tasting Name"
            name="name"
            placeholder="e.g. Pinot Noir Lineup"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            required
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              error={errors.date}
              required
            />

            <Input
              label="Time"
              name="time"
              type="time"
              value={formData.time}
              onChange={handleChange}
              error={errors.time}
              required
            />
          </div>

          <Input
            label="Venue"
            name="venue"
            placeholder="e.g. Downtown Wine Bar"
            value={formData.venue}
            onChange={handleChange}
          />

          <Input
            label="Participants"
            name="participants"
            placeholder="e.g. Sarah, John, Mike"
            value={formData.participants}
            onChange={handleChange}
          />

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#1A1A1A]">
              Notes
            </label>
            <textarea
              name="notes"
              placeholder="Any additional notes about this tasting..."
              value={formData.notes}
              onChange={handleChange}
              className="flex min-h-32 w-full rounded-md border border-[#E5E1DB] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#6B7280] transition-colors focus:outline-none focus:border-[#7C2D36] focus:ring-2 focus:ring-[#7C2D36] focus:ring-offset-0 disabled:cursor-not-allowed disabled:bg-[#FDFBF7] disabled:text-[#6B7280]"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              className="flex-1"
            >
              Create Tasting
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
