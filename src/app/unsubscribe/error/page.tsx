export default function UnsubscribeError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
        <div className="text-red-500 text-6xl mb-4">✕</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Something went wrong
        </h1>
        <p className="text-gray-600">
          We couldn&apos;t process your unsubscribe request. Please try again later.
        </p>
        <p className="text-gray-400 text-sm mt-4">
          If this problem persists, contact support.
        </p>
      </div>
    </div>
  );
}
