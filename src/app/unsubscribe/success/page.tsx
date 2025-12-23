export default function UnsubscribeSuccess() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
        <div className="text-green-500 text-6xl mb-4">✓</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          You&apos;ve been unsubscribed
        </h1>
        <p className="text-gray-600">
          You will no longer receive emails from this sender.
        </p>
        <p className="text-gray-400 text-sm mt-4">
          You can close this page.
        </p>
      </div>
    </div>
  );
}
