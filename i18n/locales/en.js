export default {
  //PROFILE SCREEN
  profile: {
    loading: "Loading profile...",
    title: "My Profile",
    removePhoto: "Remove photo",
    removePhotoTitle: "Remove photo?",
    removePhotoMessage: "This action will remove your current profile photo.",
    cancel: "Cancel",
    delete: "Delete",

    sellerSpaceKicker: "SELLER SPACE",
    sellerSpaceTitle: "Manage your store",
    sellerSpaceDesc:
      "Open your online grocery store and reach thousands of customers",
    access: "Access",

    personalInfo: "Personal Information",
    displayName: "DISPLAY NAME",
    yourName: "Your name",
    save: "Save",

    preferences: "Preferences",
    language: "Language",
    interfaceLanguage: "Interface language",

    logout: "Log out",
    version: "Version 0.0.1 ⚫️ Mifere",
  },

  // -----------
  // HOME SCREEN
  // ----------
  home: {
    endOfProducts: "End of products",
    noLocation: "No location",
    searchPlaceholder: "Attiéké, yam, spices...",
    productsCount: "Products ({{count}})",
    categories: {
      all: "All",
    },
  },

  common: {
    inStock: "In stock",
    outOfStock: "Out of stock",
    locale: "en-CA",
    cancel: "Cancel",
    delete: "Delete",
    save: "Save",
  },

  categories: {
    epices: "Spices",
    cereales: "Cereals",
    tubercules: "Tubers",
    legumes: "Vegetables",
    fruits: "Fruits",
    poissons: "Fish",
    viandes: "Meat",
    volailles: "Poultry",
    surgeles: "Frozen",
    huiles: "Oils",
    farines: "Flours",
    legumineuses: "Legumes",
    sauces: "Sauces",
    pates: "Pasta",
    conserves: "Canned goods",
    boissons: "Drinks",
    snacks: "Snacks",
    produits_laitiers: "Dairy products",
    boulangerie: "Bakery",
    autres: "Others",
  },
  filters: {
    title: "Sort by",
    active: "Active filters",
    price: "Price",
    priceLow: "Lowest price",
    priceHigh: "Highest price",
    distance: "Distance",
    nearest: "Nearest",
    farthest: "Farthest",
    apply: "Apply filters",
  },
  locationGate: {
    askTitle: "Discover nearby grocery stores",
    askBody:
      "To calculate distances and show nearby grocery stores, we need your location.",
    enabledTitle: "Location enabled",
    enabledBody: "Location is already enabled. You can refresh your position.",
    deniedTitle: "Location denied",
    deniedBody:
      "Location is disabled. Open settings to allow it (Location > Allow).",
    currentLocation: "Current: {{location}}",

    allow: "Allow location",
    continueWithout: "Continue without location",
    continue: "Continue",
    refresh: "Refresh my location",
    retryAllow: "Try allowing again",
    changeLater: "You can change this choice later.",
  },
  // --------
  // GROCERY LIST SCREEN
  // --------
  groceries: {
    title: "Grocery stores",
    searchPlaceholder: "Search for a grocery store...",
    addressNotProvided: "Address not provided",
    distanceUnknown: "Distance unknown",
    emptyTitle: "No grocery stores found",
    emptySubtitle: "Try another keyword",
    filters: {
      title: "Sort by",
      active: "Active filters",
      distance: "Distance",
      nearest: "Nearest",
      farthest: "Farthest",
      apply: "Apply filters",
    },
  },

  // --------
  // FAVORITES SCREEN
  // --------
  favorites: {
    title: "My Favorites",
    searchPlaceholder: "Search in my favorites...",
    count: "Favorites ({{count}})",
    unknownDistance: "Distance unknown",
    emptyTitle: "No favorites",
    emptySub: "Add products to favorites to find them here",
  },

  // --------
  // PRODUCTS DETAILS SCREEN
  // --------

  productDetails: {
    noLocationToast:
      "This grocery store did not provide any location. Unable to open the map.",
    openAppError: "Unable to open the app.",
    defaultProduct: "Product",
    defaultStore: "Store",
    storeSection: "Store",
    unknownDistance: "Unknown distance",
    distanceFromYou: "{{distance}} km away from you",
    addressNotProvided: "Address not provided",
    itinerary: "Directions",
    compare: "Compare",
    description: "Description",
    similarProducts: "Similar products",
  },

  // --------
  // GROCERY STORE SCREEN
  // --------

  groceryStore: {
    defaultStore: "Grocery store",
    noDescription: "No description available",
    noLocationToast:
      "The grocery store did not provide any location. Unable to open the map.",
    openMapsError: "Unable to open the maps app.",
    articlesCount: "{{count}} items",
    emptyTitle: "No products",
    emptySub: "Try another search",
  },
  groceryStoreHeader: {
    location: "Location",
    addressNotProvided: "Address not provided",
    unknownDistance: "Unknown distance",
    distanceFromPosition: "{{distance}} km from your location",
    searchPlaceholder: "Search for a product in this grocery store...",
  },

  // --------
  // COMPARE SCREEN
  // --------
  compare: {
    title: "Product Comparison",
    analysis: "Comparative Analysis",
    itinerary: "Directions",
    defaultStore: "Grocery store",
    addressNotProvided: "Address not provided",
    unknownDistance: "Unknown distance",
    distanceValue: "{{distance}} km",
    priceValue: "{{price}} $",
    noLocationToast:
      "The seller has not provided any location. Unable to open the map.",
    openMapsError: "Unable to open the maps app.",
    labels: {
      name: "NAME",
      category: "CATEGORY",
      price: "PRICE",
      stock: "STOCK",
      distance: "DISTANCE",
      store: "STORE",
    },
    missingProducts: "Unable to display the comparison right now.",
  },
  compareBubble: {
    dragToDelete: "Drag here to delete",
  },

  // --------
  // SELLER OVERVIEW SCREEN
  // --------
  sellerOverview: {
    loading: "Loading seller profile...",
    editProfile: "Edit Profile",
    yourStore: "Your store",

    businessIdentity: "Business identity",
    businessName: "Business name",
    businessNamePlaceholder: "Enter your business name",
    storeDescription: "Store description",
    storeDescriptionPlaceholder: "Tell us about your African specialties",

    location: "Location",
    civicAddress: "Street address",
    civicAddressPlaceholder: "Number, Street, City. Ex: 4605 Walkley Avenue",
    updateWithGps: "Update with GPS",
    useCurrentPosition: "Use your current location",

    removeLogo: "Remove logo",
    removeAddress: "Remove address",
    removeGps: "Remove GPS position",
    removing: "Removing...",

    noGpsSaved: "No GPS location saved",

    rulesTitle: "Rules and guidelines",
    rulesSub: "Read best practices to maximize your visibility to customers",

    removeLogoTitle: "Remove logo?",
    removeLogoMessage: "This action will remove your store's current logo.",

    removeAddressTitle: "Remove address?",
    removeAddressMessage:
      "This action will remove your grocery store's current street address.",

    removeGpsTitle: "Remove GPS location?",
    removeGpsMessage:
      "This action will remove your grocery store's current GPS location.",

    lastUpdatedValue: "Last updated: {{date}}",
    lastUpdatedEmpty: "Last updated: -",
  },

  sellerRules: {
    title: "Rules and guidelines",
    subtitle: "Read this before editing your grocery store",
    sections: {
      privateSeller: {
        title: "INDIVIDUAL SELLER",
        items: [
          "If you do not have a physical grocery store but sell your ingredients online, this section concerns you.",
          "Please do not provide your address or GPS location, as this could be used to locate you.",
          "To let customers contact you, you may include your preferred contact method in the description: phone number, social media, and so on.",
        ],
      },
      address: {
        title: "Street address",
        items: [
          "Add a precise address to help customers identify your grocery store.",
          "Check the spelling of the street number, street name, and city.",
          "You may remove the street address if you do not want to display it.",
        ],
      },
      gps: {
        title: "GPS location",
        items: [
          "The GPS location allows customers to open directions directly in their maps app.",
          "Place the marker accurately to avoid misleading customers.",
          "You may remove the GPS location if it is incorrect or outdated.",
        ],
      },
      visibility: {
        title: "Customer visibility",
        items: [
          "Changes made to your store may become visible to customers immediately.",
          "Make sure the displayed information matches your actual point of sale.",
        ],
      },
    },
  },

  languages: {
    fr: "French",
    en: "English",
  },
};
