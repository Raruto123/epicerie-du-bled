// utils/dateFormat.js

/**
 * Convertit un Timestamp Firestore / Date / number en texte FR (jour mois année)
 * Exemple: 12 octobre 2023
 */

export function formatDateFr(value) {
    if (!value) return '';

    let date;
  // Firestore Timestamp a une méthode toDate()
    if (typeof value?.toDate === "function") {
        date = value.toDate();
    } else if (value instanceof Date) {
        date = value;
    } else if (typeof value === "number") {
        date = new Date(value);
    } else {
            // fallback: tentative
            date = new Date(value);
    }

    if (Number.isNaN(date.getTime())) return '';

    return new Intl.DateTimeFormat("fr-CA", {
        day:"2-digit",
        month:"long",
        year:"numeric"
    }).format(date);

}