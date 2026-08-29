const statusColors = {
  'Not Started': 'badge-gray',
  Pending:       'badge-yellow',
  'In Progress': 'badge-cyan',
  Completed:     'badge-green',
};

const priorityColors = {
  High:   'badge-red',
  Medium: 'badge-orange',
  Low:    'badge-green',
};

export const StatusBadge = ({ status }) => (
  <span className={`badge ${statusColors[status] || 'badge-gray'}`}>{status}</span>
);

export const PriorityBadge = ({ priority }) => (
  <span className={`badge ${priorityColors[priority] || 'badge-gray'}`}>{priority}</span>
);
