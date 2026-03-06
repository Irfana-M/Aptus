import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../constants/routes.constants";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { createExam } from "../../../features/exam/examSlice";
import { fetchMentorCourses } from "../../../features/mentor/mentorThunk";
import type { AppDispatch, RootState } from "../../../app/store";

import { MentorLayout } from "../../../components/mentor/MentorLayout";
import { QuestionType } from "../../../types/exam.types";
import type { CreateQuestionDTO } from "../../../types/exam.types";
import { Loader } from "../../../components/ui/Loader";
import toast from "react-hot-toast";

const CreateExam: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading } = useSelector((state: RootState) => state.exam);
  const { courses } = useSelector((state: RootState) => state.mentor);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subjectId: "",
    gradeId: "",
    syllabus: "", // New field
    duration: 30,
    passingMarks: 0,
    isPremium: false,
  });

  const [questions, setQuestions] = useState<CreateQuestionDTO[]>([]);

  // Extract unique syllabi from mentor's courses
  const uniqueSyllabi = courses
    ? Array.from(new Set(courses.map((c) => c.grade?.syllabus))).filter(Boolean)
    : [];

  // Filter Grades based on selected Syllabus
  const availableGrades = courses
    ? Array.from(
        new Map(
          courses
            .filter(
              (c) =>
                !formData.syllabus || c.grade?.syllabus === formData.syllabus,
            )
            .map((c) => [
              c.grade?._id,
              { _id: c.grade?._id, name: c.grade?.name },
            ]),
        ).values(),
      ).filter((g) => g._id)
    : [];

  // Filter Subjects based on selected Grade (and implicitly Syllabus)
  const availableSubjects = courses
    ? Array.from(
        new Map(
          courses
            .filter(
              (c) =>
                (!formData.syllabus ||
                  c.grade?.syllabus === formData.syllabus) &&
                (!formData.gradeId || c.grade?._id === formData.gradeId),
            )
            .map((c) => [
              c.subject?._id,
              { _id: c.subject?._id, name: c.subject?.subjectName },
            ]),
        ).values(),
      ).filter((s) => s._id)
    : [];

  useEffect(() => {
    dispatch(fetchMentorCourses());
  }, [dispatch]);

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: "",
        type: QuestionType.MCQ,
        marks: 1,
        isPremium: false,
        hint: "",
        options: [
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ],
      },
    ]);
  };

  const handleQuestionChange = <K extends keyof CreateQuestionDTO>(
    index: number,
    field: K,
    value: CreateQuestionDTO[K],
  ) => {
    setQuestions((prev) => {
      const updated = [...prev];

      updated[index] = {
        ...updated[index],
        [field]: value,
      };

      return updated;
    });
  };

  const handleOptionChange = (
    qIndex: number,
    oIndex: number,
    field: "text" | "isCorrect",
    value: string | boolean,
  ) => {
    const newQuestions = [...questions];
    if (!newQuestions[qIndex].options) return;

    if (
      field === "isCorrect" &&
      value === true &&
      newQuestions[qIndex].type === QuestionType.MCQ
    ) {
      // Uncheck other options for MCQ (assuming single correct answer for simplicity, though backend supports multiple)
      newQuestions[qIndex].options?.forEach((opt, i) => {
        opt.isCorrect = i === oIndex;
      });
    } else {
      (newQuestions[qIndex].options![oIndex] as Record<string, unknown>)[
        field
      ] = value;
    }

    setQuestions(newQuestions);
  };

  const handleAddOption = (qIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options?.push({ text: "", isCorrect: false });
    setQuestions(newQuestions);
  };

  const handleRemoveOption = (qIndex: number, oIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options?.splice(oIndex, 1);
    setQuestions(newQuestions);
  };

  const handleDeleteQuestion = (index: number) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };

  const handleSubmit = async () => {
    if (
      !formData.title ||
      !formData.subjectId ||
      !formData.gradeId ||
      !formData.syllabus
    ) {
      toast.error(
        "Please fill in required fields (Title, Subject, Grade, Syllabus)",
      );
      return;
    }
    if (questions.length === 0) {
      toast.error("Please add at least one question");
      return;
    }

    // Validate that all MCQs have a correct answer selected
    const invalidMCQ = questions.find(
      (q) =>
        q.type === QuestionType.MCQ && !q.options?.some((opt) => opt.isCorrect),
    );
    if (invalidMCQ) {
      toast.error(
        "Please select a correct answer for all Multiple Choice Questions",
      );
      return;
    }

    // Sanitize questions: Remove options for non-MCQ questions
    const sanitizedQuestions = questions.map((q) => ({
      ...q,
      options: q.type === QuestionType.MCQ ? q.options : [],
    }));

    const result = await dispatch(
      createExam({
        ...formData,
        questions: sanitizedQuestions,
      }),
    );

    if (createExam.fulfilled.match(result)) {
      toast.success("Exam created successfully!");
      navigate(ROUTES.MENTOR.EXAMS);
    } else {
      toast.error("Failed to create exam");
    }
  };

    return (
      <MentorLayout title="Create Exam">
        <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(ROUTES.MENTOR.EXAMS)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Create New Exam
            </h1>
            <p className="text-gray-500 mt-1">Design your assessment</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Exam Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exam Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                  placeholder="e.g. Mid-term Physics Assessment"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                  placeholder="Brief description of the exam content and rules..."
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <select
                  value={formData.syllabus}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      syllabus: e.target.value,
                      gradeId: "",
                      subjectId: "",
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                >
                  <option value="">Select Syllabus</option>
                  {uniqueSyllabi.map((opt) => (
                    <option key={opt as string} value={opt as string}>
                      {opt as string}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grade
                </label>
                <select
                  value={formData.gradeId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      gradeId: e.target.value,
                      subjectId: "",
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                  disabled={!formData.syllabus}
                >
                  <option value="">Select Grade</option>
                  {availableGrades.map((grade) => (
                    <option key={grade._id} value={grade._id}>
                      {grade.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <select
                  value={formData.subjectId}
                  onChange={(e) =>
                    setFormData({ ...formData, subjectId: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                  disabled={!formData.gradeId}
                >
                  <option value="">Select Subject</option>
                  {availableSubjects.map((subject) => (
                    <option key={subject._id} value={subject._id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Passing Marks
                </label>
                <input
                  type="number"
                  value={formData.passingMarks}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      passingMarks: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                />
              </div>
              <div className="flex items-center mt-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPremium}
                    onChange={(e) =>
                      setFormData({ ...formData, isPremium: e.target.checked })
                    }
                    className="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700 font-medium">
                    Premium Only
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Questions</h2>
              <button
                onClick={handleAddQuestion}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                <Plus size={16} />
                Add Question
              </button>
            </div>

            {questions.map((q, qIndex) => (
              <div
                key={qIndex}
                className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative group"
              >
                <button
                  onClick={() => handleDeleteQuestion(qIndex)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={18} />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
                  <div className="md:col-span-1 flex items-center justify-center">
                    <span className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
                      {qIndex + 1}
                    </span>
                  </div>
                  <div className="md:col-span-8">
                    <input
                      type="text"
                      value={q.text}
                      onChange={(e) =>
                        handleQuestionChange(qIndex, "text", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none font-medium"
                      placeholder="Enter question text..."
                    />
                  </div>
                  <div className="md:col-span-3 flex gap-2">
                    <select
                      value={q.type}
                      onChange={(e) =>
                        handleQuestionChange(qIndex, "type", e.target.value as QuestionType)
                      }
                      className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50"
                    >
                      <option value={QuestionType.MCQ}>Multiple Choice</option>
                      <option value={QuestionType.SUBJECTIVE}>
                        Subjective
                      </option>
                    </select>
                    <input
                      type="number"
                      value={q.marks}
                      onChange={(e) =>
                        handleQuestionChange(
                          qIndex,
                          "marks",
                          parseInt(e.target.value) || 0,
                        )
                      }
                      className="w-20 px-2 py-2 border border-gray-200 rounded-lg text-sm text-center"
                      placeholder="Marks"
                    />
                  </div>
                  <div className="md:col-start-2 md:col-span-11 flex items-center gap-4 mt-2">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={q.isPremium ?? false}
                        onChange={(e) =>
                          handleQuestionChange(
                            qIndex,
                            "isPremium",
                            e.target.checked,
                          )
                        }
                        className="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500 border-gray-300"
                      />
                      <span className="ml-2 text-xs text-gray-600">
                        Premium Question
                      </span>
                    </label>
                    <input
                      type="text"
                      value={q.hint || ""}
                      onChange={(e) =>
                        handleQuestionChange(qIndex, "hint", e.target.value)
                      }
                      className="flex-1 px-3 py-1 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-cyan-500 outline-none"
                      placeholder="Add a premium hint/tip for this question (optional)"
                    />
                  </div>
                </div>

                {q.type === QuestionType.MCQ && (
                  <div className="pl-12 space-y-2">
                    {q.options?.map((opt, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-3">
                        <input
                          type="radio"
                          name={`q-${qIndex}-correct`}
                          checked={opt.isCorrect}
                          onChange={(e) =>
                            handleOptionChange(
                              qIndex,
                              oIndex,
                              "isCorrect",
                              e.target.checked,
                            )
                          }
                          className="w-4 h-4 text-cyan-600 focus:ring-cyan-500"
                        />
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) =>
                            handleOptionChange(
                              qIndex,
                              oIndex,
                              "text",
                              e.target.value,
                            )
                          }
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-cyan-500 outline-none"
                          placeholder={`Option ${oIndex + 1}`}
                        />
                        <button
                          onClick={() => handleRemoveOption(qIndex, oIndex)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => handleAddOption(qIndex)}
                      className="text-sm text-cyan-600 font-medium hover:text-cyan-700 mt-2 flex items-center gap-1"
                    >
                      <Plus size={14} /> Add Option
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-6 pb-12">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`flex items-center gap-2 px-8 py-3 bg-cyan-600 text-white rounded-lg font-medium transition-colors ${loading ? "opacity-70 cursor-not-allowed" : "hover:bg-cyan-700"}`}
            >
              {loading ? (
                <Loader color="border-white" size="sm" />
              ) : (
                <Save size={20} />
              )}
              <span>Save Exam</span>
            </button>
          </div>
        </div>
      </div>
    </MentorLayout>
  );
};

export default CreateExam;

