const startDate = "2026-06-14";
const endDate = "2026-06-14";
const startTime = "10:00";
const endTime = "11:00";
const start = new Date(`${startDate}T${startTime}`);
const end = new Date(`${endDate}T${endTime}`);
console.log(start, end);
console.log("end <= start:", end <= start);

const startInvalid = new Date(`2026-06-14T10:00 PM`);
console.log(startInvalid, startInvalid <= startInvalid);

