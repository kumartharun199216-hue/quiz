const formatIndianDateTime = (dateObj) => {
  if (!dateObj) return 'N/A';
  const d = new Date(dateObj);

  const day = d.toLocaleDateString('en-IN', { day: '2-digit', timeZone: 'Asia/Kolkata' });
  const month = d.toLocaleDateString('en-IN', { month: 'long', timeZone: 'Asia/Kolkata' });
  const year = d.toLocaleDateString('en-IN', { year: 'numeric', timeZone: 'Asia/Kolkata' });
  const time = d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });

  return `${day}/${month}/${year} - ${time}`;
};

module.exports = { formatIndianDateTime };
