/**
 * Step 6 — Target Role + Job Description
 */
export default function TargetRoleStep({ targetRole, jobDescription, onChangeRole, onChangeJD }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Target Role</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Optionally provide a target job title and paste the job description for best results.
      </p>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Target Job Role
        </label>
        <input
          placeholder="e.g. Senior Backend Engineer"
          value={targetRole}
          onChange={(e) => onChangeRole(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Job Description <span className="text-gray-400">(optional)</span>
        </label>
        <textarea
          placeholder="Paste the full job description here..."
          value={jobDescription}
          onChange={(e) => onChangeJD(e.target.value)}
          rows={8}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm text-sm resize-none"
        />
      </div>
    </div>
  )
}
