"use client";

import React, { FormEvent, useEffect, useRef, useState } from "react";
import Button from "@/components/button/Button";
import Input from "@/components/form/Input";
import Textarea from "@/components/form/Textarea";
import ChooseItems from "../_components/ChooseItems";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import { fetchProjects } from "@/rtk/slices/projectsSlice";
import { fetchCompanies } from "@/rtk/slices/companiesSlice";
import { toast } from "sonner";
import {
  createEstimate,
  fetchEstimateById,
  updateEstimate,
} from "@/rtk/slices/estimatesSlice";
import { useRouter, useSearchParams } from "next/navigation";
import Dropdown from "@/components/dropdown/DropDown";
import axios from "@/lib/axios";
import Modal from "@/components/modal/Modal";
import FormModal from "@/components/formModal/FormModal";
import {
  getEstimateItemQuantityMap,
  saveEstimateItemQuantities,
} from "@/utils/estimateItemQuantities";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import {
  parsePhoneNumber,
  parsePhoneNumberFromString,
} from "libphonenumber-js";
import { createCompany } from "@/rtk/slices/companiesSlice";
import { validatePassword } from "@/utils/validatePassword ";

type SelectedEstimateItem = {
  itemId: number;
  quantity: number;
};

type FormState = {
  estimateNumber: string;
  name: string;
  projectId: string;
  companyId: string;
  companyProposal: number | null;
  estimateCompleteId: number;
  estimateStageId: number;
  notes: string;
  selectedItems: SelectedEstimateItem[];
};

interface EstimateComplete {
  id: number;
  name: string;
}

type EditableEstimate = {
  id: number;
  estimateNumber?: string;
  name?: string;
  projectId?: number;
  projectName?: string;
  companyId?: number;
  companyName?: string;
  adminOfferPrice?: number | null;
  notes?: string | null;
  estimateComplete?: EstimateComplete;
  estimateStage?: EstimateComplete;
  items?: { id: number }[];
};

type NewErrors = {
  estimateNumber: string;
  name: string;
  projectId: string;
  companyId: string;
  companyProposal: number;
  estimateCompleteId: string;
  estimateStageId: string;
};

type CompanyFormState = {
  name: string;
  email: string;
  password: string;
  countryCode: string;
  phone: string;
};

const emptyCompanyForm: CompanyFormState = {
  name: "",
  email: "",
  password: "",
  countryCode: "",
  phone: "",
};

