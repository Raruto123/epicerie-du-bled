import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

export async function signUpWithSellerFlag({name, email, password, isSeller}) {
    const credentials = await createUserWithEmailAndPassword(auth, email, password);

    await setDoc(doc(db, "users", credentials.user.uid), {
        name,
        email,
        isSeller : !!isSeller,
        createdAt : serverTimestamp()
    });

    console.log("successfully signed up")
    return credentials.user
}

export async function signIn({email, password}) {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    console.log("successfully signed In")
    return credential.user;
}

export async function getUserRole(uid) {
    const snapchot = await getDoc(doc(db, "users", uid));
    if (!snapchot.exists()) return null;
    return snapchot.data().role;
}