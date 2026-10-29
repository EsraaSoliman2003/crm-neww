"use client";

import React, { useEffect, useRef, useState } from "react";
import Button from "@/components/button/Button";
import Input from "@/components/form/Input";
import Textarea from "@/components/form/Textarea";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import {
  createProject,
  fetchProjectById,
  updateProject,
} from "@/rtk/slices/projectsSlice";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";

type FormState = {
  name: string;
  location: string;
  sector: string;
  startDate: string;
  type: string;
  estimatedValue: number | null;
  estimates: number[];
  notes: string;
};

export default function ProjectsForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const mode = (searchParams.get("mode") as "create" | "edit") || "create";
  const projectId = Number(searchParams.get("id"));
  const isEdit = mode === "edit" && Boolean(projectId);
  const { creating, updating, currentProject } = useAppSelector(
    (s) => s.projects,
  );

  const [form, setForm] = useState<FormState>({
    name: "",
    location: "",
    sector: "",
    startDate: "",
    type: "",
    estimatedValue: null,
    estimates: [],
    notes: "",
  });

  const [errors, setErrors] = useState<Partial<FormState>>({});
  const filledFormKeyRef = useRef("");

  useEffect(() => {
    if (isEdit) {
      dispatch(fetchProjectById(projectId));
    }
  }, [dispatch, isEdit, projectId]);

  useEffect(() => {
    const editFormKey = `${mode}-${projectId}`;
    if (!isEdit || filledFormKeyRef.current === editFormKey) return;
    if (!currentProject || currentProject.id !== projectId) return;

    queueMicrotask(() => {
      setForm({
        name: currentProject.name || "",
        location: currentProject.location || "",
        sector: currentProject.sector || "",
        startDate: currentProject.startDate
          ? currentProject.startDate.slice(0, 10)
          : "",
        type: currentProject.projectType || "",
        estimatedValue: currentProject.investmentCost || 0,
        estimates: [],
        notes: currentProject.description || "",
      });
      filledFormKeyRef.current = editFormKey;
    });
  }, [currentProject, isEdit, mode, projectId]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validate = () => {
    const newErrors: Partial<FormState> = {};

    if (!form.name.trim()) newErrors.name = "اسم المشروع مطلوب";
    if (!form.location.trim()) newErrors.location = "اسم الموقع مطلوب";
    if (!form.sector.trim()) newErrors.sector = "جهة المشروع مطلوبة";
    if (!form.startDate) newErrors.startDate = "تاريخ البدء مطلوب";
    if (!form.type.trim()) newErrors.type = "نوع المشروع مطلوب";
    // if (!form.estimatedValue || form.estimatedValue <= 0)
    //     newErrors.estimatedValue ="القيمة التقديرية مطلوبة";
    // if (!form.notes.trim()) newErrors.notes ="الملاحظات مطلوبة";

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const saveProject = async () => {
    if (!validate()) return;

    try {
      const payload = {
        name: form.name,
        location: form.location,
        sector: form.sector,
        startDate: form.startDate,
        projectType: form.type,
        investmentCost:
          Number(String(form.estimatedValue ?? "").replace(/,/g, "")) || 0,
        description: form.notes,
      };

      if (isEdit) {
        await dispatch(
          updateProject({
            id: projectId,
            ...payload,
          }),
        ).unwrap();

        toast.success("تم تعديل المشروع بنجاح");
      } else {
        await dispatch(createProject(payload)).unwrap();

        toast.success("تم إضافة المشروع بنجاح");
      }

      setForm({
        name: "",
        location: "",
        sector: "",
        startDate: "",
        type: "",
        estimatedValue: 0,
        estimates: [],
        notes: "",
      });

      setErrors({});
      router.push("/projects");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="bg-white shadow p-6 space-y-8">
        {/* Name */}
        <div>
          <Input
            label="اسم المشروع"
            name="name"
            value={form.name}
            placeholder="ادخل الاسم"
            onChange={handleChange}
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        {/* Location + Sector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Input
              label="موقع المشروع"
              name="location"
              value={form.location}
              placeholder="ادخل اسم الموقع"
              onChange={handleChange}
            />
            {errors.location && (
              <p className="text-red-500 text-sm mt-1">{errors.location}</p>
            )}
          </div>

          <div>
            <Input
              label="جهة المشروع"
              name="sector"
              value={form.sector}
              placeholder="ادخل اسم جهة المشروع"
              onChange={handleChange}
            />
            {errors.sector && (
              <p className="text-red-500 text-sm mt-1">{errors.sector}</p>
            )}
          </div>
        </div>

        {/* Date + Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Input
              label="ادخل تاريخ بدء المشروع"
              type="date"
              name="startDate"
              value={form.startDate}
              onChange={handleChange}
            />
            {errors.startDate && (
              <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>
            )}
          </div>

          <div>
            <Input
              label="نوع المشروع"
              name="type"
              value={form.type}
              placeholder="ادخل نوع المشروع"
              onChange={handleChange}
            />
            {errors.type && (
              <p className="text-red-500 text-sm mt-1">{errors.type}</p>
            )}
          </div>
        </div>

        {/* Estimated Value */}
        <div>
          <Input
            label="القيمة التقديرية للمشروع"
            type="number"
            name="estimatedValue"
            value={form.estimatedValue ?? ""}
            placeholder="ادخل القيمة التقديرية للمشروع"
            onChange={handleChange}
            formatNumber
          />
          {/* {errors.estimatedValue && (
                        <p className="text-red-500 text-sm mt-1">{errors.estimatedValue}</p>
                    )} */}
        </div>

        {/* Notes */}
        <div>
          <Textarea
            label="ملاحظات"
            name="notes"
            value={form.notes}
            placeholder="اضف ملاحظات..."
            onChange={handleChange}
          />
          {/* {errors.notes && (
                        <p className="text-red-500 text-sm mt-1">{errors.notes}</p>
                    )} */}
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          text={isEdit ? "حفظ التعديل" : "إضافة المشروع"}
          onClick={saveProject}
          loading={creating || updating}
        />
      </div>
    </div>
  );
}
