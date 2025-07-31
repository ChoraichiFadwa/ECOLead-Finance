import { useNavigate } from 'react-router-dom';
import { ArrowLeft, GraduationCap, Users } from 'lucide-react';
import { useRole } from '../context/RoleContext';  // Import the context

export default function Login() {
  const navigate = useNavigate();
  const { setRole } = useRole();  // Get setRole from context

  const handleRoleSelect = (role) => {
    setRole(role);  // Store the selected role in context
    if (role === 'student') {
      navigate('/dashboard/student');
    } else if (role === 'teacher') {
      navigate('/dashboard/teacher');
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-4xl mx-auto w-full">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors duration-200"
          aria-label="Go back to home page"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Choose your role</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Select how you'd like to use LearnQuest to get started with your personalized experience.
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Student Card */}
          <button
            onClick={() => handleRoleSelect('student')}
            className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border-2 border-transparent hover:border-blue-200 text-left"
            aria-label="Select student role"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-blue-100 group-hover:bg-blue-200 rounded-full flex items-center justify-center mb-6 transition-colors duration-200">
                <GraduationCap className="w-10 h-10 text-blue-600" />
              </div>
              <div className="text-4xl mb-4">🧑‍🎓</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">I'm a student</h2>
              <p className="text-gray-600 leading-relaxed">
                Access interactive lessons, track your progress, earn achievements, and learn at your own pace with
                gamified content.
              </p>
              <div className="mt-6 inline-flex items-center text-blue-600 font-semibold group-hover:translate-x-2 transition-transform duration-200">
                Start Learning
                <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
              </div>
            </div>
          </button>

          {/* Teacher Card */}
          <button
            onClick={() => handleRoleSelect('teacher')}
            className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border-2 border-transparent hover:border-blue-200 text-left"
            aria-label="Select teacher role"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-blue-100 group-hover:bg-blue-200 rounded-full flex items-center justify-center mb-6 transition-colors duration-200">
                <Users className="w-10 h-10 text-blue-600" />
              </div>
              <div className="text-4xl mb-4">👩‍🏫</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">I'm a teacher</h2>
              <p className="text-gray-600 leading-relaxed">
                Create engaging courses, manage student progress, assign interactive content, and analyze learning
                outcomes with powerful tools.
              </p>
              <div className="mt-6 inline-flex items-center text-blue-600 font-semibold group-hover:translate-x-2 transition-transform duration-200">
                Start Teaching
                <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

