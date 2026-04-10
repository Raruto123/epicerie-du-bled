// utils/dateFormat.js

/**
 * Convertit un Timestamp Firestore / Date / number en texte FR (jour mois année)
 * Exemple: 12 octobre 2023
 */

export function formatDateByLocale(dateValue, locale = "fr-CA") {
  if (!dateValue) return "-";

  let date;

  if (dateValue?.toDate) {
    date = dateValue.toDate();
  } else {
    date = new Date(dateValue);
  }

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);

}