/**
 * Step 0 — Personal Information
 */
export default function PersonalInfoStep({ data, onChange }) {
  const fields = [
    { key: 'name', label: 'Full Name', placeholder: 'Jane Doe', required: true },
    { key: 'email', label: 'Email', placeholder: 'jane@example.com', type: 'email', required: true },
    { key: 'phone', label: 'Phone', placeholder: '+1-555-0100' },
    { key: 'location', label: 'Location', placeholder: 'San Francisco, CA' },
    { key: 'linkedin', label: 'LinkedIn URL', placeholder: 'https://linkedin.com/in/janedoe' },
    { key: 'github', label: 'GitHub URL', placeholder: 'https://github.com/janedoe' },
  ]

  const handleChange = (key, value) => {
    onChange({ ...data, [key]: value })
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Personal Information</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">Tell us about yourself.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {f.label} {f.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type={f.type || 'text'}
              placeholder={f.placeholder}
              value={data[f.key] || ''}
              onChange={(e) => handleChange(f.key, e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm text-sm transition-colors"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
