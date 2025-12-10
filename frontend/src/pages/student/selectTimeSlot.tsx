import React, { useState, useEffect } from "react";
import { Menu, X, Bell, User, LogOut, Settings } from "lucide-react";
import { fetchAvailableCourses, createCourseRequest } from "../../features/student/studentApi";
import toast from "react-hot-toast";

// // FormField Component
// interface FormFieldProps {
//   label: string;
//   type: string;
//   value?: string;
//   onChange: (value: string) => void;
//   placeholder?: string;
//   required?: boolean;
//   error?: string;
//   disabled?: boolean;
//   rows?: number;
// }


// Logo Component
const Logo = () => (
  <div className="flex items-center gap-2">
    <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
      <span className="text-white font-bold text-lg">M</span>
    </div>
    <span className="text-xl font-bold text-slate-800">Mentora</span>
  </div>
);

// Button Component
interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "outline";
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  onClick,
  className = "",
  disabled = false,
}) => {
  const baseClasses = "px-4 py-2 rounded-lg font-medium transition-colors";
  const variantClasses = {
    primary: "bg-teal-500 text-white hover:bg-teal-600",
    ghost: "text-slate-700 hover:bg-slate-100",
    outline: "border border-slate-300 text-slate-700 hover:bg-slate-50",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      {children}
    </button>
  );
};

// Success Component
interface SuccessComponentProps {
  title?: string;
  message: string;
  buttonText?: string;
  onButtonClick?: () => void;
  onClose?: () => void;
}

