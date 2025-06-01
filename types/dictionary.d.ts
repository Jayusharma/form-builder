export interface Dictionary {
  common: {
    switchLanguage: string;
    login: string;
    signup: string;
    welcome: string;
    forms: string;
    createForm: string;
    myForms: string;
    settings: string;
  };
  userInfo: {
    notifications: {
      adminCode: {
        copySuccess: string;
        copyError: string;
      };
    };
    fields: {
      id: string;
      name: string;
      email: string;
      role: string;
      adminCode: string;
      twoFactor: string;
    };
    values: {
      notSet: string;
      noAdminCode: string;
      twoFactor: {
        on: string;
        off: string;
      };
    };
  };
  auth: {
    login: {
      title: string;
      description: string;
      emailLabel: string;
      emailPlaceholder: string;
      passwordLabel: string;
      passwordPlaceholder: string;
      forgotPassword: string;
      submitButton: string;
      confirmButton: string;
      twoFactorLabel: string;
      twoFactorPlaceholder: string;
      orContinueWith: string;
      noAccount: string;
      oauthError: string;
    };
    register: {
      title: string;
      description: string;
      nameLabel: string;
      namePlaceholder: string;
      emailLabel: string;
      emailPlaceholder: string;
      passwordLabel: string;
      passwordPlaceholder: string;
      submitButton: string;
      orContinueWith: string;
      haveAccount: string;
    };
    error: {
      title: string;
      backToLogin: string;
    };
    newPassword: {
      title: string;
      description: string;
      passwordLabel: string;
      passwordPlaceholder: string;
      submitButton: string;
      backToLogin: string;
    };
    verification: {
      title: string;
      loading: string;
      backToLogin: string;
      error: {
        missingToken: string;
        default: string;
      };
    };
    reset: {
      title: string;
      description: string;
      emailLabel: string;
      emailPlaceholder: string;
      submitButton: string;
      backToLogin: string;
    };
    signup: string;
    forgotPassword: string;
    resetPassword: string;
    verifyEmail: string;
    twoFactor: string;
  };
  // Add other sections as needed
  navbar: {
    brand: string;
    navigation: {
      dashboard: string;
      profile: string;
      settings: string;
      manageUsers: string;
      logs: string;
      home: string;
      login: string;
    };
    theme: {
      toggleTheme: string;
      darkMode: string;
      lightMode: string;
    };
    language: {
      title: string;
    };
    userMenu: {
      profile: string;
      settings: string;
      logout: string;
    };
    mobileMenu: {
      openMenu: string;
    };
    screenReader: {
      navigation: string;
    };
  };
  notFound: {
    title: string;
    description: string;
    returnHome: string;
  };
  search: {
    placeholder: string;
    errors: {
      fetchFailed: string;
      searchFailed: string;
    };
    states: {
      loading: string;
      noResults: string;
    };
    table: {
      headers: {
        name: string;
        email: string;
        role: string;
        forms: string;
      };
    };
  };
  settings: {
    title: string;
    messages: {
      error: string;
    };
    form: {
      name: {
        label: string;
        placeholder: string;
      };
      email: {
        label: string;
        placeholder: string;
      };
      password: {
        current: {
          label: string;
          placeholder: string;
        };
        new: {
          label: string;
          placeholder: string;
        };
      };
      twoFactor: {
        label: string;
        description: string;
      };
    };
    actions: {
      save: string;
    };
  };
  userEdit: {
    title: string;
    description: string;
    messages: {
      loadError: string;
      updateError: string;
      updateSuccess: string;
      deleteError: string;
      deleteSuccess: string;
    };
    form: {
      name: {
        label: string;
        placeholder: string;
      };
      email: {
        label: string;
        placeholder: string;
      };
      role: {
        label: string;
        placeholder: string;
        options: {
          user: string;
          manager: string;
          admin: string;
          sadmin: string;
        };
      };
      twoFactor: {
        label: string;
        description: string;
      };
      adminCode: {
        label: string;
        noCode: string;
        copy: string;
        copied: string;
      };
    };
    actions: {
      save: string;
      delete: {
        button: string;
        title: string;
        description: string;
        confirm: string;
        cancel: string;
      };
    };
    notFound: {
      title: string;
      description: string;
      action: string;
    };
  };
  dashboard: {
    superAdmin: {
      title: string;
      welcomeBack: string;
      tabs: {
        myForms: string;
        published: string;
        requests: string;
        responses: string;
      };
      descriptions: {
        myForms: string;
        published: string;
        requests: string;
        responses: string;
      };
    };
    admin: {
      title: string;
      welcomeBack: string;
      tabs: {
        myForms: string;
        published: string;
        responses: string;
      };
      descriptions: {
        myForms: string;
        published: string;
        responses: string;
      };
    };
    user: {
      title: string;
      welcomeBack: string;
      organization: {
        title: string;
        description: string;
        loading: string;
        unnamedAdmin: string;
        error: string;
      };
      tabs: {
        forms: string;
        submissions: string;
      };
      descriptions: {
        forms: string;
        submissions: string;
      };
    };
    adminForms: {
      loading: string;
      error: string;
      noForms: string;
      noResults: string;
      search: {
        placeholder: string;
      };
      sort: {
        newest: string;
        oldest: string;
      };
      form: {
        fillForm: string;
        createdAt: string;
      };
    };
    connectToAdmin: {
      title: string;
      description: string;
      placeholder: string;
      connect: string;
      connecting: string;
      success: {
        title: string;
        description: string;
      };
      error: {
        title: string;
        defaultMessage: string;
        failedToConnect: string;
      };
    };
    mySubmissions: {
      loading: string;
      error: {
        fetchFailed: string;
        loadFailed: string;
      };
      noSubmissions: string;
      noResults: string;
      search: {
        placeholder: string;
      };
      sort: {
        newest: string;
        oldest: string;
      };
      submission: {
        viewButton: string;
        submittedOn: string;
      };
    };
    manager: {
      title: string;
      welcomeBack: string;
      tabs: {
        myForms: string;
        published: string;
        responses: string;
      };
      descriptions: {
        myForms: string;
        published: string;
        responses: string;
      };
    };
  };
  formActions: {
    menuItems: {
      requestPublic: string;
      makePrivate: string;
      viewSubmissions: string;
      reuseForm: string;
      viewForm: string;
      publicRequestPending: string;
      shareForm: string;
    };
    notifications: {
      makePrivate: {
        success: {
          title: string;
          description: string;
        };
        error: {
          title: string;
          description: string;
        };
      };
      requestPublic: {
        success: {
          title: string;
          description: string;
        };
        error: {
          title: string;
          description: string;
        };
      };
    };
    share: {
      title: string;
      text: string;
      copied: {
        title: string;
        description: string;
      };
    };
  };
  formPreview: {
    buttons: {
      print: string;
      preparing: string;
      close: string;
      submit: string;
      chooseFile: string;
    };
    imageUpload: {
      clickToUpload: string;
      fileTypes: string;
      success: string;
      error: string;
      remove: string;
      noImage: string;
    };
    validation: {
      requiredFields: string;
      submitSuccess: string;
      submitError: string;
      tryAgain: string;
      thankYou: string;
    };
    submission: {
      success: string;
      thankYou: string;
      alreadySubmitted: string;
      submittedOn: string;
      viewSubmission: string;
    };
    print: {
      dialogOpened: string;
      ready: string;
      error: string;
    };
    noContent: string;
  };
  formResponses: {
    loading: string;
    noForms: {
      admin: string;
      manager: string;
      default: string;
    };
    select: {
      placeholder: string;
      responses: string;
      responses_plural: string;
    };
    responses: {
      title: string;
      noResponses: string;
      responseNumber: string;
      timeAgo: string;
    };
  };
  myForms: {
    actions: {
      createNew: string;
      createFirst: string;
    };
    search: {
      placeholder: string;
    };
    sort: {
      newest: string;
      oldest: string;
      mostSubmissions: string;
      leastSubmissions: string;
    };
    status: {
      published: string;
      notPublished: string;
    };
    loading: {
      error: {
        title: string;
        fetchFailed: string;
      };
    };
    empty: {
      title: string;
      noResults: string;
      noForms: string;
    };
    form: {
      noDescription: string;
      lastUpdated: string;
      submissions: {
        single: string;
        multiple: string;
      };
    };
  };
  publicRequest: {
    loading: string;
    empty: {
      noResults: string;
      noRequests: string;
    };
    search: {
      placeholder: string;
    };
    sort: {
      newest: string;
      oldest: string;
      pending: string;
      accepted: string;
    };
    request: {
      requestedBy: string;
      status: {
        approved: string;
        pending: string;
      };
      actions: {
        review: string;
        approve: string;
        reject: string;
      };
    };
    notifications: {
      error: {
        fetchFailed: string;
        invalidResponse: string;
        loadFailed: string;
        actionFailed: string;
      };
      success: {
        actionSuccess: string;
      };
    };
  };
  publishedForms: {
    loading: {
      title: string;
      error: {
        title: string;
        fetchFailed: string;
        defaultError: string;
      };
    };
    empty: {
      title: string;
      noResults: string;
      noForms: string;
    };
    search: {
      placeholder: string;
    };
    sort: {
      newest: string;
      oldest: string;
      mostSubmissions: string;
      leastSubmissions: string;
    };
    form: {
      noDescription: string;
      creator: {
        title: string;
      };
      lastUpdated: string;
      submissions: {
        single: string;
        multiple: string;
      };
    };
  };
  review: {
    metadata: {
      title: string;
      description: string;
    };
    actions: {
      backToRequests: string;
      rejectRequest: string;
      acceptRequest: string;
      cancel: string;
      reject: string;
      accept: string;
    };
    confirmations: {
      reject: {
        title: string;
        description: string;
      };
      accept: {
        title: string;
        description: string;
      };
    };
    notifications: {
      accept: {
        success: {
          title: string;
          description: string;
        };
        error: {
          title: string;
          description: string;
        };
      };
      reject: {
        success: {
          title: string;
          description: string;
        };
        error: {
          title: string;
          description: string;
        };
      };
    };
  };
  logs: {
    title: string;
    description: string;
    metadata: {
      title: string;
      description: string;
    };
    filters: {
      searchPlaceholder: string;
      level: {
        title: string;
        all: string;
        error: string;
        warn: string;
        info: string;
        debug: string;
      };
      event: {
        title: string;
        all: string;
        formCreated: string;
        formSubmitted: string;
        formMadePrivate: string;
        formMadePublic: string;
        formDeleted: string;
      };
    };
    table: {
      headers: {
        timestamp: string;
        level: string;
        event: string;
        form: string;
        user: string;
      };
      loading: string;
      noLogs: {
        title: string;
        description: string;
      };
      noResults: {
        title: string;
        description: string;
      };
      tooltips: {
        event: string;
        raw: string;
        form: {
          id: string;
        };
        user: {
          title: string;
          id: string;
        };
      };
    };
    actions: {
      refresh: string;
      export: string;
      tryAgain: string;
    };
    errors: {
      title: string;
      fetchFailed: string;
      invalidData: string;
    };
  };
} 