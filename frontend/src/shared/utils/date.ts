export function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  const datePart = value.slice(0, 10);
  const parts = datePart.split("-");
  if (parts.length !== 3) return value;
  const [year, month, day] = parts;
  return `${day}-${month}-${year}`;
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "";
  const formattedDate = formatDate(value);
  const timePart = value.slice(11, 16);
  if (!timePart || timePart.length < 5) return formattedDate;
  return `${formattedDate} ${timePart}`;
}
