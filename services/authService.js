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

export async function signUpWithSellerFlag({
  name,
  email,
  password,
  isSeller,
}) {
  const credentials = await createUserWithEmailAndPassword(
    auth,
    email,
    password
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
}

export async function signIn({ email, password }) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  console.log("successfully signed In");
  return credential.user;
}

// export async function getUserRole(uid) {
//   const snapchot = await getDoc(doc(db, "users", uid));
//   if (!snapchot.exists()) return null;
//   return snapchot.data().isSeller === true ? "seller" : "buyer";