const SuccessComponent: React.FC<SuccessComponentProps> = ({
  title = "Course success",
  message,
  buttonText = "Continue to Home",
  onButtonClick,
  onClose,
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <h2 className="text-2xl font-semibold text-cyan-600 mb-4">{title}</h2>
        <div className="bg-white border-4 border-cyan-500 rounded-lg p-12 text-center relative">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          <p className="text-gray-700 text-lg mb-6">{message}</p>

          <Button
            variant="primary"
            onClick={onButtonClick}
            className="bg-green-500 hover:bg-green-600 px-6"
          >
            {buttonText}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Header Component
const Header = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const user = {
    fullName: "John Doe",
    initials: "JD",
  };

  const NAV_ITEMS = [
    { href: "#home", label: "Home" },
    { href: "#features", label: "Features" },
    { href: "#about", label: "About" },
    { href: "#contact", label: "Contact" },
  ];

  const userNavigation = [
    { name: "Your Profile", href: "/profile", icon: User },
    { name: "Settings", href: "/settings", icon: Settings },
    { name: "Sign out", href: "/logout", icon: LogOut },
  ];

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition backdrop-blur bg-white/70 ${
        scrolled ? "shadow-md" : "shadow-none"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-6">
        <a href="/" className="flex items-center">
          <Logo />
        </a>

        <nav className="hidden lg:block">
          <ul className="flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="text-sm font-medium text-slate-700 hover:text-teal-500 transition-colors"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <button className="p-2 hover:bg-slate-100 rounded-full relative transition-colors">
            <Bell className="w-5 h-5 text-slate-600" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              3
            </span>
          </button>

          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user.initials}
              </div>
              <span className="text-sm font-medium text-slate-700">
                {user.fullName}
              </span>
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1">
                {userNavigation.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          className="inline-flex items-center justify-center rounded-xl p-2 lg:hidden hover:bg-slate-100"
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-slate-200">
          <nav className="p-3">
            <ul className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="block rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-100"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
};

// Main Booking Component
const BookTuitionSessions = () => {
  const [mentoringMode, setMentoringMode] = useState<"one-to-one" | "one-to-many">("one-to-one");
  const [subject, setSubject] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);

  const [customSlot, setCustomSlot] = useState({
    subject: "",
    mentoringMode: "",
    day: "",
    timeRange: "",
    timezone: "",
  });

  const [selectedSessions, setSelectedSessions] = useState<
    Array<{ subject: string; date: string; time: string }>
  >([]);

  // Fetch available courses when subject changes
  useEffect(() => {
    const loadCourses = async () => {
        if (!subject) return;
        try {
            const response = await fetchAvailableCourses(subject);
            if (response.success) {
                setAvailableCourses(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch courses", error);
        }
    };
    loadCourses();
  }, [subject]);

  const removeSession = (index: number) => {
    setSelectedSessions(selectedSessions.filter((_, i) => i !== index));
  };

  const handleSubmitCustomSlot = async () => {
    try {
        setLoading(true);
        const payload = {
            subject: customSlot.subject,
            mentoringMode: customSlot.mentoringMode,
            preferredDay: customSlot.day,
            timeRange: customSlot.timeRange,
            timezone: customSlot.timezone
        };
        const response = await createCourseRequest(payload);
        if (response.success) {
             setIsModalOpen(false);
             setShowSuccess(true);
             toast.success("Request submitted successfully!");
             setCustomSlot({
               subject: "",
               mentoringMode: "",
               day: "",
               timeRange: "",
               timezone: "",
             });
        }
    } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to submit request");
    } finally {
        setLoading(false);
    }
  };

  const handleCancelModal = () => {
    setIsModalOpen(false);
    setCustomSlot({
      subject: "",
      mentoringMode: "",
      day: "",
      timeRange: "",
      timezone: "",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {showSuccess ? (
        <SuccessComponent
          title="Course success"
          message="Thanks! Your request has been received."
          buttonText="Continue to Home"
          onButtonClick={() => {
            setShowSuccess(false);
            // Navigate to home or perform action
          }}
          onClose={() => setShowSuccess(false)}
        />
      ) : (
        <>
          <Header />

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            Book Tuition Sessions
          </h1>

          {/* Select Mentoring Mode */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Mentoring Mode
            </label>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => setMentoringMode("one-to-one")}
                className={`px-6 py-2 rounded-lg border transition-colors ${
                  mentoringMode === "one-to-one"
                    ? "bg-teal-500 text-white border-teal-500"
                    : "bg-white text-gray-700 border-gray-300 hover:border-teal-500"
                }`}
              >
                One-to-One
              </button>
              <button
                onClick={() => setMentoringMode("one-to-many")}
                className={`px-6 py-2 rounded-lg border transition-colors ${
                  mentoringMode === "one-to-many"
                    ? "bg-teal-500 text-white border-teal-500"
                    : "bg-white text-gray-700 border-gray-300 hover:border-teal-500"
                }`}
              >
                One-to-Many
              </button>
            </div>
          </div>

          {/* Select Subject */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Subject
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Choose a subject</option>
              <option value="mathematics">Mathematics</option>
              <option value="physics">Physics</option>
              <option value="chemistry">Chemistry</option>
              <option value="biology">Biology</option>
            </select>
          </div>

          {/* Available Time Slots */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Available Courses & Time Slots
            </label>
            <div className="space-y-3">
              {availableCourses.length === 0 ? (
                  <p className="text-gray-500">No courses available for selected criteria.</p>
              ) : (
                availableCourses.map((course: any, index: number) => (
                  <div
                    key={course._id || index}
                    className="flex justify-between items-center p-3 border border-gray-200 rounded-lg hover:border-teal-500 transition-colors"
                  >
                    <div>
                      <div className="font-medium text-gray-900">{course.subject?.name || course.subject}</div>
                      <div className="text-sm text-gray-600">
                           {course.dayOfWeek}s, {course.timeSlot}
                      </div>
                      <div className="text-xs text-gray-500">
                          Mentor: {course.mentor?.name || 'Assigned Mentor'}
                      </div>
                    </div>
                    <Button variant="outline" className="text-sm" onClick={() => {
                        // Logic to select session/course
                        setSelectedSessions([...selectedSessions, {
                            subject: course.subject?.name || course.subject,
                             date: `${course.dayOfWeek}`, 
                             time: course.timeSlot 
                        }]);
                        toast.success("Course selected!");
                    }}>
                      Select
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Add More Subject Button */}
          <div className="mb-6">
            <Button variant="outline" className="w-full md:w-auto">
              Add More Subject
            </Button>
          </div>

          {/* Selected Sessions */}
          {selectedSessions.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Selected Sessions
              </label>
              <div className="space-y-3">
                {selectedSessions.map((session, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-start p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-gray-900">
                        {session.subject}
                      </div>
                      <div className="text-sm text-gray-600">
                        {session.date}, {session.time}
                      </div>
                    </div>
                    <button
                      onClick={() => removeSession(index)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-sm text-teal-600">
                Can't find a free time slot?{" "}
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="underline hover:text-teal-700"
                >
                  Request a custom time
                </button>
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button variant="primary" className="w-full md:w-auto px-8">
              Submit & Proceed to Payment
            </Button>
          </div>
        </div>
      </main>

      {/* Custom Time Slot Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Request a Custom Time Slot
              </h2>

              {/* Subject */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={customSlot.subject}
                  onChange={(e) =>
                    setCustomSlot({ ...customSlot, subject: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Enter subject"
                />
              </div>

              {/* Mentoring Mode */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mentoring Mode
                </label>
                <input
                  type="text"
                  value={customSlot.mentoringMode}
                  onChange={(e) =>
                    setCustomSlot({ ...customSlot, mentoringMode: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="e.g., One-to-One"
                />
              </div>

              {/* Select Day */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Day
                </label>
                <input
                  type="text"
                  value={customSlot.day}
                  onChange={(e) =>
                    setCustomSlot({ ...customSlot, day: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="e.g., Monday"
                />
              </div>

              {/* Select Time Range */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Time Range
                </label>
                <input
                  type="text"
                  value={customSlot.timeRange}
                  onChange={(e) =>
                    setCustomSlot({ ...customSlot, timeRange: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="e.g., 2:00 PM - 4:00 PM"
                />
              </div>

              {/* Select Time Zone */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Time Zone (Optional)
                </label>
                <input
                  type="text"
                  value={customSlot.timezone}
                  onChange={(e) =>
                    setCustomSlot({ ...customSlot, timezone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="e.g., EST, PST"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-end">
                <Button
                  variant="ghost"
                  onClick={handleCancelModal}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmitCustomSlot}
                  disabled={loading}
                  className="px-6 bg-cyan-500 hover:bg-cyan-600"
                >
                  {loading ? 'Submitting...' : 'Submit'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default BookTuitionSessions;