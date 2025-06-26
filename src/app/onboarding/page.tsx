import { PreferenceQuiz } from '@/components/onboarding/preference-quiz';

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to Wonder!
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Let's personalize your experience by understanding what you love to do.
          </p>
        </div>

        <PreferenceQuiz />
      </div>
    </div>
  );
}
