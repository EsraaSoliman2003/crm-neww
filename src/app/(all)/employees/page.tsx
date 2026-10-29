"use client";

import { card2BG } from "@/assets";
import ButtonBar from "@/components/buttonBar/ButtonBar";
import EmptyState from "@/components/emptyState/EmptyState";
import Input from "@/components/form/Input";
import Loader from "@/components/loader/Loader";
import Modal from "@/components/modal/Modal";
import Table from "@/components/table/Table";
import { useAuth } from "@/context/AuthContext";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import {
  deleteEmployee,
  fetchEmployees,
  type Employee,
  updateEmployee,
} from "@/rtk/slices/adminSlice";
import { confirmDelete } from "@/utils/confirmDelete";
import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type EmployeeForm = {
  id: string;
  fullName: string;
  email: string;
  countryCode: string;
  phoneNumber: string;
};

export default function EmployeesPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { role } = useAuth();
  const { employees, employeesLoading, updatingEmployee } = useAppSelector(
    (state) => state.admin,
  );
  const [search, setSearch] = useState("");
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editForm, setEditForm] = useState<EmployeeForm>({
    id: "",
    fullName: "",
    email: "",
    countryCode: "",
    phoneNumber: "",
  });

  useEffect(() => {
    if (role && !role.includes("ADMIN")) {
      router.replace("/");
      return;
    }

    if (role?.includes("ADMIN")) {
      dispatch(fetchEmployees());
    }
  }, [dispatch, role, router]);

  const filteredEmployees = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("ar");

    if (!normalizedSearch) return employees;

    return employees.filter((employee) =>
      [employee.fullName, employee.email, employee.phoneNumber]
        .filter(Boolean)
        .some((value) =>
          String(value).toLocaleLowerCase("ar").includes(normalizedSearch),
        ),
    );
  }, [employees, search]);

  const openEditModal = (employee: Employee) => {
    setEditingEmployee(employee);
    setEditForm({
      id: employee.id,
      fullName: employee.fullName || "",
      email: employee.email || "",
      countryCode: employee.countryCode || "",
      phoneNumber: employee.phoneNumber || "",
    });
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editForm.fullName.trim() || !editForm.email.trim()) {
      toast.error("اسم الموظف والبريد الإلكتروني مطلوبان");
      return;
    }

    try {
      await dispatch(
        updateEmployee({
          ...editForm,
          fullName: editForm.fullName.trim(),
          email: editForm.email.trim(),
        }),
      ).unwrap();
      toast.success("تم تعديل بيانات الموظف بنجاح");
      setEditingEmployee(null);
    } catch {
      toast.error("تعذر تعديل بيانات الموظف");
    }
  };

  const handleDelete = (id: string) => {
    confirmDelete(id, (employeeId) =>
      dispatch(deleteEmployee(String(employeeId))).unwrap(),
    );
  };

  if (!role?.includes("ADMIN")) return null;

  return (
    <div className="space-y-8">
      <Modal
        open={Boolean(editingEmployee)}
        onClose={() => setEditingEmployee(null)}
        title="تعديل بيانات الموظف"
      >
        <form className="space-y-4" onSubmit={handleUpdate}>
          <Input
            label="اسم الموظف"
            name="fullName"
            value={editForm.fullName}
            placeholder="أدخل اسم الموظف"
            onChange={(event) =>
              setEditForm((previous) => ({
                ...previous,
                fullName: event.target.value,
              }))
            }
          />
          <Input
            label="البريد الإلكتروني"
            name="email"
            type="email"
            value={editForm.email}
            placeholder="أدخل البريد الإلكتروني"
            onChange={(event) =>
              setEditForm((previous) => ({
                ...previous,
                email: event.target.value,
              }))
            }
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="مفتاح البلد"
              name="countryCode"
              value={editForm.countryCode}
              placeholder="مثال: +20"
              onChange={(event) =>
                setEditForm((previous) => ({
                  ...previous,
                  countryCode: event.target.value,
                }))
              }
            />
            <Input
              label="رقم الهاتف"
              name="phoneNumber"
              value={editForm.phoneNumber}
              placeholder="أدخل رقم الهاتف"
              onChange={(event) =>
                setEditForm((previous) => ({
                  ...previous,
                  phoneNumber: event.target.value,
                }))
              }
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setEditingEmployee(null)}
              className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={updatingEmployee}
              className="rounded-xl bg-[#bf0200] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#9f0200] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updatingEmployee ? "جارٍ الحفظ..." : "حفظ التعديل"}
            </button>
          </div>
        </form>
      </Modal>

      <div className="space-y-5 rounded-b-3xl border-b border-orange-100/80 bg-linear-to-b from-orange-50/95 via-white/95 to-white/90 px-6 pb-5 pt-4 shadow-[0_10px_30px_-24px_rgba(154,52,18,0.45)] md:px-8">
        <div className="text-right">
          <h1 className="text-xl font-bold md:text-2xl">الموظفين</h1>
        </div>

        <ButtonBar
          title="تقرير الموظفين"
          data={filteredEmployees.map((employee) => ({ ...employee }))}
        />
      </div>

      {employeesLoading ? (
        <Loader />
      ) : employees.length ? (
        <Table
          data={filteredEmployees}
          filterContent={
            <Input
              name="employeeSearch"
              type="text"
              value={search}
              placeholder="ابحث باسم الموظف أو البريد الإلكتروني أو رقم الهاتف"
              onChange={(event) => setSearch(event.target.value)}
            />
          }
          emptyText="لا يوجد موظفين مطابقين للبحث"
          exportTitle="تقرير الموظفين"
          getRowKeyAction={(employee) => employee.id}
          columns={[
            {
              key: "id",
              header: "الرقم",
              render: (_, index) => index + 1,
            },
            {
              key: "fullName",
              header: "اسم الموظف",
            },
            {
              key: "email",
              header: "البريد الإلكتروني",
              render: (row) => row.email || "-",
            },
            {
              key: "phoneNumber",
              header: "رقم الهاتف",
              render: (row) => row.phoneNumber || "-",
            },
            {
              key: "isApproved",
              header: "الحالة",
              render: (row) => (
                <span
                  className={
                    row.isApproved
                      ? "font-semibold text-green-600"
                      : "font-semibold text-orange-600"
                  }
                >
                  {row.isApproved ? "مفعل" : "غير مفعل"}
                </span>
              ),
              exportValue: (row) => (row.isApproved ? "مفعل" : "غير مفعل"),
              filterable: true,
            },
            {
              key: "role",
              header: "الدور",
              render: (row) => (row.role === "EMPLOYEE" ? "مهندس" : "-"),
              filterable: true,
            },
            {
              key: "actions",
              header: "خيارات",
              printable: false,
              render: (row) => (
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      openEditModal(row);
                    }}
                    className="text-blue-500 transition-colors hover:text-blue-700"
                    aria-label="تعديل الموظف"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDelete(row.id);
                    }}
                    className="text-red-500 transition-colors hover:text-red-700"
                    aria-label="حذف الموظف"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ),
            },
          ]}
        />
      ) : (
        <EmptyState image={card2BG} title="لا يوجد موظفين" />
      )}
    </div>
  );
}
