import {
  collection,
  deleteDoc,
  doc,
  documentId,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
} from "firebase/firestore";
import { db, storage } from "../lib/firebase";
import { deleteObject, ref as storageRef } from "firebase/storage";

export async function updateProductStock({ productId, inStock }) {
  if (!productId) throw new Error("Missing productId");
  const productRef = doc(db, "products", productId);
  await updateDoc(productRef, {
    inStock: !!inStock,
    updatedAt: serverTimestamp(),
  });
}
/**
 * Extract "products/<uid>/<file>.jpg" from Firebase download URL:
 * https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<ENCODED_PATH>?alt=media&token=...
 */

function getStoragePathFromDownloadURL(url) {
  if (!url) return null;

  const match = String(url).match(/\/o\/([^?]+)/); //grab encoded path
  if (!match?.[1]) return null;

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

/**
 * Delete product doc + its image if photoURL exists.
 * photoURL is a Firebase Storage download URL.
 */
export async function deleteProductWithImage({ productId, photoURL }) {
  if (!productId) throw new Error("Missing productId");

  // 1) Try delete storage file (best-effort)
  const path = getStoragePathFromDownloadURL(photoURL);
  if (path) {
    try {
      const imgRef = storageRef(storage, path); //storage path
      await deleteObject(imgRef);
    } catch (e) {
      // If image already deleted or url invalid, we still delete the doc
      console.log("⚠️ delete image failed (continuing) :", e?.message ?? e);
    }
  } else if (photoURL) {
    console.log("⚠️PhotoURL not parseable, skipping image delete");
  }
  //2) Delete Firestore doc
  const productRef = doc(db, "products", productId);
  await deleteDoc(productRef);
}

function chunkArray(arr, size = 10) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
//Haversine distance in KM
function distanceKmBetween(a, b) {
  if (!a || !b) return null;
  const lat1 = Number(a.latitude);
  const lon1 = Number(a.longitude);
  const lat2 = Number(b.latitude);
  const lon2 = Number(b.longitude);
  if (![lat1, lon1, lat2, lon2].every((x) => Number.isFinite(x))) return null;

  const R = 6371; //km
  const toRad = (x) => (x * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLon / 2);

  const aa = s1 * s1 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * s2 * s2;

  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
  return Number((R * c).toFixed(2));
}

/**
 * Fetch seller user docs for a list of sellerIds
 * Uses where(documentId(), "in", ids) with chunking (10 max per query)
 */
async function fetchSellersByIds(sellerIds = []) {
  const ids = Array.from(new Set(sellerIds.filter(Boolean)));
  if (!ids.length) return new Map();

  const usersCol = collection(db, "users");
  const chunks = chunkArray(ids, 10);

  const results = new Map();
  for (const group of chunks) {
    const q = query(usersCol, where(documentId(), "in", group));
    const snap = await getDocs(q);

    snap.docs.forEach((d) => {
      results.set(d.id, d.data() || {});
    });
  }

  return results;
}

/**
 * Fetch products for Home (public feed)
 * - paginated with cursor
 * - optional category filter (cat)
 * - optional inStockOnly filter
 *
 * Returns:
 *  { items: [], cursor: DocumentSnapshot|null, hasMore: boolean }
 */
export async function fetchProductsPage({
  pageSize = 10,
  cursor = null,
  cat = "Tout",
  inStockOnly = false,
  userLocation = null,
} = {}) {
  try {
    const colRef = collection(db, "products");
    const constraints = [];

    // Optional filters
    if (cat && cat !== "Tout") constraints.push(where("cat", "==", cat));
    if (inStockOnly) constraints.push(where("inStock", "==", true));

    constraints.push(orderBy("createdAt", "desc"));
    constraints.push(limit(pageSize));

    let q = query(colRef, ...constraints);
    if (cursor) {
      // When paginating, startAfter must come AFTER orderBy
      q = query(colRef, ...constraints, startAfter(cursor));
    }

    const snap = await getDocs(q);
    //1) base products
    const baseProducts = snap.docs.map((d) => {
      const data = d.data() || {};
      return {
        id: d.id,
        name: data.name ?? "",
        price: Number(data.price ?? 0),
        inStock: !!data.inStock,
        cat: data.cat ?? "Autres",
        photoURL: data.photoURL ?? null,
        desc: data.desc ?? null,
        sellerId: data.sellerId ?? null,
        createdAt: data.createdAt ?? null,
      };
    });
    // 2) fetch sellers from users collection
    const sellerIds = baseProducts.map((p) => p.sellerId).filter(Boolean);
    const sellersMap = await fetchSellersByIds(sellerIds);
    // 3) enrich products with seller info + distance
    const items = baseProducts.map((p) => {
      const u = sellersMap.get(p.sellerId) || null;
      const seller = u?.seller || null;

      const sellerName = seller?.storeName ?? null;
      const sellerAddress =
        seller?.addressText ?? u?.lastAddress?.formatted ?? null;
      const sellerLogoURL = seller?.logoURL ?? null;
      const sellerGps = seller?.gps ?? null;
      const sellerDescription = seller?.description ?? null;

      const distanceKm =
        userLocation && sellerGps
          ? distanceKmBetween(userLocation, sellerGps)
          : null;

      return {
        ...p,
        sellerName,
        sellerAddress,
        sellerLogoURL,
        sellerGps,
        distanceKm,
        sellerDescription,
      };
    });

    const nextCursor = snap.docs.length
      ? snap.docs[snap.docs.length - 1]
      : null;
    const hasMore = snap.docs.length === pageSize;

    return { items, cursor: nextCursor, hasMore };
  } catch (e) {
    console.log("❌ fetchProductsPage failed :", e?.message ?? e);
    throw e;
  }
}

//1) fetch product by id (for productDetailsScreen)
export async function fetchProductById({ productId, userLocation = null }) {
  if (!productId) throw new Error("Missing productId");
  const ref = doc(db, "products", productId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const d = snap.data() || {};
  const base = {
    id: snap.id,
    name: d.name ?? "",
    price: Number(d.price ?? 0),
    inStock: !!d.inStock,
    cat: d.cat ?? "Autres",
    photoURL: d.photoURL ?? null,
    desc: d.desc ?? null,
    sellerId: d.sellerId ?? null,
    createdAt: d.createdAt ?? null,
  };

  const sellersMap = await fetchSellersByIds([base.sellerId].filter(Boolean));
  const u = sellersMap.get(base.sellerId) || null;
//   console.log("SELLER RAW USER DOC", base.sellerId, u);
// console.log("SELLER DISTANCEKM", u?.seller?.description);
  const seller = u?.seller || null;

  const sellerName = seller?.storeName ?? null;
  const sellerAddress =
    seller?.addressText ?? u?.lastAddress?.formatted ?? null;
  const sellerLogoURL = seller?.logoURL ?? null;
  const sellerGps = seller?.gps ?? null;
  const sellerDescription = seller?.description ?? null;

  const distanceKm =
    userLocation && sellerGps
      ? distanceKmBetween(userLocation, sellerGps)
      : null;

  return {
    ...base,
    sellerName,
    sellerAddress,
    sellerLogoURL,
    sellerGps,
    distanceKm,
    sellerDescription,
  };
}

//2) similar products by cat
export async function fetchSimilarProducts({
  cat,
  excludeProductId = null,
  pageSize = 6,
  userLocation = null,
} = {}) {
  if (!cat) return [];

  const colRef = collection(db, "products");

  // ⚠️ Firestore: where(cat==) + orderBy(createdAt) => index
  const q = query(
    colRef,
    where("cat", "==", cat),
    orderBy("createdAt", "desc"),
    limit(pageSize + 3),
  );

  const snap = await getDocs(q);

  const base = snap.docs.map((d) => {
    const data = d.data() || {};
    return {
      id: d.id,
      name: data.name ?? "",
      price: Number(data.price ?? 0),
      inStock: !!data.inStock,
      cat: data.cat ?? "Autres",
      photoURL: data.photoURL ?? null,
      desc: data.desc ?? null,
      sellerId: data.sellerId ?? null,
      createdAt: data.createdAt ?? null,
    };
  });

  const filtered = excludeProductId
    ? base.filter((p) => p.id !== excludeProductId)
    : base;

  const sellerIds = filtered.map((p) => p.sellerId).filter(Boolean);
  const sellersMap = await fetchSellersByIds(sellerIds);

  const enriched = filtered.map((p) => {
    const u = sellersMap.get(p.sellerId) || null;
    const seller = u?.seller || null;

    const sellerName = seller?.storeName ?? null;
    const sellerAddress =
      seller?.addressText ?? u?.lastAddress?.formatted ?? null;
    const sellerLogoURL = seller?.logoURL ?? null;
    const sellerGps = seller?.gps ?? null;
    const sellerDescription = seller?.description ?? null;

    const distanceKm =
      userLocation && sellerGps
        ? distanceKmBetween(userLocation, sellerGps)
        : null;

    return {
      ...p,
      sellerName,
      sellerAddress,
      sellerLogoURL,
      sellerGps,
      distanceKm,
      sellerDescription,
    };
  });

  return enriched.slice(0, pageSize);
}

//3)product by the same grocery store
export async function fetchProductsBySellerId({
  sellerId,
  pageSize = 200,
  userLocation = null,
} = {}) {
  if (!sellerId) return [];

  const colRef = collection(db, "products");

  const q = query(
    colRef,
    where("sellerId", "==", sellerId),
    orderBy("createdAt", "desc"),
    limit(pageSize),
  );

  console.log("🔎 products query sellerId=", sellerId);

  const snap = await getDocs(q);

  const base = snap.docs.map((d) => {
    const data = d.data() || {};
    return {
      id: d.id,
      name: data.name ?? "",
      price: Number(data.price ?? 0),
      inStock: !!data.inStock,
      cat: data.cat ?? "Autres",
      photoURL: data.photoURL ?? null,
      desc: data.desc ?? null,
      sellerId: data.sellerId ?? null,
      createdAt: data.createdAt ?? null,
    };
  });

  //seller info + distance (same logic)
  const sellersMap = await fetchSellersByIds([sellerId]);
  const u = sellersMap.get(sellerId) || null;
  const seller = u?.seller || null;

  const sellerName = seller?.storeName ?? null;
  const sellerAddress =
    seller?.addressText ?? u?.lastAddress?.formatted ?? null;
  const sellerLogoURL = seller?.logoURL ?? null;
  const sellerGps = seller?.gps ?? null;
  const sellerDescription = seller?.description ?? null;

  const distanceKm =
    userLocation && sellerGps
      ? distanceKmBetween(userLocation, sellerGps)
      : null;

  return base.map((p) => ({
    ...p,
    sellerName,
    sellerAddress,
    sellerLogoURL,
    sellerGps,
    distanceKm,
    sellerDescription,
  }));
}
