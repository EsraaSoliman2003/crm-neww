"use client";

import React, { useEffect, useState } from "react";
import Button from "@/components/button/Button";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { fetchEstimates } from "@/rtk/slices/estimatesSlice";
import {
  assignEstimatesToCompanies,
  fetchCompanies,
} from "@/rtk/slices/companiesSlice";

import Section from "./_components/Section";

export default function AddEstimateToCompanies() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const {
    data: companies,
    loading: companiesLoading,
    assigning,
  } = useAppSelector((s) => s.companies);

  const { data: estimates, loading: estimatesLoading } = useAppSelector(
    (s) => s.estimates
  );

  const [form, setForm] = useState({
    estimateIds: [] as number[],
    companyIds: [] as number[],
  });

  const [search, setSearch] = useState({
    estimates: "",
    companies: "",
  });

  useEffect(() => {
    dispatch(fetchEstimates());
    dispatch(fetchCompanies());
  }, [dispatch]);

  const toggleItem = (id: number, key: "estimateIds" | "companyIds") => {
    setForm((prev) => {
      const exists = prev[key].includes(id);

      return {
        ...prev,
        [key]: exists
          ? prev[key].filter((i) => i !== id)
          : [...prev[key], id],
      };
    });
  };

  const toggleAll = (key: "estimateIds" | "companyIds", ids: number[]) => {
    setForm((prev) => {
      const isAllSelected = prev[key].length === ids.length;

      return {
        ...prev,
        [key]: isAllSelected ? [] : ids,
      };
    });
  };

  const handleSubmit = async () => {
    try {
      console.log("here");
      await dispatch(
        assignEstimatesToCompanies({
          estimateIds: form.estimateIds,
          companyIds: form.companyIds,
        })
      ).unwrap();

      toast.success("تم الإضافة بنجاح");

      setForm({
        estimateIds: [],
        companyIds: [],
      });

      router.push("/estimates");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="flex justify-center p-6">
      <div className="w-full space-y-8">

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-800">
          ربط المقايسات بالشركات
        </h2>

        {/* Sections */}
        <div className="grid md:grid-cols-2 gap-6">

          <Section
            title="المقايسات"
            data={estimates}
            loading={estimatesLoading}
            searchKey="estimates"
            formKey="estimateIds"
            form={form}
            search={search}
            setSearch={setSearch}
            toggleAll={toggleAll}
            toggleItem={toggleItem}
          />

          <Section
            title="الشركات"
            data={companies}
            loading={companiesLoading}
            searchKey="companies"
            formKey="companyIds"
            form={form}
            search={search}
            setSearch={setSearch}
            toggleAll={toggleAll}
            toggleItem={toggleItem}
          />

        </div>

        {/* Button */}
        <div className="flex justify-end">
          <Button
            text="حفظ"
            onClick={handleSubmit}
            loading={assigning}
          />
        </div>

      </div>
    </div>
  );
}