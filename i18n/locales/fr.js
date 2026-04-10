export default {
  //PROFILE SCREEN
  profile: {
    loading: "Chargement du profil...",
    title: "Mon Profil",
    removePhoto: "Supprimer la photo",
    removePhotoTitle: "Supprimer la photo ?",
    removePhotoMessage:
      "Cette action supprimera votre photo de profil actuelle.",
    cancel: "Annuler",
    delete: "Supprimer",

    sellerSpaceKicker: "ESPACE VENDEUR",
    sellerSpaceTitle: "Gérez votre boutique",
    sellerSpaceDesc:
      "Ouvrez votre épicerie en ligne et toucher des milliers de clients",
    access: "Accéder",

    personalInfo: "Informations Personnelles",
    displayName: "NOM D'AFFICHAGE",
    yourName: "Votre nom",
    save: "Enregistrer",

    preferences: "Préférences",
    language: "Langue",
    interfaceLanguage: "Langue de l'interface",

    logout: "Se déconnecter",
    version: "Version 0.0.1 ⚫️ Mifere",
  },
  //-------------
  //HOME SCREEN
  //-------------
  home: {
    endOfProducts: "Fin des produits",
    noLocation: "Aucune localisation",
    searchPlaceholder: "Attiéké, igname, épices...",
    productsCount: "Produits ({{count}})",
    categories: {
      all: "Tout",
    },
  },

  common: {
    inStock: "En stock",
    outOfStock: "Rupture",
    locale: "fr-CA",
    cancel: "Annuler",
    delete: "Supprimer",
    save: "Enregistrer",
  },

  categories: {
    epices: "Épices",
    cereales: "Céréales",
    tubercules: "Tubercules",
    legumes: "Légumes",
    fruits: "Fruits",
    poissons: "Poissons",
    viandes: "Viandes",
    volailles: "Volailles",
    surgeles: "Surgelés",
    huiles: "Huiles",
    farines: "Farines",
    legumineuses: "Légumineuses",
    sauces: "Sauces",
    pates: "Pâtes",
    conserves: "Conserves",
    boissons: "Boissons",
    snacks: "Snacks",
    produits_laitiers: "Produits laitiers",
    boulangerie: "Boulangerie",
    autres: "Autres",
  },
  filters: {
    title: "Trier par",
    active: "Filtres actifs",
    price: "Prix",
    priceLow: "Prix le plus bas",
    priceHigh: "Prix le plus haut",
    distance: "Distance",
    nearest: "Plus proche",
    farthest: "Plus loin",
    apply: "Appliquer les filtres",
  },
  locationGate: {
    askTitle: "Découvrez les épiceries à proximité",
    askBody:
      "Pour calculer les distances et afficher les épiceries proches, nous avons besoin de votre position.",
    enabledTitle: "Localisation activée",
    enabledBody:
      "Localisation déjà activée. Vous pouvez actualiser votre position.",
    deniedTitle: "Localisation refusée",
    deniedBody:
      "La localisation est désactivée. Ouvrez les réglages pour l’autoriser (Localisation > Autoriser).",
    currentLocation: "Actuel : {{location}}",

    allow: "Autoriser la localisation",
    continueWithout: "Continuer sans localisation",
    continue: "Continuer",
    refresh: "Actualiser ma position",
    retryAllow: "Réessayer d’autoriser",
    changeLater: "Vous pourrez modifier ce choix plus tard.",
  },

  // --------
  // GROCERY LIST SCREEN
  // --------
  groceries: {
    title: "Liste des épiceries",
    searchPlaceholder: "Rechercher une épicerie...",
    addressNotProvided: "Adresse non renseignée",
    distanceUnknown: "Distance inconnue",
    emptyTitle: "Aucune épicerie trouvée",
    emptySubtitle: "Essaie avec un autre mot-clé",
    filters: {
      title: "Trier par",
      active: "Filtres actifs",
      distance: "Distance",
      nearest: "Plus proche",
      farthest: "Plus loin",
      apply: "Appliquer les filtres",
    },
  },

  // --------
  // FAVORITES SCREEN
  // --------
  favorites: {
    title: "Mes Favoris",
    searchPlaceholder: "Rechercher dans mes favoris...",
    count: "Favoris ({{count}})",
    unknownDistance: "Distance inconnue",
    emptyTitle: "Aucun favori",
    emptySub: "Ajoute des produits en favoris pour les retrouver ici",
  },

  // --------
  // PRODUCTS DETAILS SCREEN
  // --------
  productDetails: {
    noLocationToast:
      "L'épicier n'a spécifié aucune localisation. Impossible d'ouvrir la carte.",
    openAppError: "Impossible d'ouvrir l'application.",
    defaultProduct: "Produit",
    defaultStore: "Épicerie",
    storeSection: "Épicerie",
    unknownDistance: "Distance inconnue",
    distanceFromYou: "À {{distance}} km de vous",
    addressNotProvided: "Adresse non renseignée",
    itinerary: "Itinéraire",
    compare: "Comparer",
    description: "Description",
    similarProducts: "Produits similaires",
  },

  // --------
  // GROCERY STORE SCREEN
  // --------
  groceryStore: {
    defaultStore: "Épicerie",
    noDescription: "Aucune description",
    noLocationToast:
      "L'épicier n'a spécifié aucune localisation. Impossible d'ouvrir la carte.",
    openMapsError: "Impossible d'ouvrir l'application de cartes.",
    articlesCount: "{{count}} articles",
    emptyTitle: "Aucun produit",
    emptySub: "Essaie une autre recherche",
  },
  groceryStoreHeader: {
    location: "Localisation",
    addressNotProvided: "Adresse non renseignée",
    unknownDistance: "Distance inconnue",
    distanceFromPosition: "À {{distance}} km de votre position",
    searchPlaceholder: "Rechercher un produit de cette épicerie...",
  },

  // --------
  // COMPARE SCREEN
  // --------
  compare: {
    title: "Comparaison de Produits",
    analysis: "Analyse Comparative",
    itinerary: "Itinéraire",
    defaultStore: "Épicerie",
    addressNotProvided: "Adresse non renseignée",
    unknownDistance: "Distance inconnue",
    distanceValue: "{{distance}} km",
    priceValue: "{{price}} $",
    noLocationToast:
      "L'épicier n'a spécifié aucune localisation. Impossible d'ouvrir la carte.",
    openMapsError: "Impossible d'ouvrir l'application de cartes.",
    labels: {
      name: "NOM",
      category: "CATÉGORIE",
      price: "PRIX",
      stock: "STOCK",
      distance: "DISTANCE",
      store: "ÉPICERIE",
    },
    missingProducts: "Impossible d'afficher la comparaison pour le moment.",
  },
  compareBubble: {
    dragToDelete: "Glisse ici pour supprimer",
  },

  // --------
  // SELLER OVERVIEW SCREEN
  // --------
  sellerOverview: {
    loading: "Chargement du profil vendeur...",
    editProfile: "Modifier le Profil",
    yourStore: "Votre boutique",

    businessIdentity: "Identité du commerce",
    businessName: "Nom commercial",
    businessNamePlaceholder: "Entrez le nom de votre commerce",
    storeDescription: "Description de la boutique",
    storeDescriptionPlaceholder: "Parlez-nous de vos spécialités africaines",

    location: "Localisation",
    civicAddress: "Adresse civique",
    civicAddressPlaceholder: "Numéro, Rue, Ville. Ex : 4605 Avenue Walkley",
    updateWithGps: "Mettre à jour via GPS",
    useCurrentPosition: "Utiliser votre position actuelle",

    removeLogo: "Supprimer le logo",
    removeAddress: "Supprimer l'adresse",
    removeGps: "Supprimer la position GPS",
    removing: "Suppression...",

    noGpsSaved: "Aucune position GPS enregistrée",

    rulesTitle: "Règles et consignes",
    rulesSub:
      "Lire les bonnes pratiques pour maximiser votre visibilité auprès des clients",

    removeLogoTitle: "Supprimer le logo ?",
    removeLogoMessage:
      "Cette action supprimera le logo actuel de votre boutique.",

    removeAddressTitle: "Supprimer l'adresse ?",
    removeAddressMessage:
      "Cette action supprimera l'adresse civique actuelle de votre épicerie.",

    removeGpsTitle: "Supprimer la position GPS ?",
    removeGpsMessage:
      "Cette action supprimera la position GPS actuelle de votre épicerie.",

    lastUpdatedValue: "Dernière mise à jour : {{date}}",
    lastUpdatedEmpty: "Dernière mise à jour : -",
  },

  sellerRules: {
    title: "Règles et consignes",
    subtitle: "À lire avant de modifier votre épicerie",
    sections: {
      privateSeller: {
        title: "PARTICULIER",
        items: [
          "Si vous n'avez pas une épicerie physique mais vendez vos ingrédients en ligne, ceci vous concerne.",
          "Veuillez ne pas indiquer votre adresse ni votre position GPS car cela pourrait être utilisé afin de vous localiser.",
          "Pour que les clients vous contactent, vous êtes autorisé à inscrire votre moyen de contact favori en description : numéro de téléphone, réseaux sociaux, etc.",
        ],
      },
      address: {
        title: "Adresse civique",
        items: [
          "Ajoutez une adresse précise pour aider les clients à identifier votre épicerie.",
          "Vérifiez l’orthographe du numéro, de la rue et de la ville.",
          "Vous pouvez supprimer l’adresse civique si vous ne souhaitez pas l’afficher.",
        ],
      },
      gps: {
        title: "Position GPS",
        items: [
          "La position GPS permet d’ouvrir directement l’itinéraire dans l’application de cartes.",
          "Placez le marqueur avec précision pour éviter d’induire les clients en erreur.",
          "Vous pouvez supprimer la position GPS si elle est incorrecte ou obsolète.",
        ],
      },
      visibility: {
        title: "Visibilité client",
        items: [
          "Les modifications apportées à votre boutique peuvent être visibles immédiatement par les clients.",
          "Assurez-vous que les informations affichées correspondent bien à votre point de vente.",
        ],
      },
    },
  },

  languages: {
    fr: "Français",
    en: "English",
  },
};
