const formatTimeNumber = (number) => {
  if (number < 10) return '0' + number;
  return '' + number;
};

export const dateTimeFormat = (date, type = 'dd/mm/yyyy') => {
  date = getDate(date);
  const days = formatTimeNumber(date.getDate());
  const months = formatTimeNumber(date.getMonth() + 1);
  const years = date.getFullYear();
  const seconds = formatTimeNumber(date.getSeconds());
  const minutes = formatTimeNumber(date.getMinutes());
  const hours = formatTimeNumber(date.getHours());
  const mapTime = {
    dd: days,
    mm: months,
    yyyy: years,
    ss: seconds,
    ms: minutes,
    hs: hours,
  };
  return type.replace(/dd|mm|yyyy|ss|ms|hs/gi, function (matched) {
    matched = typeof matched === 'string' ? matched.toLocaleLowerCase() : matched;
    return mapTime[matched] || '';
  });
};
