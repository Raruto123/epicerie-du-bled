import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

// Firestore shape (users/{uid})
// {
//   name: string,
//   email: string,
//   isSeller: boolean,
//   photoURL?: string | null,
//   createdAt: Timestamp,
//   updatedAt?: Timestamp,
//
//   // Only if isSeller === true
//   seller?: {
//     storeName: string,
//     description: string,
//     logoURL: string | null,
//     coverURL: string | null,
//     addressText: string,
//     gps?: {
//       latitude: number,
//       longitude: number,
//       accuracy: number | null,
//       timestamp: number,
//     },
//     addressSource: "manual" | "gps" | "unknown",
//     updatedAt?: Timestamp,
//     createdAt?: Timestamp,
//   }
// }

// ------------Helpers-------------
function isValidEmail(email) {
  const value = String(email || "")
    .trim()
    .toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function cleanEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function normalizeName(name) {
  return String(name || "").trim();
}

function throwFieldError(fields) {
  const err = new Error("Validation error");
  err.fields = fields;
  throw err;
}

function mapFirebaseAuthError(error, context) {
  const code = error?.code || "";
  // context: "login" | "signup"
  // Messages courts, humains
  switch (code) {
    case "auth/invalid-email":
      return "Veuillez entrer une adresse e-mail valide.";
    case "auth/network-request-failed":
      return "Problème de connexion. Vérifiez Internet puis réessayez.";
    case "auth/too-many-requests":
      return "Trop de tentatives. Réessayez dans quelques minutes.";

    //signup
    case "auth/email-already-in-use":
      return "Cet e-mail est déjà utilisé. Essayez de vous connecter.";
    case "auth/weak-password":
      return "Le mot de passe est trop faible. Minimum 6 caractères.";

    //Login
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return context === "login"
        ? "E-mail ou mot de passe incorrect."
        : "Identifiants incorrects.";

    //default
    default:
      // fallback propre (au lieu du message brut firebase)
      return "Une erreur est survenue. Veuillez réessayer";
  }
}

export async function signUpWithSellerFlag({
  name,
  email,
  password,
  isSeller,
}) {
  // ✅ Validations UI (avant Firebase)
  const cleanName = normalizeName(name);
  const cleanMail = cleanEmail(email);
  const cleanPwd = String(password || "");

  if (!cleanName) throwFieldError({ name: "Veuillez entrer votre nom." });
  if (cleanName.length < 4)
    throwFieldError({ name: "Le nom doit contenir au moins 4 caractères." });

  if (!cleanMail) throwFieldError({ email: "Veuillez entrer votre e-mail." });
  if (!isValidEmail(cleanMail))
    throwFieldError({ email: "Veuillez entrer une adresse e-mail valide." });

  if (!cleanPwd)
    throwFieldError({ password: "Veuillez entrer un mot de passe." });
  if (cleanPwd.length < 6)
    throwFieldError({
      password: "Le mot de passe doit contenir au moins 6 caractères.",
    });

  try {
    const credentials = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );

    const userRef = doc(db, "users", credentials.user.uid);

    const baseUser = {
      name,
      email,
      isSeller: !!isSeller,
      photoURL: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // If seller: initialize seller profile fields (can be edited later in SellerBoard)
    const sellerProfile = !!isSeller
      ? {
          seller: {
            storeName: name, //default = user's name (you can change it)
            description: "",
            logoURL: null,
            coverURL: null,
            addressText: "",
            gps: null,
            addressSource: "unknown",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
        }
      : {};

    await setDoc(userRef, { ...baseUser, ...sellerProfile });

    //   await setDoc(doc(db, "users", credentials.user.uid), {
    //     name,
    //     email,
    //     isSeller: !!isSeller,
    //     createdAt: serverTimestamp(),
    //   });

    console.log("successfully signed up");
    return credentials.user;
  } catch (e) {
    throw new Error(mapFirebaseAuthError(e, "signup"));
  }
}

export async function signIn({ email, password }) {
  // ✅ Validations UI
  const cleanMail = cleanEmail(email);
  const cleanPwd = String(password || "");
  if (!cleanMail) throwFieldError({ email: "Veuillez entrer votre e-mail." });
  if (!isValidEmail(cleanMail))
    throwFieldError({ email: "Veuillez entrer une adresse e-mail valide." });

  if (!cleanPwd)
    throwFieldError({ password: "Veuillez entrer votre mot de passe." });

  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    console.log("successfully signed In");
    return credential.user;
  } catch (e) {
    const msg = mapFirebaseAuthError(e, "login");
    throwFieldError({ form: msg });
  }
}
