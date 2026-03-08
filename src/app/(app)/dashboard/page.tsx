export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Dashboard</h1>
      <p className="text-sm text-gray-500 mb-8">
        Welcome to HelmAI. Your workspace overview will appear here.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {["Tone Profiles", "Active Agents", "Integrations"].map((label) => (
          <div
            key={label}
            className="bg-white border border-gray-200 rounded-lg p-5"
          >
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
              {label}
            </p>
            <p className="text-2xl font-semibold text-gray-300">—</p>
          </div>
        ))}
      </div>
    </div>
  );
}
