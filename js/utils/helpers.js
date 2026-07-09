// Utility helper functions for StudySync

export function formatDate(dateString) {
  if (!dateString) return '';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

export function formatTime(secondsTotal) {
  const mins = Math.floor(secondsTotal / 60);
  const secs = secondsTotal % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function truncateString(str, num) {
  if (str.length <= num) return str;
  return str.slice(0, num) + '...';
}
