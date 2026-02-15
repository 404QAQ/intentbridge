import { Requirement } from '../services/api';

export function useExport() {
  const exportToCSV = (requirements: Requirement[], filename: string = 'requirements.csv') => {
    const headers = [
      'ID',
      'Title',
      'Description',
      'Status',
      'Priority',
      'Created',
      'Tags',
      'Files',
      'Acceptance Criteria',
      'Dependencies',
    ];

    const rows = requirements.map((req) => [
      req.id,
      req.title,
      `"${req.description.replace(/"/g, '""')}"`,
      req.status,
      req.priority,
      req.created,
      req.tags?.join('; ') || '',
      req.files?.join('; ') || '',
      req.acceptance?.map((a) => `${a.criterion} (${a.done ? 'Done' : 'Pending'})`).join('; ') || '',
      req.depends_on?.join('; ') || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = (requirements: Requirement[], filename: string = 'requirements.json') => {
    const jsonContent = JSON.stringify(requirements, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToMarkdown = (requirements: Requirement[], filename: string = 'requirements.md') => {
    const markdown = requirements
      .map((req) => {
        const acceptance =
          req.acceptance
            ?.map((a) => `- [${a.done ? 'x' : ' '}] ${a.criterion}`)
            .join('\n') || 'None';

        const files = req.files?.map((f) => `- ${f}`).join('\n') || 'None';

        const deps = req.depends_on?.map((d) => `- ${d}`).join('\n') || 'None';

        return `## ${req.id}: ${req.title}

**Status**: ${req.status}
**Priority**: ${req.priority}
**Created**: ${req.created}
**Tags**: ${req.tags?.join(', ') || 'None'}

### Description
${req.description}

### Acceptance Criteria
${acceptance}

### Files
${files}

### Dependencies
${deps}

---`;
      })
      .join('\n\n');

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return { exportToCSV, exportToJSON, exportToMarkdown };
}
