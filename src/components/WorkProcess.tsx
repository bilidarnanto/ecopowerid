"use client";

import { useMemo } from "react";
import { type VehicleType } from "@/lib/configurator-data";
import { type RabLine } from "@/lib/rab";
import { buildWorkSchedule, type WorkSchedule } from "@/lib/work-schedule";
import type { Dict } from "@/lib/i18n/dictionaries";
import { formatIDR } from "@/lib/format";

type WorkProcessProps = {
  vehicleType: VehicleType;
  includePlts: boolean;
  addonCodes: string[];
  lines: RabLine[];
  t: Dict;
  lang: "id" | "en";
};

/** Panel Proses Pengerjaan + Time Schedule — tampil di step 4 review */
export function WorkProcess(props: WorkProcessProps) {
  const { vehicleType, includePlts, addonCodes, lines, t, lang } = props;

  const schedule: WorkSchedule = useMemo(
    () => buildWorkSchedule(vehicleType, lines, includePlts, addonCodes, lang),
    [vehicleType, lines, includePlts, addonCodes, lang]
  );

  const activeSteps = schedule.steps.filter((s) => s.active);
  const totalWeeks = Math.ceil(schedule.totalDays / 7);

  return (
    <div className="space-y-6">
      {/* ---- Proses Pengerjaan ---- */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm">
        <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          🏗️ {t.configurator.processTitle}
        </h3>
        <p className="mt-1 text-xs text-slate-500">{t.configurator.processSubtitle}</p>

        {/* Steps timeline */}
        <div className="mt-6 space-y-0">
          {activeSteps.map((step, idx) => {
            const title = lang === "id" ? step.titleId : step.titleEn;
            const desc = lang === "id" ? step.descId : step.descEn;
            const isLast = idx === activeSteps.length - 1;
            return (
              <div key={step.id} className="relative flex gap-4">
                {/* Vertical line + dot */}
                <div className="flex flex-col items-center">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700 ring-2 ring-emerald-200">
                    {step.emoji}
                  </div>
                  {!isLast && (
                    <div className="w-0.5 flex-1 bg-gradient-to-b from-emerald-200 to-slate-200" />
                  )}
                </div>
                {/* Content */}
                <div className={`flex-1 ${isLast ? "pb-0" : "pb-6"}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{title}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                      ≈ {step.durationDays} {lang === "id" ? "hari" : "days"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">📝</span>
            <span className="text-sm font-bold text-slate-800">
              {t.configurator.scheduleTotal}: ≈ {totalWeeks} {lang === "id" ? "minggu" : "weeks"}
            </span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            {lang === "id" ? schedule.summaryTextId : schedule.summaryTextEn}
          </p>
        </div>
      </div>

      {/* ---- Time Schedule / Gantt ---- */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          📅 {t.configurator.scheduleTitle}
        </h3>
        <p className="mt-1 text-xs text-slate-500">{t.configurator.scheduleSubtitle}</p>

        {/* Week headers */}
        <div className="mt-5 overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Header row */}
            <div className="flex items-center border-b border-slate-200 pb-2">
              <div className="w-44 shrink-0 text-xs font-bold text-slate-500">
                {t.configurator.schedulePhase}
              </div>
              <div className="flex-1">
                <div className="flex">
                  {Array.from({ length: totalWeeks }, (_, i) => (
                    <div
                      key={i}
                      className="flex-1 text-center text-[10px] font-semibold text-slate-400"
                    >
                      {t.configurator.scheduleWeek} {i + 1}
                    </div>
                  ))}
                </div>
              </div>
              <div className="w-24 shrink-0 text-right text-[10px] font-bold text-slate-500">
                {t.configurator.scheduleDuration}
              </div>
            </div>

            {/* Gantt bars */}
            <div className="space-y-2 pt-3">
              {schedule.schedule.map((entry) => {
                const title = lang === "id" ? entry.titleId : entry.titleEn;
                const startWeek = Math.ceil(entry.startDay / 7);
                const endWeek = Math.ceil(entry.endDay / 7);
                const totalWeeks = Math.ceil(schedule.totalDays / 7);

                // Calculate left % and width % based on weeks
                const leftPct = ((startWeek - 1) / totalWeeks) * 100;
                const widthPct = Math.max(3, ((endWeek - startWeek + 1) / totalWeeks) * 100);

                return (
                  <div key={entry.phaseKey} className="flex items-center gap-3">
                    <div className="w-44 shrink-0 truncate text-xs font-medium text-slate-700">
                      {title}
                    </div>
                    <div className="relative flex-1 h-8">
                      {/* Background track */}
                      <div className="absolute inset-0 rounded-full bg-slate-100" />
                      {/* Progress bar */}
                      <div
                        className={`absolute top-0 bottom-0 left-0 rounded-full ${entry.color} opacity-80 transition-all duration-500`}
                        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                      />
                      {/* Label on bar */}
                      <div
                        className="absolute top-0 flex h-full items-center px-2 text-[10px] font-bold text-white drop-shadow-sm"
                        style={{ left: `${leftPct}%` }}
                      >
                        {widthPct > 15 ? `M${startWeek}–M${endWeek}` : ""}
                      </div>
                    </div>
                    <div className="w-24 shrink-0 text-right text-[11px] text-slate-500">
                      {entry.endDay - entry.startDay + 1} {lang === "id" ? "hari" : "days"}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total row */}
            <div className="mt-4 flex items-center border-t border-slate-200 pt-3">
              <div className="w-44 shrink-0 text-xs font-bold text-slate-700">
                {t.configurator.scheduleTotal}
              </div>
              <div className="flex-1" />
              <div className="w-24 shrink-0 text-right text-sm font-extrabold text-emerald-600">
                ≈ {totalWeeks} {lang === "id" ? "minggu" : "wk"}
              </div>
            </div>
          </div>
        </div>

        <p className="mt-4 text-[11px] italic text-slate-400">
          ⚠️ {t.configurator.scheduleNote}
        </p>
      </div>
    </div>
  );
}
