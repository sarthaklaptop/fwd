export default function UnsubscribeInvalid() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
        <div className="text-yellow-500 text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Invalid link
        </h1>
        <p className="text-gray-600">
          This unsubscribe link is invalid or has been tampered with.
        </p>
        <p className="text-gray-400 text-sm mt-4">
          Please use the unsubscribe link from your email.
        </p>
      </div>
    </div>
  );
}
