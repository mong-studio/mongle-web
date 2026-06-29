const MIN_SIGNUP_AGE = 14;

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getLatestEligibleBirthDate(today = new Date()) {
  return new Date(today.getFullYear() - MIN_SIGNUP_AGE, today.getMonth(), today.getDate());
}

export function getLatestEligibleBirthDateInputValue(today = new Date()) {
  return toDateInputValue(getLatestEligibleBirthDate(today));
}

export function isAtLeastSignupAge(birth: string, today = new Date()) {
  const birthDate = new Date(birth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= MIN_SIGNUP_AGE;
}
