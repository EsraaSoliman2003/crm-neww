import { Project } from "@/utils/dtos";
import React from "react";

type Props = {
    project: Project | null;
};

export default function CardProject({ project }: Props) {
    if (!project) return null;

    return (
        <div className="bg-white shadow-[0_10px_25px_rgba(0,0,0,0.08)] p-6 space-y-3">
            <h2 className="text-xl font-bold">{project.name}</h2>

            <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                <p>
                    <span className="font-semibold">الجهه:</span> {project.sector}
                </p>

                <p>
                    <span className="font-semibold">الموقع:</span> {project.location}
                </p>

                <p>
                    <span className="font-semibold">النوع:</span> {project.projectType}
                </p>

                <p>
                    <span className="font-semibold">التكلفه:</span>{" "}
                    {project.investmentCost.toLocaleString()}
                </p>

                <p>
                    <span className="font-semibold">تاريخ البدايه:</span>{" "}
                    {new Date(project.startDate).toLocaleDateString()}
                </p>
            </div>

            <p className="text-gray-600 text-sm mt-2">
                {project.description}
            </p>
        </div>
    );
}