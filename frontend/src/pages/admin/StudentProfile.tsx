import React from "react";
import { useParams, useSearchParams } from "react-router-dom";

export const StudentProfilePage: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "profile";

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Student Profile: {studentId}
      </h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p>Active Tab: {activeTab}</p>
        <p>Student ID: {studentId}</p>
      </div>
    </div>
  );
};

export default StudentProfilePage;