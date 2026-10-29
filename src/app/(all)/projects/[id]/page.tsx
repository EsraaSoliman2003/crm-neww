"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/rtk/hooks";
import { fetchProjectById } from "@/rtk/slices/projectsSlice";
import Loader from "@/components/loader/Loader";
import CardProject from "../_components/CardProject";
import EstimatesProject from "../_components/EstimatesProject";
import Button from "@/components/button/Button";

export default function Page() {
  const params = useParams();
  const dispatch = useAppDispatch();
  const { currentProject, projectLoading } = useAppSelector(
    (s) => s.projects
  );

  useEffect(() => {
    if (params?.id) {
      dispatch(fetchProjectById(Number(params.id)));
    }
  }, [dispatch, params?.id]);
  return (
    <div>
      {projectLoading ? (
        <Loader />
      ) : (
        <div className="space-y-8">
          {currentProject && (
            <div className="flex justify-end">
              <Button
                text="تعديل المشروع"
                href={`/projects/add-project?id=${currentProject.id}&mode=edit`}
              />
            </div>
          )}
          <CardProject project={currentProject} />
          <EstimatesProject project={currentProject} />
        </div>
      )}
    </div>
  );
}