export default function EstimateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const mode = (searchParams.get("mode") as "create" | "edit") || "create";
  const estimateId = Number(searchParams.get("id"));
  const isEdit = mode === "edit" && Boolean(estimateId);

  const { data: projects, loading: projectsLoading } = useAppSelector(
    (s) => s.projects,
  );
  const { data: companies, loading: loadingCompany } = useAppSelector(
    (s) => s.companies,
  );
  const { creating: creatingCompany } = useAppSelector((s) => s.companies);
  const { creating, updating, selectedEstimate } = useAppSelector(
    (s) => s.estimates,
  );

  const [errors, setErrors] = useState<Partial<NewErrors>>({});
  const [form, setForm] = useState<FormState>({
    estimateNumber: "",
    name: "",
    projectId: "",
    estimateCompleteId: 0,
    companyId: "",
    companyProposal: null,
    estimateStageId: 0,
    notes: "",
    selectedItems: [],
  });

  const filledFormKeyRef = useRef("");

  const [estimateComplete, setEstimateComplete] = useState<EstimateComplete[]>(
    [],
  );
  const [addEstimateCompleteValue, setAddEstimateCompleteValue] =
    useState<string>("");
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [openCompleteModal, setOpenCompleteModal] = useState(false);

  const [estimateStage, setEstimateStage] = useState<EstimateComplete[]>([]);
  const [addEstimateStageValue, setAddEstimateStageValue] =
    useState<string>("");
  const [loadingStage, setLoadingStage] = useState(false);
  const [openStageModal, setOpenStageModal] = useState(false);
  const [loadingCreateComplete, setLoadingCreateComplete] = useState(false);
  const [loadingCreateStage, setLoadingCreateStage] = useState(false);
  const [openCompanyModal, setOpenCompanyModal] = useState(false);
  const [companyForm, setCompanyForm] =
    useState<CompanyFormState>(emptyCompanyForm);
  const [companyErrors, setCompanyErrors] = useState<
    Partial<CompanyFormState>
  >({});

  const fetchEstimateComplete = async () => {
    try {
      setLoadingComplete(true);
      const res = await axios.get("EstimateComplete");
      setEstimateComplete(res.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingComplete(false);
    }
  };

  const addEstimateComplete = async (e: FormEvent) => {
    e.preventDefault();

    try {
      setLoadingCreateComplete(true);
      const res = await axios.post("EstimateComplete", {
        name: addEstimateCompleteValue,
      });

      setEstimateComplete((prev) => [...prev, res.data]);
      setAddEstimateCompleteValue("");
      setOpenCompleteModal(false);
      toast.success("تمت إضافة حالة المقايسة بنجاح");
    } catch (error) {
      console.log(error);
      toast.error("تعذر إضافة حالة المقايسة");
    } finally {
      setLoadingCreateComplete(false);
    }
  };

  const fetchEstimateStage = async () => {
    try {
      setLoadingStage(true);
      const res = await axios.get("EstimateStage");
      setEstimateStage(res.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingStage(false);
    }
  };

  const addEstimateStage = async (e: FormEvent) => {
    e.preventDefault();

    try {
      setLoadingCreateStage(true);
      const res = await axios.post("EstimateStage", {
        name: addEstimateStageValue,
      });

      setEstimateStage((prev) => [...prev, res.data]);
      setAddEstimateStageValue("");
      setOpenStageModal(false);
      toast.success("تمت إضافة مرحلة المقايسة بنجاح");
    } catch (error) {
      console.log(error);
      toast.error("تعذر إضافة مرحلة المقايسة");
    } finally {
      setLoadingCreateStage(false);
    }
  };

  const validateCompanyForm = () => {
    const nextErrors: Partial<CompanyFormState> = {};

    if (!companyForm.name.trim()) {
      nextErrors.name = "اسم الشركة مطلوب";
    }

    if (!companyForm.email.trim()) {
      nextErrors.email = "البريد الإلكتروني مطلوب";
    }

    if (!companyForm.password.trim()) {
      nextErrors.password = "كلمة المرور مطلوبة";
    } else {
      const passwordError = validatePassword(companyForm.password);
      if (passwordError) {
        nextErrors.password = passwordError;
      }
    }

    if (!companyForm.phone.trim()) {
      nextErrors.phone = "رقم الهاتف مطلوب";
    } else if (!isValidPhoneNumber(companyForm.phone)) {
      nextErrors.phone = "رقم الهاتف غير صحيح";
    }

    setCompanyErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleAddCompany = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateCompanyForm()) return;

    try {
      const parsedPhone = parsePhoneNumber(companyForm.phone);

      const createdCompany = await dispatch(
        createCompany({
          companyName: companyForm.name.trim(),
          email: companyForm.email.trim(),
          password: companyForm.password,
          countryCode: companyForm.countryCode,
          phoneNumber: parsedPhone?.nationalNumber || "",
        }),
      ).unwrap();

      toast.success("تمت إضافة الشركة بنجاح");
      setForm((prev) => ({
        ...prev,
        companyId: String(createdCompany?.id || ""),
      }));
      setCompanyForm(emptyCompanyForm);
      setCompanyErrors({});
      setOpenCompanyModal(false);
    } catch (error) {
      console.log(error);
      toast.error("تعذر إضافة الشركة");
    }
  };

  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchCompanies());
    fetchEstimateComplete();
    fetchEstimateStage();

    if (isEdit) {
      dispatch(fetchEstimateById(estimateId));
    }
  }, [dispatch, estimateId, isEdit]);

  useEffect(() => {
    const editFormKey = `${mode}-${estimateId}`;

    if (!isEdit || filledFormKeyRef.current === editFormKey) return;
    if (!selectedEstimate || selectedEstimate.id !== estimateId) return;

    const estimate = selectedEstimate as EditableEstimate;

    queueMicrotask(() => {
      const storedQuantityMap = getEstimateItemQuantityMap(estimateId);

      setForm({
        estimateNumber: estimate.estimateNumber || "",
        name: estimate.name || "",
        projectId: String(
          estimate.projectId ||
            projects.find((project) => project.name === estimate.projectName)
              ?.id || "",
        ),
        companyId: String(
          estimate.companyId ||
            companies.find(
              (company) => company.companyName === estimate.companyName,
            )?.id || "",
        ),
        companyProposal: estimate.adminOfferPrice ?? null,
        notes: estimate.notes || "",
        selectedItems:
          estimate.items?.map((item) => ({
            itemId: item.id,
            quantity: storedQuantityMap.get(item.id) ?? 1,
          })) || [],
        estimateCompleteId: estimate.estimateComplete?.id || 0,
        estimateStageId: estimate.estimateStage?.id || 0,
      });
      filledFormKeyRef.current = editFormKey;
    });
  }, [companies, estimateId, isEdit, mode, projects, selectedEstimate]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "companyProposal"
          ? value === ""
            ? null
            : Number(value)
          : value,
    }));
  };

  const toggleItem = (id: number) => {
    setForm((prev) => {
      const exists = prev.selectedItems.some((item) => item.itemId === id);

      return {
        ...prev,
        selectedItems: exists
          ? prev.selectedItems.filter((item) => item.itemId !== id)
          : [...prev.selectedItems, { itemId: id, quantity: 1 }],
      };
    });
  };

  const changeItemQuantity = (id: number, quantity: number) => {
    setForm((prev) => ({
      ...prev,
      selectedItems: prev.selectedItems.map((item) =>
        item.itemId === id
          ? { ...item, quantity: Number.isFinite(quantity) ? quantity : 0 }
          : item,
      ),
    }));
  };

  const validate = () => {
    const newErrors: Partial<NewErrors> = {};

    if (!form.name.trim()) newErrors.name = "اسم المقايسة مطلوب";
    if (!form.estimateNumber.trim()) {
      newErrors.estimateNumber = "رقم المقايسة مطلوب";
    }
    if (!form.projectId) newErrors.projectId = "المشروع مطلوب";
    if (!form.companyId) newErrors.companyId = "الشركة مطلوبة";
    if (!form.estimateStageId) newErrors.estimateStageId = "المرحلة مطلوبة";
    if (!form.estimateCompleteId) {
      newErrors.estimateCompleteId = "حالة إتمام المقايسة مطلوبة";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveEstimate = async () => {
    if (!validate()) return;

    try {
      const itemIds = form.selectedItems.map((item) => item.itemId);
      const quantityPayload = form.selectedItems.map((item) => ({
        itemId: item.itemId,
        quantity: item.quantity,
      }));

      if (isEdit) {
        await dispatch(
          updateEstimate({
            id: estimateId,
            estimateNumber: form.estimateNumber.trim(),
            estimateStageId: form.estimateStageId,
            estimateCompleteId: form.estimateCompleteId,
            name: form.name,
            projectId: Number(form.projectId),
            companyId: Number(form.companyId),
            pricePerUnit: 0,
            adminOfferPrice: form.companyProposal,
            notes: form.notes,
          }),
        ).unwrap();

        await axios.post(`Estimate/Assign?isUpdate=${true}`, {
          estimateId,
          itemIds,
        });
        saveEstimateItemQuantities(estimateId, quantityPayload);

        toast.success("تم تحديث المقايسة بنجاح");
      } else {
        const createdEstimate = await dispatch(
          createEstimate({
            estimateNumber: form.estimateNumber.trim(),
            estimateStageId: form.estimateStageId,
            estimateCompleteId: form.estimateCompleteId,
            name: form.name,
            projectId: Number(form.projectId),
            companyId: Number(form.companyId),
            quantity: 0,
            pricePerUnit: 0,
            adminOfferPrice: form.companyProposal,
            notes: form.notes,
            itemIds,
          }),
        ).unwrap();
        if (createdEstimate?.id) {
          saveEstimateItemQuantities(createdEstimate.id, quantityPayload);
        }

        toast.success("تمت إضافة المقايسة بنجاح");
      }

      setForm({
        estimateNumber: "",
        name: "",
        projectId: "",
        companyId: "",
        companyProposal: 0,
        notes: "",
        selectedItems: [],
        estimateCompleteId: 0,
        estimateStageId: 0,
      });

      setErrors({});
      router.push("/estimates");
    } catch (error) {
      console.log(error);
      toast.error(
        isEdit ? "تعذر تعديل المقايسة" : "تعذر إضافة المقايسة",
      );
    }
  };

  return (
    <>
      <Modal
        open={openCompanyModal}
        onClose={() => {
          setOpenCompanyModal(false);
          setCompanyErrors({});
        }}
        title="إضافة شركة جديدة"
      >
        <form className="space-y-5" onSubmit={handleAddCompany}>
          <Input
            label="اسم الشركة"
            name="name"
            value={companyForm.name}
            placeholder="أدخل اسم الشركة"
            onChange={(event) =>
              setCompanyForm((previous) => ({
                ...previous,
                name: event.target.value,
              }))
            }
          />
          {companyErrors.name && (
            <p className="text-sm text-red-500">{companyErrors.name}</p>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <Input
                label="البريد الإلكتروني"
                name="email"
                value={companyForm.email}
                placeholder="أدخل البريد الإلكتروني"
                onChange={(event) =>
                  setCompanyForm((previous) => ({
                    ...previous,
                    email: event.target.value,
                  }))
                }
              />
              {companyErrors.email && (
                <p className="text-sm text-red-500">{companyErrors.email}</p>
              )}
            </div>

            <div>
              <Input
                label="كلمة المرور"
                name="password"
                type="password"
                value={companyForm.password}
                placeholder="أدخل كلمة المرور"
                onChange={(event) =>
                  setCompanyForm((previous) => ({
                    ...previous,
                    password: event.target.value,
                  }))
                }
              />
              {companyErrors.password && (
                <p className="text-sm text-red-500">{companyErrors.password}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block font-bold text-gray-700">رقم الهاتف</label>
            <PhoneInput
              international={false}
              defaultCountry="EG"
              value={companyForm.phone}
              onChange={(value) => {
                const phone = value || "";
                const parsedPhone = parsePhoneNumberFromString(phone);
                setCompanyForm((previous) => ({
                  ...previous,
                  phone,
                  countryCode: parsedPhone ? `+${parsedPhone.countryCallingCode}` : "",
                }));
              }}
              className="h-13.75! rounded-xl!"
            />
            {companyErrors.phone && (
              <p className="text-sm text-red-500">{companyErrors.phone}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setOpenCompanyModal(false);
                setCompanyErrors({});
              }}
              className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={creatingCompany}
              className="rounded-xl bg-red-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creatingCompany ? "جارٍ الحفظ..." : "حفظ الشركة"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={openStageModal}
        onClose={() => setOpenStageModal(false)}
        title="إضافة مرحلة جديدة"
      >
        <FormModal
          value={addEstimateStageValue}
          onChange={setAddEstimateStageValue}
          onSubmit={addEstimateStage}
          loading={loadingCreateStage}
          label="اسم المرحلة"
          placeholder="أدخل اسم المرحلة"
          buttonText="حفظ"
        />
      </Modal>

      <Modal
        open={openCompleteModal}
        onClose={() => setOpenCompleteModal(false)}
        title="إضافة حالة إتمام جديدة"
      >
        <FormModal
          value={addEstimateCompleteValue}
          onChange={setAddEstimateCompleteValue}
          onSubmit={addEstimateComplete}
          loading={loadingCreateComplete}
          label="اسم حالة الإتمام"
          placeholder="أدخل اسم حالة الإتمام"
          buttonText="حفظ"
        />
      </Modal>

      <div className="min-h-screen">
        <div className="space-y-8 rounded-[28px] border border-rose-100/80 bg-white p-6 shadow-[0_22px_42px_-30px_rgba(136,19,55,0.28)]">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <Input
                label="اسم المقايسة"
                name="name"
                value={form.name}
                placeholder="أدخل اسم المقايسة"
                onChange={handleChange}
              />
              {errors.name && (
                <p className="mt-2 text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div>
              <Input
                label="رقم المقايسة"
                name="estimateNumber"
                value={form.estimateNumber}
                placeholder="أدخل رقم المقايسة"
                onChange={handleChange}
              />
              {errors.estimateNumber && (
                <p className="mt-2 text-sm text-red-500">
                  {errors.estimateNumber}
                </p>
              )}
            </div>
          </div>

          <div>
            <Dropdown
              label="اختر المشروع"
              placeholder="اختر المشروع"
              options={projects.map((project) => ({
                value: String(project.id),
                label: project.name,
              }))}
              selected={form.projectId}
              onSelect={(opt) =>
                setForm((prev) => ({
                  ...prev,
                  projectId: opt.value,
                }))
              }
              link="/projects/add-project"
              linkText="+ إضافة مشروع"
              loading={projectsLoading}
            />
            {errors.projectId && (
              <p className="mt-2 text-sm text-red-500">{errors.projectId}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <Dropdown
                label="اختر مرحلة المقايسة"
                placeholder="اختر مرحلة المقايسة"
                options={estimateStage.map((stage) => ({
                  value: String(stage.id),
                  label: stage.name,
                }))}
                selected={String(form.estimateStageId)}
                onSelect={(opt) =>
                  setForm((prev) => ({
                    ...prev,
                    estimateStageId: Number(opt.value),
                  }))
                }
                linkType="button"
                linkText="+ إضافة مرحلة"
                onAdd={() => setOpenStageModal(true)}
                loading={loadingStage}
              />
              {errors.estimateStageId && (
                <p className="mt-2 text-sm text-red-500">
                  {errors.estimateStageId}
                </p>
              )}
            </div>

            <div>
              <Dropdown
                label="اختر حالة إتمام المقايسة"
                placeholder="اختر حالة إتمام المقايسة"
                options={estimateComplete.map((complete) => ({
                  value: String(complete.id),
                  label: complete.name,
                }))}
                selected={String(form.estimateCompleteId)}
                onSelect={(opt) =>
                  setForm((prev) => ({
                    ...prev,
                    estimateCompleteId: Number(opt.value),
                  }))
                }
                linkType="button"
                linkText="+ إضافة حالة إتمام"
                onAdd={() => setOpenCompleteModal(true)}
                loading={loadingComplete}
              />
              {errors.estimateCompleteId && (
                <p className="mt-2 text-sm text-red-500">
                  {errors.estimateCompleteId}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <Dropdown
                label="اختر الشركة"
                placeholder="اختر الشركة"
                options={companies.map((company) => ({
                  value: String(company.id),
                  label: company.companyName,
                }))}
                selected={String(form.companyId)}
                onSelect={(opt) =>
                  setForm((prev) => ({
                    ...prev,
                    companyId: opt.value,
                  }))
                }
                linkType="button"
                linkText="+ إضافة شركة"
                onAdd={() => setOpenCompanyModal(true)}
                loading={loadingCompany}
              />
              {errors.companyId && (
                <p className="mt-2 text-sm text-red-500">{errors.companyId}</p>
              )}
            </div>

            <div>
                <Input
                  label="قيمة المقايسة"
                  type="number"
                  name="companyProposal"
                  value={form.companyProposal ?? ""}
                  placeholder="ادخل قيمة المقايسة"
                  onChange={handleChange}
                />
            </div>
          </div>

          <div>
            <Textarea
              label="ملاحظات"
              name="notes"
              value={form.notes}
              placeholder="أضف ملاحظات إضافية..."
              onChange={handleChange}
            />
          </div>
        </div>

        <ChooseItems
          selectedItems={form.selectedItems}
          onToggle={toggleItem}
          onQuantityChange={changeItemQuantity}
        />

        <div className="mt-6 flex justify-end">
          <Button
            text={isEdit ? "حفظ التعديل" : "إضافة المقايسة"}
            onClick={saveEstimate}
            loading={creating || updating}
          />
        </div>
      </div>
    </>
  );
}


